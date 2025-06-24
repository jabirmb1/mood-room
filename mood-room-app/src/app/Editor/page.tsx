// editor page where u can customize it all
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { LightingConfig, LightingPanel } from '@/components/LightingPanel';
import MainWalls from '@/components/MainWalls';
import { Object3D } from '@/components/3d/Object3D';
import { CameraController } from '@/components/CameraController';
import { v4 as uuidv4 } from 'uuid';
import { AddFurnitureTab } from '@/components/AddFurnitureTab';
import { FurnitureItem } from '@/components/AddFurnitureTab';
import { Sun } from 'lucide-react';
import { defaultCameraPosition } from '@/utils/const';
import { ObjectEditorPanel } from '@/components/ObjectEditorPanel/ObjectEditorPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useModelRefs } from '@/hooks/useModelRefs';
import * as THREE from "three";
import { LightIntensityTransition } from '@/components/LightIntensityTransition';

// model type
type Model = {
  id: string;
  url: string;
  colourPalette?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  position: [number, number, number];
  scale?: [number, number, number];
};

//place holder array of models until adding/ deletion of object functionality is added.
const initialModels: Model[] = [
  {
    id: uuidv4(),
    url: "/assets/Tvold.glb",
    colourPalette: {
      primary: "#0ff0ff",
      secondary: "#ff0000",
      tertiary: "#ff0000"
    },
    position: [0, 0, -4],
  },
  {
    id: uuidv4(),
    url: "/assets/BookShelfBasic.glb",
    position: [0, 0, -6],
  },
];

