import * as THREE from 'three';
import { calculateObjectBoxSize } from './object3D';
/******** This file handles all logic relating to the camera **********/

// This function just computes and returns the final position of where the camera should stop at, given an object.
// if no object is present, then it will just reset the camera.
export function computeCameraTargetPositions( object: THREE.Object3D | null, resetPosition: [number, number, number]) {
  const desiredCameraPos = new THREE.Vector3();// target position to go to
  const desiredLookAt = new THREE.Vector3();// which face to look at.
  const zoomOffset = -1;// how much to zoom the camera into the object (- makes it go closer, + makes camera further)

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
  }
  else {
    desiredCameraPos.set(...resetPosition);
    desiredLookAt.set(0, 0, 0);
  }

  return { desiredCameraPos, desiredLookAt };
}
