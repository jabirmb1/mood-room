import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { calculateObjectBoxSize } from '@/utils/object3D';

/****  This hook is used to make objects between target object and camera be invisible/ trasnparent via raycasting****/

type UseOcclusionTransparencyProps = {
  targetRef: React.RefObject<THREE.Object3D>;// reference of the target object that the camera must see and not get obscured.
  potentialOccluders: THREE.Object3D[];// a list of potential three js objects that can obscure the target e.g. objects; walls etc.
  opacity?: number;// if we want to make objects transparent, what opacity to set them with.
  throttleMs?: number;// throttling speed.
  makeInvisible?: boolean;// if we want to use transparency or use invisble.
  sampleCount?: number;// number of rays to fire for accuracy.
};

const STABILITY_FRAMES = 3;// to stop things from flickering we want to e.g. make things inviisble/ visible ( or transparent) every n frames

// generates some rays from the target object's face to the camera, to increase effiecny we only take the rays from the current
// visible part of the object (current front face) to the camera and place n sample rays to get better collision detection.
// rays are placed in a grid format to reduce missing possible occluders.
//
function getFrontalSamplePoints(box: THREE.Box3, camera: THREE.Camera, samples = 12): THREE.Vector3[] {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const offsets: THREE.Vector3[] = [];
  const steps = Math.ceil(Math.sqrt(samples));

  for (let x = 0; x < steps; x++) {
    for (let y = 0; y < steps; y++) {
      const offset = new THREE.Vector3(
        (x / (steps - 1)) * 2 - 1,
        (y / (steps - 1)) * 2 - 1,
        0
      );
      offsets.push(offset);
    }
  }

  const frontalFaceNormal = new THREE.Vector3().subVectors(camera.position, center).normalize();
  const samplePoints: THREE.Vector3[] = [];

  for (const offset of offsets) {
    const point = center.clone()
      .add(frontalFaceNormal.clone().multiplyScalar(size.length() * 0.5))
      .add(new THREE.Vector3(
        offset.x * size.x * 0.25,
        offset.y * size.y * 0.25,
        0
      ));
    samplePoints.push(point);
  }

  return samplePoints;
}

// This function gets an object and see's if it's a descendent/ child of the second object that's passing in (parent)
//
function isDescendantOf(object: THREE.Object3D, parent: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === parent) return true;
    current = current.parent;
  }
  return false;
}

//Traverses up the object hierarchy from a hit object to find the top-level occluder
//from the provided potentialOccluders list.
//
function findOccluderRoot(hit: THREE.Intersection, occluders: THREE.Object3D[]): THREE.Object3D {
  let obj = hit.object;
  while (obj.parent && !occluders.some(o => o.uuid === obj.uuid)) {// compare by uuid for better accuracy.
    obj = obj.parent;
  }
  return obj;
}

// This function will get an object and traverse it's childrent to make it transparent; it will need to be passed a target opacity.
//
function makeTransparent(obj: THREE.Object3D, opacity: number): void {
  obj.traverse((child: any) => {
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat.transparent || mat.opacity !== opacity) {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        }
      });
    }
  });
}

// This function wil just take an object and set it's visible status to false
function makeInvisibleFunc(obj: THREE.Object3D): void {
  obj.traverse((child: any) => {
    child.visible = false;
  });
}

// This function will get an object and depending if it's been transparent or invisble; will reset it and make it opaque again
// (needs to be passed a boolean of whether or not object is visible or not)
//
function resetObject(obj: THREE.Object3D, makeInvisible: boolean): void {
  obj.traverse((child: any) => {
    if (child.material && !makeInvisible) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.needsUpdate = true;
      });
    }
    if (makeInvisible) child.visible = true;
  });
}

/*************** main hook ******************/

