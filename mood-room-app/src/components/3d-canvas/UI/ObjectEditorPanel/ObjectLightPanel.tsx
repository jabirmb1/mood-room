'use client';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { ColourPickerControl } from '../../../UI/ColourPickerControl';
import { HorizontalSlider } from '../../../UI/HorizontalSlider';
import { getObjectLightColour, getObjectLightIntensity, isObjectLightOn, updateAllLights} from '@/utils/3d-canvas/models';
import { baseModelPointLightIntensity } from '@/utils/3d-canvas/const';
import { getLightSystemData, hasAnyLightSources, hasPointLightSources, hasScreens, toggleCubeLightBeamsvisibility } from '@/utils/3d-canvas/models/lightingSystem';

/********This component will handle all settings that the user can tweak to change the output of the lights
 * that are emmitted by the model
 */
type ObjectLightPanelProps = {
  objectRef: React.RefObject<THREE.Object3D | null>; // linked object
};

export function ObjectLightPanel({ objectRef }: ObjectLightPanelProps) {
    const [lightOn, setLightOn] = useState<boolean>(isObjectLightOn(objectRef.current) ?? false);
    const [lightColour, setLightColour] = useState<string>(getObjectLightColour(objectRef.current)??'#ffffff');
    // Slider state: store the UI value (-50 to +50)
    const [intensityUI, setIntensityUI] = useState<number>(intensityToUI(getObjectLightIntensity(objectRef.current) ?? baseModelPointLightIntensity))

    
    // Convert slider value (-50 to +50) → internal intensity
    function uiToIntensity(val: number) {
        return baseModelPointLightIntensity * (1 + val / 100); // -50 -> 0.5×, 0 -> 1×, +50 -> 1.5×
    }
  
    // Convert internal intensity → slider value (-50 to +50)
    function intensityToUI(intensity: number){
        return ((intensity / baseModelPointLightIntensity) - 1) * 100;
    }

    // Update effect to map UI to real intensity
    useEffect(() => {

        const object = objectRef.current

        // if the model has a screen; then it has a volumetricLightBeam mesh; toggle their visibility
        // if it has changed
        if (hasScreens(object))
        {
            const lightSystemData = getLightSystemData(object)
            if (lightSystemData)
            {
                toggleCubeLightBeamsvisibility(lightSystemData, lightOn)
            }
        }
        
        const internalIntensity = uiToIntensity(intensityUI);
        if (!object?.userData.light) return;
        updateAllLights(object, {
        on: lightOn,
        intensity: internalIntensity,
        colour: lightColour
        });
    }, [intensityUI, lightOn, lightColour, objectRef]);

    //if intensityUI ever goes past bounds; just put them back in bounds.
    useEffect(()=>{
        if(intensityUI > 50)
        {
            setIntensityUI(50);
        }
        else if (intensityUI < -50)
        {
            setIntensityUI(-50)
        }
    }, [intensityUI])
    

    if(!objectRef || !objectRef.current)
    {
        return null;
    }

    // If object doesn't have any light sources, don't show the panel
    if (!hasAnyLightSources(objectRef.current)) {
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

                    {/*only show colour picker and intensity if the light mesh actually has point lights
                    to config; otherwise just show the buttons */}

                    {/* will extend this later to any three.js lights */}
                    {/* extend this to use e.g. hasUserConfigurableLights function */}
                    {/* since e.g. spotligt inside light beams are not user configurable */}
                    {hasPointLightSources(objectRef.current) && (
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
                            <HorizontalSlider
                            label="Intensity"
                            value={intensityUI}
                            onChange={setIntensityUI}
                            min={-50}
                            max={50}
                            step={1}
                            unit="%"
                            trackcolour="bg-gray-800"
                            rangeLabelcolour="text-grey-300"
                            valueTextcolour="text-grey-400"
                            />

                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIntensityUI(intensityUI - 10)}
                                    disabled={intensityUI <= -50}
                                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    -10%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIntensityUI(intensityUI + 10)}
                                    disabled={intensityUI >= 50}
                                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    +10%
                                </button>
                                </div>
                            
                                <button
                                type="button"
                                onClick={() => setIntensityUI(0)}
                                className="mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400"
                                >
                                Reset Intensity.
                                </button>
                        </>
                    )}

                    <button  className='mt-4 px-4 py-1 text-sm bg-blue-200 rounded hover:bg-blue-400' onClick={()=>setLightOn(false)}>
                        turn off light
                    </button>
                </>

            )}
        </article>
    );
}