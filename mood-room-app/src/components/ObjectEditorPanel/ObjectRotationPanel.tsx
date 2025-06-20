'use client'
// This componentn will handle all the UI buttons sliders that can affect an object's rotation.
import { useEffect, useState } from "react";
import * as THREE from "three";
import { HorizontalSlider } from "../HorizontalSlider"; 
import { getObjectRotation } from "@/utils/object3D";
import {normaliseDegrees} from "@/utils/rotation";

type RotateComponentProps = {
  objectRef: React.RefObject<THREE.Object3D>;// reference of the object that it is rotating
  objectId: string;// id of the object that it is rotating.
};

export function ObjectRotationPanel({ objectRef, objectId }: RotateComponentProps) {
  const [rotation, setRotation] = useState(() => getObjectRotation(objectRef))// intialise the rotation to object's
  // current rotation.

  // Sync initial rotation from object on objectId change
  useEffect(() => {
    const model = objectRef.current;
    if (model) {
      setRotation(THREE.MathUtils.radToDeg(model.rotation.y));
    }
  }, [objectId]);

  // Apply rotation to model
  useEffect(() => {
    const model = objectRef.current;
    if (model) {
      model.rotation.y = THREE.MathUtils.degToRad(rotation);
    }
  }, [rotation]);

  const handleRotate = (delta: number) => {
    setRotation((prev) => normaliseDegrees(prev + delta));// this makes the degrees be bounded between -180 and + 180 degrees
  };

  return (
    <div className="w-full mt-6">
      <HorizontalSlider  value={rotation} onChange={setRotation} min={-180} max={180} step={1} 
      unit="°" trackColor="bg-gray-800" rangeLabelColor="text-grey-300" valueTextColor="text-grey-400" />
 
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => handleRotate(-90)}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          ⟲ 90° anti-clockwise 
        </button>
        <button
          onClick={() => handleRotate(90)}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          ⟳ 90° clockwise
        </button>
      </div>
    </div>
  );
}