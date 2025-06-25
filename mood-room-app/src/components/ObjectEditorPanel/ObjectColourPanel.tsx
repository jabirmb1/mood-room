// colour wheel used in editor panel to chnage colours of an Object
'use client';

import React, { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import ColourButton from '../ColourButton';
import * as THREE from 'three';
import { getObjectMaterialMap, resetColourPalette} from '../../utils/object3D'
import './colourPicker.css';
import { convertValidColourToHex } from '@/utils/colours';
type ColourWheelProps = {
  objectRef: React.RefObject<THREE.Object3D>; // reference of the object that this colour wheel is linked to.
};

type MaterialcolourMap = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export function ObjectColourPanel({ objectRef }: ColourWheelProps) {
  const [activeColourType, setActiveColourType] = useState<'primary' | 'secondary' | 'tertiary'>('primary');

  const [colours, setColours] = useState<MaterialcolourMap|null>(null);// colour that the current material has on.
  const [colourText, setColourText] = useState<string>('');;// a text string that just says what current colour is.

  const [materialMap, setMaterialMap] = useState<Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>>({});
  const [availableTypes, setAvailableTypes] = useState<Set<'primary' | 'secondary' | 'tertiary'>>(new Set());

  // going through and travering the object figuring out which colours and parts does it have.
  useEffect(() => {
    if (!objectRef.current) return;

    const { materialMap, currentcolours, availableTypes } = getObjectMaterialMap(objectRef);

    setMaterialMap(materialMap);
    setAvailableTypes(availableTypes);
    setColours(currentcolours);

    // Default to first available type
    const firstAvailable = ['primary', 'secondary', 'tertiary'].find((type) => availableTypes.has(type));
    if (firstAvailable) {
      setActiveColourType(firstAvailable);
      setColourText(currentcolours[firstAvailable])// initialise text input
    }
  }, [objectRef]);

  // Apply colour to active material whenever it changes
  useEffect(() => {
    const mat = materialMap[activeColourType];
    if (mat) {
      mat.color.set(colours[activeColourType]);
    }
  }, [colours, activeColourType, materialMap]);

  // syncup the colour text to the current colour:
  useEffect(() => {
    if (colours) {
      setColourText(colours[activeColourType]);
    }
  }, [activeColourType, colours]);

  // wait until colours is ready and then load in the component.
  if (!colours) return null;

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
            isActive={activeColourType === type}
            isAvailable={availableTypes.has(type)}
            colour={colours[type]}
            onClick={() => availableTypes.has(type) && setActiveColourType(type)}
          />
        ))}
        </div>

        {/* Only show colour picker if the active material exists */}
        {/* colour picker/ wheel display */}
        {/* later probs use tailwinds @ apply to override some of the styles for this colour picker to make it bigger */}
        {availableTypes.has(activeColourType) ? (
          <>
            <div className = "colour-picker-wrapper">
              {/* note there is an infinite rerender error/ warning forthe hex colour picker with the onChange;
              it doesn't seem to affect the app other than the warning so I will ignore it. if need be we can fix
              this via throttling or debouncing later */}
            <HexColorPicker
              color={convertValidColourToHex(colours[activeColourType])}// convert to hex before passing it in
              onChange={(newColour) => {
                setColourText(newColour); // Keeps both picker and input in sync
                setColours((prev) => ({ ...prev, [activeColourType]: newColour }));
                }}
            />
            </div>
            {/* Display current hex color value */}
            <div className = 'flex flex-col justify-center'>
              <div className = "flex gap-2 justify-center items-center text-1g p-1 mt-4">
                <p>current colour:</p>
                
                <input
                  type="text"
                  className="border rounded text-center w-24"
                  value={colourText}
                  onChange={(e) => {
                    const input = e.target.value;
                    setColourText(input);
                    if (convertValidColourToHex(input) !== '')  setColours((prev) => ({ ...prev, [activeColourType]: input }));
                  }}
              />
            </div>
            <p className = "text-xs text-red-500 font-bold"
              > note* : colour input only takes in the names of colours that are in the 
                <a 
                 className="underline text-blue-600 hover:text-blue-800"
                href = 'https://www.w3.org/TR/css-color-4/#named-colors'> list of colours inside the css spec. </a>
                if you want to use colours that are not in that spec please just type in e.g. their hex, rgb, hsl equivalent.
              </p>
          </div>
            <button type = 'button'
            className = "mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400"
             onClick={()=>{
              // sync reset button to the rest of the UI
              const initialColours =resetColourPalette(objectRef);
              if (initialColours) setColours(initialColours)}}>Reset Model colours</button>
          </>
        ) : (
          <div className="text-sm text-gray-400 mt-4 italic">This material does not exist on this object.</div>
        )}
      </div>
    </div>
  );
}
