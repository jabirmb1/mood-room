// colour wheel used in editor panel to chnage colours of an Object
'use client';
import React, { useEffect, useState } from 'react';
import ColourButton from '../ColourButton';
import * as THREE from 'three';
import { getObjectMaterialMap, resetColourPalette} from '../../utils/object3D'
import { ColourPickerControl } from '../ColourPickerControl';
import './colourPicker.css';
import { MaterialColourType } from '@/types/types';
import { modelMaterialNames } from '@/utils/const';
type ColourWheelProps = {
  objectRef: React.RefObject<THREE.Object3D | null>; // reference of the object that this colour wheel is linked to.
};

type MaterialcolourMap = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export function ObjectColourPanel({ objectRef }: ColourWheelProps) {
  const [activeColourType, setActiveColourType] = useState<MaterialColourType>('primary');

  const [colours, setColours] = useState<Partial<MaterialcolourMap>|null>(null);// colour that the current material has on.
  const [colourText, setColourText] = useState<string>('');;// a text string that just says what current colour is.

  const [materialMap, setMaterialMap] = useState<Partial<Record<MaterialColourType, THREE.MeshStandardMaterial[]>>>({});
  const [availableTypes, setAvailableTypes] = useState<Set<MaterialColourType>>(new Set());

  // going through and travering the object figuring out which colours and parts does it have.
  useEffect(() => {
    if (!objectRef.current) return;

    const { materialMap, currentcolours, availableTypes } = getObjectMaterialMap(objectRef);

    setMaterialMap(materialMap);
    setAvailableTypes(availableTypes);
    setColours(currentcolours);

    // Default to first available type
    const firstAvailable = (modelMaterialNames).find(
      (type): type is MaterialColourType => availableTypes.has(type)
    );
    
    if (firstAvailable) {
      setActiveColourType(firstAvailable);
      setColourText(currentcolours[firstAvailable] ?? ''); // initialise the text input.
    }    
  }, [objectRef]);

  // Apply colour to active material whenever it changes
  useEffect(() => {
    const mats = materialMap[activeColourType];
    const newColour = colours?.[activeColourType];
  
    if (mats && newColour) {
      for (const mat of mats) {// go through all e.g. 'primary' materials and give them the same colour
        mat.color.set(newColour);
        mat.needsUpdate = true;
      }
    }
  }, [colours, activeColourType, materialMap]);

  // syncup the colour text to the current colour:
  useEffect(() => {
    if (colours) {
      setColourText(colours[activeColourType] ?? '');
    }
  }, [activeColourType, colours]);

  // wait until colours is ready and then load in the component.
  if (!colours) return null;

  return (
    <article className="w-full mt-6 flex flex-col items-center border border-gray-400 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 text-center">Colour</h3>

        {/* colour target buttons header */}
        <p className="mb-1 text-sm font-medium text-gray-700">Select Material Channel:</p>

        {/* colour buttons with labels */}
        <div  className="flex gap-4 mb-4">
        {(modelMaterialNames).map((type) => (
          <ColourButton
            key={type}
            type={type}
            isActive={activeColourType === type}
            isAvailable={availableTypes.has(type)}
            colour={colours[type] ?? 'transparent'}
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
            <ColourPickerControl
                value={colours[activeColourType] ?? 'transparent'}
                onChange={(newColour) => {
                  setColours((prev) => ({ ...prev, [activeColourType]: newColour }));
                }}
                colourText="current colour"
                showCloseButton={false}
              />
            </div>
            <p className = "text-xs text-red-500 font-bold"
              > note* : colour input only takes in the names of colours that are in the 
                <a 
                 className="underline text-blue-600 hover:text-blue-800"
                href = 'https://www.w3.org/TR/css-color-4/#named-colors'> list of colours inside the css spec. </a>
                if you want to use colours that are not in that spec please just type in e.g. their hex, rgb, hsl equivalent.
            </p>
            
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
    </article>
  );
}
