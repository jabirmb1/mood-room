
'use client';
import { Html } from "@react-three/drei";
import { RefObject } from "react";
import * as THREE from "three";
import React from "react";
import { motion } from "framer-motion";
import { RotatingSlider } from "./RotatingSlider";
import { ColourWheel } from "./ColourWheel";

type ObjectEditorPanelProps = {
  objectRef: RefObject<THREE.Object3D>;
  onClose: () => void;
};

export function ObjectEditorPanel({ objectRef, onClose }: ObjectEditorPanelProps) {
  return (
    <Html fullscreen>
      <div className="absolute inset-0 grid grid-cols-2 rounded">
        {/* Left side: preview area */}
        <div className="bg-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Object Preview</h2>
          <div className="w-full h-64 bg-white rounded shadow-inner flex items-center justify-center">
            <p>Live preview area</p>
          </div>
        </div>

        {/* Right side: controls */}
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="bg-white shadow-lg border-l border-gray-200 p-6 flex-1"
        >
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Object Controls</h2>

            <div className="flex gap-2 justify-center">
              <ColourWheel objectRef={objectRef} />
            </div>

            <div className="flex gap-2 justify-center">
              <RotatingSlider />
            </div>

            <div className="flex gap-6 md:gap-4 sm:gap-2 justify-center">
              <button className="bg-red-500 text-white px-4 py-2 rounded outline-color-transparent" onClick={onClose}>Close</button>
              <button className="bg-red-500 text-white px-4 py-2 rounded outline-color-transparent">Delete Object</button>
            </div>
          </div>
          
        </motion.aside>
      </div>
    </Html>
  );
}
