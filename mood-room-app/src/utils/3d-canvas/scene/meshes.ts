/*************** utlity function to store general functions that can relate to any three js mehses */

import * as THREE from 'three'
import { calculateObjectBoxSize } from '../models';

//some constance that will be used to fine tune creation and updates of pointlights on meshes.

export const POINTLIGHT_DISTANCE_SCALE_FACTOR = 2;   // how much to scale distance relative to model size
// increasing value = larger light radius; decreasing = smaller light radius.

export const POINTLIGHT_MIN_DECAY = 1.0;                // lowest allowed decay value
// increase value = faster fall off (sharper light); decrease = smaller/ fainter halo.

export const POINTLIGHT_DECAY_SCALE_EXPONENT = 0.5;     // n root scaling for decay softness
// increase value =  more aggressive decay scaling as model grows (shrinks outer halo for large models).
// decrease value = gentler scaling, outer halo grows more with larger models.

export const POINTLIGHT_CONFIG_DECAY = 1.8;// default values for pointlight's decay value
export const POINTLIGHT_CONFIG_DISTANCE = 6// default values for pointLight's distance value

type pointLightConfig={
  colour?: string;
  intensity?: number;
  distance?: number;
  decay?: number;
}

// Default config values to create a pointlight
const DEFAULT_POINTLIGHT_CONFIG: Required<pointLightConfig> = {
  colour: '#ffffff',
  intensity: 1,
  distance: POINTLIGHT_CONFIG_DISTANCE,
  decay: POINTLIGHT_CONFIG_DECAY,
};

// Helper function to cache material emissive state
//
export function cacheEmissiveState(material: THREE.MeshStandardMaterial): void {
    material.userData.cachedEmissive = {
      colour: material.emissive.clone(),
      intensity: material.emissiveIntensity
    };
}

// Helper function to restore material emissive state
//
export function restoreEmissiveState(material: THREE.MeshStandardMaterial): void {
  const cached = material.userData.cachedEmissive;
  if (cached) {
   // console.log('trying to use cache:', cached)
    material.emissive.copy(cached.colour);
    material.emissiveIntensity = cached.intensity;
  } else {
    // Fallback to no emission if no cached state
    material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
  }
}


// Helper function to find meshes by name pattern
// just finds all meshes that has a name that includes the passed in patter and returns an array of meshes.
//
export function findMeshesByPattern(object: THREE.Object3D, pattern: string): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child: any) => {
    if (child.isMesh && child.name.toLowerCase().includes(pattern.toLowerCase())) {
      meshes.push(child);
    }
  });
  return meshes;
}

// Helper function to create a single point light attatched to a singular mesh.
// NOTE: distance/decay are accepted for completeness but will be 
// overridden during runtime updates for our models (inside updateAllLights function)
//
export function createPointLightForMesh(mesh: THREE.Mesh, config: pointLightConfig={}): THREE.PointLight | null {
  try {

    // merge config with default and passed in values.
   const finalConfig: Required<pointLightConfig> = { ...DEFAULT_POINTLIGHT_CONFIG,  ...config };

    // Initialize distance and decay based on the config.
    let distance = finalConfig.distance;
    let decay = finalConfig.decay;
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Convert world center to local space of mesh
    mesh.worldToLocal(center);
    const light = new THREE.PointLight(finalConfig.colour, finalConfig.intensity, distance, decay); 
    light.position.copy(center);
    mesh.add(light);// add it to the mesh; so the light moves with the mesh.
    
    return light;
  } catch (error) {
    console.error('Error creating light for bulb mesh:', error);
    return null;
  }
}