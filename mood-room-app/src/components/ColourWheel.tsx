// colour wheel used in editor panel to chnage colours
'use client';

import React, { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import * as THREE from 'three';

type ColourWheelProps = {
  objectRef: React.RefObject<THREE.Object3D>;
};

type MaterialColorMap = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export function ColourWheel({ objectRef }: ColourWheelProps) {
  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary' | 'tertiary'>('primary');

  const [colors, setColors] = useState<MaterialColorMap>({
    primary: '#ff0000',
    secondary: '#00ff00',
    tertiary: '#0000ff',
  });

  //store material references by name
  const [materialMap, setMaterialMap] = useState<Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>>({});

  // On first load or when object changes, collect named materials
  useEffect(() => {
    const obj = objectRef.current;
    if (!obj) return;

    const newMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>> = {};

    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (material.name === 'primary') newMap.primary = material;
        if (material.name === 'secondary') newMap.secondary = material;
        if (material.name === 'tertiary') newMap.tertiary = material;
      }
    });

    setMaterialMap(newMap);
  }, [objectRef]);

  // Apply color to active material whenever it changes
  useEffect(() => {
    const mat = materialMap[activeColorType];
    if (mat) {
      mat.color.set(colors[activeColorType]);
    }
  }, [colors, activeColorType, materialMap]);

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center">
        <h3 className="font-semibold mb-2">Change to your liking!!</h3>

        {/* Color target buttons header */}
        <p className="mb-1 text-sm font-medium text-gray-700">Select Material Channel:</p>

        {/* Color buttons  with labels*/}
        <div className="flex gap-2 mb-4">
          {(['primary', 'secondary', 'tertiary'] as const).map((type) => (
            <div key={type} className="flex items-center">
              <button
                className={`w-8 h-8 rounded border ${activeColorType === type ? 'ring-2 ring-black' : ''}`}
                style={{ backgroundColor: colors[type] }}
                onClick={() => setActiveColorType(type)}
              />
              <span className="ml-2">{type}</span>
            </div>
          ))}
        </div>

        {/* Color picker/ wheel display */}
        <div className="mb-4">
          <HexColorPicker
            color={colors[activeColorType]}
            onChange={(newColor) => {
              setColors((prev) => ({ ...prev, [activeColorType]: newColor }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
