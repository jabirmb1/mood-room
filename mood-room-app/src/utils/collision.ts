// This file will handle all logic relating to the collision system for the mood room.

import { collisionSpecificTags, wallHeight} from "./const"
import * as THREE from "three";
import { RapierRigidBody} from "@react-three/rapier";
import { Ray, type Ball, type Capsule, type Collider, type Cuboid, type Rotation, type Shape} from "@dimforge/rapier3d-compat";
import { RapierWorld } from "@/types/types";


type CollisionRules = {// the different rules of collision that an object may follow.
    mustTouchGround?: boolean;
    mustBeOnSurface?: boolean;
    disallowStacking?: boolean;
    mustBeOnWall?: boolean;
}
type CollisionTag = typeof collisionSpecificTags[number];// a specific object's collision tag e.g. 'decor', 'furniture' 'wall-art' etc.

type SceneObjectRole = "model" | "floor" | "wall";// role of a specific object and what it is.

type ObjectOverlap = {isOverlapping: boolean, penetrationDepth: number}

const collisionRules: Record<CollisionTag, CollisionRules> = {
    furniture: {
      mustTouchGround: true,
      disallowStacking: true,
    },
    decor: {
      mustBeOnSurface: true,
    },
    'wall-art': {
      mustBeOnWall: true,
    },
};

type WallOrientation = 'frontBack' | 'leftRight';
type WallNormalAxis = 'x' | 'z';

type WallOrientationData = {
  orientation: WallOrientation;
  normalAxis: WallNormalAxis;
  wallNormal: number;
};

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


//This function will check if an object is currently intersecting with another object; returns an ObjectOverlap object.
//
export function isOverlapping(world: RapierWorld, pos: THREE.Vector3, rotation: Rotation, shape: Shape, collider: Collider, rigidBody: RapierRigidBody
  ,onSnapCandidate?: (otherRigidBody: RapierRigidBody | null) => void // an optional callback to snap selected object on overlapping object.
): ObjectOverlap {
  let overlapping = false;
  let maxPenetration = 0;
  const predictionDistance = 1.0
   // Store only the first candidate
  let snapCandidate: RapierRigidBody | null = null;

  world.intersectionsWithShape(pos, rotation, shape, (otherCollider) => {
    const { isOverlapping, penetrationDepth } = checkCollisionWith(collider, shape, pos, rotation, otherCollider, predictionDistance);
    
    if (isOverlapping) {
      overlapping = true;
      maxPenetration = Math.max(maxPenetration, penetrationDepth);// we want the max penetration depth.
    }
    // if the object can snap onto it; keep track of it so we can snap on it after the query.
    if (onSnapCandidate) {
      const otherRigidBody = otherCollider.parent();
      snapCandidate = otherRigidBody
    }

    return false; // continue iterating all overlaps
  }, undefined, undefined, collider, rigidBody, undefined);

   // Now outside the iteration, call onSnapCandidate for each stored candidate
   if (onSnapCandidate && snapCandidate) {
      onSnapCandidate(snapCandidate);
    }
  return {isOverlapping: overlapping, penetrationDepth: maxPenetration};
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

// This function will get a rigid body's top most collider's AABB.
//
export function getTopMostColliderAABB(rigidBody: RapierRigidBody): THREE.Box3 | null {
  let topAABB: THREE.Box3 | null = null;
  let topY = -Infinity;

  const count = rigidBody.numColliders();
  for (let i = 0; i < count; i++) {// iterate through all colliders of selected rigid body to try and find top most collider via 
    // bounding boxes (e.g. compare top of bounding box and see if it's higher than what we tracked -> can be replaced with e.g.
    // a map which will make things more efficient.)
    const collider = rigidBody.collider(i);// get the collider
    const aabb = getApproximateAABB(collider);
    if (!aabb) continue;

    if (aabb.max.y > topY) {
      topY = aabb.max.y;
      topAABB = aabb;
    }
  }

  return topAABB;
}

//This function will get a rigid body's bottom most collider's AABB.
//
export function getBottomMostColliderAABB(rigidBody: RapierRigidBody): THREE.Box3 | null {
  let bottomAABB: THREE.Box3 | null = null;
  let bottomY = Infinity;

  const count = rigidBody.numColliders();
  for (let i = 0; i < count; i++) {// find the lowest collider by finding the bounding box with the least y value.
    const collider = rigidBody.collider(i);
    const aabb = getApproximateAABB(collider);
    if (!aabb) continue;

    if (aabb.min.y < bottomY) {
      bottomY = aabb.min.y;
      bottomAABB = aabb;
    }
  }

  return bottomAABB;
}
// Returns the ratio of selected box's area to target box's area (both in XZ plane)
// Returns a ratio in [0, ∞) — values <= 1 mean "target can hold selected" (boxB is bigger than boxA)
//
export function get2DAreaCoverageRatio(boxA: THREE.Box2, boxB: THREE.Box2): number {
  const areaA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y); // selected
  const areaB = (boxB.max.x - boxB.min.x) * (boxB.max.y - boxB.min.y); // target

  if (areaA === 0) return 0; // invalid object
  return areaB / areaA;
}



