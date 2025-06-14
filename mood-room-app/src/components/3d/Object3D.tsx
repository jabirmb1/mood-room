 'use client';
import { useGLTF} from "@react-three/drei";
import { useEffect, useState, useRef, useMemo} from "react";
import { useDragControls } from "@/hooks/useDragControls";
import {ThreeEvent } from "@react-three/fiber";
import { useKeyboardMovement } from "@/hooks/useKeyBoardMovement";
import * as THREE from "three";
// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette } from "@/utils/object3D";

/**** This is a loader that loads in models and returns it, props are passed into this component to change a model's default colour
 * , change it's position and size.
 */


type Object3DProps = {
  url: string;// URL to the 3D model file
  id: string// unique id of the object.
  mode: "edit" | "view";// if user can edit the model or just view it
  colourPalette?: ColourPalette;// colour palette to apply to the model
  position?: [number, number, number];// position of the model in the scene
  size?: number;// size of the model in the scene.
  isSelected: boolean;// boolean flag to check if current model is the selected one or not.
  onSelect: () => void;// a function to be run when it is selected.
  onDragging: (dragging: boolean) => void
  onPositionChange: (newPos: [number, number, number]) => void

};


export function Object3D({ url, id, mode, colourPalette, position = [0, 0, 0],  size = 1, isSelected = false, onSelect, onDragging, onPositionChange}: Object3DProps) {
  const { scene} = useGLTF(url) as { scene: THREE.Object3D };
  // we clone the model and also the material to make it fully independant of other models (allows us to place multiple of 
  // same model if needed)
  const clonedScene = useMemo(() => cloneModel(scene), [scene]);
  const ref = useRef<THREE.Object3D>(null)// pass in a reference down to the dragging controls so that script knows which object to drag.
  const [hovered, setHovered] = useState(false);
  
  // add in the dragging logic:
  const { onPointerDown, onPointerMove, onPointerUp } = useDragControls(ref, {
    enabled: mode === "edit" && isSelected,
    onStart: () => onDragging(true),
    onEnd: () => onDragging(false),
    onChange: onPositionChange,
  });

  // add in movement logic:
  useKeyboardMovement({ref: ref, enabled: isSelected, onChange: onPositionChange});

  // add in a custom colour palette to model if user has specfied one.
  useEffect(() => {
    if (ref.current) {
      // also add in the draggable attribute as well on model load.
      ref.current.traverse((child) => {
        if (child instanceof THREE.Object3D) {
          child.userData.isDraggable = true;
        }
      });
      applyColourPalette(ref.current, colourPalette);
    }
  }, [colourPalette]);

  // add in a hovered effect if user is in edit mode and hovers over model
  useEffect(() => {
    if (!ref.current) return;
    applyHoverEffect(ref.current, hovered, mode, size);
  }, [hovered, mode, size]);

  useEffect(() => {
    if (isSelected) {
      // TO-DO: add in selected functionality.
      console.log("Model selected:", url);
    }
  }, [isSelected, url]);

  
  return (
    <>
      <primitive
        ref={ref}
        object={clonedScene}
        position={position}
        scale={size}
        onClick={(e: ThreeEvent<MouseEvent>)=> {
          e.stopPropagation();
          if (mode === "edit") onSelect();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (mode === "edit") setHovered(true);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (mode === "edit") setHovered(false);
        }}
        // passing in the functions from the hook so we can drag the object around.
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}/>


      </>
  );
}
