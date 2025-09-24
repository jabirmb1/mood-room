'use client';
import { useEffect, useState, useRef, useMemo} from "react";
import { useDragControls } from "@/hooks/3d-canvas/useDragControls";
import {ThreeEvent } from "@react-three/fiber";
import { useKeyboardMovement } from "@/hooks/3d-canvas/useKeyBoardMovement";
import { globalScale } from "@/utils/3d-canvas/const";
import * as THREE from "three";
// importing types and functions
import { cloneModel, applyColourPalette, applyHoverEffect, ColourPalette, centerPivot, applyCategoryTags } from "@/utils/3d-canvas/models";
import { generateCubeLightBeamDimensionsAndPosition, getLightSystemData, getObjectLightColour, getObjectLightData, getScreens, hasScreens, isObjectLightOn, updateAllLights, updateCubeLightBeamsArray } from "@/utils/3d-canvas/models/lightingSystem";
import { ObjectFloatingPanel } from "../../UI/ObjectFloatingPanel";
import { RapierRigidBody } from "@react-three/rapier";
import { Model } from "@/types/types";
import { disposeObject, getMeshColour } from "@/utils/3d-canvas/scene/meshes";
import { CubeLightBeam,} from "../scene-infrastructure/volumetric-lights/CubeLightBeam/CubeLightBeam";
import { useSharedGLTF } from "@/hooks/3d-canvas/useSharedGltf";


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
  scale: [number, number, number];// model's size
  rotation?: [number, number, number]// model's rotation.
  lightData?: Model['light'];
  isSelected: boolean;// boolean flag to check if current model is the selected one or not.
  isColliding?: boolean;// if this object is inside an illegal collision state, e.g. inside a wall or floor.
  editingMode: 'edit' | 'move';//what mode the object is in, e.g. edit means that side panel will show to change the object's properties
  // e.g. size, colour, rotation etc, 'move' will instead show a floating panel which will help user's to translate object.
  setSelectedId: (id: string | null) => void;// this will be used for the object to select and unselect itself.
  setEditingMode: (mode: 'edit' | 'move') => void;// if object should show it's panel or it is being moved.
  setIsHoveringObject?: (hover: boolean) => void;// if this object is currently being hovered or not.
  updateModelInformation: (id: string, updates: Partial<Model>) => void;
  onDragging: (dragging: boolean) => void// this will just notify the parent if this object is currently being dragged or not.
  onDelete: ()=> void;// function to delete this object.
  onModelUpdate?: (instance: THREE.Object3D | null) => void;// a callback to explicitly expose the object's internal instance to parent.
};

