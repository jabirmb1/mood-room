import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalScale } from "@/utils/const";
import { RapierRigidBody, useRapier} from "@react-three/rapier";
import type { Collider } from "@dimforge/rapier3d-compat";
import { applyMovement } from "@/utils/movementEngine";

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
  const { world, rapier} = useRapier();

  // Cache static colliders and data
  const cachedColliders = useRef<Collider[]>([]);
  const wasEnabled = useRef<boolean>(false);

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
  }, []);

  // Cache static colliders once when enabled toggles true
  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      // Collect colliders that do not belong to our rigidBody (i.e., static)
      cachedColliders.current = [];

      world.forEachCollider((collider) => {
        if (
          collider.parent() === null || // static collider, or
          collider.parent() !== rigidBodyRef.current // not our player collider
        ) {
          cachedColliders.current.push(collider);
        }
      });
    }
    wasEnabled.current = enabled;
  }, [enabled, world, rigidBodyRef]);

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

    applyMovement({direction, distance, world, shape: new rapier.Ball(1),rotation: rigidBody.rotation(), rigidBody, collider: rigidBody.collider(0),
      isHorizontal: isHorizontalMode, cachedColliders: cachedColliders.current
    })
  });
}
