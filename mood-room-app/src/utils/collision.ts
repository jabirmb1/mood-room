// This file will handle all logic relating to the collision system for the mood room.

import * as THREE from "three";
import { RapierCollider, RapierRigidBody} from "@react-three/rapier";
import {type Ball, type Capsule, type Collider, type Cuboid, type Rotation, type Shape} from "@dimforge/rapier3d-compat";
import {RapierWorld } from "@/types/types";


type ObjectOverlap = {isOverlapping: boolean, penetrationDepth: number, otherRigidBody: RapierRigidBody | null, selectedRigidBody:
  RapierRigidBody
}

// structure to see if  rigid body can overlap or not; handles compound colliders.
type MultiColliderOverlap = {
  isOverlapping: boolean;
  maxPenetrationDepth: number;
  collidingBodies: Set<RapierRigidBody>;
  snapCandidates: RapierRigidBody[];
}
// a type to kee[ track of the result of world.castShape but for compound colliders.
type CompoundCastHit = {
  collider: RapierCollider;
  toi: number; // time of impact
  point: { x: number; y: number; z: number };// point of contact
  normal: { x: number; y: number; z: number };// normal at contact point
  otherCollider: RapierCollider;// the other collider that was hit
} | null;


/************** rapier rigid body collisions (will replace above collision logic soon) ********* */

//This function will allow us to check what collision a shape has with another; returnsand overlapObject.
//
export function checkCollisionWith(selfCollider: Collider, shape: Shape, position: THREE.Vector3, rotation: Rotation,
  otherCollider: Collider, predictionDistance: number): { isOverlapping: boolean; penetrationDepth: number } {
  // Skip self
  if (selfCollider === otherCollider) {
    return { isOverlapping: false, penetrationDepth: 0 };
  }

  const contact = shape.contactShape(position, rotation, otherCollider.shape, otherCollider.translation(), otherCollider.rotation(),
    predictionDistance);

    // objects are overlapping and are intersecting each other (within the bounds)
  if (contact && contact.distance <= 0) {
    return {
      isOverlapping: true,
      penetrationDepth: -contact.distance,// distance is pentration depth; but is is negative so we must reverse it.
    };
  }

  // objects are not overlapping
  return {
    isOverlapping: false,
    penetrationDepth: 0,
  };
}

//This function will be used to perform a world.castShape sweep test but with compound colliders;
// returns the closest hit if there is multiple:
//
export function sweepCastCompoundRigidBodyShape( world: RapierWorld, body: RapierRigidBody, direction: THREE.Vector3, 
  maxDistance: number, filterPredicate?: (otherCollider: RapierCollider) => boolean): CompoundCastHit {

  let closestHit: CompoundCastHit = null;

  for (let i = 0; i < body.numColliders(); i++) {
    const collider = body.collider(i);
    if (!collider) continue;

    const shape = collider.shape;
    const bodyPos = body.translation();
    const colliderLocalPos = collider.translation();

    // get the world position of the colllider
    const position = new THREE.Vector3(bodyPos.x + colliderLocalPos.x, bodyPos.y + colliderLocalPos.y,bodyPos.z + colliderLocalPos.z) ;
   
    const rotation = collider.rotation();
    const hit = world.castShape( position,rotation,direction,shape,maxDistance, maxDistance,false,undefined,undefined,collider, body);


    // only accept the closest hit when there has been a hit, it's with an object that's not itself and it's within the range.
    if (hit && hit.collider && hit.collider.parent() !== body && hit.time_of_impact < maxDistance && (!filterPredicate || filterPredicate(hit.collider))) {
      if (( !closestHit || hit.time_of_impact < closestHit.toi)) {// we want the closest hit to avoid any clipping with compound colliders.
        closestHit = {collider, toi: hit.time_of_impact, point: hit.witness1, normal: hit.normal1, otherCollider: hit.collider};
      }
    }
  }
  return closestHit;
}

