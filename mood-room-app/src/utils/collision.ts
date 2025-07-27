// This file will handle all logic relating to the collision system for the mood room.

import { collisionSpecificTags, wallHeight, wallThickness } from "./const"
import * as THREE from "three";
import { calculateObjectBoxSize } from "./object3D";
import { RapierRigidBody} from "@react-three/rapier";
import { Ray, type Ball, type Capsule, type Collider, type ColliderDesc, type Cuboid, type Rotation, type Shape} from "@dimforge/rapier3d-compat";
import { Rapier, RapierAABB, RapierWorld } from "@/types/types";


type CollisionRules = {// the different rules of collision that an object may follow.
    mustTouchGround?: boolean;
    mustBeOnSurface?: boolean;
    disallowStacking?: boolean;
    mustBeOnWall?: boolean;
}
type CollisionTag = typeof collisionSpecificTags[number];// a specific object's collision tag e.g. 'decor', 'furniture' 'wall-art' etc.

type SceneObjectRole = "model" | "floor" | "wall";// role of a specific object and what it is.

type ObjectOverlap = {isOverlapping: boolean, penetrationDepth: number}

type SceneObject = {// an object inside our room scene
  role: SceneObjectRole;
  object: THREE.Object3D;
};

type CheckOptions = {
  collision?: boolean;
  snapping?: boolean;
  stacking?: boolean;
  snapThreshold?: number;
  stackThreshold?: number;
  searchRadius?: number; // for spatial pruning
};

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



//This function checks if the object is touching the ground or not (in our case it's just the flat floor)
// returns boolean.
//
function isTouchingGround( object: THREE.Object3D, floor: THREE.Object3D): boolean {
    const objectBox = calculateObjectBoxSize(object).box;
    const floorBox = calculateObjectBoxSize(floor).box;
  
    // Check bottom of object is close to floor top
    const objectBottom = objectBox.min.y;
    const floorTop = floorBox.max.y;
  
    const touching = Math.abs(objectBottom - floorTop) === 0;
    return touching;
}
  
//This function checks if the object is on top of a surface (room floor or surface of another object.)
//
function isOnSurface(  object: THREE.Object3D,  surface: THREE.Object3D): boolean {
    const objectBox = calculateObjectBoxSize(object).box;
    const objectBottom = objectBox.min.y;
    const surfaceBox = new THREE.Box3().setFromObject(surface);
    // Check horizontal overlap (x, z)
    const overlapX = objectBox.min.x < surfaceBox.max.x && objectBox.max.x > surfaceBox.min.x;
    const overlapZ = objectBox.min.z < surfaceBox.max.z && objectBox.max.z > surfaceBox.min.z;
  
      // Check vertical proximity (bottom of object close to top of surface)
      if (overlapX && overlapZ) {
        if (Math.abs(objectBottom - surfaceBox.max.y) <= wallThickness) {
          return true;
        }
      }
  
    return false;
}
  

/***********some wall specific funtions */

//This function get's the wall's orientation and normal; returns a wallOrientationData variable
//
function getWallOrientationAndNormal(objectBox: THREE.Box3, wallBox: THREE.Box3):WallOrientationData | null {
    const wallSize = new THREE.Vector3();
    wallBox.getSize(wallSize);
  
    if (Math.abs(wallSize.z - wallThickness) < 1e-3) {
      // Front/back wall: thickness along Z, normal along Z axis
      // Determine if object is closer to min.z (front) or max.z (back)
      const distToMinZ = Math.abs(objectBox.max.z - wallBox.min.z);
      const distToMaxZ = Math.abs(objectBox.min.z - wallBox.max.z);
      const wallNormal = distToMinZ < distToMaxZ ? -1 : 1;
      return { orientation: 'frontBack', normalAxis: 'z', wallNormal };
    } 
    else if (Math.abs(wallSize.x - wallThickness) < 1e-3) {
      // Left/right wall: thickness along X, normal along X axis
      const distToMinX = Math.abs(objectBox.max.x - wallBox.min.x);
      const distToMaxX = Math.abs(objectBox.min.x - wallBox.max.x);
      const wallNormal = distToMinX < distToMaxX ? -1 : 1;
      return { orientation: 'leftRight', normalAxis: 'x', wallNormal };
    }
    return null;// not a valid wall
  }

