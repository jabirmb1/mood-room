// editor page where u can customize it all
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { LightingConfig, LightingPanel } from '@/components/LightingPanel';
import MainWalls from '@/components/MainWalls';
import { Object3D } from '@/components/3d/Object3D';
import { CameraController } from '@/components/CameraController';
import { v4 as uuidv4 } from 'uuid';
import { defaultCameraPosition } from '@/utils/const';
import { ObjectEditorPanel } from '@/components/ObjectEditorPanel/ObjectEditorPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useModelRefs } from '@/hooks/useModelRefs';
import * as THREE from "three";
import { LightIntensityTransition } from '@/components/LightIntensityTransition';
import { AddFurnitureTab } from '@/components/AddFurnitureTab';
import { FurnitureItem } from '@/components/AddFurnitureTab';
import { Sun } from 'lucide-react';

// model type.
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
  // getting all references for all current models, each model has two refs, group and model, group is used for e.g.
  // rotation, movement, dragging, camera, and model is e.g. changing colour:
  const { groupRefs, modelRefs, getGroupRefUpdateHandler, getModelRefUpdateHandler } = useModelRefs();
  const [selectedId, setSelectedId] = useState<string | null>(null);// id of the model which has been selected.
  const [models, setModels] = useState(() => initialModels);// array of current/ active models.
  const [isDragging, setDragging] = useState(false);// if user is dragging a model or not, needed for orbital controls
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');// if the user wants to show model's editor panel
  //or instead show a floating panel so they can move model around.
  const orbitControlsRef = useRef<typeof OrbitControls | null>(null);//reference of the orbital controls tag (
  // used so that we can disable/ enable it from child components e.g. camera movement.)
  const isPopupOpen = (selectedId !== null && editingMode === 'edit');// if the editor panel is open or not.
  const [isHoveringObject, setIsHoveringObject] = useState(false);// tracks if any object is being hovered over.

  const [showFurnitureTab, setShowFurnitureTab] = useState(false); // needed for popup of furniture tab hide or not
  const [showLightingPanel, setShowLightingPanel] = useState(false); // needed for popup of lighting panel hide or not
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({ // base ligthing when just loaded
    ambient: { intensity: 0.5, color: '#ffffff' },
    directional: { intensity: 1, color: '#ffffff' }
  });
  // creating a use state to keep track of what lightings the user adjusted before the editor opens
  // (since we will me temporarily overriding them for a spot light effect when editor opens.)
  const [userLightingBeforePopup, setUserLightingBeforePopup] = useState<LightingConfig | null>(null);


  // getting the selected model's group and model refs:
  const selectedModelRef = selectedId ? modelRefs.current[selectedId] : null;

  // creating some refs for the lighting:
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);

  // function to keep track of each model's position.
  const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev =>
      prev.map(model => model.id === id ? { ...model, position: newPos } : model)
    );
  }, []);

  // function to run when a user has selected a model, we set the model into editing mode (show's editor panel)
  // and then change the selected ID.
  const handleSelect = useCallback((id: string | null) => {
    setEditingMode('edit');
    setSelectedId(id);
  }, []);

  // creating a useEfect to just dim the lights down and not dim them down when pop up is open or not (object editor)
  useEffect(() => {
    if (isPopupOpen) {
      // Save original lighting only once
      setUserLightingBeforePopup((prev) => prev ?? lightingConfig);
      
      // dark background; white spotlight effect.
      // we want minimum intesity to be 0.25; but if user's light settings is already below 0.25; use that instead.
      setLightingConfig((prev) => ({
        ambient: {
          intensity: Math.min(prev.ambient.intensity, 0.25),
          color: '#ffffff', // force white spotlight
        },
        directional: {
          intensity: Math.min(prev.directional.intensity, 0.3),
          color: '#ffffff', // force white spotlight
        },
      }));
    } else if (userLightingBeforePopup) {
      // Restore original lighting
      setLightingConfig(userLightingBeforePopup);
      setUserLightingBeforePopup(null);
    }
  }, [isPopupOpen]);
  
  

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
      <div className="w-full h-[80vh] mt-4 flex flex-col lg:flex-row relative">
        {/* Canvas Section */}
        <div className={`relative flex-1 ${isPopupOpen && editingMode === 'edit' ? 'lg:w-1/2' : 'w-full'}`}>
          <Canvas
            shadows
            camera={{ position: defaultCameraPosition, fov: 50 }}
            className={`canvas-container h-full w-full bg-gray-200
             ${isHoveringObject ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' }`} >
              {/* if object if being hovered over change cursor into a grab */}
              <ambientLight ref={ambientRef} intensity={lightingConfig.ambient.intensity} color = {lightingConfig.ambient.color} />
              <directionalLight ref={directionalRef} intensity={lightingConfig.directional.intensity} color = {lightingConfig.directional.color} position={[5, 10, 5]} />
              <LightIntensityTransition lightRef={ambientRef} targetIntensity={lightingConfig.ambient.intensity} />
              <LightIntensityTransition lightRef={directionalRef} targetIntensity={lightingConfig.directional.intensity} />
              <OrbitControls enabled={!isDragging} ref={orbitControlsRef} />
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
                  controlsRef={orbitControlsRef}
                  targetRef={selectedModelRef && isPopupOpen ? selectedModelRef : null}
                  resetPosition={defaultCameraPosition}
                  showSpotlight={true}
                />
              )}
          </Canvas>

          {/* adding in a little note at the top left corner of canvas to let users know that they can seleect an object */}
          <div className="absolute top-2 left-2 z-20 pointer-events-none select-none bg-black/30 text-white font-semibold text-sm rounded-lg px-3 py-1 shadow-lg max-w-xs leading-tight">
            <p>* To select an object please double click it *</p>
          </div>
        </div>

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

        {/* Editor Panel */}
        <AnimatePresence>{/* animate the panel coming in from the side */}
          {isPopupOpen && editingMode === 'edit' && (
            <motion.div
              key="editor-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`z-10 bg-white
                w-full h-[30vh] mt-2
                absolute bottom-0 lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-1/2 lg:mt-0`}
            >
              <ObjectEditorPanel
                objectRef={selectedModelRef}
                objectId={selectedId}
                onClose={() => setSelectedId(null)}
                setMode={setEditingMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