//This function will check if an object is currently intersecting with another object; returns an ObjectOverlap object.
//
export function isOverlapping(world: RapierWorld, pos: THREE.Vector3, rotation: Rotation, shape: Shape, collider: Collider, rigidBody: RapierRigidBody
  ,onSnapCandidate?: (otherRigidBody: RapierRigidBody | null) => void // an optional callback to snap selected object on overlapping object.
): ObjectOverlap {
  let overlapping = false;
  let maxPenetration = 0;
  const predictionDistance = 1.0
  let overlappingBody: RapierRigidBody | null = null;
   // Store only the first candidate
  let snapCandidate: RapierRigidBody | null = null;

  world.intersectionsWithShape(pos, rotation, shape, (otherCollider) => {
    const { isOverlapping, penetrationDepth } = checkCollisionWith(collider, shape, pos, rotation, otherCollider, predictionDistance);
    
    if (isOverlapping) {
      overlapping = true;
      maxPenetration = Math.max(maxPenetration, penetrationDepth);// we want the max penetration depth.
      overlappingBody = otherCollider.parent();
    }
    // if the object can snap onto it; keep track of it so we can snap on it after the query.
    if (onSnapCandidate) {
      snapCandidate = overlappingBody
    }

    return false; // continue iterating all overlaps
  }, undefined, undefined, collider, rigidBody, undefined);

   // Now outside the iteration, call onSnapCandidate for each stored candidate
   if (onSnapCandidate && snapCandidate) {
      onSnapCandidate(snapCandidate);
    }
  return {isOverlapping: overlapping, penetrationDepth: maxPenetration, otherRigidBody: overlappingBody, selectedRigidBody: rigidBody};
}

// Return the first rigid body that overlaps the selectedBody at candidate position.
//
function getFirstOverlappingRigidBody(world: RapierWorld, candidatePos: THREE.Vector3, selectedBody: RapierRigidBody,shape: Shape): RapierRigidBody | null {
  let foundBody: RapierRigidBody | null = null;
  world.intersectionsWithShape(candidatePos, selectedBody.rotation(), shape, (otherCollider) => {
    const otherBody = otherCollider.parent();
    if (otherBody !== selectedBody) {
      foundBody = otherBody;
      return true; // stop iterating after first found
    }
    return false;
  }, undefined, undefined, selectedBody.collider(0)!, selectedBody, undefined);// since we pass in selectedBody; it ignores all colliders
  // not just the first one

  return foundBody;
}


// Helper function to check overlaps for all colliders of a rigid body
export function checkMultiColliderOverlap(world: RapierWorld, rigidBody: RapierRigidBody, testPos: THREE.Vector3): MultiColliderOverlap {
  let hasOverlap = false;
  let maxPenetration = 0;
  const collidingBodies = new Set<RapierRigidBody>();
  const snapCandidates: RapierRigidBody[] = [];

  // Check all colliders of the rigid body
  const colliderCount = rigidBody.numColliders();
  
  for (let i = 0; i < colliderCount; i++) {
    const collider = rigidBody.collider(i);
    const shape = collider?.shape;
    if (!shape) continue;

    // Store current position and temporarily move to test position
    const originalPos = rigidBody.translation();
    const offset = {x: testPos.x - originalPos.x, y: testPos.y - originalPos.y, z: testPos.z - originalPos.z};

    // Calculate this collider's position at the test location
    const colliderCurrentPos = collider.translation();
    const colliderTestPos = new THREE.Vector3(colliderCurrentPos.x + offset.x, colliderCurrentPos.y + offset.y, colliderCurrentPos.z + offset.z);

    const overlap = isOverlapping(world, colliderTestPos, rigidBody.rotation(), shape, collider, rigidBody);

    if (overlap.isOverlapping) {
      hasOverlap = true;
      maxPenetration = Math.max(maxPenetration, overlap.penetrationDepth);
      if (overlap.otherRigidBody) {
        collidingBodies.add(overlap.otherRigidBody);// we don't exit out ealry since we need all collider overlapping data to see
        // when entire model is escaping out of a collision.
      }
    }
  }
  return {isOverlapping: hasOverlap, maxPenetrationDepth: maxPenetration, collidingBodies, snapCandidates};
}


