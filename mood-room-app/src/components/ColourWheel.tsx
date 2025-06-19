// colour wheel used in editor panel to chnage colours of an Object
'use client';

import React, { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import ColourButton from './ColourButton';
import * as THREE from 'three';
import { getObjectMaterialMap} from '../utils/object3D'

type ColourWheelProps = {
  objectRef: React.RefObject<THREE.Object3D>; // reference of the object that this colour wheel is linked to.
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

  const [materialMap, setMaterialMap] = useState<Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>>({});
  const [availableTypes, setAvailableTypes] = useState<Set<'primary' | 'secondary' | 'tertiary'>>(new Set());

  // going through and travering the object figuring out which colours and parts does it have.
  useEffect(() => {
    if (!objectRef.current) return;

    const { materialMap, initialColors, availableTypes } = getObjectMaterialMap(objectRef);

    setMaterialMap(materialMap);
    setAvailableTypes(availableTypes);

    // Initialise colors to match actual material colors
    setColors((prev) => ({
      ...prev,
      ...initialColors,
    }));

    // Default to first available type
    const firstAvailable = ['primary', 'secondary', 'tertiary'].find((type) => availableTypes.has(type));
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

        {/* Color buttons with labels */}
        <div  className="flex gap-4 mb-4">
        {(['primary', 'secondary', 'tertiary'] as const).map((type) => (
          <ColourButton
            key={type}
            type={type}
            isActive={activeColorType === type}
            isAvailable={availableTypes.has(type)}
            color={colors[type]}
            onClick={() => availableTypes.has(type) && setActiveColorType(type)}
          />
        ))}
        </div>

        {/* Only show color picker if the active material exists */}
        {/* Color picker/ wheel display */}
        {availableTypes.has(activeColorType) ? (
          <HexColorPicker
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
