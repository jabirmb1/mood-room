'use client';
import { useGLTF } from "@react-three/drei";
import { useEffect, useState,} from "react";
import { useRef } from "react";
import * as THREE from "three";

/**** This is a loader that loads in models and returns it, props are passed into this component to change a model's default colour
 * , change it's position and size.
 */
type ColorPalette = {
  primary?: string;
  secondary?: string;
  accent?: string;
};

type Object3DProps = {
  url: string;// URL to the 3D model file
  mode: "edit" | "view";// if user can edit the model or just view it
  colorPalette?: ColorPalette;// colour palette to apply to the model
  position?: [number, number, number];// position of the model in the scene
  size?: number;// size of the model in the scene.
};

type MaterialColorMap = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

export function Object3D({ url, mode, colorPalette, position = [0, 0, 0],  size = 1,}: Object3DProps) {
  const { scene} = useGLTF(url) as any; //TO-DO: create a custom type later
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!colorPalette || !ref.current) return;
    
    // mapping the colour palette to the material names in the model to reduce code
    // each material in a model will be primary, secondary, or tertiary.
    const materialColorMap: MaterialColorMap = {
      primary: colorPalette.primary,
      secondary: colorPalette.secondary,
      tertiary: colorPalette.accent,
    };
  
    // traverse through the model and apply the colors to the materials
    ref.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material;
        if (!material) return;
        console.log("Material found:", material.name);
        if (material.name === 'primary' || material.name === 'secondary' || material.name === 'tertiary') {
          const key = material.name as keyof MaterialColorMap;
            // getting the material name to apply the color e.g. if material name is 'primary', then apply the primary color from the color palette.
          const color = materialColorMap[key];
          if (color) {// if the color is defined in the color palette, then apply it to the material
            material.color.set(color);
            material.needsUpdate = true;
          }
        }
      }
    });
  }, [colorPalette]);
  

  // if user hovers over the model, then increase it's size and also highlight it.
   // Highlight & scale on hover
   useEffect(() => {
    if (!ref.current) return;

    // user has hovered or selected model, scale it up slightly, and reset to normal size when not hovered/ selected
    ref.current.scale.setScalar(hovered ? 1.2 * size : size);

    // Emissive highlight
    ref.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (hovered && mode === 'edit') {
          // highlight the model in yellow.
          mat.emissive.set('yellow');
          mat.emissiveIntensity = 0.4;
        } else {
          // reset the model to normal state.
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [hovered, mode]);

  // if the model is selected, then display panel.
  //
  useEffect(() => {
    if (selected) {
      // TO-DO: handle selected state, e.g. open a panel for editing the model
      console.log("Model selected:", url);
    }
  }, [selected, url]);

  
  return (
    <primitive
      ref={ref}
      object={scene}
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
