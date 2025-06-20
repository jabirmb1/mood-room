'use client';
import { useGLTF} from "@react-three/drei";
import { useEffect, useState, useRef, useMemo} from "react";
import { useDragControls } from "@/hooks/useDragControls";
import {ThreeEvent } from "@react-three/fiber";
import { useKeyboardMovement } from "@/hooks/useKeyBoardMovement";
import { globalScale } from "@/utils/const";
import * as THREE from "three";
// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette, centerPivotHorizontal, getObjectSizeDifference } from "@/utils/object3D";
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
  editingMode: 'edit' | 'move';//what mode the object is in, e.g. edit means that side panel will show to change the object's properties
  // e.g. size, colour, rotation etc, 'move' will instead show a floating panel which will help user's to translate object.
  setSelectedId: (id: string | null) => void;// this will be used for the object to select and unselect itself.
  setEditingMode: (mode: 'edit' | 'move') => void;// if object should show it's panel or it is being moved.
  setIsHoveringObject?: (hover: boolean) => void;// if this object is currently being hovered or not.
  onDragging: (dragging: boolean) => void// this will just notify the parent if this object is currently being dragged or not.
  onPositionChange: (newPos: [number, number, number]) => void// function to run when the object's positon changes.
  onModelRefUpdate?: (ref: React.RefObject<THREE.Object3D>) => void;// a callback to explicitly expose the object's internal modelRef to parent.
  onGroupRefUpdate?: (ref: React.RefObject<THREE.Object3D>)=> void;// a callback to explicitly expose this component's interal group ref to parent.

};



export function Object3D({ url, id, mode, colourPalette, position = [0, 0, 0], isSelected = false, editingMode = 'edit', 
  setSelectedId, setEditingMode, setIsHoveringObject, onDragging, onPositionChange, onModelRefUpdate, onGroupRefUpdate}: Object3DProps) {

  const { scene} = useGLTF(url) as { scene: THREE.Object3D };

// we clone the model and also the material to make it fully independent of other models
  // (allows us to place multiple of same model if needed)
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = cloneModel(scene);
    const centered = centerPivotHorizontal(cloned);
  
    centered.scale.set(globalScale, globalScale, globalScale); // on first load, load it into global scale
    centered.userData.baseScale = globalScale; // record what the current size is.
  
    return centered;
  }, [scene]);
  


  const modelRef = useRef<THREE.Object3D>(null)// reference to change model's colour, size and rotation
  const groupRef = useRef<THREE.Object3D>(null)// reference needed to change model's position (including the floating UI's position)
  const [hovered, setHovered] = useState(false);
  const [isHorizontalMode, setIsHorizontalMode] = useState(true); 

  // all models used are propertionaly modelled relative to each other, so we will not use any scaling logic
  // to normalise models.
  const currentScale = modelRef.current?.scale.x ?? globalScale;
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

  
  // if the parent page/ component wants the internal group ref (e.g. for camera animations), pass it to them now.
  useEffect(()=> {
    if (onGroupRefUpdate)// parent wants to access this object's group ref
    {
      onGroupRefUpdate(groupRef)
    }
    // clean up when unmounting:
    return () => {
      if (onGroupRefUpdate) onGroupRefUpdate(null);
    };
  }, [onGroupRefUpdate])

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
    console.log(getObjectSizeDifference(modelRef));
  
  }, [hovered, mode, modelRef.current?.userData.baseScale]);
  

  {/* The code below just shows the bounding box for the model }
  useEffect(() => {
    if (!modelRef.current) return;
  
    const helper = new THREE.BoxHelper(modelRef.current, 0xffff00);
    groupRef.current?.add(helper);
  
    return () => {
      groupRef.current?.remove(helper);
    };
  }, [modelRef.current]);
   */}
  
  return (
    <>
      <group ref = {groupRef} position={position}>
          {/****
           * code below just shows us the pivot of each model, uncomment this to visualise it
           {isSelected && (
        <axesHelper args={[4]} /> // size 0.5 or tweak as needed
      )} */}

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
      </group>
      </>
  );
}