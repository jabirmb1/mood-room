// rotating slider component used in the object editor panel to rotate the object
'use client'
import { useState } from "react";

export function RotatingSlider() {
  const [rotation, setRotation] = useState(0);
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
        Current: {rotation}
      </div>
    </div>
  );
} 