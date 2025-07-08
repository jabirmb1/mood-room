import React from "react";
import * as THREE from "three";
import { ObjectRotationPanel } from "./ObjectRotationPanel";
import { ObjectColourPanel } from "./ObjectColourPanel";
import { ObjectSizePanel } from "./ObjectSizePanel";

type ObjectEditorPanelProps = {
  rigidBodyRef: React.RefObject<THREE.Object3D | null>;// ref to object's rigid body, has objects current pos and rotation, size etc.
  objectRef: React.RefObject<THREE.Object3D>;// which oject that this panel relates to/ is linked up with
  objectId: string;// Id of the linked up object
  refreshRigidBody:  (id: string) => void;// a function to change the rigid body of an object when needed.
  onClose: () => void;// function to run when this panel closes
  onDelete: () => void;// function to delete selected object.
  setMode: (mode: string) => void;// setting an object's mode from e.g. 'edit' to 'move' and vice versa
};

export function ObjectEditorPanel({ rigidBodyRef, objectRef,objectId,refreshRigidBody, onClose, onDelete, setMode }: ObjectEditorPanelProps) {
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
          <ObjectSizePanel objectRef={objectRef} objectId = {objectId} refreshRigidBody={refreshRigidBody}/>
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
