'use client';
import { useGLTF } from "@react-three/drei";
import { useEffect, useState, useRef, useMemo} from "react";
import * as THREE from "three";

// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette } from "@/utils/object3D";

/**** This is a loader that loads in models and returns it, props are passed into this component to change a model's default colour
 * , change it's position and size.
 */


type Object3DProps = {
  url: string;// URL to the 3D model file
  mode: "edit" | "view";// if user can edit the model or just view it
  colourPalette?: ColourPalette;// colour palette to apply to the model
  position?: [number, number, number];// position of the model in the scene
  size?: number;// size of the model in the scene.
};


export function Object3D({ url, mode, colourPalette, position = [0, 0, 0],  size = 1,}: Object3DProps) {
  const { scene} = useGLTF(url) as any; //TO-DO: create a custom type later

  // we clone the model and also the material to make it fully independant of other models (allows us to place multiple of 
  // same model if needed)
  const clonedScene = useMemo(() => cloneModel(scene), [scene]);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const ref = useRef<THREE.Group>(null);


  // add in a custom colour palette to model if user has specfied one.
  useEffect(() => {
    if (!ref.current) return;
    applyColourPalette(ref.current, colourPalette);
  }, [colourPalette]);

  // add in a hovered effect if user is in edit mode and hovers over model
  useEffect(() => {
    if (!ref.current) return;
    applyHoverEffect(ref.current, hovered, mode, size);
  }, [hovered, mode, size]);

  useEffect(() => {
    if (selected) {
      // TO-DO: add in selected functionality.
      console.log("Model selected:", url);
    }
  }, [selected, url]);

  
  return (
    <primitive
      ref={ref}
      object={clonedScene}
      position={position}
      scale={size}
      onPointerOver={(e: React.PointerEvent) => {
        e.stopPropagation();
        if (mode === 'edit') setHovered(true);
      }}
      onPointerOut={(e: React.PointerEvent) => {
        e.stopPropagation();
        if (mode === 'edit') setHovered(false);
      }}
      onClick={(e: React.PointerEvent) => {
        e.stopPropagation();
        if (mode === 'edit') setSelected(true);// make sure to make this be false when user clicks outside the model
        // TO-DO: handle click event for editing the model (e.g. open an editing panel)
      }}
    />
  );
}
