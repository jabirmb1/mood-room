import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";// we use this library to get current camera and canvas details set up by react three fibre.
/* This hook is used to easily drag and drop any objects which call upon it */

type UseDragControlsProps =  {
    enabled: boolean;// when to enable drag controls
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
function handlePointerDown(
    e: ThreeEvent<PointerEvent>, ref: React.RefObject<THREE.Object3D>, camera: THREE.Camera, plane: React.MutableRefObject<THREE.Plane>,  dragOffset: 
    React.MutableRefObject<THREE.Vector3>, setDragging: (v: boolean) => void, enabled: boolean, onStart?: () => void) {
    if (!enabled || !ref.current) return;
    e.stopPropagation();
  
    setDragging(true);
    onStart?.();// call the function if it exists and has been assigned.
  
    // we need to grab the intersection of where mouse collides with object, then we need to clone that point to avoid changing original data
    const intersect = e.intersections?.[0] || e;
    const point = intersect.point.clone();
  
    // we make the dragging plane be the one that is in front of camera ans then we anchor it (change this to floor of room later)
    plane.current.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), point);
    dragOffset.current.subVectors(ref.current.position, point);// calculate how much new position is from old position.
  }
  
// This function is called as we drag an object.
//
function handlePointerMove(e: ThreeEvent<PointerEvent>, ref: React.RefObject<THREE.Object3D>, plane: React.MutableRefObject<THREE.Plane>, 
    dragOffset: React.MutableRefObject<THREE.Vector3>,dragging: boolean, onChange?: (newPos: [number, number, number]) => void) {

    if (!dragging || !ref.current) return;

    const ray = e.ray;
    const intersection = new THREE.Vector3();

    if (ray.intersectPlane(plane.current, intersection)) {// if our ray interescts the dragging plane, it means that it is a draggable object
        const newPos = intersection.add(dragOffset.current);
        // update object's position to new position
        ref.current.position.copy(newPos);
        onChange?.([newPos.x, newPos.y, newPos.z]);
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
  export function useDragControls( ref: React.RefObject<THREE.Object3D>,  { enabled, onStart, onEnd, onChange }:
     UseDragControlsProps): DragHandlers {
    const { camera } = useThree();
    const [dragging, setDragging] = useState(false);
    const plane = useRef(new THREE.Plane());
    const dragOffset = useRef(new THREE.Vector3());
  
    // we use useCallback to stop recreating functions every render and instead just use the old ones (improves efficiency).
    return {
        onPointerDown: useCallback(
          (e) => handlePointerDown(e, ref, camera, plane, dragOffset, setDragging, enabled, onStart),
          [ref, camera, plane, dragOffset, setDragging, enabled, onStart]
        ),
        onPointerMove: useCallback(
          (e) => handlePointerMove(e, ref, plane, dragOffset, dragging, onChange),
          [ref, plane, dragOffset, dragging, onChange]
        ),
        onPointerUp: useCallback(
          () => handlePointerUp(setDragging, dragging, onEnd),
          [setDragging, dragging, onEnd]
        ),
      };
  }