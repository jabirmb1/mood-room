import React, { useState } from 'react';
import { ColourPickerControl } from '../ColourPickerControl';

export interface LightingConfig {
  ambient: { intensity: number; colour: string };// intensity and colour of ambient light
  directional: { intensity: number; colour: string };// intensity and colour of directional light.
}

interface LightingPanelProps {
  config: LightingConfig;// initial configurations of the light panel
  onChange: (config: LightingConfig) => void;// what happens when the configurations change.
}

export const LightingPanel: React.FC<LightingPanelProps> = ({ config, onChange }) => {
  // keeping some use states to show the respetive hex colour picker for the two lights.
  const [showAmbientPicker, setShowAmbientPicker] = useState(false);
  const [showDirectionalPicker, setShowDirectionalPicker] = useState(false);

  // This function is used to just update the light configs .
  function updateLight( type: 'ambient' | 'directional',  field: 'intensity' | 'colour', value: number | string){
    onChange({ ...config, [type]: { ...config[type],
        [field]: value,
      },
    });
  };

  return (
    <div className="h-full flex flex-col rounded-lg h-[80vh]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Lighting</h3>
      </div>

      {(['ambient', 'directional'] as const).map((type) => {
        const label = type === 'ambient' ? '💡 Ambient' : '☀️ Directional';
        const showPicker = type === 'ambient' ? showAmbientPicker : showDirectionalPicker;
        const setShowPicker = type === 'ambient' ? setShowAmbientPicker : setShowDirectionalPicker;
        const colour = config[type].colour;

        return (
          <div key={type} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{label}</span>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-2 mb-2">
              <input
                type="range"
                min="0"
                max={type === 'ambient' ? 2 : 3}
                step="0.1"
                value={config[type].intensity}
                onChange={(e) =>
                  updateLight(type, 'intensity', parseFloat(e.target.value))
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {config[type].intensity.toFixed(1)}
              </span>
            </div>

            {/* Colour control row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-700">Current colour:</span>
              <button
                className="w-6 h-6 border rounded shadow"
                style={{ backgroundColor: colour }}
                onClick={() => setShowPicker(true)}
                title="Click to edit colour"
              />
            </div>

            {/* Picker UI */}
            {showPicker && (
             <ColourPickerControl
             value={colour}
             colourText={''}
             onChange={(newColour) => updateLight(type, 'colour', newColour)}
             onClose={() => setShowPicker(false)}
           />
            )}
          </div>
        );
      })}
    </div>
  );
};
