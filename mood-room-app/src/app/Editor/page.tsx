// editor page where u can customize it all
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { LightingConfig, LightingPanel } from '@/components/LightingPanel';
import MainWalls from '@/components/MainWalls';
import { Object3D } from '@/components/3d/Object3D';
import { v4 as uuidv4 } from 'uuid';
import { AddFurnitureTab } from '@/components/AddFurnitureTab';
import { FurnitureItem } from '@/components/AddFurnitureTab';
import { Sun } from 'lucide-react';

type Model = {
  id: string;
  url: string;
  colourPalette: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  position: [number, number, number];
  scale?: [number, number, number];
};

const initialModels: Model[] = [
  {
    id: uuidv4(),
    url: "/assets/NormTable.glb",
    colourPalette: {
      primary: "#0000ff",
      secondary: "#ff0000",
      tertiary: "#ff0000"
    },
    position: [0, 0, 0],
  },
  {
    id: uuidv4(),
    url: "/assets/NormTable.glb",
    colourPalette: {
      primary: "#ff0000",
      secondary: "#00ff00",
      tertiary: "#0000ff"
    },
    position: [4, 0, 0],
  },
];

export default function Editor() {
  const [selectedId, setSelectedId] = useState<string | null>(null);  //needed due to popup for editor of furniture
  const [models, setModels] = useState(() => initialModels);
  const [isDragging, setDragging] = useState(false); // needed for orbit controls
  const [showFurnitureTab, setShowFurnitureTab] = useState(false); // needed for popup of furniture tab hide or not
  const [showLightingPanel, setShowLightingPanel] = useState(false); // needed for popup of lighting panel hide or not
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({ // base ligthing when just loaded
    ambient: { intensity: 0.5, color: '#ffffff' },
    directional: { intensity: 1, color: '#ffffff' }
  });


  // When selectedId is non-null, editor panel is open so user can scroll when popup is open.
  const isPopupOpen = selectedId !== null;
  useEffect(() => {
    if (isPopupOpen) {
      // Allow page scroll when popup is open
      document.body.style.overflow = 'auto';
    } else {
      // Optionally disable page scroll when popup closed
      document.body.style.overflow = 'auto';
    }
    return () => {
      // Clean up overflow style on unmount
      document.body.style.overflow = 'auto';
    };
  }, [isPopupOpen]);

  const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev => prev.map(model =>
      model.id === id ? { ...model, position: newPos } : model
    ));
  }, []);

  useEffect(() => {
    console.log("Selected model:", selectedId);
  }, [selectedId]);

  function handleAddFurniture(model: Omit<FurnitureItem, 'thumbnail'>): void {
    const newModel: Model = {
      id: uuidv4(),
      url: model.url,
      colourPalette: model.colourPalette,
      position: [3, 3, 3],
      scale: [1, 1, 1]
    };
  
    console.log("Adding furniture:", newModel);
  
    setModels(prev => [...prev, newModel]);
    setShowFurnitureTab(false); // optional: close the tab
  }



  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-xl font-bold mb-2">Editor</h1>
      <p>Edit your generated room layout</p>

      {/* code for adding furniture tab and lighting panel */}
      <div className="w-full h-[80vh] mt-4 relative">
        {/* furnitur button and ui*/}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setShowFurnitureTab(!showFurnitureTab)}
              className={`px-4 py-2 rounded text-white hover:cursor-pointer ${
                showFurnitureTab ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              {showFurnitureTab ? 'X' : 'Add'}
            </button>
            
          </div>
        
          
          {showFurnitureTab && (
            <div className="absolute left-0 mt-2 w-64 bg-white p-4 rounded shadow-lg z-20">
              <AddFurnitureTab onAddFurniture={handleAddFurniture} />
            </div>
          )}
        </div>

        {/* Top right lighting button */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setShowLightingPanel(!showLightingPanel)}
              className={`px-4 py-2 rounded text-white hover:cursor-pointer ${
                showLightingPanel ? 'bg-red-500' : 'bg-white rounded shadow-lg hover:shadow-xl transition-shadow'
              }`}
            >
              {showLightingPanel ? 'X' : <Sun className="w-5 h-5 text-yellow-600" />}
            </button>
          </div>
          
          {showLightingPanel && (
          <div className="absolute right-0 mt-2 w-64 bg-white p-4 rounded shadow-lg z-20">
            <LightingPanel 
              config={lightingConfig}
              onChange={setLightingConfig}
            />
          </div>
        )}
        </div>
        
        <div className="relative w-full h-full">
          <Canvas 
            shadows 
            camera={{ position: [10, 10, 10], fov: 50 }}
            style={{ 
              position: 'relative',
              height: '90%',
              width: '100%',
              background: '#e5e7eb',
            }}
            onWheel={(e) => {
              if (!isPopupOpen) {
                e.stopPropagation();
              }
              // Only prevent default if we're over the canvas
              if ((e.target as HTMLElement).tagName.toLowerCase() === 'canvas') {
                e.preventDefault();
              }
            }}
            className="canvas-container"
          >
            {/* base lighting we preset*/}
            <ambientLight 
              key={`ambient-${lightingConfig.ambient.intensity}-${lightingConfig.ambient.color}`} 
              intensity={lightingConfig.ambient.intensity} 
              color={lightingConfig.ambient.color}
            />

            <directionalLight 
              key={`directional-${lightingConfig.directional.intensity}-${lightingConfig.directional.color}`} 
              position={[5, 10, 5]} 
              intensity={lightingConfig.directional.intensity}
              color={lightingConfig.directional.color}
            />
            <OrbitControls 
              enabled={!isDragging && !isPopupOpen}
            />
            <MainWalls />
            {models.map((model) => (
              <Object3D
                key={model.id}
                id={model.id}
                url={model.url}
                position={model.position}
                colourPalette={model.colourPalette}
                mode="edit"
                isSelected={selectedId === model.id}
                setSelectedId={setSelectedId}
                onDragging={setDragging}
                onPositionChange={(newPos) => handlePositionChange(model.id, newPos)}
              />
            ))}
          </Canvas>
        </div>
      </div>
    </div>
  );
}

