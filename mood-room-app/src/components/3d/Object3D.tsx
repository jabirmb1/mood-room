'use client';
import { useGLTF} from "@react-three/drei";
import { useEffect, useState, useRef, useMemo} from "react";
import { useDragControls } from "@/hooks/useDragControls";
import {ThreeEvent } from "@react-three/fiber";
import { useKeyboardMovement } from "@/hooks/useKeyBoardMovement";
import { globalScale } from "@/utils/const";
import * as THREE from "three";
// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette } from "@/utils/object3D";
import { ObjectEditorPanel } from "../ObjectEditorPanel";
import { ObjectFloatingPanel } from "../ObjectFloatingPanel";

/**** This is a loader that loads in models and returns it, props are passed into this component to change a model's default colour
 * , change it's position and size.
 */


type Object3DProps = {
  url: string;// URL to the 3D model file
  id: string// unique id of the object.
  mode: "edit" | "view";// if user can edit the model or just view it
  colourPalette?: ColourPalette;// colour palette to apply to the model
  position?: [number, number, number];// position of the model in the scene
  isSelected: boolean;// boolean flag to check if current model is the selected one or not.
  setSelectedId: (id: string | null) => void;// this will be used for the object to select and unselect itself.
  onDragging: (dragging: boolean) => void// this will just notify the parent if this object is currently being dragged or not.
  onPositionChange: (newPos: [number, number, number]) => void// function to run when the object's positon changes.

};



export function Object3D({ url, id, mode, colourPalette, position = [0, 0, 0], isSelected = false, setSelectedId, onDragging, onPositionChange}: Object3DProps) {
  const { scene} = useGLTF(url) as { scene: THREE.Object3D };

   // we clone the model and also the material to make it fully independent of other models
  // (allows us to place multiple of same model if needed)
  const clonedScene = useMemo(() => {
    if (!scene) return null; // adding a safeguard to return null if the object doesn't exist.
    return cloneModel(scene);
  }, [scene]);

  const modelRef = useRef<THREE.Object3D>(null)// reference to change model's colour, size and rotation
  const groupRef = useRef<THREE.Object3D>(null)// reference needed to change model's position (including the floating UI's position)
  const [hovered, setHovered] = useState(false);
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');// if object needs to show editing panel or floating panel
  // editing panel allows for change of colours, rotation, size etc, floating panel allows users to translate object.
  
  const [isHorizontalMode, setIsHorizontalMode] = useState(true); 

  // all models used are propertionaly modelled relative to each other, so we will not use any scaling logic
  // to normalise models.
  const baseScale = globalScale;// this scale represents the default size of object
  // will be used to e.g. reset object back to normal size when needed.

  // current scale. size of object.
  const [scale, setScale] = useState<number>(baseScale);

  
  // add in the dragging logic:
  const { onPointerDown, onPointerMove, onPointerUp } = useDragControls({objectRef: groupRef,
    enabled: mode === "edit" && editingMode === 'move' && isSelected ,
    isHorizontalMode: isHorizontalMode,
    onStart: () => onDragging(true),
    onEnd: () => onDragging(false),
    onChange: onPositionChange,
  });

  // add in movement logic:
  useKeyboardMovement({ref: groupRef, enabled: isSelected && mode === 'edit' && editingMode === 'move',
    isHorizontalMode: isHorizontalMode, onChange: onPositionChange});

  // add in a custom colour palette to model if user has specfied one.
  useEffect(() => {
    if (modelRef.current) {
      // also add in the draggable attribute as well on model load.
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Object3D) {
          child.userData.isDraggable = true;
        }
      });
      applyColourPalette(modelRef.current, colourPalette);
    }
  }, [colourPalette]);

  // add in a hovered effect if user is in edit mode and hovers over model
  useEffect(() => {
    if (!modelRef.current) return;
    applyHoverEffect(modelRef.current, hovered, mode, scale);
  }, [hovered, mode, scale]);
  
  return (
    <>
      <group ref = {groupRef}position={position}>

        {(isSelected && mode === 'edit' && editingMode === 'move') &&(
          // default into starting with horizontal mode whenever we open the panel.
          <ObjectFloatingPanel  onClose={() => {setSelectedId(null); 
              setEditingMode('edit')}} isHorizontalMode = {isHorizontalMode} setIsHorizontalMode = {setIsHorizontalMode} setMode={setEditingMode} />
        )}


       {/* adding in an extra safeguard to only show the model when it is fully loaded / not null */}
       {clonedScene && (
          <primitive
            ref={modelRef}
            object={clonedScene}
            scale={scale}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (mode === "edit" && editingMode !== "move") {
                setSelectedId(id);
              }
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
        )}
      </group>

      {(isSelected && mode === 'edit' && editingMode === 'edit') &&(
        <ObjectEditorPanel objectRef={modelRef} onClose={() => setSelectedId(null)} setMode={setEditingMode} />
      )}
      </>
  );
}
