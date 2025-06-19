// rotating slider component used in the object editor panel to rotate the object
'use client'
import { getObjectRotation } from "@/utils/object3D";
import { useState, useEffect } from "react";
import * as THREE from "three";

type RotatingSliderProps = {
  objectRef: React.RefObject<THREE.Object3D>// what object that this slider is controlling
  objectId: String// Id of the object.
}
export function RotatingSlider({objectRef, objectId}: RotatingSliderProps) {
  const [rotation, setRotation] = useState(() => getObjectRotation(objectRef))// intialise the rotation to object's
                                                                              // current rotation.

  // sync the slider to what the model's current rotation is.
  useEffect(() => {
    const model = objectRef.current;
    if (model) {
      setRotation(THREE.MathUtils.radToDeg(model.rotation.y));
    }
  }, [objectId]);

  // Apply slider rotation to actual model
  useEffect(() => {
    const model = objectRef.current;
    if (model) {
      model.rotation.y = THREE.MathUtils.degToRad(rotation);
    }
  }, [rotation]);
  return (
    <div className="w-full mt-6">
      <label className="block mb-2 text-xl font-medium text-gray-700">
        Rotate
      </label>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">-180°</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          className="w-full h-6 bg-black rounded-lg appearance-none accent-yellow-500 cursor-pointer"
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))  }
        />
        <span className="text-sm text-gray-500">180°</span>
      </div>
      <div className="mt-2 text-center text-sm text-gray-600 mb-2">
        Current: {rotation.toFixed(1)}°{/* show one decimal place */}
      </div>
    </div>
  );
} 