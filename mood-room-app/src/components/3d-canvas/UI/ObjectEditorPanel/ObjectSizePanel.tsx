'use client'

import { useEffect, useState } from "react";
import * as THREE from "three";
import { HorizontalSlider } from "../../../UI/HorizontalSlider"; 
import { getObjectSizeDifference } from "@/utils/3d-canvas/models";
import { globalScale } from "@/utils/3d-canvas/const";

/************** This panel will be used to change an object's size via buttons and a slider */
type ObjectScalePanelProps = {
  objectRef: React.RefObject<THREE.Object3D | null>;// reference of the object that will change in size.
  objectId: string;// id of the object that will change in size.
};

export function ObjectSizePanel({ objectRef, objectId}: ObjectScalePanelProps) {
  const [sizePercentage, setSizePercentage] = useState(() => getObjectSizeDifference(objectRef));

  // Update slider value when objectId changes (so that it can link up to the new object)
  useEffect(() => {
    setSizePercentage(getObjectSizeDifference(objectRef));
  }, [objectId]);

  // Apply the new scale to the model
  useEffect(() => {
    const model = objectRef.current;
    if (model) {
      const scaleFactor = 1 + sizePercentage / 100;
      const newScale = globalScale * scaleFactor;
      model.userData.baseScale  = newScale;// update the base scale of the model so that the app keeps track of model's
      // current scale (also used for calculations.)
      model.scale.set(newScale, newScale, newScale);
    }
  }, [sizePercentage]);

  // increases/ decreases size by delta unless if it's past the bounds (-50 and + 50).
  function handleSizeChange(delta: number){
    setSizePercentage(prev => {
      const next = prev + delta;
      if (next < -50) return -50;
      if (next > 50) return 50;
      return next;
    });
  };

  return (
    <article className="w-full mt-6 flex flex-col items-stretch border border-gray-400 rounded-xl p-4 bg-white shadow-sm">
    <p className="text-lg font-semibold mb-4 text-center">Size</p>
  
    <HorizontalSlider
      value={sizePercentage}
      onChange={setSizePercentage}
      min={-50}
      max={50}
      step={1}
      unit="%"
      trackcolour="bg-gray-800"
      valueTextcolour="text-gray-400"
    />
  
    <div className="flex justify-center gap-4 mt-4">
      <button
        type="button"
        onClick={() => handleSizeChange(-10)}
        disabled={sizePercentage <= -50}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
      >
        -10%
      </button>
      <button
        type="button"
        onClick={() => handleSizeChange(10)}
        disabled={sizePercentage >= 50}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
      >
        +10%
      </button>
    </div>
  
    <button
      type="button"
      onClick={() => setSizePercentage(0)}
      className="mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400"
    >
      Reset Size
    </button>
  </article>
  
  );
}
