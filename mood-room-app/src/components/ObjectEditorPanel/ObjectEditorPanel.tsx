import React, { useEffect } from "react";
import * as THREE from "three";
import { ObjectRotationPanel } from "./ObjectRotationPanel";
import { ObjectColourPanel } from "./ObjectColourPanel";
import { ObjectSizePanel } from "./ObjectSizePanel";
import { Model } from "@/types/types";
import { getObjectMaterialMap } from "@/utils/object3D";
import { RapierRigidBody } from "@react-three/rapier";

type ObjectEditorPanelProps = {
  rigidBodyRef:React.RefObject<RapierRigidBody | null>;// ref to object's rigid body, has objects current pos and rotation, size etc.
  objectRef: React.RefObject<THREE.Object3D> | null;// which oject that this panel relates to/ is linked up with
  objectId: string;// Id of the linked up object
  updateModelInformation: (id: string, updates: Partial<Model>) => void;
  onClose: () => void;// function to run when this panel closes
  onDelete: () => void;// function to delete selected object.
  setMode: (mode: string) => void;// setting an object's mode from e.g. 'edit' to 'move' and vice versa
};

export function ObjectEditorPanel({ rigidBodyRef, objectRef,objectId,updateModelInformation, onClose, onDelete, setMode }: ObjectEditorPanelProps) {
 // On unmount, update model with final transform data
 useEffect(() => {
  return () => {
    const object = objectRef?.current;
    if (!object) return;

      const rigid = rigidBodyRef?.current;
      
      // Add null checks and error handling
      let rotation = { x: 0, y: 0, z: 0 };
      
      if (rigid && rigid.rotation) {
        // Safely get rotation from rigid body
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

      updateModelInformation(objectId, {
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [object.scale.x, object.scale.y, object.scale.z],
        colourPalette: currentcolours,
      });
  };
}, [objectRef, rigidBodyRef, objectId, updateModelInformation]);

  if (!objectRef?.current) {
    return null; // wait until the object is ready
  }

  return (
      <article className = "bg-white shadow-xl border-l border-gray-300 p-6 flex flex-col h-full w-full  overflow-y-auto">
        <h2 className="text-xl font-semibold mb- text-center">Object Controls</h2>

        <section className="flex gap-2 justify-center mb-4">
          <ObjectColourPanel objectRef={objectRef} />
        </section>

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
