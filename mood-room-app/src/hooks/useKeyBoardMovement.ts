import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { moveObject } from "@/utils/object3D";
import { globalScale } from "@/utils/const";

/*** This hook is used to move an object via keybaord controls *********/

type useKeyboardMovementProps = {
    ref:  React.RefObject<THREE.Object3D>,// which object to move.
    enabled: boolean,// represents when to allow keyboard controls to be active
    isHorizontalMode: boolean,
    onChange: (newPos: [number, number, number]) => void;// function to run when position changes
}
export function useKeyboardMovement({ref, enabled, isHorizontalMode, onChange}: useKeyboardMovementProps) {
  
    // Track which keys are pressed
  const keysPressed = useRef<Record<string, boolean>>({});

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
    if (!enabled || !ref.current) return;

    const step = globalScale;// how far to move object per press., here we want it to be one unit which is just our global scale
    let delta: [number, number, number] = [0, 0, 0];// change from original position of object.

    if (isHorizontalMode)// x and x axis movement:
    {
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) {
        delta[2] -= step;
      }
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) {
        delta[2] += step;
      }
      if (keysPressed.current["a"] || keysPressed.current["arrowleft"]) {
        delta[0] -= step;
      }
      if (keysPressed.current["d"] || keysPressed.current["arrowright"]) {
        delta[0] += step;
      }
    }
    else{// vertical movement
      if (keysPressed.current["w"] || keysPressed.current["arrowup"]) delta[1] += step;
      if (keysPressed.current["s"] || keysPressed.current["arrowdown"]) delta[1] -= step;
    }
   

    if (delta.some((v) => v !== 0)) {// if one or more of the values is not 0, i.e there has been a change in position 
        // in one or more of the axis, then we simply move the object to the new position.
      moveObject(ref, delta, onChange);
    }
  });
}
