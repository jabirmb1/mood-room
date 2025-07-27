import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ObjectRotationPanel } from "./ObjectRotationPanel";
import { ObjectColourPanel } from "./ObjectColourPanel";
import { ObjectSizePanel } from "./ObjectSizePanel";
import { Model } from "@/types/types";
import { getObjectMaterialMap } from "@/utils/object3D";
import { RapierRigidBody } from "@react-three/rapier";

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
  const unmountCounterRef = useRef(0);
  // since we are conditionally rendering this panel the life cycle of it is: mount -> unmount -> remount -> unmount last time)
  // Onthe last unmount (e.g. it visually goes away; we will want to do the clean up logic), update model with final transform data
  useEffect(() => {
    const currentObjectId = objectId;
    return () => {
      unmountCounterRef.current += 1;// just unmounted
      // Only run update when counter hits 2)
      if (unmountCounterRef.current === 2) {// second unmount; component is about to be visiually removed from scene
        // TO DO: this may be bad for other browsrs; test and go for new logic if necessary
        // e.g. always render editing panel but do .visible = false and pass it in from editor.
       
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
          rotation = { x: euler.x, y: euler.y, z: euler.z };;// storing rotation in radians.
        }
        else {
          rotation = object.rotation;
        }

        const { currentcolours } = getObjectMaterialMap(objectRef);
        updateModelInformation(objectId, {// storing the data.
          rotation: [rotation.x, rotation.y, rotation.z],
          scale: [object.scale.x, object.scale.y, object.scale.z],
          colourPalette: currentcolours,
        });
      }
    };
  }, [objectId]);

  if (!objectRef?.current || !objectId) {
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
