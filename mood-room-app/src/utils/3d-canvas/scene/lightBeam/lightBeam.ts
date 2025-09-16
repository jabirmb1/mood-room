/**functions that can relate to any type of light beams */
import * as THREE from 'three'
import { isCubeLightBeam, updateCubeLightBeamVisibility } from './cubeLightBeam';

export type LightBeamDimensions={
  width: number;
  height:number;
  depth: number;
}

/*****light beam initialisation functions *****/

//function to add in general light beam specific userdata to a light beam
// we will add in the reference to the light beam's host model (e.g. if light beam is attatched to a 
//primitive model or not)
// we will also add in a reference to the specific mesh that the light beam should be attatched to
//
export function addLightBeamUserData(lightBeam: THREE.Mesh, hostModelRef: React.RefObject<THREE.Object3D | null>, linkedMesh: THREE.Object3D | null)
{
    // if the passed in values are not null; then assign their userData
    if (hostModelRef.current)
    {
        lightBeam.userData.hostModelRef = hostModelRef;
    }
   
    if (linkedMesh)
    {
        lightBeam.userData.linkedMesh = linkedMesh;
    }
}


/*******helpers to calculate values *********/

// Calculate beam origin position (back of the beam) based on mesh position and depth
export function calculateBeamOriginPosition(mesh: THREE.Mesh, depth: number): THREE.Vector3 {
  // Origin is one beam length behind the mesh position
  return mesh.position.clone().add(new THREE.Vector3(0, 0, -depth));
}

// Calculate beam target position (front of the beam)
export function calculateBeamTargetPosition(mesh: THREE.Mesh, depth: number): THREE.Vector3 {
  // Target is one beam length in front of the mesh position
  return mesh.position.clone().add(new THREE.Vector3(0, 0, depth));
}

/*******functions to update light beam ***********/

// function to update the lightBeams colour:
//
export function updateLightBeamMeshColour(lightBeam: THREE.Mesh, colour: THREE.Color) {
  const mat = lightBeam.material as THREE.ShaderMaterial;
  if (mat && mat.uniforms && mat.uniforms.uColour) {
    mat.uniforms.uColour.value.copy(colour);
  }
}


// function to update the light beam dimensions
//
export function updateLightBeamMeshDimensions(lightBeam: THREE.Mesh,dimensions: LightBeamDimensions) {
    const { width, height, depth } = dimensions;
    if (!lightBeam) return;
  
    // Get the original geometry parameters to calculate proper scaling
    const geom = lightBeam.geometry as THREE.BoxGeometry;
    if (!geom || !geom.parameters) return;
  
    // Calculate scale factors based on original geometry dimensions
    const scaleX = width / geom.parameters.width;
    const scaleY = height / geom.parameters.height;
    const scaleZ = depth / geom.parameters.depth;
  
    // Apply scaling to the mesh
    lightBeam.scale.set(scaleX, scaleY, scaleZ);
  
    // Update material uniforms with the TARGET dimensions (not scaled by mesh scale)
    const mat = lightBeam.material as THREE.ShaderMaterial;
    if (mat && mat.uniforms) {
      // Use the original geometry dimensions for shader calculations
      // The shader will work with these base dimensions, and mesh scaling handles the visual size
      if (mat.uniforms.uWidth) mat.uniforms.uWidth.value = geom.parameters.width;
      if (mat.uniforms.uHeight) mat.uniforms.uHeight.value = geom.parameters.height;
      if (mat.uniforms.uFadeLength) mat.uniforms.uFadeLength.value = geom.parameters.depth;
      mat.needsUpdate = true;
    }
  
    lightBeam.updateMatrix();
}

// function to update any light beam visability status (of light beams attatched to models)
//
export function updateModelLightBeamVisability(object: THREE.Object3D)
{
    // we want to update visability status depending on what type it is:
    // if it's not even a light beam; then return
    if (!isLightBeam(object)) return

    if (isCubeLightBeam(object))
    {
        updateCubeLightBeamVisibility(object)
    }
    // extend to other types later
}

/*********getters */

// Extract beam geometry parameters
export function getBeamGeometryParams(lightBeamMesh: THREE.Mesh) : LightBeamDimensions | null {
  const geometry = lightBeamMesh.geometry as THREE.BoxGeometry;
  if (!geometry || !geometry.parameters) {
    return null;
  }
  
  return {
    width: geometry.parameters.width * lightBeamMesh.scale.x,
    height: geometry.parameters.height * lightBeamMesh.scale.y,
    depth: geometry.parameters.depth * lightBeamMesh.scale.z
  };
}

// Get spread parameter from beam material
export function getBeamSpreadParameter(lightBeamMesh: THREE.Mesh): number {
    const material = lightBeamMesh.material as THREE.ShaderMaterial;
    return material?.uniforms?.uSpread?.value || 2.0;
}

//function to return what mesh lightBeam linked to (if at all); otherwise returns null
//
export function getLinkedMesh(lightBeam: THREE.Object3D): THREE.Mesh | null{
  if (lightBeam.userData.linkedMesh)
  {
    const mesh = lightBeam.userData.linkedMesh as THREE.Mesh | null
    return mesh
  }
  return null
}
  
// whether or not this object is a light beam or not
//
export function isLightBeam(object: THREE.Object3D)
{
    return isCubeLightBeam(object);// extend this to other types
}