// Checks vertical and horizontal overlap and proximity to wall surface.
//
function checkOverlapAndProximity(objectBox: THREE.Box3, wallBox: THREE.Box3,orientation: 'frontBack' | 'leftRight', normalAxis: 'x' | 'z',
  wallNormal: number, threshold: number): boolean {
  // Vertical overlap (Y axis)
  const verticalOverlap = objectBox.min.y < wallBox.max.y && objectBox.max.y > wallBox.min.y;
  if (!verticalOverlap) return false;

  if (orientation === 'frontBack' && normalAxis === 'z') {
    // Check proximity along Z axis (wall normal)
    const nearWall = wallNormal > 0? Math.abs(objectBox.min.z - wallBox.max.z) <= threshold : Math.abs(objectBox.max.z - wallBox.min.z) <= threshold;
   
    // Check horizontal overlap on X axis
    const horizontalOverlap = objectBox.max.x > wallBox.min.x && objectBox.min.x < wallBox.max.x;
    return nearWall && horizontalOverlap;

  } 
  else if (orientation === 'leftRight' && normalAxis === 'x') {
    // Proximity along X axis (wall normal)
    const nearWall = wallNormal > 0 ? Math.abs(objectBox.min.x - wallBox.max.x) <= threshold : Math.abs(objectBox.max.x - wallBox.min.x) <= threshold;
    // Horizontal overlap on Z axis
    const horizontalOverlap = objectBox.max.z > wallBox.min.z && objectBox.min.z < wallBox.max.z;
    return nearWall && horizontalOverlap;
  }
  return false;
}


// Aligns object's front face to be parallel to wall's normal direction. 
//
function alignRotationToWallNormal(object: THREE.Object3D, orientation: 'frontBack' | 'leftRight', wallNormal: number) {
  if (orientation === 'frontBack') {
    // front/back walls: front faces along +Z or -Z
    object.rotation.y = wallNormal > 0 ? 0 : Math.PI; // 0 or 180 degrees
  } else if (orientation === 'leftRight') {
    // left/right walls: front faces along +X or -X
    object.rotation.y = wallNormal > 0 ? -Math.PI / 2 : Math.PI / 2; // -90 or 90 degrees
  }
}

// checks if object is on a wall
// precondition: wall is a basic flat surface e.g. square/ rectangle and e.g. has no curves.
//
export function isOnWall(object: THREE.Object3D, walls: THREE.Object3D[], threshold = wallThickness): boolean {
  const objectBox = calculateObjectBoxSize(object).box;

  for (const wall of walls) {
    const wallBox = new THREE.Box3().setFromObject(wall);
    const orientationData = getWallOrientationAndNormal(objectBox, wallBox);
    if (!orientationData) continue;

    const { orientation, normalAxis, wallNormal } = orientationData;

    if (checkOverlapAndProximity(objectBox, wallBox, orientation, normalAxis, wallNormal, threshold)) {
      return true;
    }
  }
  return false;
}


// This function alligns an object to the closest wall; returns true if aligned, and false if not
//
export function alignObjectToWall(object: THREE.Object3D, walls: THREE.Object3D[], threshold = wallThickness): boolean {
  const objectBox = calculateObjectBoxSize(object).box;

  for (const wall of walls) {
    const wallBox = new THREE.Box3().setFromObject(wall);
    const orientationData = getWallOrientationAndNormal(objectBox, wallBox);
    if (!orientationData) continue;

    const { orientation, normalAxis, wallNormal } = orientationData;

    if (checkOverlapAndProximity(objectBox, wallBox, orientation, normalAxis, wallNormal, threshold)) {
      alignRotationToWallNormal(object, orientation, wallNormal);
      return true;
    }
  }
  return false;
}

//This function get's the room's bounds and returns it
//
export function getRoomBounds(floor: THREE.Object3D, wallHeight: number, padding: number = 0): THREE.Box3 {
  const floorBox = calculateObjectBoxSize(floor).box;
  const roomMin = new THREE.Vector3( floorBox.min.x + padding,   floorBox.max.y + padding,  floorBox.min.z + padding, );
  const roomMax = new THREE.Vector3( floorBox.max.x - padding,  floorBox.max.y + wallHeight - padding, floorBox.max.z - padding, );
  return new THREE.Box3(roomMin, roomMax);
}

  

// This function checks if the object is within the room or not
//
export function isInsideRoom(object: THREE.Object3D, floor: THREE.Object3D): boolean {
  const objectBox = calculateObjectBoxSize(object).box;
  const roomBox = getRoomBounds(floor, wallHeight).clone();
  return roomBox.containsBox(objectBox);
}

