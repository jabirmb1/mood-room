// editor page where u can customise it all
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei'; // the actual react component for orbital controls.
import { OrbitControls } from 'three-stdlib'; // instance class (used as a type)
import { Object3D } from '@/components/3d-canvas/3d/Object3D';
import { CameraController } from '@/components/3d-canvas/CameraController';
import { v4 as uuidv4 } from 'uuid';
import { defaultCameraPosition, globalScale, wallHeight, wallThickness } from '@/utils/3d-canvas/const';
import { ObjectEditorPanel } from '@/components/3d-canvas/ObjectEditorPanel/ObjectEditorPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { useModel} from '@/hooks/3d-canvas/useModel';
import * as THREE from "three";
import { LightIntensityTransition } from '@/components/3d-canvas/LightIntensityTransition';
import { AddModelButton } from '@/components/3d-canvas/AddModelMenu/AddModelButton';
import { ModelItem } from '@/components/3d-canvas/AddModelMenu/AddModelTab';
import { LightingButton } from '@/components/3d-canvas/LightingPanel/LightingButton';
import { LightingConfig } from '@/components/3d-canvas/LightingPanel/LightingPanel';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import RoomFoundation from '@/components/3d-canvas/RoomFoundation';
import { RoomContext } from '../contexts/RoomContext';
import { ColliderJsonData, Model } from '@/types/types';
import { Physics, RigidBody } from '@react-three/rapier';
import { getCategoryTagsFromURL, getModelColliderDataUrl } from '@/utils/3d-canvas/object3D';
import Colliders from '@/components/3d-canvas/Colliders';
import { getManifestData } from '@/services/manifestServices';
import { getModelColliderData } from '@/services/modelServices';
import ShadowManager from '@/components/3d-canvas/ShadowManager';
import { BloomEffect } from '@/components/3d-canvas/BloomEffect';



//place holder array of models until adding/ deletion of object functionality is added.

export async function loadInitialModels(): Promise<Model[]> {
  return [];
}

export default function Editor() {

   // State to hold floor returned from RoomFoundation
   const floorRef = useRef<THREE.Object3D | null>(null);   
  // getting all references for all current models, each model has two refs, group and model, group is used for e.g.
  // rotation, movement, dragging, camera, and model is e.g. changing colour:
  const { models, setModels, modelRefs, rigidBodyRefs,rigidBodyVersions, updateModelInformation, areModelRefsReady, collisionMap, getModelInstanceUpdateHandler, getRigidBodyInstanceUpdateHandler, 
     refUpdateTrigger, forceRefUpdate, deleteModel, updateCollisionMap} = useModel([], floorRef, []);

  const emptyRef = React.useRef<THREE.Object3D | null>(null);// a default empty ref.
  const [selectedId, setSelectedId] = useState<string | null>(null);// id of the model which has been selected.
   // getting the selected model's model refs:
  const [selectedModelRef, setSelectedModelRef] =useState<React.RefObject<THREE.Object3D | null>>(emptyRef);;// using a usestate now since models will now remount due to rigid bodies.
  const [isDragging, setDragging] = useState(false);// if user is dragging a model or not, needed for orbital controls
  const [editingMode, setEditingMode] = useState<'edit' | 'move'>('edit');// if the user wants to show model's editor panel
  //or instead show a floating panel so they can move model around.
  const orbitControlsRef = useRef<OrbitControls>(null);//reference of the orbital controls tag (
  // used so that we can disable/ enable it from child components e.g. camera movement.)
  const isPopupOpen = (selectedId !== null && editingMode === 'edit');// if the editor panel is open or not.
  const [isHoveringObject, setIsHoveringObject] = useState(false);// tracks if any object is being hovered over.

  const [showAddModelTab, setShowAddModelTab] = useState(false); // needed for popup of furniture tab hide or not
  const [showLightingPanel, setShowLightingPanel] = useState(false); // needed for popup of lighting panel hide or not
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>({ // base ligthing when just loaded
    ambient: { intensity: 0.5, colour: '#ffffff' },
    directional: { intensity: 1, colour: '#ffffff' }
  });
  // creating a use state to keep track of what lightings the user adjusted before the editor opens
  // (since we will me temporarily overriding them for a spot light effect when editor opens.)
  const [userLightingBeforePopup, setUserLightingBeforePopup] = useState<LightingConfig | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);// boolean flag keeping track if
  // dialog right before model deletetion is open or not.
  
  // creating some refs for the lighting:
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const selectedObjectDirectionalRef = useRef<THREE.DirectionalLight>(null);

  // cooldown ref
