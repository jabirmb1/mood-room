'use client';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { ColourPickerControl } from '../../UI/ColourPickerControl';
import { HorizontalSlider } from '../../UI/HorizontalSlider';
import { getObjectLightColour, getObjectLightIntensity, isObjectLightOn, updateAllLights} from '@/utils/3d-canvas/object3D';

type ObjectLightPanelProps = {
  objectRef: React.RefObject<THREE.Object3D | null>; // linked object
};

export function ObjectLightPanel({ objectRef }: ObjectLightPanelProps) {
    const [lightOn, setLightOn] = useState<boolean>(isObjectLightOn(objectRef.current) ?? false);
    const [lightColour, setLightColour] = useState<string>(getObjectLightColour(objectRef.current)??'#ffffff');
    const [intensity, setIntensity] = useState<number>(getObjectLightIntensity(objectRef.current) ?? 1);

    
    // update object lights in real time:
    // Update all bulb lights whenever colour/intensity/on changes
    useEffect(() => {
        if (!objectRef.current?.userData.light) return;

        //update everything at once
        updateAllLights(objectRef.current, {
            on: lightOn,
            intensity: intensity,
            colour: lightColour
        });

    }, [lightOn, lightColour, intensity, objectRef]);

    if(!objectRef.current || !objectRef)
    {
        return null;
    }

    return (   
        <article className="w-full mt-6 flex flex-col items-stretch border border-gray-400 rounded-xl p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">Light</h3>
            {/* either show no light settings; or do show light settings depending if light is currently on/ off*/}

            
            {!lightOn &&(
                <>
                    <button className='mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400'onClick={()=>setLightOn(true)}>
                        Turn light on
                    </button>
                </>
            )}

            {lightOn &&(
                <>
                        {/* Light colour picker */}
                    <div className="colour-picker-wrapper mb-6">
                    <ColourPickerControl
                        value={lightColour}
                        onChange={(newColour) => setLightColour(newColour)}
                        colourText="light colour"
                        showCloseButton={false}
                    />
                    </div>
        
                    {/* Light intensity slider */}
                    <HorizontalSlider label="Intensity" value={intensity} onChange={(val) => setIntensity(val)}
                    min={15} max={30} step={1} unit="" trackcolour="bg-gray-800" rangeLabelcolour="text-grey-300" valueTextcolour="text-grey-400" />

                    {/* button needs styling */}
                    <button  className='mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400' onClick={()=>setLightOn(false)}>
                        turn off light
                    </button>
                </>

            )}
        </article>
    );
}
