import * as THREE from 'three';
import { calculateObjectBoxSize } from './object3D';
/******** This file handles all logic relating to the camera **********/


// This function just computes and returns the final position of where the camera should stop at, given an object.
// if no object is present, then it will just reset the camera.
export function computeCameraTargetPositions( object: THREE.Object3D | null, resetPosition: [number, number, number],
   cameraXOffset: number = 0, zoomOffset: number = 0 ) {
  const desiredCameraPos = new THREE.Vector3();// target position to go to
  const desiredLookAt = new THREE.Vector3();// which face to look at.

  if (object) {
    // grab the box dimension so we can calculate the distance.
    const {center, maxDim} = calculateObjectBoxSize(object);
    const margin = 1.5// margin so that the object fits nicely in view.
    const distance = maxDim * margin;
    const front = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(object.quaternion)
      .normalize()
      .multiplyScalar(distance);

    desiredCameraPos.copy(object.position).add(front);
    desiredCameraPos.y = center.y; // Align camera Y to object center (eye level)
    desiredCameraPos.z += zoomOffset// zoom into object slightly more

    desiredLookAt.copy(center);
    desiredLookAt.x += cameraXOffset; // add any offsets when needed.
  }
  else {
    desiredCameraPos.set(...resetPosition);
    desiredLookAt.set(0, 0, 0);
  }

  return { desiredCameraPos, desiredLookAt };
}
