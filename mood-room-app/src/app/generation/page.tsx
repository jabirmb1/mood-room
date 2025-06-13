'use client';
import { Canvas } from "@react-three/fiber";
import { Object3D } from "@/components/3d/Object3D";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';

type Model = {
  id: string;
  url: string;
  colourPalette: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  position: [number, number, number]; // <-- This fixes the type warning
};
// when we can add and remove models dynamically, this will just be an empty array in a useState.
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
    position: [120, 0, 0],
  },
  {
    id: uuidv4(),
    url: "/assets/NormTable.glb",
    colourPalette: {
      primary: "#ffff00",
      secondary: "#00ffff",
      tertiary: "#ff00ff"
    },
    position: [240, 0, 0],
  },
];

export default function GenerationPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [models, setModels] = useState(() => initialModels);
  const [isDragging, setDragging] = useState<boolean>(false);

  // For debug purposes
  useEffect(() => {
    console.log("Selected:", selectedId);
  }, [selectedId]);

  // if the position of a model has changed, update the array of models with the new position and display.
  const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev => prev.map(model =>
        model.id === id ? { ...model, position: newPos } : model
      )
    );
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h1>generate/edit room</h1>
      <p>Customize your room by selecting a 3D model and applying a color palette.</p>
      
      <div className="bg-gray-500 h-[70vh] w-full relative">
        <Canvas className="w-full h-full" camera={{ position: [0, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <OrbitControls enableRotate={true} enabled={!isDragging} />

          {models.map((model) => (
            <Object3D
              key={model.id}
              id={model.id}
              url={model.url}
              position={model.position}
              colourPalette={model.colourPalette}
              mode="edit"
              isSelected={selectedId === model.id}
              onSelect={() => setSelectedId(model.id)}
              onDragging={setDragging}
              onPositionChange={(newPos) => handlePositionChange(model.id, newPos)}
            />
          ))}
        </Canvas>
      </div>
    </div>
  );
}