// This hooks gets a target reference of the target object and makes sure that it is not being obcscured by other objects or floors/ walls
// from the camera. It uses raycasting by pointing rays from target object back into camera with various number of rays; this makes it
// be more accurate. It also uses throttling to increase performance.
//
export function useOcclusionTransparency({targetRef, potentialOccluders, opacity = 0.2, throttleMs = 100, makeInvisible = false, sampleCount = 12,}: UseOcclusionTransparencyProps) {
  const { camera, scene } = useThree();// current camera that is being used.
  const raycaster = useRef(new THREE.Raycaster());// the raycaster that we will use to fire rays.
  const modifiedObjectsRef = useRef<Set<THREE.Object3D>>(new Set());// keeps track of which objects are transparent/ invisible at a given time.
  const visibilityStability = useRef<Map<THREE.Object3D, number>>(new Map());// keeps track of for how many frames an occluder has been an occluder
  // (used to reduce quick sessions of making objects e.g. trasnparent/ untransparent for better performance.)
  const lastUpdateRef = useRef(0);// how often the raycasting was run


  // function to reset all objects which are either transparent or invisble back to their opaque selves.
  const resetObjects = () => {
    modifiedObjectsRef.current.forEach((obj) => {
      resetObject(obj, makeInvisible);
    });
    modifiedObjectsRef.current.clear();
    visibilityStability.current.clear();
  };

  useEffect(() => resetObjects, []);// we need to always make sure to reset objects back to their opaquesleves on mount/ unmount.



  useFrame(({ clock }) => {
    const now = clock.getElapsedTime() * 1000;
    if (now - lastUpdateRef.current < throttleMs) return;// don't fire ray casters until after the throttling time has ended.
    lastUpdateRef.current = now;// starting a new timer.

    const target = targetRef?.current;
    // if there is no target; qicky reset all objects and return early.
    if (!target) {
      resetObjects();
      return;
    }

    // every frame keep track of occluders; and do raycasting.
    const { box } = calculateObjectBoxSize(target);
    const center = box.getCenter(new THREE.Vector3());
    const frontalPoints = getFrontalSamplePoints(box, camera, sampleCount);// get frontal sample points from the target object to the camera, works for 90% of cases.
    const faceSamples = [center, ...frontalPoints];// also fire rays from center to avoid edge cases where object is right up against 
    // another object, results in rays bieng fired from within other object. leads to false negatives.
    const occluderHitsThisFrame = new Set<THREE.Object3D>();

    for (const point of faceSamples) {
      const directions: [THREE.Vector3, THREE.Vector3, number][] = [
        // array containing, direction, origin, length of raycast. We will fire rays in both directions for more accuracy.
        //(currently only fireing one ray, but if accuracy becomes issue; fire both directions and reduce sample count)

        //NOTE: is performance becomes an issue for phones or weak devices, reduce sample count and not include the camera to target ray.
        [new THREE.Vector3().subVectors(camera.position, point).normalize(), point.clone(), point.distanceTo(camera.position)],// target to camera
       // [new THREE.Vector3().subVectors(point, camera.position).normalize(), camera.position, camera.position.distanceTo(point)],// camera to target
      ];
      for (let [dir, origin, maxDist] of directions) {
        const offsetDistance = 0.01;// offset the distance behind to avoid hitting the target object itself.
        origin = origin.clone().add(dir.clone().multiplyScalar(offsetDistance)); // offset origin a bit
        raycaster.current.set(origin, dir);
        const intersects = raycaster.current.intersectObjects(potentialOccluders, true);
        for (const hit of intersects) {
          if (['LineSegments', 'Line'].includes(hit.object.type)) continue;// skip lines and line segments as they are not occluders. (background helper geometry that's not visible)

          // if the ray hit the target object (or it's child), we continue as we don't want to set the target invisible/ transparent.
          if (isDescendantOf(hit.object, target)) continue;
          
          // if the object's hit distance is less than distance from target object to camera; it means that it is between the
          // points; and hence it is an occluder.
          if (hit.distance < maxDist) {
            const rootOccluder = findOccluderRoot(hit, potentialOccluders);
            if (potentialOccluders.some(o => o.uuid === rootOccluder.uuid)) {
              occluderHitsThisFrame.add(rootOccluder);
            }          
          }
        }
      }

    // for each of the potential occluders we need to check if they are currently occludingl and if they are, for how long
    // (e.g. how many frames).
    potentialOccluders.forEach((obj) => {
      const prevCount = visibilityStability.current.get(obj) || 0;
      const isOccluded = occluderHitsThisFrame.has(obj);
      const newCount = isOccluded ? prevCount + 1 : 0;// if it is still occluding, increase the counter; otherwise reset to 0
      // as now it is no longer occluding.
      visibilityStability.current.set(obj, newCount);

      const alreadyModified = modifiedObjectsRef.current.has(obj);

      // if the object is not already trasnparent/ invisible and the buffer timer has ended; then make the object trasnparent/ invisible
      if (newCount >= STABILITY_FRAMES && !alreadyModified) {
        makeInvisible ? makeInvisibleFunc(obj) : makeTransparent(obj, opacity);
        if (obj !== targetRef?.current) modifiedObjectsRef.current.add(obj); // never add target object in here.
      }

      // if the object is no longer occluding and it is currently invisible/ trasnparent and if the buffer timer just reset; reset object.
      // (make it opaque again).
      if (!isOccluded && alreadyModified && newCount === 0) {
        resetObject(obj, makeInvisible);
        modifiedObjectsRef.current.delete(obj);
      }
    });
  }});
}
