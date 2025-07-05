import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";// we use this library to get current camera and canvas details set up by react three fibre.
import { clampObjectToRoom, snapToSurface } from "@/utils/collision";
import { useRoomContext } from "@/app/contexts/RoomContext";
import { useModel } from "./useModel";
/* This hook is used to easily drag and drop any objects which call upon it */

type UseDragControlsProps =  {
    objectRef: React.RefObject<THREE.Object3D>// which object that it is reffering to.
    enabled: boolean;// when to enable drag controls
    isHorizontalMode: boolean// whether we want to drag it vertically or horizontally.
    onStart?: () => void;// function to run when dragging starts
    onEnd?: () => void;// function to run when dragging ends
    onChange?: (newPos: [number, number, number]) => void;// function to run when position changes
  }
type DragHandlers = {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;// function that will run when mouse/ pointer is pressed down on object
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;// function that will run when pointer moves (dragging)
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;// funtion that will run when the pointer is released (e.g. a clean up function)
};

// This function will run when user clicks down on the object referenced by the passed in ref.
//
function handlePointerDown( e: ThreeEvent<PointerEvent>, ref: React.RefObject<THREE.Object3D>, 
  plane: React.MutableRefObject<THREE.Plane>, dragOffset: React.MutableRefObject<THREE.Vector3>, 
  setDragging: (v: boolean) => void,enabled: boolean,isHorizontalMode: boolean,onStart?: () => void) {

  if (!enabled || !ref.current) return;
  e.stopPropagation();

  setDragging(true);
  onStart?.();

  const point = e.point.clone();

  // This method creates a plane on y and z axis depending on the mode, allows us to easily drag object, no matter the camera angle.
  if (isHorizontalMode) {
    plane.current.set(new THREE.Vector3(0, 1, 0), -point.y);
  } else {
    plane.current.set(new THREE.Vector3(0, 0, 1), -point.z);
  }

  dragOffset.current.copy(ref.current.position).sub(point);
}

  
// This function is called as we drag an object.
//
function handlePointerMove(e: ThreeEvent<PointerEvent>, ref: React.RefObject<THREE.Object3D>, floorRef: React.RefObject<THREE.Object3D>, plane: React.MutableRefObject<THREE.Plane>, 
    dragOffset: React.MutableRefObject<THREE.Vector3>,dragging: boolean, isHorizontalMode: boolean, onChange?: (newPos: [number, number, number]) => void) {

    if (!dragging || !ref.current) return;
    const ray = e.ray;
    const intersection = new THREE.Vector3();

    if (ray.intersectPlane(plane.current, intersection)) {// if our ray interescts the dragging plane, it means that it is a draggable object
        const newPos = intersection.add(dragOffset.current);
        const oldPos = ref.current.position;// we will need to keep track of old position in case if we want to disable
        // vertical/ horizontal movement:

        // update object's position to new position
        // Apply axis constraint
        const lockedPos: [number, number, number] = isHorizontalMode? [newPos.x, oldPos.y, newPos.z] : [oldPos.x, newPos.y, oldPos.z];
        ref.current.position.set(...lockedPos);

        // snap object vertically.
        snapToSurface(ref.current, floorRef.current, )
        const clampedPos = clampObjectToRoom(ref.current, floorRef.current);
        ref.current.position.set(...clampedPos);
        onChange?.(clampedPos);
    }
}

// function to run when we release our mouse from object (it's basically a clean up function)
//
function handlePointerUp( setDragging: (v: boolean) => void, dragging: boolean, onEnd?: () => void ) {
    if (!dragging) return;
    setDragging(false);
    onEnd?.();
}
  
  // dragging hook that we can use to append to objects and allow them to be draggable.
  export function useDragControls({objectRef, enabled, isHorizontalMode, onStart, onEnd, onChange }:
     UseDragControlsProps): DragHandlers {
    const { camera } = useThree();
    const [dragging, setDragging] = useState(false);
    const plane = useRef(new THREE.Plane());
    const dragOffset = useRef(new THREE.Vector3());
    const { floorRef } = useRoomContext();
  
    // we use useCallback to stop recreating functions every render and instead just use the old ones (improves efficiency).
    return {
        onPointerDown: useCallback(
          (e) => handlePointerDown(e, objectRef, plane, dragOffset, setDragging, enabled,isHorizontalMode, onStart),
          [objectRef, camera, plane, dragOffset, setDragging, enabled, onStart]
        ),
        onPointerMove: useCallback(
          (e) => handlePointerMove(e, objectRef, floorRef, plane, dragOffset, dragging, isHorizontalMode, onChange),
          [objectRef, plane, dragOffset, dragging, isHorizontalMode, onChange]
        ),
        onPointerUp: useCallback(
          () => handlePointerUp(setDragging, dragging, onEnd),
          [setDragging, dragging, onEnd]
        ),
      };
  }