/********************************* AABB/ OBB sections **************/

// This function checks if the passed in shape is a rapier cuboid or not.
//
function isCuboid(shape: Shape): shape is Cuboid {
  return shape.type === 1;
}

//This function checks if passed in shape is a rapier sphere or not
//
function isBall(shape: Shape): shape is Ball {
  return shape.type === 0;
}

//This function checks if passed in shape is a rapier capsule or not.
//
function isCapsule(shape: Shape): shape is Capsule{
  return shape.type === 2;
}

//This function is used to create an approximate AABB box when the collider's shape is a cubioud; returns the box or null
//
export function computeCuboidAABB(collider: Collider): THREE.Box3 | null {
  const position = collider.translation();
  const shape = collider.shape;

  if (!isCuboid(shape)) return null;

  const half = shape.halfExtents;// to try to tightly defie a box around a cuboid we will just use the half extends to get pefect fit.
  if (!half) return null;

  const min = new THREE.Vector3( position.x - half.x, position.y - half.y, position.z - half.z );
  const max = new THREE.Vector3( position.x + half.x, position.y + half.y, position.z + half.z);
  return new THREE.Box3(min, max);
}

//This function is used to create an approximate AABB box when the collider's shape is a ball; returns the box or null
//
export function computeSphereAABB(collider: Collider): THREE.Box3 | null {
  const position = collider.translation();
  const shape = collider.shape;

  if (!isBall(shape)) return null;

  const r = shape.radius;// we will try to tightly define a cube inside a sphere by using it's radius
  if (r == null) return null;

  const min = new THREE.Vector3( position.x - r, position.y - r, position.z - r);
  const max = new THREE.Vector3(position.x + r,position.y + r,position.z + r);

  return new THREE.Box3(min, max);
}

//This function is used to create an approximate AABB box when the collider's shape is a capsule; returns the box or null
//
export function computeCapsuleAABB(collider: Collider): THREE.Box3 | null {
  const position = collider.translation();
  const shape = collider.shape;

  if (!isCapsule(shape)) return null;

  // use the radius and half height of the capsule to define a tight box/ cuboid around it.
  const r = shape.radius;
  const h = shape.halfHeight;
  if (r == null || h == null) return null;

  const min = new THREE.Vector3( position.x - r, position.y - h - r, position.z - r );
  const max = new THREE.Vector3( position.x + r, position.y + h + r, position.z + r);
  return new THREE.Box3(min, max);
}

//This function will be used to get an approximate AABB box of the passed in collider; returns the box or null in case it fails
//
export function getApproximateAABB(collider: Collider): THREE.Box3 | null {
  const shape = collider.shape;

  // assuming we only use the very simple shapes throughout our project (can build upon more rapier shapes if needed)
  if (isCuboid(shape)) {
    return computeCuboidAABB(collider);
  } else if (isBall(shape)) {
    return computeSphereAABB(collider);
  } else if (isCapsule(shape)) {
    return computeCapsuleAABB(collider);
  } else {
    console.warn(`AABB approximation not implemented for shape type: ${shape.type}`);
    return null;
  }
}

// This function will calculate the actual scale needed to be passed down into the collider scale props for it to fit the mode
// wuth the base scale/ global scale applied.
//
export function getRelativeColliderScale(actualScale: number | undefined, baseScale: number): [number, number, number] {
  const scale = actualScale ?? baseScale;
  const factor = scale / baseScale;
  return [factor, factor, factor];
}

// This function will return the collider which is the lowest in world pos from the passed in rigid body
//
export function getLowestCollider(rigidBody: RapierRigidBody): RapierCollider | null {
  let lowestCollider: RapierCollider | null = null;
  let lowestY = Infinity;

  for (let i = 0; i < rigidBody.numColliders(); i++) {
    const collider = rigidBody.collider(i);
    if (!collider) continue;

    const position = collider.translation();
    if (position.y < lowestY) {
      lowestY = position.y;
      lowestCollider = collider;
    }
  }

  return lowestCollider;
}
