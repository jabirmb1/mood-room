import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ObjectRotationPanel } from "./ObjectRotationPanel";
import { ObjectColourPanel } from "./ObjectColourPanel";
import { ObjectSizePanel } from "./ObjectSizePanel";
import { Model, RotationDegrees } from "@/types/types";
import { getObjectLightData, getObjectMaterialMap, isObjectLight } from "@/utils/3d-canvas/object3D";
import { RapierRigidBody } from "@react-three/rapier";
import { getRigidBodyRotation } from "@/utils/3d-canvas/rotation";
import { areLightDataEqual, areRotationsEqual, areVectorsEqual, deepEqual } from "@/utils/3d-canvas/comparisons";
import { globalScale } from "@/utils/3d-canvas/const";
import { ObjectLightPanel } from "./ObjectLightPanel";

/******** This panel will be used to change the properties of an object e.g. it's rotation; size; colour scheme etc. ********/

type ObjectEditorPanelProps = {
  rigidBodyRef:React.RefObject<RapierRigidBody | null>;// ref to object's rigid body, has objects current pos and rotation, size etc.
  objectRef: React.RefObject<THREE.Object3D | null>;// which oject that this panel relates to/ is linked up with
  objectId: string;// Id of the linked up object
  updateModelInformation: (id: string, updates: Partial<Model>) => void;
  onClose: () => void;// function to run when this panel closes
  onDelete: () => void;// function to delete selected object.
  setMode: (mode: 'edit' | 'move') => void;// setting an object's mode from e.g. 'edit' to 'move' and vice versa
};

export function ObjectEditorPanel({ rigidBodyRef, objectRef,objectId,updateModelInformation, onClose, onDelete, setMode }: ObjectEditorPanelProps) {
  const initialScale = useRef<THREE.Vector3 | null>(null);
  const initialColours = useRef<Model['colourPalette'] | null>(null);
  const initialRotation = useRef<RotationDegrees | null>(null);
  const initialLights = useRef<Model['light'] | null>(null)
  // since we are conditionally rendering this panel the life cycle of it is: mount -> unmount -> remount -> unmount last time)
  // Onthe last unmount (e.g. it visually goes away; we will want to do the clean up logic), update model with final transform data
  useEffect(() => {
    const currentObjectId = objectId;
    const object = objectRef.current;
    if (!object) return;

    // on mount store initial details of the object.
    initialScale.current = object.scale.clone() ?? new THREE.Vector3(globalScale, globalScale, globalScale);
    initialRotation.current = getRigidBodyRotation(rigidBodyRef);
    initialColours.current = getObjectMaterialMap(objectRef).currentcolours;
    initialLights.current = getObjectLightData(objectRef.current)

    return () => {
  
      // on unmount check to see if there was any differences; if there was then update the model information
      const object = objectRef?.current;
      if (!object || !currentObjectId) return;// make sure that we are updating the correct object.

      const rigid = rigidBodyRef?.current;

      // Add null checks and error handling
      let rotation = { x: 0, y: 0, z: 0 };

      if (rigid && rigid.rotation) {
        const quaternion = rigid.rotation();
        const euler = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
        );
        rotation = { x: euler.x, y: euler.y, z: euler.z };// storing rotation in radians.
      }
      else {
        rotation = object.rotation;
      }
      const { currentcolours } = getObjectMaterialMap(objectRef);
      const currentLightData = getObjectLightData(objectRef.current)
      
      const originalScale = initialScale.current;
      const originalRotation = initialRotation.current;
      const originalColours = initialColours.current;
      const originalLights = initialLights.current

      //(pass in undefined if we want to skip updating that field)
      // otherwise pass in the new value so that we can update that part
      updateModelInformation(objectId, {
        rotation: originalRotation && areRotationsEqual(originalRotation, rotation) ? undefined : [rotation.x, rotation.y, rotation.z],
        scale: originalScale && areVectorsEqual(object.scale, originalScale) ? undefined : [object.scale.x, object.scale.y, object.scale.z],
        colourPalette: originalColours && deepEqual(originalColours, currentcolours) ? undefined : currentcolours,
        light: originalLights && areLightDataEqual(originalLights, currentLightData) ? undefined : currentLightData ?? undefined
      });
    };
  }, [objectId]);

  if (!objectRef?.current || !objectId) {
    return null; // wait until the object is ready
  }

  return (
      <article className = "bg-white border-4 border-black p-6 flex flex-col h-full w-full overflow-y-auto">
        <h2 className="text-xl font-semibold mb- text-center">Object Controls</h2>

        <section className="flex gap-2 justify-center mb-4">
          <ObjectColourPanel objectRef={objectRef} />
        </section>

        {isObjectLight(objectRef) && (
          <section className="flex gap-2 justify-center mb-4">
          <ObjectLightPanel objectRef={objectRef} />
        </section>
        )}

        <section className="flex gap-2 justify-center mb-6">
          <ObjectRotationPanel rigidBodyRef={rigidBodyRef} objectId = {objectId}/>
        </section>

        <section className="flex gap-2 justify-center mb-6">
          <ObjectSizePanel objectRef={objectRef} objectId = {objectId}/>
        </section>

        <div className="flex gap-6 md:gap-4 sm:gap-2 justify-center mt-auto">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded outline-none"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setMode('move')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded outline-none"
          >
            Move
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded outline-none"
            onClick ={onDelete}
          >
            Delete Object
          </button>
        </div>
    </article>
  );
}
