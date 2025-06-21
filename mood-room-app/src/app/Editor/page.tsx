'use client';

import { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MainWalls from '@/components/MainWalls';
import { Object3D } from '@/components/3d/Object3D';
import { CameraController } from '@/components/CameraController';
import { v4 as uuidv4 } from 'uuid';
import { defaultCameraPosition } from '@/utils/const';
import { ObjectEditorPanel } from '@/components/ObjectEditorPanel/ObjectEditorPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useModelRefs } from '@/hooks/useModelRefs';

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
    position: [0, 0, 0],
  },
  {
    id: uuidv4(),
    url: "/assets/Tvold.glb",
    position: [4, 0, 0],
  },
];

export default function Editor() {
  // getting all references for all current models, each model has two refs, group and model, group is used for e.g.
  // rotation, movement, dragging, camera, and model is e.g. changing colour:
  const { groupRefs, modelRefs, getGroupRefUpdateHandler, getModelRefUpdateHandler } = useModelRefs();

  const [selectedId, setSelectedId] = useState<string | null>(null);// id of the model which has been selected.
  const [models, setModels] = useState(() => initialModels);// array of current/ active models.
  const [isDragging, setDragging] = useState(false);// if user is dragging a model or not.
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');// if the user wants to show model's editor panel
  //or instead show a floating panel so they can move model around.
  const orbitControlsRef = useRef<typeof OrbitControls | null>(null);//reference of the orbital controls tag (
  // used so that we can disable/ enable it from child components e.g. camera movement.)
  const isPopupOpen = (selectedId !== null && editingMode === 'edit');// if the editor panel is open or not.
  const [isHoveringObject, setIsHoveringObject] = useState(false);// tracks if any object is being hovered over.

  // getting the selected model's group and model refs:
  const selectedGroupRef = selectedId ? groupRefs.current[selectedId] : null;
  const selectedModelRef = selectedId ? modelRefs.current[selectedId] : null;

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
            onWheel={(e) => {
              if (!isPopupOpen) e.stopPropagation();
            }}
            className={`canvas-container h-full w-full bg-gray-200
             ${isHoveringObject ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' }`} >
              {/* if object if being hovered over change cursor into a grab */}

            {/* Lights and 3D content */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} />
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
                targetRef={selectedGroupRef && editingMode === 'edit' ? selectedGroupRef: null}
                resetPosition={defaultCameraPosition}
              />
            )}
          </Canvas>
        </div>
        
        {/* adding in a little note at the top left corner of canvas to let users know that they can seleect an object */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none select-none bg-black/30 text-white font-semibold text-sm rounded-lg px-3 py-1 shadow-lg max-w-xs leading-tight">
          <p>* To select an object please double click it *</p>
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
              className={`
                z-10 bg-white
                w-full h-[30vh] mt-2
                absolute bottom-0 lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-1/2 lg:mt-0
              `}
            >
              <ObjectEditorPanel
                objectRef={selectedModelRef}
                objectId = {selectedId}
                onClose={() => setSelectedId(null)}
                setMode={setEditingMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}  