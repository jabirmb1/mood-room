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
    <article className="w-full mt-6 flex flex-col items-stretch border border-gray-400 rounded-xl p-4 bg-white shadow-sm">
      <p className ="text-lg font-semibold mb-4 text-center">Rotation</p>
      <HorizontalSlider  value={rotation} onChange={setRotation} min={-180} max={180} step={1} 
      unit="°" trackcolour="bg-gray-800" rangeLabelcolour="text-grey-300" valueTextcolour="text-grey-400" />
 
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
      <button type = 'button'  className="mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400"
      onClick={()=> setRotation(0)}>Reset Rotation</button>
    </article>
  );
}