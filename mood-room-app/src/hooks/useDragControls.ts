import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";// we use this library to get current camera and canvas details set up by react three fibre.
import { useRoomContext } from "@/app/contexts/RoomContext";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import { getPosition} from "@/utils/rapierHelpers";
import { applyMovement } from "@/utils/movementEngine";
import { Rapier, RapierWorld } from "@/types/types";
import { trySnapDownFromObject } from "@/utils/collision";
import { snapDownwardsCountdown } from "@/utils/const";
/* This hook is used to easily drag and drop any objects which call upon it */

type UseDragControlsProps =  {
    rigidBodyRef: React.RefObject<RapierRigidBody | null>;// the reference to a rapier rigid body.
    objectRef: React.RefObject<THREE.Object3D | null>// which object that it is reffering to.
    enabled: boolean;// when to enable drag controls
    isHorizontalMode: boolean// whether we want to drag it vertically or horizontally.
    onStart?: () => void;// function to run when dragging starts
    onEnd?: () => void;// function to run when dragging ends
  }
type DragHandlers = {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;// function that will run when mouse/ pointer is pressed down on object
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;// function that will run when pointer moves (dragging)
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;// funtion that will run when the pointer is released (e.g. a clean up function)
};

// This function will run when user clicks down on the object referenced by the passed in ref.
//
function handlePointerDown( e: ThreeEvent<PointerEvent>, rigidBodyRef: React.RefObject<RapierRigidBody | null>, 
  plane: React.RefObject<THREE.Plane>, dragOffset: React.RefObject<THREE.Vector3>, 
  setDragging: (v: boolean) => void,enabled: boolean,isHorizontalMode: boolean,onStart?: () => void) {

  if (!enabled || !rigidBodyRef?.current) return;
  e.stopPropagation();
  const target = e.target as HTMLElement;
  target.setPointerCapture(e.pointerId);// we want to explicitly capture the pointer so we can drag it around accuratly
  // (avoids issues with pointer events not being captured in track pads).

  setDragging(true);
  onStart?.();

  const point = e.point.clone();

  // This method creates a plane on y and z axis depending on the mode, allows us to easily drag object, no matter the camera angle.
  if (isHorizontalMode) {
    plane.current.set(new THREE.Vector3(0, 1, 0), -point.y);
  } else {
    plane.current.set(new THREE.Vector3(0, 0, 1), -point.z);
  }
  const currentPos = getPosition(rigidBodyRef.current);
  dragOffset.current.copy(currentPos).sub(point);
}

  
// This function is called as we drag an object.
//
function handlePointerMove(e: ThreeEvent<PointerEvent>,   rigidBodyRef: React.RefObject<RapierRigidBody | null>, 
  objectRef: React.RefObject<THREE.Object3D | null>,  world:RapierWorld, rapier: Rapier ,floorRef: React.RefObject<THREE.Object3D | null>, 
  plane: React.RefObject<THREE.Plane>,  dragOffset: React.RefObject<THREE.Vector3>,
  dragging: boolean, isHorizontalMode: boolean){
  

    if (!dragging || !rigidBodyRef?.current || !objectRef.current) return;
  const ray = e.ray;
  const intersection = new THREE.Vector3();

  if (ray.intersectPlane(plane.current, intersection)) {
    const targetPos = intersection.add(dragOffset.current);
    const currentPos = getPosition(rigidBodyRef.current);
    
    const fullDelta = targetPos.clone().sub(currentPos);

    // to keep drag controls as smooth and prediciable as e.g. keybaord controls; we will limit the direction into smaller
    // continuas steps rather than one big step.
    const maxStep = 0.5; // smaller step means smoother, more controlled drag
    const stepDelta = fullDelta.clone().clampLength(0, maxStep);

    const direction = stepDelta.clone().normalize();
    const distance = stepDelta.length();

    const shape = rigidBodyRef.current.collider(0).shape

    applyMovement({direction, distance,world, shape: shape,rotation: rigidBodyRef.current.rotation(),rigidBody: rigidBodyRef.current,
      collider: rigidBodyRef.current.collider(0),  isHorizontal: isHorizontalMode,
    });
  }
}

// function to run when we release our mouse from object (it's basically a clean up function)
//
function handlePointerUp(e: ThreeEvent<PointerEvent>, rigidBodyRef: React.RefObject<RapierRigidBody | null>,
  snapTimeout: React.RefObject<NodeJS.Timeout | null>, world: RapierWorld, setDragging: (v: boolean) => void, dragging: boolean, onEnd?: () => void ) {
    if (!dragging) return;
    setDragging(false);
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);// explicitly release the pointer capture so we can stop dragging.

    if (rigidBodyRef.current)
    {
       if (snapTimeout.current) clearTimeout(snapTimeout.current);
       {
      
              // Try snapping after a pause from key release
              snapTimeout.current = setTimeout(() => {
                trySnapDownFromObject(world, rigidBodyRef.current!);
              }, snapDownwardsCountdown);
        }
    }
    onEnd?.();
}
  
  // dragging hook that we can use to append to objects and allow them to be draggable.
  export function useDragControls({rigidBodyRef, objectRef, enabled, isHorizontalMode, onStart, onEnd}:
     UseDragControlsProps): DragHandlers {
    const { camera } = useThree();
    const [dragging, setDragging] = useState(false);
    const plane = useRef(new THREE.Plane());
    const dragOffset = useRef(new THREE.Vector3());
    const { floorRef } = useRoomContext();
    const {world, rapier} = useRapier()
    const snapTimeout = useRef<NodeJS.Timeout | null>(null);

    // Clean up dragging on global pointer up (failsafe for trackpads and touch devices)
    useEffect(() => {
      function forceEndDrag() {
        setDragging(false);
      }
      window.addEventListener("pointerup", forceEndDrag);
      return () => {
        window.removeEventListener("pointerup", forceEndDrag);
      };
    }, []);
  
    // we use useCallback to stop recreating functions every render and instead just use the old ones (improves efficiency).
    return {
        onPointerDown: useCallback(
          (e) => handlePointerDown(e, rigidBodyRef, plane, dragOffset, setDragging, enabled,isHorizontalMode, onStart),
          [objectRef, camera, plane, dragOffset, setDragging, enabled, onStart]
        ),
        onPointerMove: useCallback(
          (e) => handlePointerMove(e,rigidBodyRef, objectRef, world, rapier, floorRef, plane, dragOffset, dragging, isHorizontalMode),
          [objectRef, plane, dragOffset, dragging, isHorizontalMode]
        ),
        onPointerUp: useCallback(
          (e) => handlePointerUp(e, rigidBodyRef, snapTimeout, world, setDragging, dragging, onEnd),
          [setDragging, dragging, onEnd]
        ),
      };
  }