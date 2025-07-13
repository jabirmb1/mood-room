import { RapierRigidBody} from "@react-three/rapier";
import * as THREE from "three";

// This function gets position from either a RapierRigidBody instance or THREE.Object3D instance
export function getPosition(obj: RapierRigidBody | THREE.Object3D): THREE.Vector3 {
  if (!obj) return new THREE.Vector3();
  if ("translation" in obj) {
    // RapierRigidBody instance
    const currentPos = obj.translation();
    return new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
  }
  // THREE.Object3D instance
  return (obj as THREE.Object3D).position.clone();
}

// This function sets position on either a RapierRigidBody instance or THREE.Object3D instance
export function setPosition(obj: RapierRigidBody | THREE.Object3D, newPos: THREE.Vector3) {
  if (!obj) return;
  if ("setNextKinematicTranslation" in obj) {
    obj.setNextKinematicTranslation(newPos);
  } else {
    (obj as THREE.Object3D).position.copy(newPos);
  }
}