export function Object3D({ url, id, rigidBodyRef, mode, colourPalette, position = [0, 0, 0], scale, rotation, lightData, isSelected = false, isColliding=false, editingMode = 'edit', 
  setSelectedId, setEditingMode, setIsHoveringObject, updateModelInformation, onDragging, onDelete, onModelUpdate}: Object3DProps) {

  const scene = useSharedGLTF(url)
  const defaultRigidBodyRef = useRef<RapierRigidBody | null>(null);// in case rigid body is undefined.
// we clone the model and also the material to make it fully independent of other models
  // (allows us to place multiple of same model if needed)
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = cloneModel(scene, lightData);
    const centered = centerPivot(cloned);
    centered.userData.baseScale = scale[0]; // record what the current size is.
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

  const { onPointerDown, onPointerMove, onPointerUp } = useDragControls({rigidBodyRef: rigidBodyRef ?? defaultRigidBodyRef, objectRef: modelRef,
    enabled: mode === "edit" && editingMode === 'move' && isSelected,
    isHorizontalMode: isHorizontalMode,
    onStart: () => onDragging(true),
    onEnd: () => {onDragging(false)},
  });

  // add in movement logic:
  useKeyboardMovement({rigidBodyRef: rigidBodyRef ?? defaultRigidBodyRef, modelRef: modelRef, enabled: isSelected && mode === 'edit' && editingMode === 'move',
    isHorizontalMode: isHorizontalMode});

  // if parent page wants the internal model ref, pass it to them.
  useEffect(() => {
    if (isSelected && modelRef.current && onModelUpdate) {
      onModelUpdate(modelRef.current);
    }
    else if (!isSelected && onModelUpdate)// clean up when  de selected.
    {
      onModelUpdate(null);
    }
    return () => {// always clean up on mount or when selected changes.
      if (onModelUpdate) onModelUpdate(null);
    };
  }, [clonedScene, isSelected, onModelUpdate]);

  // add in a custom colour palette to model if user has specfied one.
  useEffect(() => {
    if (modelRef.current) {
      applyColourPalette(modelRef.current, colourPalette);
      
      // Update lights when color palette changes (affects affected meshes)
      if(lightData)
      {
        updateAllLights(modelRef.current, lightData);
      }
    }
  }, [colourPalette]);// may be an error as it may not be constant
  
  // add in a hovered effect if user is in edit mode and hovers over model
  useEffect(() => {
    if (!modelRef.current) return;
    applyHoverEffect(modelRef.current, hovered, mode);
  }, [hovered, mode, currentScale]);

  // after model has been loaded; we want to also update the lights to give them correct initial values
  // (syncs them).
  useEffect(()=>{
    // if the object cannot produce light; or it isn't ready yet; then just return
    if (!modelRef.current || !clonedScene || !modelRef.current.userData.light) return;
    updateAllLights(modelRef.current, modelRef.current.userData.light)
  }, [clonedScene, lightData])

  // Clear hover state when object is selected and editor panel opens
  useEffect(() => {
    if (isSelected && editingMode === 'edit') {
      setHovered(false);
      setIsHoveringObject?.(false);
    }
  }, [isSelected, editingMode, setIsHoveringObject]);

  // making hover effects temporarily size up and down the objects.
  useEffect(() => {
    if (!modelRef.current) return;
  
    const model = modelRef.current;
    const scaleFactor = hovered && mode === 'edit' ? 1.20 : 1.0;
  
    const base = model.userData.baseScale ?? scale[0];

    model.scale.set(base * scaleFactor, base * scaleFactor, base * scaleFactor);
    const lightData = getObjectLightData(model);
   // if model has light data; update the lights to match the new scale.
    if (lightData){
      updateAllLights(model, lightData);
    }  
  }, [hovered, mode,]);

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

  //clean up when object unmounts.
  useEffect(()=>{
    return(()=>{
      if (modelRef.current)
        disposeObject(modelRef.current, false)
    })
  },[])
  
  return (
    <>
        {(isSelected && mode === 'edit' && editingMode === 'move' && rigidBodyRef) &&(
          // default into starting with horizontal mode whenever we open the panel.
          <ObjectFloatingPanel modelId={id} rigidBodyRef={rigidBodyRef} modelRef={modelRef} onClose={() => {setSelectedId(null); 
              setEditingMode('edit')}} isHorizontalMode = {isHorizontalMode} setIsHorizontalMode = {setIsHorizontalMode}
               setMode={setEditingMode}  updateModelInformation = {updateModelInformation} onDelete = {onDelete}/>
        )}

       {/* adding in an extra safeguard to only show the model when it is fully loaded / not null */}
       {clonedScene && (
        <primitive
          ref={modelRef}
          object={clonedScene}
          position={position}
          scale= {scale}
          rotation = {rotation}
          castShadow = {true}
          recieveShadow = {true}
          onDoubleClick={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            if (isSelected) {
              // Deselect if the same model is clicked again
              setSelectedId(null);
            } else {
              // Select new model
              setEditingMode('edit');
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

        {/* models with screens also has light beams for extra affect; so conditionally render them
        if this model has a screen */}
        {hasScreens(modelRef.current) && (() => {
            const screens = getScreens(modelRef.current);
            if (!screens) return null;

            return screens.map((screen, idx) => {
              const dimensionsAndPosition = generateCubeLightBeamDimensionsAndPosition(screen);
              const beamColour = getObjectLightColour(modelRef.current) ?? '#ffffff';
              if (!dimensionsAndPosition) return null;
              
              const { dimensions, position } = dimensionsAndPosition;
                return (
                    <CubeLightBeam
                        key={idx}
                        hostModelRef={modelRef}
                        linkedMesh={screen}
                        width={dimensions.width}
                        height={dimensions.height}
                        depth={dimensions.depth}
                        colour={new THREE.Color(beamColour)}
                        position={position} // place light beam in front of screen (calculated already inside position)
                        // spawns halfway inside the screen; so push it back out (the depth)
                        castLight={true}// screens always cast light
                        castShadow={false}
                        visible={isObjectLightOn(modelRef.current) ?? false}
                        onMount={(beam) => {// on mount; add it to the lightSystemData
                          // so that other parts of the code can access it.
                          const lightSystem = getLightSystemData(modelRef.current);
                          updateCubeLightBeamsArray(lightSystem, 'add', beam);
                        }}
                        onUnmount={(beam) => {
                          const lightSystem = getLightSystemData(modelRef.current);
                          updateCubeLightBeamsArray(lightSystem, 'remove', beam);
                        }}
                    />
                );
            });
        })()}
    </>)
}