/*************** utlity function to store general functions that can relate to any three js mehses */

import * as THREE from 'three'
// Helper function to cache material emissive state
//
export function cacheEmissiveState(material: THREE.MeshStandardMaterial): void {
    material.userData.cachedEmissive = {
      color: material.emissive.clone(),
      intensity: material.emissiveIntensity
    };
}

// Helper function to restore material emissive state
//
export function restoreEmissiveState(material: THREE.MeshStandardMaterial): void {
  const cached = material.userData.cachedEmissive;
  if (cached) {
   // console.log('trying to use cache:', cached)
    material.emissive.copy(cached.color);
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
//
export function createPointLightForMesh(mesh: THREE.Mesh, config = { color: '#ffffff', intensity: 0, distance: 10, decay: 2 }): THREE.PointLight | null {
  try {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Convert world center to local space of mesh
    mesh.worldToLocal(center);
    
    const light = new THREE.PointLight(config.color, config.intensity, config.distance, config.decay);
    light.position.copy(center);
    mesh.add(light);// add it to the mesh; so the light moves with the mesh.
    
    return light;
  } catch (error) {
    console.error('Error creating light for bulb mesh:', error);
    return null;
  }
}
