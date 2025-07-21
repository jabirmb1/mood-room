import * as THREE from "three";
import { getPosition, setPosition } from "@/utils/rapierHelpers";
import { handleSlidingMovement, resolveDepenetration } from "@/utils/collision";
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
  const margin = 0.01;// a small margin to prevent objet's from actually touching each other (bad for collision); small enough to 
  // make it seem that objects are touching each other.

  const target = handleSlidingMovement( world, currentPos, direction.normalize(), shape, rotation, distance, margin, 
  collider, rigidBody, isHorizontal);

  if (target) {
    setPosition(rigidBody, target);
  } else if (cachedColliders.length > 0) {
    // make sure to update and reset frame every loop for efficiency.
    currentFrame = currentFrame >= 60 ? 0 : currentFrame + 1;

    resolveDepenetration(
      world,
      shape,
      cachedColliders,
      currentPos,
      rotation,
      isHorizontal,
      currentFrame,
      3,              // depenetration stride
      rigidBody,
      collider,
      5               // max attempts
    );
  }
}
