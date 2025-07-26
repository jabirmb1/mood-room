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


// This function will rotate the selected body to face the same direction as the other rigid body which is passed in
// e.g. it will make rigidBodyA face the same direction as rigidBodyB
//
export function matchRigidBodyRotation(rigidBodyA : RapierRigidBody, rigidBodyB: RapierRigidBody)
{

  console.log('trying to match rotations:', rigidBodyA.rotation(), rigidBodyB.rotation());
  const targetRotation = rigidBodyB.rotation();
  if (rigidBodyA.rotation() !== targetRotation) rigidBodyA.setRotation(targetRotation, true)
}

// This function will get passed in a rigid body and see if it's a wall or not via tags in user data
// (pre conditions: in the rigid body user data there is a tags object which might have walls)
//
export function isWall(rigidBody: RapierRigidBody)
{
  if (rigidBody.userData?.tags.includes('wall'))
  {
    return true
  }
  return false
}