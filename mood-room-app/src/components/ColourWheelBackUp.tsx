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

  //store material references by name  const [materialMap, setMaterialMap] = useState<Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>>({});

  // Track which material types are available on this object
  const [availableTypes, setAvailableTypes] = useState<Set<'primary' | 'secondary' | 'tertiary'>>(new Set());

  useEffect(() => {
    const obj = objectRef.current;
    if (!obj) return;
  
    const newMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>> = {};
    const foundTypes = new Set<'primary' | 'secondary' | 'tertiary'>();
    const newColors: Partial<MaterialColorMap> = {};
  
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
  
        ['primary', 'secondary', 'tertiary'].forEach((type) => {
          if (material.name === type) {
            newMap[type] = material;
            foundTypes.add(type);
            newColors[type] = `#${material.color.getHexString()}`; // get color from the mesh
          }
        });
      }
    });
  
    setMaterialMap(newMap);
    setAvailableTypes(foundTypes);
  
    // Initialise colors to match actual material colors
    setColors((prev) => ({
      ...prev,
      ...newColors,
    }));
  
    // Default to first available type
    const firstAvailable = ['primary', 'secondary', 'tertiary'].find((type) => foundTypes.has(type));
    if (firstAvailable) {
      setActiveColorType(firstAvailable);
    }
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
        <h3 className="font-semibold mb-2">Change to your liking!</h3>

        {/* Color target buttons header */}
        <p className="mb-1 text-sm font-medium text-gray-700">Select Material Channel:</p>

          {/* Color buttons  with labels*/}
        <div className="flex gap-4 mb-4">
          {(['primary', 'secondary', 'tertiary'] as const).map((type) => {
            const isAvailable = availableTypes.has(type);
            return (
              <div key={type} className="flex flex-col items-center text-center">
                {/* the actual colour circular buttons that we can click to edit, some models won't have all three
                 so we need to disable some buttons and grey them out */}
                <button
                  className={`
                    w-8 h-8 rounded border transition-all relative
                    ${activeColorType === type ? 'ring-2 ring-black' : ''}
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed ring-2 ring-red-500' : ''}
                  `}
                  style={{ backgroundColor: !isAvailable ? 'grey' : colors[type]}}
                  onClick={() => isAvailable && setActiveColorType(type)}
                  disabled={!isAvailable}
                >
                  {/* adding a red diagonal line across button if it is disabled */}
                  <div className = {` ${!isAvailable ? 'absolute top-1/2 left-0 w-full h-[2px] bg-red-500 rotate-45 origin-center pointer-events-none' : ''}`}/>
                  <div className = {` ${!isAvailable ? 'absolute top-1/2 left-0 w-full h-[2px] bg-red-500 rotate-315 origin-center pointer-events-none' : ''}`}/>
                </button>
                <span className="mt-1 text-xs capitalize">{type}</span>
              </div>
            );
          })}
        </div>

        {/* Only show color picker if the active material exists */}
        {availableTypes.has(activeColorType) ? (
          <HexColorPicker  {/* Color picker/ wheel display */}
            color={colors[activeColorType]}
            onChange={(newColor) => {
              setColors((prev) => ({ ...prev, [activeColorType]: newColor }));
            }}
          />
        ) : (
          <div className="text-sm text-gray-400 mt-4 italic">This material does not exist on this object.</div>
        )}
      </div>
    </div>
  );
}
