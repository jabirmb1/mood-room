import React from 'react';

export interface LightingConfig {
  ambient: { intensity: number; color: string };
  directional: { intensity: number; color: string };
}

interface LightingPanelProps {
  config: LightingConfig;
  onChange: (config: LightingConfig) => void;
}

export const LightingPanel: React.FC<LightingPanelProps> = ({ config, onChange }) => {
  // ✅ Declare updateLight inside the component
  const updateLight = (type: 'ambient' | 'directional', field: 'intensity' | 'color', value: number | string) => {
    onChange({
      ...config,
      [type]: {
        ...config[type],
        [field]: value
      }
    });
  };

  return (
    <div className="h-full flex flex-col rounded-lg h-[80vh]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Lighting</h3>
      </div>

      {/* Ambient Light */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">💡</span>
          <span className="text-sm font-medium">Ambient</span>
        </div>
        <div className="space-y-2">
          <div>
            <input
              type="range"
              min="0" max="2" step="0.1"
              value={config.ambient.intensity}
              onChange={(e) => updateLight('ambient', 'intensity', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{config.ambient.intensity.toFixed(1)}</span>
          </div>
          <input
            type="color"
            value={config.ambient.color}
            onChange={(e) => updateLight('ambient', 'color', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Directional Light */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">☀️</span>
          <span className="text-sm font-medium">Directional</span>
        </div>
        <div className="space-y-2">
          <div>
            <input
              type="range"
              min="0" max="3" step="0.1"
              value={config.directional.intensity}
              onChange={(e) => updateLight('directional', 'intensity', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{config.directional.intensity.toFixed(1)}</span>
          </div>
          <input
            type="color"
            value={config.directional.color}
            onChange={(e) => updateLight('directional', 'color', e.target.value)}
            className="w-8 h-8 border rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
