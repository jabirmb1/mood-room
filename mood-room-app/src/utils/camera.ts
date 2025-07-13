import * as THREE from 'three';
import { calculateObjectBoxSize } from './object3D';
import { RapierRigidBody } from '@react-three/rapier';
/******** This file handles all logic relating to the camera **********/


// This function just computes and returns the final position of where the camera should stop at, given an object.
// if no object is present, then it will just reset the camera.

export function computeCameraTargetPositions( rigidBody: RapierRigidBody | null, object: THREE.Object3D | null,resetPosition: [number, number, number],
   cameraXOffset: number = 0, zoomOffset: number = 0) {
  const desiredCameraPos = new THREE.Vector3();
  const desiredLookAt = new THREE.Vector3();

  if (object && rigidBody) {
     // grab the box dimension so we can calculate the distance.
    const { center, maxDim } = calculateObjectBoxSize(object);
    const margin = 1.5; // margin so that the object fits nicely in view.
    const distance = (maxDim * margin) + zoomOffset;// add in the zoom offset here to move back camera if needed

      // Get the rigid body's rotation as a THREE.Quaternion
      const bodyRotation = rigidBody.rotation(); 
      const quaternion = new THREE.Quaternion( bodyRotation.x,  bodyRotation.y, bodyRotation.z,  bodyRotation.w);

    // Vector from object to camera (forward direction) (i.e camera always faces object's front)
    const front = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(quaternion)
      .normalize()
      .multiplyScalar(distance);

    // Camera base position = in front of object center
    desiredCameraPos.copy(center).add(front);
    desiredCameraPos.y = center.y; // eye-level view

    // Calculate the "right" vector in world space so we can apply our x axis offset.
    const cameraDirection = new THREE.Vector3().subVectors(center, desiredCameraPos).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(worldUp, cameraDirection).normalize();

    // Apply offset to camera position AND lookAt, to shift whole view left/right without distorting front view
    // (e.g. looking at object from an angle)
    desiredCameraPos.addScaledVector(right, cameraXOffset);
    desiredLookAt.copy(center).addScaledVector(right, cameraXOffset);
  } 
  else {
    desiredCameraPos.set(...resetPosition);
    desiredLookAt.set(0, 0, 0);
  }

  return { desiredCameraPos, desiredLookAt };
}