// returns a position which clamps objects to room.
//
export function getClampedPos(modelRef: THREE.Object3D,newPosition: THREE.Vector3,floor: THREE.Object3D | null): [number, number, number] {
  if (!floor) return [0, 0, 0];// if floor doesn't exist for our bounding calulcation; just return the default pos.
  const objectBox = calculateObjectBoxSize(modelRef).box;
  const objectSize = new THREE.Vector3();
  objectBox.getSize(objectSize);

  const roomBox = getRoomBounds(floor, wallHeight);
   // Compute min/max allowed positions for object.position so object fits fully inside room
  const minPos = roomBox.min.clone().add(objectSize.clone().multiplyScalar(0.5));
  const maxPos = roomBox.max.clone().sub(objectSize.clone().multiplyScalar(0.5));

  const clamped = newPosition.clone();
  clamped.x = THREE.MathUtils.clamp(clamped.x, minPos.x, maxPos.x);
  clamped.y = THREE.MathUtils.clamp(clamped.y, minPos.y, maxPos.y);
  clamped.z = THREE.MathUtils.clamp(clamped.z, minPos.z, maxPos.z);
  return [clamped.x, clamped.y, clamped.z];
}

  
// This function checks that if an object is stacking on another objext, returns a boolean.
//
function isStacking( object: THREE.Object3D, otherObject: THREE.Object3D, threshold = 0.01): boolean {
    const objBox = calculateObjectBoxSize(object).box;  
    const otherBox = calculateObjectBoxSize(otherObject).box;
  
    // Check horizontal overlap (x,z)
    const overlapX = objBox.min.x < otherBox.max.x && objBox.max.x > otherBox.min.x;
    const overlapZ =   objBox.min.z < otherBox.max.z && objBox.max.z > otherBox.min.z;
  
    if (overlapX && overlapZ) {
      // Check vertical stacking overlap (obj bottom < other top)
      if (objBox.min.y < otherBox.max.y + threshold && objBox.max.y > otherBox.min.y - threshold) {
        return true; // stacking collision
      }
    }
  return false;
}

//This function is just a general collision test, and checks if an object is inside another object or not.
//
function hasCollisionWithOtherObject(object: THREE.Object3D, otherObject: THREE.Object3D): boolean {
    const objectBox = calculateObjectBoxSize(object).box;
    const otherBox = calculateObjectBoxSize(otherObject).box;
  
      // Check full 3D box intersection
      if (objectBox.intersectsBox(otherBox)) {
        return true;
      }
      return false;
 }
  

  

//This function is used to snap an object to it's nearest surface (so user's don't have to be accurate in the y axis when placing 
// down objects)
//This is just for the y axis
// returns true if it has been snapped correctly
//
export function snapToSurface( object: THREE.Object3D, sceneObjects: THREE.Object3D[], threshold = 0.5): boolean {
  const objectBox = calculateObjectBoxSize(object).box;
  const objectHeight = objectBox.max.y - objectBox.min.y;

  let closestSnapY: number | null = null;// we want to snap object to the closest surface.
  let smallestDistance = Infinity;// a counter to keep track which surface is closest to the object.

  for (const other of sceneObjects) {
    if (other === object) continue;
    const otherBox = calculateObjectBoxSize(other).box;

    // Must be horizontally overlapping (i.e., aligned on X/Z)
    const horizontalOverlap =
      objectBox.max.x > otherBox.min.x &&
      objectBox.min.x < otherBox.max.x &&
      objectBox.max.z > otherBox.min.z &&
      objectBox.min.z < otherBox.max.z;

    if (!horizontalOverlap) continue;

    const bottomY = objectBox.min.y;
    const topY = objectBox.max.y;

    // Snap downward (onto a surface below)
    const surfaceBelowY = otherBox.max.y;
    const distBelow = bottomY - surfaceBelowY;

    if (distBelow >= 0 && distBelow <= threshold && distBelow < smallestDistance) {
      closestSnapY = surfaceBelowY + objectHeight / 2;
      smallestDistance = distBelow;
    }

    // also if the above surface is closer; then snap the object on top of that srurface.
    const surfaceAboveY = otherBox.min.y;
    const distAbove = surfaceAboveY - topY;

    if (distAbove >= 0 && distAbove <= threshold && distAbove < smallestDistance) {
      const proposedTopY = surfaceAboveY; 
      if (proposedTopY <= wallHeight) {// we don't want any objects to peak over wall height.
        closestSnapY = surfaceAboveY - objectHeight / 2;
        smallestDistance = distAbove;
      }
    }
  }

  if (closestSnapY !== null) {
    object.position.y = closestSnapY;
    return true;
  }

  return false;
}

