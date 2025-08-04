import * as THREE from "three";
import { getPosition, isWall, matchRigidBodyRotation, setPosition } from "@/utils/rapierHelpers";
import {checkMultiColliderOverlap} from "@/utils/collision";
import { RapierRigidBody } from "@react-three/rapier";
import { RapierWorld} from "@/types/types";

/************This file is the central hub for all movement logic; (keybaord controls, drag controls and buttons to move an object 
 * will all be hooked up to this file.) */

// a frame couter to debounce some collision ligic for btter efficiency.
let currentFrame = 0;

type MovementOptions = {
  direction: THREE.Vector3;// what direction object is moving in
  distance: number;// distance from current pos to desitination
  world: RapierWorld;// instance of world from rapier
  rigidBody: RapierRigidBody;// rigid body of the object that we are moving
  isHorizontal: boolean;// what movement we are in
};

// This is the main function will will be responsible to actually move object (has built in collision detection)
export function applyMovement({ direction, distance, world, rigidBody, isHorizontal}: MovementOptions) {
  if (direction.lengthSq() === 0) return;

  const currentPos = getPosition(rigidBody);
  const isWallArt = rigidBody.userData?.tags?.includes('wall-art') ?? false;// wall art models are allowed to stick to walls.
  
  // total movement vector scaled by distance
  const moveVec = direction.clone().normalize().multiplyScalar(distance);

  // We'll try moving per axis separately
  // axes for horizontal: X and Z; vertical: Y only
  const axes: ('x' | 'y' | 'z')[] = isHorizontal ? ['x', 'z'] : ['y'];

  let newPos = currentPos.clone();

  for (const axis of axes) {
    if (moveVec[axis] === 0) continue;

    const testPos = newPos.clone();
    testPos[axis] += moveVec[axis];

    // Check current overlaps (before moving)
    const beforeOverlap = checkMultiColliderOverlap(world,  rigidBody,  newPos);

    // Check overlaps after potential movement
    const afterOverlap = checkMultiColliderOverlap(world, rigidBody, testPos);

    // Allow move if no collision OR if penetration reduces (escaping)
    if (!afterOverlap.isOverlapping || 
        (beforeOverlap.isOverlapping && afterOverlap.maxPenetrationDepth < beforeOverlap.maxPenetrationDepth)) {
      newPos.copy(testPos);
    }

   // snap the wall art model to the direction that the wall is facing.
    if (isWallArt && afterOverlap.collidingBodies.size > 0) {
      for (const otherRigidBody of afterOverlap.collidingBodies) {
        if (isWall(otherRigidBody)) {
          matchRigidBodyRotation(rigidBody, otherRigidBody);
          break; // Only snap to first wall found
        }
      }
    }
  }

  setPosition(rigidBody, newPos);
  currentFrame = (currentFrame + 1) % 60;
}