// This file will handle all logic relating to the collision system for the mood room.

import { collisionSpecificTags, wallHeight, wallThickness } from "./const"
import * as THREE from "three";
import { calculateObjectBoxSize } from "./object3D";

type CollisionRules = {// the different rules of collision that an object may follow.
    mustTouchGround?: boolean;
    mustBeOnSurface?: boolean;
    disallowStacking?: boolean;
    mustBeOnWall?: boolean;
}
type CollisionTag = typeof collisionSpecificTags[number];// a specific object's collision tag e.g. 'decor', 'furniture' 'wall-art' etc.

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
  
//This function checks if the object is on top of a surface (room floor or surface of a furniture object.)
//
function isOnSurface(  object: THREE.Object3D,  surfaces: THREE.Object3D[]): boolean {
    const objectBox = calculateObjectBoxSize(object).box;
    const objectBottom = objectBox.min.y;
  
    for (const surface of surfaces) {
      const surfaceBox = new THREE.Box3().setFromObject(surface);
      // Check horizontal overlap (x, z)
      const overlapX = objectBox.min.x < surfaceBox.max.x && objectBox.max.x > surfaceBox.min.x;
      const overlapZ = objectBox.min.z < surfaceBox.max.z && objectBox.max.z > surfaceBox.min.z;
  
      // Check vertical proximity (bottom of object close to top of surface)
      if (overlapX && overlapZ) {
        if (Math.abs(objectBottom - surfaceBox.max.y) < wallThickness) {
          return true;
        }
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

// clamps object inside room so that it can't go out
//
export function clampObjectToRoom(object: THREE.Object3D, floor: THREE.Object3D): [ number, number, number ] {
  const objectBox = calculateObjectBoxSize(object).box;
  const objectSize = new THREE.Vector3();
  objectBox.getSize(objectSize);

  const roomBox = getRoomBounds(floor, wallHeight);
  // Compute min/max allowed positions for object.position so object fits fully inside room
  const minPos = roomBox.min.clone().add(objectSize.clone().multiplyScalar(0.5));
  const maxPos = roomBox.max.clone().sub(objectSize.clone().multiplyScalar(0.5));


  const clamped = object.position.clone();
  clamped.x = THREE.MathUtils.clamp(clamped.x, minPos.x, maxPos.x);
  clamped.y = THREE.MathUtils.clamp( clamped.y, minPos.y, maxPos.y);
  clamped.z = THREE.MathUtils.clamp(clamped.z, minPos.z, maxPos.z);

  object.position.copy(clamped);
  return [clamped.x, clamped.y, clamped.z];
}
  
// This function checks that if an object is stacking on another objext, returns a boolean.
//
function isStacking( object: THREE.Object3D, others: THREE.Object3D[], threshold = 0.01): boolean {
    const objBox = calculateObjectBoxSize(object).box;
  
    for (const other of others) {
      if (other === object) continue;// skip current object.
  
      const otherBox = calculateObjectBoxSize(other).box;
  
      // Check horizontal overlap (x,z)
      const overlapX = objBox.min.x < otherBox.max.x && objBox.max.x > otherBox.min.x;
      const overlapZ =   objBox.min.z < otherBox.max.z && objBox.max.z > otherBox.min.z;
  
      if (overlapX && overlapZ) {
        // Check vertical stacking overlap (obj bottom < other top)
        if (objBox.min.y < otherBox.max.y + threshold && objBox.max.y > otherBox.min.y - threshold) {
          return true; // stacking collision
        }
      }
    }
  
    return false;
  }

//This function is just a general collision test, and checks if an object is inside another object or not.
//
function hasCollisionWithOtherObjects(object: THREE.Object3D, otherObjects: THREE.Object3D[]): boolean {
    const objectBox = calculateObjectBoxSize(object).box;

    for (const other of otherObjects) {
      if (other === object) continue;// skip current object.
  
      const otherBox = calculateObjectBoxSize(other).box;
  
      // Check full 3D box intersection
      if (objectBox.intersectsBox(otherBox)) {
        return true;
      }
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
  otherObjects: THREE.Object3D[]
): boolean {
  const rules = mergeCollisionRules(object.userData.tags);

  // 1. Check inside room boundaries
  if (!isInsideRoom(object, floor)) {
    console.warn("Object is outside room boundaries");
    return false;
  }

  // 2. mustTouchGround: object bottom near floor top
  if (rules.mustTouchGround && !isTouchingGround(object, floor)) {
    console.warn("Object must touch the ground (floor)");
    return false;
  }

    // 3. mustBeOnSurface: object on floor or other surfaces (e.g. furniture)
    if (rules.mustBeOnSurface) {
      // surfaces are floor + furniture objects that can act as surfaces
      const surfaces = [floor, ...otherObjects];
      if (!isOnSurface(object, surfaces)) {
        console.warn("Object must be on a surface");
        return false;
      }
    }

  // 4. mustBeOnWall: object is touching any wall
  if (rules.mustBeOnWall && !isOnWall(object, walls)) {
    console.warn("Object must be on a wall");
    return false;
  }

  // 5. disallowStacking: no vertical overlaps with other objects
  if (rules.disallowStacking && isStacking(object, otherObjects)) {
    console.warn("Object stacking is disallowed");
    return false;
  }

  // 6. Disallow general collisions/clipping with any other objects
  if (hasCollisionWithOtherObjects(object, otherObjects)) {
      console.warn("Object intersects with another object");
      return false;
  }
  
  // If all rules passed
  return true;
}