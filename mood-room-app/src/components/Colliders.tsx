import { useState, useEffect } from "react";
import { ColliderJsonData } from "@/types/types";
import {BallCollider, CapsuleCollider, CuboidCollider,} from "@react-three/rapier";
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
export default function Colliders({ jsonUrl, scale }: CollidersProps) {
  const [colliders, setColliders] = useState<ColliderJsonData[] | null>(null);// the collider data
  const [fetchFailed, setFetchFailed] = useState<boolean>(false);// whether we have valid collider data or not
  const DEGREES90 = Math.PI/2

  // use effect to fetch the collider data from the json file.
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
        console.log("remaking colliders");
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
      colliders.map((col, idx) => {
        // Position scaled per axis (in original Blender coordinate system)
        const position = col.position.map(
          (v, i) => v * scale[i]
        ) as [number, number, number];

        // Apply orientation fix to each individual collider rotation
        // Add -90 degrees around X axis to make colliders face screen instead of down
        // (converting from blender cooridintate system, into three js coordinate system.)
        const rotation = new Euler(col.rotation[0] - DEGREES90, col.rotation[1], col.rotation[2]);

        if (col.shape === "box") {
          // Use dimensions as-is since they're already converted in Blender
          const dimensions = col.dimensions.map(
            (v, i) => v * scale[i]
          ) as [number, number, number];

          return (
            <CuboidCollider
              key={idx}
              args={dimensions}
              position={position}
              rotation={rotation}
            />
          );
        } 
        else if (col.shape === "sphere") {
          const radius = col.dimensions[0] * scale[0];// our program uses uniform scaling so we can use any of the three indexes
          // to get the correct sale.

          return (
            <BallCollider
              key={idx}
              args={[radius]}
              position={position}
              rotation={rotation}
            />
          );
        }
        else if (col.shape === "capsule") {
          const halfHeight = col.dimensions[0] * scale[0]; // Y-axis scale
          const radius = col.dimensions[1] * scale[0]; // XZ avg

          return (
            <CapsuleCollider
              key={idx}
              args={[halfHeight, radius]}
              position={position}
              rotation={rotation}
            />
          );
        }
        else{// illegal shape; warn the console and return null.
          console.warn("Unknown collider shape:", col.shape);
          return null;
        }
      })
  );
}