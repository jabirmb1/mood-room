import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Model } from "@/types/types";
import { RapierRigidBody } from "@react-three/rapier";

/***************This hook will be used to centralise how we handle multiple models; it will keep a record of all model's
 *  indivisual refs (both group and model refs) and also if each model are collidig or not.
 */
type useModelReturn = {
  models: Model[];// array which stores all current models in the scene.
  modelRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D | null>>>;// a record of all model refs.
  rigidBodyVersions: Record<string, number>;// a record of all rigid body verions (0 or 1); used to refresh/ reconstruct a rigid body on command.
  rigidBodyRefs: React.RefObject<Record<string, React.RefObject<RapierRigidBody | null>>>;// a record of all rigid bodies for the selected models.
  areModelRefsReady: boolean; // a boolean to check if all model refs are ready.
  collisionMap: Record<string, boolean>;// a map which says if each model is in an illegal collider or not.
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;// function to change the models array.
  getModelInstanceUpdateHandler: (id: string) => (ref: THREE.Object3D | null) => void;// function to update a model's instance within the record.
  getRigidBodyInstanceUpdateHandler: (id: string) => (ref: RapierRigidBody | null) => void; // function to update a rigid bodie's instance within the record.
  refreshRigidBody: (id: string) => void;// functiont to refresh. remount a rigid body.
  updateModelInformation: (id: string, updates: Partial<Model>) => void;// function to save a specific model information to the array of models.
  updateCollisionMap: (id: string, isColliding: boolean) => void;
  deleteModel: (id: string) => void;// function to delete a model from the array of models.
};

export function useModel(initialModels: Model[] = [],  floorRef: React.RefObject<THREE.Object3D | null>, walls: THREE.Object3D[]): useModelReturn {
  const [models, setModels] = useState<Model[]>(initialModels);
  const modelRefs = useRef<Record<string, React.RefObject<THREE.Object3D | null>>>({});
  const rigidBodyRefs = useRef<Record<string, React.RefObject<RapierRigidBody | null>>>({});
  const [rigidBodyVersions, setRigidBodyVersions] = useState<Record<string, number>>({});
  const [collisionMap, setCollisionMap] = useState<Record<string, boolean>>({});
  const areModelRefsReady = models.every(model => modelRefs.current[model.id]?.current);;// an initial check to see if any initial models are ready.

  // Returns a callback to update the model ref for a given id
  const getModelInstanceUpdateHandler = useCallback(
    (id: string) => (instance: THREE.Object3D | null) => {
      if (instance) {
        // If there's no ref object yet for this id, create one
        if (!modelRefs.current[id]) {
          modelRefs.current[id] = { current: null };
        }
        modelRefs.current[id]!.current = instance;
      } else {
        // Instance is null, remove the ref
        delete modelRefs.current[id];
      }
    },
    []
  );

  // Returns a callback to update the rigid body ref for a given id
  const getRigidBodyInstanceUpdateHandler = useCallback(
    (id: string) => (instance: RapierRigidBody | null) => {
      if (instance) {
        // if there is no current rigid body, set it to null
        if (!rigidBodyRefs.current[id]) {
          rigidBodyRefs.current[id] = { current: null };
        }
        rigidBodyRefs.current[id]!.current = instance;
      } 
      else {
        // clean up the ref
        if (rigidBodyRefs.current[id]) {
          rigidBodyRefs.current[id]!.current = null;
          delete rigidBodyRefs.current[id];
        }
      }
    }, []);

    // refreshes a rigid body by changing it's key to force a re-creation (needs the model id)
    // Refresh function toggling version between 0 and 1
  const refreshRigidBody = useCallback((id: string) => {
    // Clear the current rigid body ref before refreshing
    if (rigidBodyRefs.current[id]) {
      rigidBodyRefs.current[id]!.current = null;
    }
    
    // using time out to prevent any race conditions.
    setTimeout(() => {
      setRigidBodyVersions(prev => {
        const currentVersion = prev[id] ?? 0;
        const newVersion = currentVersion + 1;// for some reason when toggling 0 and 1; it causes errors (fix later).
                //console.log(`Rigid body version: ${currentVersion} → ${newVersion}`);
        return { ...prev, [id]: newVersion };
      });
    }, 16);
  }, []);

  // function to update a model's information and save it to the array of models.
  const updateModelInformation = useCallback((id: string, updates: Partial<Model>) => {
    setModels(prevModels =>
      prevModels.map(model => {
        if (model.id !== id) return model;
        const updatedModel = { ...model, ...updates };
        // Force rigid body recreation if scale is updated
        if (updates.scale) {
          refreshRigidBody(id);
        }
        return updatedModel;
      })
    );
  }, [refreshRigidBody]);

  
  // Function to delete the selected model
  const deleteModel = useCallback((id: string) => {
    // Clean up rigid body ref first
    if (rigidBodyRefs.current[id]) {
      rigidBodyRefs.current[id]!.current = null;
      delete rigidBodyRefs.current[id];
    }
    // Clean up model ref
    delete modelRefs.current[id];
    
    // Update states
    setModels(prev => prev.filter(model => model.id !== id));
    
    setCollisionMap(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    setRigidBodyVersions(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  //This function will allow us to update the collision map efficiently.
  /*const updateCollisionMap = useCallback((selectedModelId?: string) => {
    const newMap: Record<string, boolean> = {};

    for (const model of models) {
      const ref = modelRefs.current[model.id];
      const object = ref?.current;

      if (!object) continue;

      // Collect other objects (excluding the current one)
      const otherObjects: THREE.Object3D[] = Object.entries(modelRefs.current)
        .filter(([otherId]) => otherId !== model.id)
        .map(([_, ref]) => ref?.current)
        .filter((obj): obj is THREE.Object3D => !!obj);

      const isValid = validateObjectPlacement(object, floorRef?.current, walls, otherObjects, model.id === selectedModelId);// only 
      // log warnings for the selected model if it is being updated.
      newMap[model.id] = !isValid;
    }

    setCollisionMap(newMap);
  }, [models, walls, floorRef]); */

  //This function is used to only validate the collision map for a single model; much more efficient.
 /* function updateCollisionSingle(id: string) {
    const object = modelRefs.current[id]?.current;
    if (!object) return;
  
    const otherObjects = Object.entries(modelRefs.current)
      .filter(([otherId]) => otherId !== id)
      .map(([_, ref]) => ref?.current)
      .filter((obj): obj is THREE.Object3D => !!obj);
  
    const isValid = validateObjectPlacement(object, floorRef.current, walls, otherObjects, true);
    setCollisionMap(prev => ({ ...prev, [id]: !isValid })); 
  } */

    const updateCollisionMap = useCallback((id: string, isColliding: boolean) => {
      setCollisionMap(prev => ({
        ...prev,
        [id]: isColliding,
      }));
    }, []);
    

  return {models,modelRefs, rigidBodyRefs,rigidBodyVersions, areModelRefsReady, collisionMap,
    setModels, getModelInstanceUpdateHandler, getRigidBodyInstanceUpdateHandler, refreshRigidBody,updateModelInformation, deleteModel, updateCollisionMap};
}