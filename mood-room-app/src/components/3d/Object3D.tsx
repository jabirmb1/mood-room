'use client';
import { useGLTF} from "@react-three/drei";
import { useEffect, useState, useRef, useMemo} from "react";
import { useDragControls } from "@/hooks/useDragControls";
import {ThreeEvent } from "@react-three/fiber";
import { useKeyboardMovement } from "@/hooks/useKeyBoardMovement";
import { globalScale } from "@/utils/const";
import * as THREE from "three";
// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette, centerPivot, applyCategoryTags } from "@/utils/object3D";
import { ObjectFloatingPanel } from "../ObjectFloatingPanel";
import { RapierRigidBody } from "@react-three/rapier";

/**** This is a loader that loads in models and returns it, props are passed into this component to change a model's default colour
 * , change it's position and size.
 */


type Object3DProps = {
  url: string;// URL to the 3D model file
  id: string// unique id of the object.
  rigidBodyRef?: React.RefObject<RapierRigidBody | null>;// reference to the rigid body of the object, used for physics and movement.
  mode: "edit" | "view";// if user can edit the model or just view it
  colourPalette?: ColourPalette;// colour palette to apply to the model
  position?: [number, number, number];// position of the model in the scene
  isSelected: boolean;// boolean flag to check if current model is the selected one or not.
  isColliding?: boolean;// if this object is inside an illegal collision state, e.g. inside a wall or floor.
  editingMode: 'edit' | 'move';//what mode the object is in, e.g. edit means that side panel will show to change the object's properties
  // e.g. size, colour, rotation etc, 'move' will instead show a floating panel which will help user's to translate object.
  setSelectedId: (id: string | null) => void;// this will be used for the object to select and unselect itself.
  setEditingMode: (mode: 'edit' | 'move') => void;// if object should show it's panel or it is being moved.
  setIsHoveringObject?: (hover: boolean) => void;// if this object is currently being hovered or not.
  onDragging: (dragging: boolean) => void// this will just notify the parent if this object is currently being dragged or not.
  onDelete: ()=> void;// function to delete this object.
  onModelRefUpdate?: (ref: React.RefObject<THREE.Object3D | null> | null) => void;// a callback to explicitly expose the object's internal modelRef to parent.
};


// TO DO: make position be used as default for object placement in viewer only mode so e.g. position = [num, num, num] or null(for editing)
export function Object3D({ url, id, rigidBodyRef, mode, colourPalette, position = [0, 0, 0], isSelected = false, isColliding=false, editingMode = 'edit', 
  setSelectedId, setEditingMode, setIsHoveringObject, onDragging, onDelete, onModelRefUpdate}: Object3DProps) {

  const { scene} = useGLTF(url) as { scene: THREE.Object3D };
// we clone the model and also the material to make it fully independent of other models
  // (allows us to place multiple of same model if needed)
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = cloneModel(scene);
    const centered = centerPivot(cloned);
  
    centered.scale.set(globalScale, globalScale, globalScale); // on first load, load it into global scale
    centered.userData.baseScale = globalScale; // record what the current size is.
    // apply tags to the object during load:
    applyCategoryTags(url, centered);
    return centered;
  }, [scene]);


  const modelRef = useRef<THREE.Object3D>(null)// reference to change model's colour, size and rotation
  const [hovered, setHovered] = useState(false);
  const [isHorizontalMode, setIsHorizontalMode] = useState(true); 

  // all models used are propertionaly modelled relative to each other, so we will not use any scaling logic
  // to normalise models.
  const currentScale = modelRef.current?.scale.x ?? globalScale;
  // add in the dragging logic:


  const { onPointerDown, onPointerMove, onPointerUp } = useDragControls({rigidBodyRef: rigidBodyRef ?? null, objectRef: modelRef,
    enabled: mode === "edit" && editingMode === 'move' && isSelected ,
    isHorizontalMode: isHorizontalMode,
    onStart: () => onDragging(true),
    onEnd: () => {onDragging(false)},
  });

  // add in movement logic:
  useKeyboardMovement({rigidBodyRef: rigidBodyRef ?? null, modelRef: modelRef, enabled: isSelected && mode === 'edit' && editingMode === 'move',
    isHorizontalMode: isHorizontalMode});

  // if parent page wants the internal model ref, pass it to them.
  useEffect(() => {
    if (onModelRefUpdate) {
      onModelRefUpdate(modelRef);// passing the object itself.
    }
    return () => {
      if (onModelRefUpdate) onModelRefUpdate(null);
    };
  }, [onModelRefUpdate]);

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
    applyHoverEffect(modelRef.current, hovered, mode);
  }, [hovered, mode, currentScale]);

  // making hover effects temporarily size up and down the objects.
  useEffect(() => {
    if (!modelRef.current) return;
  
    const model = modelRef.current;
    const scaleFactor = hovered && mode === 'edit' ? 1.20 : 1.0;
  
    const base = model.userData.baseScale ?? globalScale;
    model.scale.set(base * scaleFactor, base * scaleFactor, base * scaleFactor);
  
  }, [hovered, mode, modelRef.current?.userData.baseScale]);

   //This use effect temporarily turns the object into red if it is colliding with another object.
   useEffect(() => {
    if (!modelRef.current) return;
    if (isColliding) {
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.color.set(0xff0000); // red for illegal
        }
      });
    } else {
      applyColourPalette(modelRef.current, colourPalette); // reset colourpalette to what it was before.
    }
  }, [isColliding]);   
  
  return (
    <>
        {(isSelected && mode === 'edit' && editingMode === 'move') &&(
          // default into starting with horizontal mode whenever we open the panel.
          <ObjectFloatingPanel modelRef={modelRef} onClose={() => {setSelectedId(null); 
              setEditingMode('edit')}} isHorizontalMode = {isHorizontalMode} setIsHorizontalMode = {setIsHorizontalMode} setMode={setEditingMode} onDelete = {onDelete}/>
        )}


       {/* adding in an extra safeguard to only show the model when it is fully loaded / not null */}
       {clonedScene && (
        <primitive
          ref={modelRef}
          object={clonedScene}
          castShadow = {true}
          recieveShadow = {true}
          onDoubleClick={(e: ThreeEvent<MouseEvent>) => {// we use double click to select an object to prevent accidental selections.
            e.stopPropagation();
            if (mode === 'edit') {
              if (editingMode === 'move') {// this prevents locking, e.g. object1 in movde mode but we click object 2, 
                // would have been stuck in move mode and could not render anything.
                setEditingMode('edit'); // reset to edit when switching
              }
              setSelectedId(id);
            }
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            if (mode === "edit") {
              setHovered(true);
              setIsHoveringObject?.(true);// notify parent that an object is being hovered
            }
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            if (mode === "edit"){
              setHovered(false);
              setIsHoveringObject?.(false);// object has stopped being hovered.
            } 
          }}
          // passing in the functions from the hook so we can drag the object around.
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}/>
        )}
      
    </>)
}  