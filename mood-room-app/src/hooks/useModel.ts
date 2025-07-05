import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Model } from "@/types/types";
import {validateObjectPlacement } from "@/utils/collision";

/***************This hook will be used to centralise how we handle multiple models; it will keep a record of all model's
 *  indivisual refs (both group and model refs) and also if each model are collidig or not.
 */
type useModelReturn = {
  models: Model[];
  groupRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D> | null>>;// a record of all group refs
  modelRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D> | null>>;// a record of all model refs.
  collisionMap: Record<string, boolean>;
  setModels: React.Dispatch<React.SetStateAction<Model[]>>;
  getGroupRefUpdateHandler: (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => void;
  getModelRefUpdateHandler: (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => void;
  updateCollisionMap: () => void;
  handlePositionChange: (id: string, newPos: [number, number, number]) => void;
  deleteModel: (id: string) => void;
};

export function useModel (initialModels: Model[] = [], floorRef: React.RefObject<THREE.Object3D>, walls: THREE.Object3D[]): useModelReturn {
  // Hold the refs in mutable objects to keep across renders
  const [models, setModels] = useState<Model[]>(initialModels);
  const groupRefs = useRef<Record<string, React.RefObject<THREE.Object3D> | null>>({});
  const modelRefs = useRef<Record<string, React.RefObject<THREE.Object3D> | null>>({});
  const [collisionMap, setCollisionMap] = useState<Record<string, boolean>>({});


  // Returns a callback to update the group ref for a given id
  const getGroupRefUpdateHandler = useCallback(
    (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => {
      if (ref) groupRefs.current[id] = ref;
      else delete groupRefs.current[id];
    },
    []
  );

  // Returns a callback to update the model ref for a given id
  const getModelRefUpdateHandler = useCallback(
    (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => {
      if (ref) modelRefs.current[id] = ref;
      else delete modelRefs.current[id];
    },
    []
  );

  // function to keep track of each model's position.
     const handlePositionChange = useCallback((id: string, newPos: [number, number, number]) => {
      setModels(prev => prev.map(model =>
        model.id === id ? { ...model, position: newPos } : model
      ));
      updateCollisionMap();
    }, []);
  
   // function to delete the selected model
   const deleteModel = useCallback((id: string) => {
    setModels(prev => prev.filter(model => model.id !== id));
    delete groupRefs.current[id];
    delete modelRefs.current[id];
    setCollisionMap(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);
  
  //This function will allow us to update the collision map efficiently.
  const updateCollisionMap = useCallback(() => {
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

      const isValid = validateObjectPlacement(object, floorRef.current, walls, otherObjects);
      newMap[model.id] = !isValid;
    }

    setCollisionMap(newMap);
  }, [models, walls, floorRef]);

  return {models, groupRefs, modelRefs, collisionMap, 
    setModels, getGroupRefUpdateHandler, getModelRefUpdateHandler, updateCollisionMap, handlePositionChange, deleteModel};
}
