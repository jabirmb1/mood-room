/******** functions relating to the creation and management of cube light beams */

import { isObjectLightOn } from "../../models";
import * as THREE from 'three'
import { getScreenDimensions, getUpdatedScreenDimensions } from "../../models/lightingSystem";
import { LightBeamDimensions } from "./lightBeam";


//function to dynamically create depth of light beam depending on passed in width and height
//
export function createCubeLightBeamDepth(width:number, height: number) : number{
  // simple algorithm for now; mabye extend it later for smaller screens
  const DEPTH_SCALE_FACTOR = 2
  const depth = (width * height) * DEPTH_SCALE_FACTOR
  return depth;
}

//if this mesh is a cubeLightBeam or not
//
export function isCubeLightBeam(mesh: THREE.Object3D): boolean {
  return mesh.userData?.isCubeLightBeam === true;
}

// Returns the host model ref itself (this cube mesh may be attatched to another mesh e.g. tv screen)
// so this function would return the ref that it may be linked to e.g. tv
//
export function getCubeLightBeamHostModelRef(mesh: THREE.Object3D) {
  return mesh.userData.isCubeLightBeam ? (mesh.userData.hostModelRef as React.RefObject<THREE.Object3D | null>) : null;
}

// Update visibility depending if the linked object is 'on' or 'off'
//
export function updateCubeLightBeamVisibility(mesh: THREE.Object3D) {
  const hostModelRef = getCubeLightBeamHostModelRef(mesh);
  mesh.visible = hostModelRef ? isObjectLightOn(hostModelRef.current) ?? false : false;
}


//function to generate the dimensions for the light beam; by passing in a mesh for it to come out of 
// (e.g. screens)
// used for intialisation.
//
export function generateCubeLightBeamDimensions(linkedMesh: THREE.Mesh): LightBeamDimensions | null 
{
  const bbox = getScreenDimensions(linkedMesh)
  if (!bbox) return null;
  const depth = createCubeLightBeamDepth(bbox.width, bbox.height);
  return {width: bbox.width, height: bbox.height, depth}
}

//function to get updated cube light beams (e.g. after initialisation, uses a more optimized approach)
//
export function getUpdatedCubeLightBeamDimensions(linkedMesh: THREE.Mesh): LightBeamDimensions | null 
{
  const bbox = getUpdatedScreenDimensions(linkedMesh)
  if (!bbox) return null;
  const depth = createCubeLightBeamDepth(bbox.width, bbox.height);
  return {width: bbox.width, height: bbox.height, depth}
}