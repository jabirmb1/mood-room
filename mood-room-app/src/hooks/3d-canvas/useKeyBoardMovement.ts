import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalScale} from "@/utils/3d-canvas/const";
import { RapierRigidBody, useRapier} from "@react-three/rapier";
import { applyMovement } from "@/utils/3d-canvas/movementEngine";
;

/*** This hook is used to move an object via keybaord controls *********/

type useKeyboardMovementProps = {
  rigidBodyRef: React.RefObject<RapierRigidBody | null>;// reference of the rigid body (contains pos)
  modelRef: React.RefObject<THREE.Object3D | null>; // which object to move.
  enabled: boolean;// represents when to allow keyboard controls to be active
  isHorizontalMode: boolean;// if object is in horizontal movement or vertical.
};

export function useKeyboardMovement({rigidBodyRef, modelRef, enabled, isHorizontalMode,}: useKeyboardMovementProps) {
  
  // Track which keys are pressed
  const keysPressed = useRef<Record<string, boolean>>({});
 // const movementKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);// all valid movement keys
  const { world} = useRapier();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current[e.key.toLowerCase()] = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      keysPressed.current[e.key.toLowerCase()] = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled]);// no need to call this effect again, as we only need to set up the event listeners once.

   // we use useFrame to efficntly move current object
  useFrame(() => {
    if (!enabled || !rigidBodyRef.current || !modelRef.current) return;

    const step = globalScale;// how far to move object per press., here we want it to be one unit which is just our global scale
    let delta: [number, number, number] = [0, 0, 0];;// change from original position of object.

    if (isHorizontalMode) {// x axis movement:
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) delta[2] -= step;
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) delta[2] += step;
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) delta[0] -= step;
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) delta[0] += step;
    } 
    else {// vertical movement
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) delta[1] += step;
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) delta[1] -= step;
    }

    if (delta.every((v) => v === 0)) return;
    // if one or more of the values is not 0, i.e there has been a change in position Calculate new position

    const direction = new THREE.Vector3(...delta).normalize();
    const distance = new THREE.Vector3(...delta).length();
    const rigidBody = rigidBodyRef.current
    applyMovement({direction, distance, world, rigidBody, isHorizontal: isHorizontalMode})
  });
}