//This function will merge multiple rules (that relates to how a model will handle collision) into one object so we know what rules apply to the object
//
function mergeCollisionRules(tags: string[]): CollisionRules {
  // default rules; all flags are false.
  const base: CollisionRules = {
    mustTouchGround: false,
    mustBeOnSurface: false,
    mustBeOnWall: false,
    disallowStacking: false,
  };

  for (const tag of tags) {
    const rule = collisionRules[tag as CollisionTag];
    if (!rule) continue;// if it's not a valid rule; then just skip to next tag.

    base.mustTouchGround ||= rule.mustTouchGround;
    base.mustBeOnSurface ||= rule.mustBeOnSurface;
    base.mustBeOnWall ||= rule.mustBeOnWall;
    base.disallowStacking ||= rule.disallowStacking;
  }

  return base;
}

// This function will be used to iterate through all objects in a given array once; and do the collision checks based on the rules
//This function will check if object is inside another object, is stacking on another object, is on a surface.
//
function checkObjectCollisions( object: THREE.Object3D,  otherObjects: THREE.Object3D[],  floor: THREE.Object3D,  checkStacking: boolean = false,  checkOnSurface: boolean = false, threshold = wallThickness){

  let collides = false;
  let stacking = false;
  let onSurface = false;
  for (const other of otherObjects) {
    if (other === object) continue; // skip self

    if (!collides && hasCollisionWithOtherObject(object, other))
      collides = true;

    if (!stacking && checkStacking && isStacking(object, other, 0.1)){
      stacking = true; // stacking collision
    }

    if (!onSurface && checkOnSurface && isOnSurface(object, other)) {
      onSurface = true;// object is on a surface.
    }
  }

  // do an additional is on surface check with the floor itself.
  if (!onSurface && checkOnSurface && isOnSurface(object, floor)) {
      onSurface = true;// object is on a surface.
  }
  return {collides, stacking, onSurface}
}

/**
 * Main function to validate if an object placement follows the collision rules
 * @param object Object3D being checked
 * @param collisionTag string tag from collisionSpecificTags
 * @param floor Floor Object3D (room floor)
 * @param walls Array of walls Object3D
 * @param otherObjects Array of other objects in the room
 * @returns true if object placement is valid
 */
export function validateObjectPlacement(
  object: THREE.Object3D,
  floor: THREE.Object3D,
  walls: THREE.Object3D[],
  otherObjects: THREE.Object3D[],
  logWarnings: boolean = false,
): boolean {
  const rules = mergeCollisionRules(object.userData.tags);

  // 1. Check inside room boundaries
  if (!isInsideRoom(object, floor)) {
    if (logWarnings) console.warn("Object is outside room boundaries");
    return false;
  }

  // 2. mustTouchGround: object bottom near floor top
  if (rules.mustTouchGround && !isTouchingGround(object, floor)) {
    if (logWarnings) console.warn("Object must touch the ground (floor)");
    return false;
  }

  
  // 3. mustBeOnWall: object is touching any wall
  if (rules.mustBeOnWall && !isOnWall(object, walls)) {
    if (logWarnings) console.warn("Object must be on a wall");
    return false;
  }
  
  //4. some more general collision checks with other objects (stacking, surface, collisions)
  const { collides, stacking, onSurface } = 
  checkObjectCollisions( object, otherObjects, floor, rules.disallowStacking, rules.mustBeOnSurface && !rules.mustTouchGround,);

  if (collides || stacking || !onSurface) {
    if (logWarnings) {
      if (collides) console.warn("Object collides with another object");
      if (stacking) console.warn("Object is stacking on another object");
      if (!onSurface) console.warn("Object must be on a surface");
    }
    return false; // any of these conditions failed
  }
  // If all rules passed
  return true;
}

// surface, stacking, collisions with other objects all can just be in one single function; to prevent going through
// array multiple times per check.

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
export function trySnapDownFromObject( world: RapierWorld, selectedBody: RapierRigidBody | null, maxSnapDistance = 3): boolean {
  if (!selectedBody) return false;
  const bottom = getBottomMostColliderAABB(selectedBody)
  if (!bottom) return false
  const origin = new THREE.Vector3(selectedBody.translation().x, bottom.min.y, selectedBody.translation().z);
  const dir = new THREE.Vector3(0, -1, 0); // downward
  const ray = new Ray(origin, dir);
  const alreadyOnSurfaceThreshold = 0.025; // Time-of-impact close to zero means we're touching surface
  // accurate enough; and also more efficent than always quering or checking collisions

  // Cast ray from object downwards
  const hit = world.castRay(ray, maxSnapDistance,
    true, undefined, undefined, undefined, selectedBody
  );

  if (!hit || !hit.collider || hit.timeOfImpact <= alreadyOnSurfaceThreshold) return false;//  there was nothig below it from within the radius; so we just don't snap.
  console.log('not arady touchig ground');
  console.log(hit.timeOfImpact)
  const hitBody = hit.collider.parent();
  if (!hitBody || hitBody === selectedBody) return false;// can't count itself.
  
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