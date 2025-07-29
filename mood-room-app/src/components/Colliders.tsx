

import { useState, useEffect} from "react";
import { ColliderJsonData } from "@/types/types";
import { BallCollider, CapsuleCollider, CuboidCollider } from "@react-three/rapier";
import { Euler } from "three";
import { getRelativeColliderScale } from "@/utils/collision";
import { globalScale } from "@/utils/const";

/******This compoenent will be responsible to generate multiple colliders per object so we can have compound, simplifed colliders
 *  per model; keeping it efficient and accurate.
 */

type CollidersProps = {
    jsonUrl: string | null;// a json url which leads to the model's colliders information and of how they should be processed.
    scale: [number, number, number];// the scale to apply to the colliders.
  };

  // This function will be used to generate compound colliders from the information that is passed in.
export default function Colliders({jsonUrl, scale}: CollidersProps) {
     const [colliders, setColliders] = useState<ColliderJsonData[] | null>(null);// the collider data
     const [fetchFailed, setFetchFailed] = useState<boolean>(false);// whether we have valid collider data or not
     const ANTICLOCKWISE90DEGREES: [number, number, number] = [-Math.PI/2, 0, 0]//tranformation representing a rotation of direction
     //  upwards vertically by 90 degrees

     useEffect(() => {
      const fetchColliders = async () => {
        if (!jsonUrl) {
          setFetchFailed(true);
          return;
        }
  
        try {
          setFetchFailed(false); // reset on re-attempt
          const response = await fetch(jsonUrl);
          if (!response.ok) throw new Error(`Failed to load: ${jsonUrl}`);// couldn't find the url
  
          const data: ColliderJsonData[] = await response.json();
          setColliders(data);
          console.log('remaking colliders');
        } catch (err) {
          console.error("Error loading collider JSON:", err);
          setFetchFailed(true);
        }
      };
  
      fetchColliders();
    }, [jsonUrl]);
  
    if (fetchFailed) {// return a fallback cuboid collider is no collider data was found or url was null
    //  console.warn("Using fallback cuboid collider due to fetch failure or missing URL.");
      // since these scales are not altered to fit scene unlike the normal colliders for when a colliderData is provided;
      // we will just get the object's relative scale to scale everything up to fit the scene
      return <CuboidCollider args={[1, 1, 1]} scale={getRelativeColliderScale(scale[0], globalScale)} />;
    }
  
    if (!colliders) return null;
      return (
        <group rotation={ANTICLOCKWISE90DEGREES}>{/* for some reason all colliders come with incorrect rotation; so we fix it here */}
          {colliders.map((col, idx) => {
            const position = col.position.map((v, i) => v * scale[i]) as [number, number, number];
            const rotation = new Euler(...col.rotation); // keep local rotation
    
            if (col.shape === 'box') {
              return (
                <CuboidCollider
                  key={idx}
                  args={col.dimensions as [number, number, number]}
                  position={position}
                  rotation={rotation}
                  scale={scale}
                />
              );
            }
            else if (col.shape === "sphere"){
              return (
                <BallCollider
                  key={idx}
                  args={[col.dimensions[0]]}
                  position={position}
                  rotation={rotation}
                  scale={scale}
                />
              );
            }
            else if (col.shape === 'capsule'){
              return (
                <CapsuleCollider
                  key={idx}
                  args={[col.dimensions[0], col.dimensions[1]]}
                  position={position}
                  rotation={rotation}
                  scale={scale}
                />
              );
            }
            else{// illegal shape; warn the console and return null.
              console.warn("Unknown collider shape:", col.shape);
              return null;
            }
          })}
        </group>
      );
  }
