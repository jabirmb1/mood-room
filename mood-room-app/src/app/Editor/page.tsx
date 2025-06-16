// components/Editor.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MainWalls from '@/components/MainWalls';
import { Object3D } from '@/components/3d/Object3D';
import { v4 as uuidv4 } from 'uuid';

type Model = {
  id: string;
  url: string;
  colourPalette: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  position: [number, number, number];
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [models, setModels] = useState(() => initialModels);
  const [isDragging, setDragging] = useState(false);

  // When selectedId is non-null, editor panel is open so user can scroll when popup is open.
  const isPopupOpen = selectedId !== null;
  useEffect(() => {
    if (isPopupOpen) {
      // Allow page scroll when popup is open
      document.body.style.overflow = 'auto';
    } else {
      // Optionally disable page scroll when popup closed
      document.body.style.overflow = 'hidden';
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

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-xl font-bold mb-2">Editor</h1>
      <p>Edit your generated room layout</p>

      <div className="bg-gray-200 w-full h-[80vh] mt-4 relative">
        <div className="relative w-full h-full">
          <Canvas 
            shadows 
            camera={{ position: [10, 10, 10], fov: 50 }}
            style={{ 
              position: 'relative',
              zIndex: 1,
              touchAction: isPopupOpen ? 'none' : 'auto',
            }}
            onWheel={(e) => {
              if (isPopupOpen) {
                e.stopPropagation();
              }
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} />
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
