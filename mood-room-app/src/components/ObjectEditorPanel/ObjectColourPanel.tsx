// colour wheel used in editor panel to chnage colours of an Object
'use client';

import React, { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import ColourButton from '../ColourButton';
import * as THREE from 'three';
import { getObjectMaterialMap, resetColourPalette} from '../../utils/object3D'
import './colourPicker.css';

type ColourWheelProps = {
  objectRef: React.RefObject<THREE.Object3D>; // reference of the object that this colour wheel is linked to.
};

type MaterialcolourMap = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export function ObjectColourPanel({ objectRef }: ColourWheelProps) {
  const [activecolourType, setActivecolourType] = useState<'primary' | 'secondary' | 'tertiary'>('primary');

  const [colours, setcolours] = useState<MaterialcolourMap>({
    primary: '#ff0000',
    secondary: '#00ff00',
    tertiary: '#0000ff',
  });

  const [materialMap, setMaterialMap] = useState<Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>>({});
  const [availableTypes, setAvailableTypes] = useState<Set<'primary' | 'secondary' | 'tertiary'>>(new Set());

  // going through and travering the object figuring out which colours and parts does it have.
  useEffect(() => {
    if (!objectRef.current) return;

    const { materialMap, currentcolours, availableTypes } = getObjectMaterialMap(objectRef);

    setMaterialMap(materialMap);
    setAvailableTypes(availableTypes);

    // Initialise colours to match current model colours
    setcolours((prev) => ({
      ...prev,
      ...currentcolours,
    }));

    // Default to first available type
    const firstAvailable = ['primary', 'secondary', 'tertiary'].find((type) => availableTypes.has(type));
    if (firstAvailable) {
      setActivecolourType(firstAvailable);
    }
  }, [objectRef]);

  // Apply colour to active material whenever it changes
  useEffect(() => {
    const mat = materialMap[activecolourType];
    if (mat) {
      mat.color.set(colours[activecolourType]);
    }
  }, [colours, activecolourType, materialMap]);

  return (
    <div className="w-full mt-6 flex flex-col items-center border border-gray-400 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 text-center">Colour</h3>

        {/* colour target buttons header */}
        <p className="mb-1 text-sm font-medium text-gray-700">Select Material Channel:</p>

        {/* colour buttons with labels */}
        <div  className="flex gap-4 mb-4">
        {(['primary', 'secondary', 'tertiary'] as const).map((type) => (
          <ColourButton
            key={type}
            type={type}
            isActive={activecolourType === type}
            isAvailable={availableTypes.has(type)}
            colour={colours[type]}
            onClick={() => availableTypes.has(type) && setActivecolourType(type)}
          />
        ))}
        </div>

        {/* Only show colour picker if the active material exists */}
        {/* colour picker/ wheel display */}
        {/* later probs use tailwinds @ apply to override some of the styles for this colour picker to make it bigger */}
        {availableTypes.has(activecolourType) ? (
          <>
            <div className = "colour-picker-wrapper">
              <HexColorPicker
                className='w-[90%]'
                color={colours[activecolourType]}
                onChange={(newcolour) => {
                  setcolours((prev) => ({ ...prev, [activecolourType]: newcolour }));
                }}/>
            </div>
            <button type = 'button'
            className = "mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400"
             onClick={()=>resetColourPalette(objectRef)}>Reset Model colours</button>
          </>
        ) : (
          <div className="text-sm text-gray-400 mt-4 italic">This material does not exist on this object.</div>
        )}
      </div>
    </div>
  );
}