const addModelCooldown = useRef(false);// used so user can't add duplicate models in one go accidentally.
const addModelCooldownTime = 1000;// 1 second.

 // const [hasRunOnce, setHasRunOnce] = useState<boolean>(false);// flag to check if a function has run once or not, used to prevent multiple updates
  const [manifestData, setManifestData] = useState<ModelItem[] | null>(null);// a cache for the manifest data to stop it from being fetched multiple times.
  const [colliderDataCache, setColliderDataCache] = useState<Map<Model['colliderDataUrl'], ColliderJsonData[] | null>>(new Map());// collider data cache for the models.

  // function to validate all object's collisions on load:
  //
  /*useEffect(() => {
    if (areModelRefsReady)
    console.log("hello");
  }, [areModelRefsReady]); */

  // useEffect to get the manifest data from the server once per page mount.
  //
  useEffect(()=>{
    if(manifestData) return; // if we already have the manifest data, do not fetch again.
    
    // fetch the manifest data from the server and set the data.
    async function fetchData(){
      const data = await getManifestData();
      setManifestData(data);
    };
    fetchData();
  },[])


  useEffect(()=>{
    console.log('selected model ref is:', selectedModelRef)
  }, [selectedModelRef])

  // function to update selectedModelRef to be as up to date as possible:
  useEffect(() => {
    if (selectedId && modelRefs.current[selectedId]) {
      setSelectedModelRef(modelRefs.current[selectedId]);
    } else {
      setSelectedModelRef(emptyRef);
    }
  }, [selectedId, refUpdateTrigger]);

  useEffect(() => {
    loadInitialModels().then(setModels);
  }, []);

  // function to run when a user has selected a model, we set the model into editing mode (show's editor panel)
  // and then change the selected ID.
  const handleSelect = useCallback((id: string | null) => {
     // Clear previous selection immediately
     setSelectedModelRef(emptyRef);
     setEditingMode('edit');
     
     // If selecting the same object, deselect it
     if (selectedId === id) {
       setSelectedId(null);
       return;
     }
     setSelectedId(id);
     
     // Force ref update after state changes
     setTimeout(() => forceRefUpdate(), 0);
  }, [selectedId, forceRefUpdate]);

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
          colour: '#ffffff', // force white spotlight
        },
        directional: {
          intensity: Math.min(prev.directional.intensity, 0.3),
          colour: '#ffffff', // force white spotlight
        },
      }));
    } else if (userLightingBeforePopup) {
      // Restore original lighting
      setLightingConfig(userLightingBeforePopup);
      setUserLightingBeforePopup(null);
    }
  }, [isPopupOpen]);
  

  // use effect to preload all models initially with cached data and then indivisually search up collider data when new 
  // models are indivisually added by user.
  useEffect(() => {
    async function loadColliders() {
      const urls = models.map(m => m.colliderDataUrl).filter(Boolean) as string[];
  
      // Find URLs not yet in the cache
      const uncached = urls.filter(url => !colliderDataCache.has(url));
  
      if (uncached.length === 0) return;// everything is cached; so just return.
  
      // Fetch all uncached in parallel
      const results = await Promise.all(
        uncached.map(async url => [url, await getModelColliderData(url)] as const)
      );
  
      // Batch update cache once; used for indivisually added models; so we don't iterate through entire map every time
      // a new model is added.
      setColliderDataCache(prev => {
        const next = new Map(prev); // clone the Map
        for (const [url, data] of results) {
          if (data) next.set(url, data); // use Map.set
        }
        return next;
      });
    }
  
    loadColliders();
  }, [models]);
  
  
  // function to add in a new model.
  async function handleAddModel(model: Omit<ModelItem, 'thumbnail'>) {

    if (addModelCooldown.current) return; // if cooldown is active, do nothing
    addModelCooldown.current = true; // set cooldown

    try{
      const tags = await getCategoryTagsFromURL(model.url); // fetch tags from url
      const colliderDataUrl = await getModelColliderDataUrl(model.url)
      const newModel: Model = {
        id: uuidv4(),
        url: model.url,
        colourPalette: model.colourPalette,
        position: [3, 3, 3],
        tags: tags,
        colliderDataUrl: colliderDataUrl,
      };
      setModels(prev => [...prev, newModel]);
      setShowAddModelTab(false); // optional: close the tab
    }
    finally{
      // reset aftet cooldown is over
      setTimeout(() => {
        addModelCooldown.current = false;
      }, addModelCooldownTime);
    }
  }

  // function to delete the selected model
  function handleDeleteModel()
  {
    if (!selectedId) return;
    deleteModel(selectedId);
    setSelectedId(null);
  }

  return (
    <section className="flex flex-col items-center justify-center w-full h-full">
      <h1 className="text-xl font-bold mb-1">Editor</h1>
      <p>Edit your generated room layout</p>
      <div className="w-full h-[80vh] mt-4 flex flex-col lg:flex-row relative">
        {/* Canvas Section */}
        <article className={`relative flex-1 ${isPopupOpen && editingMode === 'edit' ? 'lg:w-1/2' : 'w-full'}`}>
        
          <RoomContext.Provider value={{ floorRef: floorRef, wallHeight: wallHeight, wallThickness: wallThickness}}>
            <Canvas
              shadows={true}
              camera={{ position: defaultCameraPosition, fov: 50 }}
              className={`canvas-container sm:h-full h-[70vh] w-full bg-gray-200 z-50
              ${isHoveringObject ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default' }`} >
                <Physics debug gravity={[0, 0, 0]}>{/* using rapier physics engine to handle collisions (no physics)*/}
                  {/* if object if being hovered over change cursor into a grab */}
                  <ambientLight ref={ambientRef} intensity={lightingConfig.ambient.intensity} color = {lightingConfig.ambient.colour} />

                  {/* our shadow manager; which has the main directional light to our scene */}
                  <ShadowManager staticLightRef={directionalRef} dynamicLightRef={selectedObjectDirectionalRef} 
                  lightColour={lightingConfig.directional.colour} lightIntensity={lightingConfig.directional.intensity}
                  lightPosition={[5, 10, 5]} selectedObject={selectedModelRef.current} models={models}/>
                  <BloomEffect/>
                  <LightIntensityTransition lightRef={ambientRef} targetIntensity={lightingConfig.ambient.intensity} />
                  <LightIntensityTransition lightRef={directionalRef} targetIntensity={lightingConfig.directional.intensity} />
                  <DreiOrbitControls enabled={!isDragging} ref={orbitControlsRef} />
                  <RoomFoundation onFloorReady={(floorObj) => { floorRef.current = floorObj;}} collidersEnabled={true} enableShadows={true}/>
                
                  {models.map((model) => 
                    (
                      <RigidBody
                      ref={getRigidBodyInstanceUpdateHandler(model.id)}
                      key={`${model.id}-${rigidBodyVersions[model.id] ?? 0}`}
                      // if we want to allow objects to go into each other but mark as invalid (might seem smoother), just remove the collision map parts 
                      // within the type prop below (so it will malways be kinematic during move mode no matter if it collides or not.)
                      type={'kinematicPosition'}
                      colliders={false}// we will not use auto generation colliders.
                      position={model.position ?? [0, 0, 0]}
                      rotation={model.rotation ?? [0, 0, 0]}
                      onCollisionEnter={()=>{updateCollisionMap(model.id, true)}}
                      onCollisionExit={()=>updateCollisionMap(model.id, false)}
                      userData={{tags: model.tags ?? []}}
                      >


                      {/* compound collider */}
                      <Colliders  colliderData={colliderDataCache.get(model.colliderDataUrl) ?? null} scale={model.scale ?? [globalScale, globalScale, globalScale]}/>
                                     
                     {/* Your visual 3D model */}
                     <Object3D
                       id={model.id}
                       url={model.url}
                       rigidBodyRef={rigidBodyRefs.current[model.id]}
                       scale={model.scale ?? [globalScale, globalScale, globalScale]}
                       colourPalette={model.colourPalette}
                       mode="edit"
                       isSelected={selectedId === model.id}
                       isColliding={collisionMap[model.id] || false}
                       editingMode={editingMode}
                       setSelectedId={handleSelect}
                       setEditingMode={setEditingMode}
                       setIsHoveringObject={setIsHoveringObject}
                       onDragging={setDragging}
                       onDelete={() => setIsDeleteDialogOpen(true)}
                       onModelUpdate={getModelInstanceUpdateHandler(model.id)}
                       updateModelInformation={updateModelInformation}
                     />
                   </RigidBody>
                    ))}

                  {orbitControlsRef.current && (
                    <CameraController
                      controlsRef={orbitControlsRef}
                      rigidBodyRef={rigidBodyRefs.current[selectedId ?? '']}
                      targetRef={selectedModelRef && isPopupOpen ? selectedModelRef : emptyRef}
                      resetPosition={defaultCameraPosition}
                      showSpotlight={true}
                    />
                  )}
                </Physics>
            </Canvas>
          </RoomContext.Provider>

          {/* adding in a little note at the top left corner of canvas to let users know that they can seleect an object */}
          <aside className="absolute top-2 left-2 z-60 pointer-events-none select-none bg-black/30 text-white font-semibold text-sm rounded-lg px-3 py-1 shadow-lg max-w-xs leading-tight">
            <p>* To select an object please double click it *</p>
          </aside>
        </article>

        {/* only show these buttons and panels when an object is not selected */}
        {!selectedModelRef.current &&(
          <>
              {/* add model button and ui*/}
            <AddModelButton show={!selectedModelRef.current && showAddModelTab} manifestData={manifestData} className={"absolute top-4 left-4 z-60"}
            toggle = {()=> setShowAddModelTab(p => !p)} onAddModel={handleAddModel}/>

            {/* Top right lighting button */}
            <LightingButton show = {!selectedModelRef.current && showLightingPanel} toggle={() => setShowLightingPanel(p => !p)} config={lightingConfig} 
            onChange={setLightingConfig} className="absolute top-4 right-4 z-60"/>

          </>
        )}
        {/* Editor Panel */}
        <AnimatePresence>{/* animate the panel coming in from the side */}
          {isPopupOpen && editingMode === 'edit' && selectedModelRef.current && (
            <motion.aside
              key="editor-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`z-60 bg-white
                w-full h-[30vh] mt-2 
                absolute bottom-0 lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-1/2 lg:mt-0`}
            >
              <ObjectEditorPanel
                rigidBodyRef={rigidBodyRefs.current[selectedId ?? '']}
                objectRef={selectedModelRef}
                objectId={selectedId}
                updateModelInformation={updateModelInformation}
                onClose={() => setSelectedId(null)}
                onDelete = {() => setIsDeleteDialogOpen(true)}
                setMode={setEditingMode}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* warning dialog before user deletes an object */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title= 'Confirm Model Deletion'
        body="Are you sure you want to delete this model?"
        confirmText="Delete"
        confirmColour="bg-red-600 text-white"
        cancelText="Cancel"
        cancelColour="bg-gray-200 text-black"
        onConfirm={() => {
          handleDeleteModel();
          setIsDeleteDialogOpen(false);
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
    />
    </section>
  )
}