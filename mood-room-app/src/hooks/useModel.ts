import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Model } from "@/types/types";
import {validateObjectPlacement } from "@/utils/collision";
import { RapierRigidBody } from "@react-three/rapier";

/***************This hook will be used to centralise how we handle multiple models; it will keep a record of all model's
 *  indivisual refs (both group and model refs) and also if each model are collidig or not.
 */
type useModelReturn = {
  models: Model[];
  modelRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D> | null>>;// a record of all model refs.
  rigidBodyVersions: Record<string, number>;// a record of all rigid body verions (0 or 1); used to refresh/ reconstruct a rigid body on command.
  rigidBodyRefs: React.RefObject<Record<string, React.RefObject<RapierRigidBody> | null>>;// a record of all rigid body refs.
  areModelRefsReady: boolean; // a boolean to check if all model refs are ready.
  collisionMap: Record<string, boolean>;
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  getModelRefUpdateHandler: (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => void;
  getRigidBodyRefUpdateHandler: (id: string) => (ref: RapierRigidBody | null) => void;
  refreshRigidBody: (id: string) => void;
  updateCollisionMap: () => void;
  deleteModel: (id: string) => void;
};

export function useModel (initialModels: Model[] = [], floorRef: React.RefObject<THREE.Object3D>, walls: THREE.Object3D[]): useModelReturn {
  // Hold the refs in mutable objects to keep across renders
  const [models, setModels] = useState<Model[]>(initialModels);
  const modelRefs = useRef<Record<string, React.RefObject<THREE.Object3D> | null>>({});
  const rigidBodyRefs = useRef<Record<string, React.RefObject<RapierRigidBody> | null>>({});
  const [rigidBodyVersions, setRigidBodyVersions] = useState<Record<string, number>>({});
  const [collisionMap, setCollisionMap] = useState<Record<string, boolean>>({});
  const areModelRefsReady = models.every(model => modelRefs.current[model.id]?.current);// an inistial check to see if any initial models are ready.

  // Returns a callback to update the model ref for a given id
  const getModelRefUpdateHandler = useCallback(
    (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => {
      if (ref) modelRefs.current[id] = ref;
      else delete modelRefs.current[id];
    },
    []
  );

  // returns a callback to update the rigid body ref for a given id
  const getRigidBodyRefUpdateHandler = useCallback(
    (id: string) => (instance: RapierRigidBody | null) => {
      if (instance) {
        rigidBodyRefs.current[id] = { current: instance };
      } else {
        delete rigidBodyRefs.current[id];
      }
    },
    []
  );

  // refreshes a rigid body by changing it's key to force a re-creation (needs the model id)
    // Refresh function toggling version between 0 and 1
    const refreshRigidBody = useCallback((id: string) => {
      setRigidBodyVersions((prev => {
        const oldVersion = prev[id] ?? 0; // default to 0 if undefined
        const newVersion = oldVersion === 0 ? 1 : 0;
        console.log(`Refreshing rigid body for ${id}: ${oldVersion} → ${newVersion}`);
        return {...prev, [id]: newVersion};
      }));
    }, []);

   // function to delete the selected model
   const deleteModel = useCallback((id: string) => {
    setModels(prev => prev.filter(model => model.id !== id));
    delete modelRefs.current[id];
    delete rigidBodyRefs.current[id];// also delete the rigid body ref.
    


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
  const updateCollisionMap = useCallback((selectedModelId?: string) => {
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

      const isValid = validateObjectPlacement(object, floorRef.current, walls, otherObjects, model.id === selectedModelId);// only 
      // log warnings for the selected model if it is being updated.
      newMap[model.id] = !isValid;
    }

    setCollisionMap(newMap);
  }, [models, walls, floorRef]);

  //This function is used to only validate the collision map for a single model; much more efficient.
  function updateCollisionSingle(id: string) {
    const object = modelRefs.current[id]?.current;
    if (!object) return;
  
    const otherObjects = Object.entries(modelRefs.current)
      .filter(([otherId]) => otherId !== id)
      .map(([_, ref]) => ref?.current)
      .filter((obj): obj is THREE.Object3D => !!obj);
  
    const isValid = validateObjectPlacement(object, floorRef.current, walls, otherObjects, true);
    setCollisionMap(prev => ({ ...prev, [id]: !isValid }));
  }

  return {models, modelRefs,rigidBodyRefs, rigidBodyVersions, areModelRefsReady, collisionMap, 
    setModels, getModelRefUpdateHandler, getRigidBodyRefUpdateHandler,refreshRigidBody, updateCollisionMap, deleteModel};
}
