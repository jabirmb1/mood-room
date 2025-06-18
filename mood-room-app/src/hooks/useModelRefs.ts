import { useRef, useCallback } from "react";
import * as THREE from "three";

/******************* This hook will be used to easily access each indivisual reference
 for each model (both their group ref and also their model ref) ********************************/
type ModelRefs = {
  groupRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D> | null>>;// a record of all group refs
  modelRefs: React.RefObject<Record<string, React.RefObject<THREE.Object3D> | null>>;// a record of all model refs.
  getGroupRefUpdateHandler: (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => void;
  getModelRefUpdateHandler: (id: string) => (ref: React.RefObject<THREE.Object3D> | null) => void;
};

export function useModelRefs(): ModelRefs {
  // Hold the refs in mutable objects to keep across renders
  const groupRefs = useRef<Record<string, React.RefObject<THREE.Object3D> | null>>({});
  const modelRefs = useRef<Record<string, React.RefObject<THREE.Object3D> | null>>({});

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

  return { groupRefs, modelRefs, getGroupRefUpdateHandler, getModelRefUpdateHandler,};
}
