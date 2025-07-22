import * as THREE from "three";
import { getPosition, setPosition } from "@/utils/rapierHelpers";
import {isOverlapping} from "@/utils/collision";
import type { Collider, Rotation, Shape } from "@dimforge/rapier3d-compat";
import { RapierRigidBody } from "@react-three/rapier";
import { RapierWorld } from "@/types/types";

/************This file is the central hub for all movement logic; (keybaord controls, drag controls and buttons to move an object 
 * will all be hooked up to this file.) */

// a frame couter to debounce some collision ligic for btter efficiency.
let currentFrame = 0;

type MovementOptions = {
  direction: THREE.Vector3;// what direction object is moving in
  distance: number;// distance from current pos to desitination
  world: RapierWorld;// instance of world from rapier
  shape: Shape;// collider's shape
  rotation: Rotation;// rotation of collider
  rigidBody: RapierRigidBody;// rigid body of the object that we are moving
  collider: Collider;// collider of object that we are moving
  isHorizontal: boolean;// what movement we are in
  cachedColliders?: Collider[];// cached colliders for better efficiency.
};

// This is the main function will will be responsible to actually move object (has built in collision detection)
export function applyMovement({ direction, distance, world, shape, rotation, rigidBody, collider, isHorizontal, cachedColliders = [],}: MovementOptions) {
  if (direction.lengthSq() === 0) return;

  const currentPos = getPosition(rigidBody);

  // total movement vector scaled by distance
  const moveVec = direction.clone().normalize().multiplyScalar(distance);

  // We'll try moving per axis separately
  // axes for horizontal: X and Z; vertical: Y only?
  // Assuming horizontal moves in XZ plane here:
  const axes: ('x' | 'y' | 'z')[] = isHorizontal ? ['x', 'z'] : ['y'];

  let newPos = currentPos.clone();

  for (const axis of axes) {
    if (moveVec[axis] === 0) continue;

    const testPos = newPos.clone();
    testPos[axis] += moveVec[axis];

    const { isOverlapping: wasOverlapping, penetrationDepth: beforePenetration } =
      isOverlapping(world, newPos, rotation, shape, collider, rigidBody);

    const { isOverlapping: willOverlap, penetrationDepth: afterPenetration } =
      isOverlapping(world, testPos, rotation, shape, collider, rigidBody);

    // Allow move if no collision OR if penetration reduces (escaping)
    if (!willOverlap || (wasOverlapping && afterPenetration < beforePenetration)) {
      newPos.copy(testPos);
    }
    // else skip axis move, block only the colliding axis but allow others
  }

  setPosition(rigidBody, newPos);

  currentFrame = (currentFrame + 1) % 60;
}
