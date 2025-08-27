/*****This file will be used to create helper functions to compare one object/ array to another */

import { Model, RotationDegrees } from "@/types/types";
import * as THREE from "three";


// This function checs if two rotation objects are equal or not; returns a boolean:
// we add a small episolon as well since a slight difference in rotation is negligible
//
export function areRotationsEqual( a: RotationDegrees, b: RotationDegrees, epsilon = 0.001) {
    return (
        Math.abs(a.x - b.x) < epsilon &&
        Math.abs(a.y - b.y) < epsilon &&
        Math.abs(a.z - b.z) < epsilon
    );
}

// function to check if vectors are equal or not:
//
export function areVectorsEqual(a: THREE.Vector3, b: THREE.Vector3,epsilon = 0.001): boolean {
    return (
      Math.abs(a.x - b.x) < epsilon &&
      Math.abs(a.y - b.y) < epsilon &&
      Math.abs(a.z - b.z) < epsilon
    );
}

// function to check if object lights are equal or not:
export function areLightDataEqual(
    lightData1: Model['light'] | null,
    lightData2: Model['light'] | null
  ): boolean {
    // both null => equal
    if (!lightData1 && !lightData2) return true;
    // only one null => not equal
    if (!lightData1 || !lightData2) return false;
  
    // compare with tolerance for floats
    const intensityEqual =
      Math.abs((lightData1.intensity ?? 0) - (lightData2.intensity ?? 0)) < 1e-3;
  
    // normalise colours for comparison
    const normaliseColour = (c: string) =>
      new THREE.Color(c).getHexString(); // gives lowercase hex string like 'ffffff'
  
    return (
      lightData1.on === lightData2.on &&
      intensityEqual &&
      normaliseColour(lightData1.colour ?? '') === normaliseColour(lightData2.colour ?? '')
    );
  }
  
  
export function deepEqual<T extends Record<string, any>>(a: T, b: T): boolean {
    if (a === b) return true;// if they point to same object then return true
    // otherwise compare every key
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => a[key] === b[key]);
}