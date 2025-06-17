// components/Editor.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MainWalls from '@/components/MainWalls';
import * as THREE from "three";
import { Object3D } from '@/components/3d/Object3D';
import { CameraController } from '@/components/CameraController';
import { v4 as uuidv4 } from 'uuid';
import { defaultCameraPosition } from '@/utils/const';
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
  const modelRefs = useRef<Record<string, THREE.Object3D>>({}); // store refs to models for camera focus
  const selectedRef = selectedId ? modelRefs.current[selectedId] : null;
  const [models, setModels] = useState(() => initialModels);
  const [isDragging, setDragging] = useState(false);
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');
  const orbitControlsRef = useRef<typeof OrbitControls | null>(null);


  const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev => prev.map(model =>
      model.id === id ? { ...model, position: newPos } : model
    ));
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setEditingMode('edit'); // reset editing mode on selection
    setSelectedId(id);
  }, []);

  // Keep track of each object's group ref
  const handleGroupRefUpdate = useCallback((id: string) => (ref: THREE.Object3D | null) => {
    if (ref) modelRefs.current[id] = ref;
    else delete modelRefs.current[id];
  }, []);

  useEffect(() => {
    console.log("Selected model:", selectedId);
  }, [selectedId]);

  return (
    <>
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-xl font-bold mb-2">Editor</h1>
      <p>Edit your generated room layout</p>

      <div className="bg-gray-200 w-full h-[80vh] mt-4 relative">
        <Canvas shadows camera={{ position: defaultCameraPosition, fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} />
          <OrbitControls enabled={!isDragging && !selectedId} ref = {orbitControlsRef}/>
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
              editingMode={editingMode}
              setSelectedId={handleSelect}
              setEditingMode={setEditingMode}
              onDragging={setDragging}
              onPositionChange={(newPos) => handlePositionChange(model.id, newPos)}
              onGroupRefUpdate={handleGroupRefUpdate(model.id)}
            />
          ))}

          {orbitControlsRef.current && (
            <CameraController
              controlsRef={orbitControlsRef}
              targetRef={selectedRef && editingMode === 'edit' ? { current: selectedRef } : null}
              resetPosition={[10, 10, 10]}
            />
          )}
        </Canvas>
      </div>
    </div>
  </>
  );
}