// Returns the XZ footprint (surface) of a 3D box, has an optional margin prop to allow to increase/ decrease surface area.
//
export function getFootprintFromBox3(box: THREE.Box3, margin = 0): THREE.Box2 {
  return new THREE.Box2(
    new THREE.Vector2(box.min.x - margin, box.min.z - margin),
    new THREE.Vector2(box.max.x + margin, box.max.z + margin)
  );
}



// This function will try to snap the selected object on top of anoher object if the other object has enough space on top of it to
// to handle the bottom of the selected object; and also if snapping on top will lead to any collisions or not
// also returns a boolean indicating if the snap wass successful or not
//
export function canObjectSnapRecursive(world: RapierWorld, selectedBody: RapierRigidBody | null, targetBody: RapierRigidBody | null,
  visited = new Set<RapierRigidBody>(), // to avoid infinite loops
  ceilingY = wallHeight, // how huigh up the cieling is
  margin = 0.05,// horizontal margin so uyser's don't have to be perfecntly accurate
  yOffset = 0.02,// vertical offset to avoid objects from actually touching each other vertically and prevents them from getting stuck
  overlapThreshold = 0.8,// the ratio that the overlap needs to be to allow snapping.
): boolean {
  if (!selectedBody || !targetBody) return false;
  if (visited.has(targetBody)) return false;  // prevent cycles
  visited.add(targetBody);

  const selectedBottomAABB = getBottomMostColliderAABB(selectedBody);
  const selectedTopAABB = getTopMostColliderAABB(selectedBody)
  const targetTopAABB = getTopMostColliderAABB(targetBody);
  if (!selectedBottomAABB || !selectedTopAABB  || !targetTopAABB) return false;

  // Compute 2D bounds (XY) for footprint comparison
  //(we want to compare bottom of selected object to the top of the other object.)
  const selectedFootprint = getFootprintFromBox3(selectedBottomAABB)
  const targetSurface = getFootprintFromBox3(targetTopAABB, margin)
  const surfaceOverlapRatio = get2DAreaCoverageRatio(selectedFootprint, targetSurface)
  const fits = surfaceOverlapRatio >= overlapThreshold;
  if (!fits) return false;

  // Snap selected body on top of target
  const bottomOffset = selectedBottomAABB.max.y - selectedBody.translation().y;
  const newY = targetTopAABB.max.y + bottomOffset + yOffset;

  // calculate what the new top y will be to check if it will exceed ceiling or not.
  const currentTranslationY = selectedBody.translation().y;
  const topOffset = selectedTopAABB.max.y - currentTranslationY;
  const newTopY = newY + topOffset;

  
  // see if top of selected object will go over cieling or not:
  if (newTopY >= ceilingY) return false;

  // check for collisions on candidate pos.
  const candidatePos =  new THREE.Vector3(selectedBody.translation().x, newY, selectedBody.translation().z );

   // Loop through all colliders and check for overlap
   const colliderCount = selectedBody.numColliders();
   for (let i = 0; i < colliderCount; i++) {
     const collider = selectedBody.collider(i);
     const shape = collider?.shape;
     if (!shape) continue;
 
     const overlap = isOverlapping(world, candidatePos,selectedBody.rotation(), shape, collider!, selectedBody);
     if (overlap.isOverlapping) {// one of the colliders are colliding with something
       const overlappingBody = getFirstOverlappingRigidBody(world, candidatePos, selectedBody, shape);
       if (!overlappingBody || overlappingBody === targetBody) {// there is a collidion but we can't identify what we are colliding with
        // so we just return false to be safe. second condition just means that we are somehow trying to overlap over target body again
        // not intended therefore return false as well.
         return false;
       }
 
       return canObjectSnapRecursive( world, selectedBody, overlappingBody, visited, ceilingY, margin, yOffset, overlapThreshold);
     }
   }
   // if none of the selected bodies colliders are colliding; then return true.
   return true
}
// This function will cast a ray downwards and see if it can snap or not. (will only check the first collision with the ray)
// returns a boolean whether or not object has been successfully snapped
//
export function trySnapDownFromObject(world: RapierWorld, selectedBody: RapierRigidBody | null, maxSnapDistance = 3): boolean {
  if (!selectedBody) return false;
  const bottom = getBottomMostColliderAABB(selectedBody);
  if (!bottom) return false;

  const pos = selectedBody.translation();
  const alreadyOnSurfaceThreshold = 0.025; // Time-of-impact close to zero means we're touching surface
  // accurate enough; and also more efficient than always querying or checking collisions

  const width = bottom.max.x - bottom.min.x;
  const depth = bottom.max.z - bottom.min.z;

  // Sample points: center + 4 near-corners
  const offsets = [
    { x: 0, z: 0 },          // center
    { x: -0.49, z: -0.49 },  // bottom-left
    { x: 0.49, z: -0.49 },   // bottom-right
    { x: -0.49, z: 0.49 },   // top-left
    { x: 0.49, z: 0.49 },    // top-right
  ];

  for (const offset of offsets) {
    const origin = new THREE.Vector3( bottom.min.x + width * (0.5 + offset.x), bottom.min.y, bottom.min.z + depth * (0.5 + offset.z));
    const dir = new THREE.Vector3(0, -1, 0); // downward
    const ray = new Ray(origin, dir);

    // Cast ray from object downwards
    const hit = world.castRay(ray, alreadyOnSurfaceThreshold, true, undefined, undefined, undefined, selectedBody);

    if (hit && hit.collider && hit.timeOfImpact <= alreadyOnSurfaceThreshold) {
      // Already on surface — no snapping needed
      return false;
    }
  }

  // Now do one main raycast from center to find a surface to snap to
  const mainOrigin = new THREE.Vector3(pos.x, bottom.min.y, pos.z);
  const mainRay = new Ray(mainOrigin, new THREE.Vector3(0, -1, 0));
  const mainHit = world.castRay(mainRay, maxSnapDistance, true, undefined, undefined, undefined, selectedBody);

  if (!mainHit || !mainHit.collider || mainHit.timeOfImpact <= alreadyOnSurfaceThreshold) return false; // nothing below or too close
  const hitBody = mainHit.collider.parent();
  if (!hitBody || hitBody === selectedBody) return false; // can't count itself

  const canSnap = canObjectSnapRecursive(world, selectedBody, hitBody);
  if (canSnap) {
    return snapObjectOnAnother(selectedBody, hitBody);
  }

  return false;
}


// this function actually snaps an object on top of the other (assuming that it will be valid)
// returns boolean of whether or not object was successfully snapped
//
export function snapObjectOnAnother(selectedBody: RapierRigidBody | null, targetBody: RapierRigidBody | null, yOffset = 0.02): boolean {
  if (!selectedBody || !targetBody) return false;

  const selectedBottomAABB = getBottomMostColliderAABB(selectedBody);
  const targetTopAABB = getTopMostColliderAABB(targetBody);
  if (!selectedBottomAABB || !targetTopAABB) return false;

  const bottomOffset = selectedBottomAABB.max.y - selectedBody.translation().y;
  const newY = targetTopAABB.max.y + bottomOffset + yOffset;

  try {
    selectedBody.setTranslation(
      { x: selectedBody.translation().x, y: newY, z: selectedBody.translation().z },
      true
    );
  } catch (e) {
    console.error('Translation error:', e);
    return false;
  }

  return true;
}