import React from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import { ObjectRotationPanel } from "./ObjectRotationPanel";
import { ObjectColourPanel } from "./ObjectColourPanel";

type ObjectEditorPanelProps = {
  objectRef: React.RefObject<THREE.Object3D>;// which oject that this panel relates to/ is linked up with
  objectId: string;// Id of the linked up object
  onClose: () => void;// function to run when this panel closes
  setMode: (mode: string) => void;// setting an object's mode from e.g. 'edit' to 'move' and vice versa
};

export function ObjectEditorPanel({ objectRef,objectId, onClose, setMode }: ObjectEditorPanelProps) {
  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="bg-white shadow-xl border-l border-gray-300 p-6 flex flex-col h-full w-full  overflow-y-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Object Controls</h2>

      <div className="flex gap-2 justify-center mb-4">
        <ObjectColourPanel objectRef={objectRef} />
      </div>

      <div className="flex gap-2 justify-center mb-6">
        <ObjectRotationPanel objectRef={objectRef} objectId = {objectId}/>
      </div>

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
          // Optional delete logic
        >
          Delete Object
        </button>
      </div>
    </motion.aside>
  );
}