export default function Editor() {
  // Model refs
  const { groupRefs, modelRefs, getGroupRefUpdateHandler, getModelRefUpdateHandler } = useModelRefs();

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [models, setModels] = useState(() => initialModels);
  const [isDragging, setDragging] = useState(false);
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');
  const [showFurnitureTab, setShowFurnitureTab] = useState(false);
  const [showLightingPanel, setShowLightingPanel] = useState(false);
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({
    ambient: { intensity: 0.5, color: '#ffffff' },
    directional: { intensity: 1, color: '#ffffff' }
  });
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  const isPopupOpen = (selectedId !== null && editingMode === 'edit');
  const [isHoveringObject, setIsHoveringObject] = useState(false);

  // Lighting intensity for animated transitions
  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [directionalIntensity, setDirectionalIntensity] = useState(1);

  // Selected model refs
  // Dummy fallback ref with non-null assertion
  const dummyObject3DRef = useRef<THREE.Object3D>(null!);
  const selectedGroupRef = selectedId && groupRefs.current[selectedId] ? groupRefs.current[selectedId] : dummyObject3DRef;
  const selectedModelRef = selectedId && modelRefs.current[selectedId] ? modelRefs.current[selectedId] : dummyObject3DRef;

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);

  // Handlers
  const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev => prev.map(model => model.id === id ? { ...model, position: newPos } : model));
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    setEditingMode('edit');
  }, []);

  const handleAddFurniture = useCallback((item: Omit<FurnitureItem, 'thumbnail'>) => {
    setModels(prev => [
      ...prev,
      {
        id: uuidv4(),
        url: item.url,
        colourPalette: item.colourPalette,
        position: [0, 0, 0],
        ...(item.scale ? { scale: item.scale } : {}),
      }
    ]);
  }, []);

  // Lighting panel animated transitions
  useEffect(() => {
    setAmbientIntensity(lightingConfig.ambient.intensity);
    setDirectionalIntensity(lightingConfig.directional.intensity);
  }, [lightingConfig]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen">
      <h1 className="text-xl font-bold mb-2">Editor</h1>
      <p>Edit your generated room layout</p>

      <div className="w-full h-[80vh] mt-4 relative">
        <div className="relative w-full h-full">
          <Canvas 
            shadows 
            camera={{ position: [10, 10, 10], fov: 50 }}
            style={{ 
              position: 'relative',
              height: '100%',
              width: '100%',
              background: '#e5e7eb',
              touchAction: isPopupOpen ? 'pan-y' : 'none',
              cursor: isDragging ? 'grabbing' : 'grab'
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
                editingMode={editingMode}
                setSelectedId={handleSelect}
                setEditingMode={(mode: string) => setEditingMode(mode as 'edit' | 'move')}
                setIsHoveringObject={setIsHoveringObject}
                onDragging={setDragging}
                onPositionChange={(newPos) => handlePositionChange(model.id, newPos)}
              />
            ))}
            {orbitControlsRef.current && (
              <CameraController
                controlsRef={orbitControlsRef.current}
                targetRef={selectedModelRef || null}
                resetPosition={defaultCameraPosition}
                showSpotlight={true}
              />
            )}
          </Canvas>
          {/* Canvas Info Note */}
          <div className="absolute top-2 left-2 z-20 pointer-events-none select-none bg-black/30 text-white font-semibold text-sm rounded-lg px-3 py-1 shadow-lg max-w-xs leading-tight">
            <p>* To select an object please double click it *</p>
          </div>
          {/* Furniture Tab Button and Panel */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex gap-2">
              <button
                onClick={() => setShowFurnitureTab(!showFurnitureTab)}
                className={`px-4 py-2 rounded text-white hover:cursor-pointer ${showFurnitureTab ? 'bg-red-500' : 'bg-green-500'}`}
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
          {/* Lighting Panel Button and Panel */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex gap-2">
              <button
                onClick={() => setShowLightingPanel(!showLightingPanel)}
                className={`px-4 py-2 rounded text-white hover:cursor-pointer ${showLightingPanel ? 'bg-red-500' : 'bg-white rounded shadow-lg hover:shadow-xl transition-shadow'}`}
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
          {/* Editor Panel */}
          <AnimatePresence>
            {isPopupOpen && editingMode === 'edit' && (
              <motion.div
                key="editor-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className={`z-10 bg-white w-full h-[30vh] mt-2 absolute bottom-0 lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-1/2 lg:mt-0`}
              >
                <ObjectEditorPanel
                  objectRef={selectedModelRef}
                  objectId={selectedId}
                  onClose={() => setSelectedId(null)}
                  setMode={(mode: string) => setEditingMode(mode as 'edit' | 'move')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
            <div className="absolute left-0 mt-2 w-64 bg-white p-4 rounded shadow-lg z-20">
            onWheel={(e: React.WheelEvent) => {
              if (!isPopupOpen) e.stopPropagation();
            }}
            className={`canvas-container h-full w-full bg-gray-200 ${isHoveringObject ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' }`}
          >
            {/* Lights and 3D content */}
            <ambientLight ref={ambientRef} intensity={ambientIntensity} />
            <directionalLight ref={directionalRef} intensity={directionalIntensity} position={[5, 10, 5]} />
            <LightIntensityTransition lightRef={ambientRef} targetIntensity={ambientIntensity} />
            <LightIntensityTransition lightRef={directionalRef} targetIntensity={directionalIntensity} />
            <DreiOrbitControls enabled={!isDragging} ref={orbitControlsRef} />
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
                setIsHoveringObject={setIsHoveringObject}
                onDragging={setDragging}
                onPositionChange={(newPos) => handlePositionChange(model.id, newPos)}
                onModelRefUpdate={getModelRefUpdateHandler(model.id)}
                onGroupRefUpdate={getGroupRefUpdateHandler(model.id)}
              />
            ))}
            {orbitControlsRef.current && (
              <CameraController
                controlsRef={orbitControlsRef.current as any}
                targetRef={selectedModelRef && isPopupOpen ? selectedModelRef : null}
                resetPosition={defaultCameraPosition}
                showSpotlight={true}
              />
            )}
          </Canvas>
        </div>
        {/* Canvas Info Note */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none select-none bg-black/30 text-white font-semibold text-sm rounded-lg px-3 py-1 shadow-lg max-w-xs leading-tight">
          <p>* To select an object please double click it *</p>
        </div>
        {/* Furniture Tab Button and Panel */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setShowFurnitureTab(!showFurnitureTab)}
              className={`px-4 py-2 rounded text-white hover:cursor-pointer ${showFurnitureTab ? 'bg-red-500' : 'bg-green-500'}`}
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
        {/* Lighting Panel Button and Panel */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setShowLightingPanel(!showLightingPanel)}
              className={`px-4 py-2 rounded text-white hover:cursor-pointer ${showLightingPanel ? 'bg-red-500' : 'bg-white rounded shadow-lg hover:shadow-xl transition-shadow'}`}
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
        {/* Editor Panel */}
        <AnimatePresence>
          {isPopupOpen && editingMode === 'edit' && (
            <motion.div
              key="editor-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`z-10 bg-white w-full h-[30vh] mt-2 absolute bottom-0 lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-1/2 lg:mt-0`}
            >
              <ObjectEditorPanel
                objectRef={selectedModelRef}
                objectId={selectedId ?? ''}
                onClose={() => setSelectedId(null)}
                setMode={(mode: string) => setEditingMode(mode as 'edit' | 'move')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}  
