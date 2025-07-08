import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalScale } from "@/utils/const";
import { useRoomContext } from "@/app/contexts/RoomContext";
import { getClampedPos } from "@/utils/collision";
import { RapierRigidBody } from "@react-three/rapier";
import { getPosition, setPosition } from "@/utils/rapierHelpers";

/*** This hook is used to move an object via keybaord controls *********/

type useKeyboardMovementProps = {
  rigidBodyRef: React.RefObject<RapierRigidBody | null> | null;// reference of the rigid body (contains pos)
  modelRef: React.RefObject<THREE.Object3D | null>; // which object to move.
  enabled: boolean;// represents when to allow keyboard controls to be active
  isHorizontalMode: boolean;// if object is in horizontal movement or vertical.
};

export function useKeyboardMovement({rigidBodyRef, modelRef, enabled, isHorizontalMode,}: useKeyboardMovementProps) {
  
  // Track which keys are pressed
  const keysPressed = useRef<Record<string, boolean>>({});
  const {floorRef} = useRoomContext();

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

  // we use useFrame to efficntly move current object
  useFrame(() => {
    if (!enabled || !rigidBodyRef?.current || !modelRef?.current) return;
  
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
  
    if (delta.some((v) => v !== 0)) {{// if one or more of the values is not 0, i.e there has been a change in position 
      // Calculate new position
      const currentPos = getPosition(rigidBodyRef.current);// move via rigid body.
      const newPos = currentPos.clone().add(new THREE.Vector3(...delta));
     // Clamp inside room bounds
      const clamped = getClampedPos(modelRef.current, newPos, floorRef.current);
  
      // Apply clamped position to rigid body
      setPosition(rigidBodyRef.current, new THREE.Vector3(...clamped));
    }
  }});
}
