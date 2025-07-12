import React from 'react';
import * as THREE from 'three';
import { RapierRigidBody } from '@react-three/rapier';

// This function just get's a degree and bounds it between -180 degrees and 180 degrees (inclusive), returns bounded degree
//
export function normaliseDegrees(deg: number): number {
    let normalised = deg % 360;
    if (normalised > 180) normalised -= 360;
    if (normalised < -180) normalised += 360;
    return normalised;
}

// This function will take in a rigid body and return it's current rotation in degrees
//
export function getRigidBodyRotation(rigidBodyRef: React.RefObject<RapierRigidBody | null>): {x: number,y: number, z: number} {
    if (!rigidBodyRef.current)return { x: 0, y: 0, z: 0 }; // fallback.

    const rapierQuat = rigidBodyRef.current.rotation();// this is not a THREE.Quaternion so we must convert it
    const quat = new THREE.Quaternion(rapierQuat.x, rapierQuat.y, rapierQuat.z, rapierQuat.w);
    const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
    return {  x: THREE.MathUtils.radToDeg(euler.x), y: THREE.MathUtils.radToDeg(euler.y), z: THREE.MathUtils.radToDeg(euler.z),};
}

// This function will apply a rotation to a rigid body.
//
export function setRigidBodyRotation( body: RapierRigidBody | null, rotation: { x?: number; y?: number; z?: number }) {
    if (!body) return;
  
    // Default to 0 for any undefined rotation component
    const x = THREE.MathUtils.degToRad(rotation.x ?? 0);
    const y = THREE.MathUtils.degToRad(rotation.y ?? 0);
    const z = THREE.MathUtils.degToRad(rotation.z ?? 0);
  
    const euler = new THREE.Euler(x, y, z, 'YXZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);
  
    body.setRotation(quat, true);
  }