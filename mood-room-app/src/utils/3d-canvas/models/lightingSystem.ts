/*** contains logic for how internal lights works on models e.g. lamps, tv screens etc (local to model);
 * won't affect any other object inside scene other than it's repsective model. *******/

import { LightMeshConfig, LightMeshState, LightSourceConfig, LightSystemConfig, LightSystemData, Model } from "@/types/types";
import * as THREE from "three";
import { baseScreenLightIntensity, defaultLightSystemConfig, lightSourceEmissiveMap} from "../const";
import { cacheEmissiveState, createPointLightForMesh, findMeshesByPattern, toggleMeshvisibility } from "../scene/meshes";
import { calculateObjectBoxSize } from "./modelManipulation";
import { getMeshRectangleByPCA } from "../helpers/pca";
import { getLinkedMesh, LightBeamDimensions, updateLightBeamMeshColour, updateLightBeamMeshDimensions } from "../scene/lightBeam/lightBeam";
import { doesLightBeamHaveLightSource, getLightBeamBaseIntensity, updateLightBeamIntensity, updateLightForLightBeam } from "../scene/lightBeam/lights";
import { createCubeLightBeamDepth, getCubeLightBeamHostModelRef, getUpdatedCubeLightBeamDimensions } from "../scene/lightBeam/cubeLightBeam";


// type covering the dimensions of screens inside models
type ScreenDimensions={
  width: number,
  height: number,
  depth: number
}

/***********initialisation functions ***********/

// Discover all meshes in the model based on configuration (e.g. bulbs, screens, fabrics etc)
//
function discoverMeshes(model: THREE.Object3D, config: LightSystemConfig): LightSystemData{
  const lightSources = new Map<string, THREE.Mesh[]>();
  const affectedMeshes = new Map<string, THREE.Mesh[]>();

  // Discover light sources
  for (const sourceConfig of config.lightSources) {
    const meshes = findMeshesByPattern(model, sourceConfig.meshPattern);
    if (meshes.length > 0) {
      lightSources.set(sourceConfig.type, meshes);
    }
  }

  // Discover affected meshes
  for (const meshConfig of config.affectedMeshes) {
    const meshes = findMeshesByPattern(model, meshConfig.meshPattern);
    if (meshes.length > 0) {
      affectedMeshes.set(meshConfig.meshPattern, meshes);
    }
  }

  return {lightSources, affectedMeshes, pointLights: [], cubeLightBeams: [], config};
};

// This function will Initialise default material properties for light source meshes based on the config provided
//
function initialiseSourceMeshes(meshes: THREE.Mesh[], config: LightSourceConfig) {
  for (const mesh of meshes) {
    if (mesh.material instanceof THREE.MeshStandardMaterial && config.defaultMaterial) {
      if (config.defaultMaterial.emissiveColor) {
        mesh.material.emissive.set(config.defaultMaterial.emissiveColor);
      }
      if (config.defaultMaterial.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = config.defaultMaterial.emissiveIntensity;
      }
      mesh.material.needsUpdate = true;
    }
  }
};

// specialised wrapper function to create pointlights for our light emitting models
//
export function createPointLightsForModel(meshes: THREE.Mesh[], config: LightSourceConfig, lightData?: Model['light']): THREE.PointLight[] {
  const pointLights: THREE.PointLight[] = [];

  for (const mesh of meshes) {
    // Merge lightData from model/user with config defaults
    const lightConfig = {
      colour: lightData?.colour || config.pointLightConfig?.color,
      intensity: lightData?.intensity || config.pointLightConfig?.intensity,
      distance: config.pointLightConfig?.distance,
      decay: config.pointLightConfig?.decay,
    };

    const pointLight = createPointLightForMesh(mesh, lightConfig);

    if (pointLight) {
      // store all pointlights in an array
      pointLights.push(pointLight);
    }
  }

  return pointLights;
}


// Main initialisation function for light emitting models
export function initialiseLights(model: THREE.Object3D, lightData?: Model['light'], config: LightSystemConfig = defaultLightSystemConfig): void{
  // Discover all meshes in the model
  const systemData = discoverMeshes(model, config);

  // If no light sources found, mark as non-light object
  if (systemData.lightSources.size === 0) {
    model.userData.light = null;
    return;
  }

  // Initialise light source meshes and create point lights
  for (const [sourceType, meshes] of systemData.lightSources) {
    const sourceConfig = config.lightSources.find(s => s.type === sourceType);
    if (!sourceConfig) continue;

    // Initialise default material properties
    initialiseSourceMeshes(meshes, sourceConfig);

    // Create point lights if needed
    if (sourceConfig.createPointLight) {
      const pointLights = createPointLightsForModel(meshes, sourceConfig, lightData);
      systemData.pointLights.push(...pointLights);// push the pointlights so we can access them faster next time
    }
  }

  // Store light data and system data in model userData

  //use existing light data if it exists; otherwise give it default values
  model.userData.lightSystemData = systemData;// make lightSystemData before calling e.g. hasScreens
  //or other functions (depends on lightSystemData)

  // crude method to determine base intesnity (can be improved later)
  // if model uses a screen; use screen base intensity; otherwise use bulb base intensity
  const baseIntensity = hasScreens(model)? baseScreenLightIntensity: config.defaultIntensity;
  model.userData.light = lightData || {on: false, intensity: baseIntensity, colour: config.defaultColor};
}

/************* functions to update data ************/


// Apply emissive color based on state configuration to the passed in material
//
function applyEmissiveColor( material: THREE.MeshStandardMaterial, state: LightMeshState, lightColour: string): void {
  if (state.emissiveColour === "meshColour") {
    material.emissive.copy(material.color);
  } else if (state.emissiveColour === "lightColour") {
    material.emissive.set(lightColour);
  } else if (typeof state.emissiveColour === "string") {
    material.emissive.set(state.emissiveColour);
  } else {
    material.emissive.copy(state.emissiveColour);
  }
};

// This function will simply apply a default mesh state to the passed in meshes; can also be used to update them
//This function will be used for the light meshes of models (meshes which behaves differently depedning if internal)
// model light is turned on/ off
//
function applyMeshState(meshes: THREE.Mesh[], config: LightMeshConfig, isOn: boolean, lightColour: string): void {
  const state = isOn ? config.on : config.off;

  for (const mesh of meshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat) continue;

    applyEmissiveColor(mat, state, lightColour);

    mat.emissiveIntensity = state.emissiveIntensity;
    cacheEmissiveState(mat)

    // add in the extra mesh specific behavaiour/ attributes if provided.
    if (state.transparent !== undefined) mat.transparent = state.transparent;
    if (state.opacity !== undefined) mat.opacity = state.opacity;
    if (state.metalness !== undefined) mat.metalness = state.metalness;
    if (state.roughness !== undefined) mat.roughness = state.roughness;

    mat.needsUpdate = true;
  }
};


//This function will update the pointlights which are attatched to the model
//
function updatePointLights (model: THREE.Object3D, pointLights: THREE.PointLight[], lightData: Model['light']): void {
  // get max dimensions for object so we can allow the lights to accuractly scale based on model size
  if (!lightData || !pointLights) return;
  const { maxDim } = calculateObjectBoxSize(model);
  const scaledIntensity = lightData.intensity * Math.pow(maxDim, 0.5);

  // update every single light
  for (const light of pointLights) {
    light.color.set(lightData.colour);
    light.intensity = lightData.on ? scaledIntensity : 0;
    light.visible = lightData.on;
  }
};


// Update affected light meshes of light emitting models.
//
function updateAffectedMeshes(systemData: LightSystemData,lightData: Model['light']): void {
  if (!lightData) return;
  // for each type of light meshes; update them based on the passed in lightData
  for (const meshConfig of systemData.config.affectedMeshes) {
    const meshes = systemData.affectedMeshes.get(meshConfig.meshPattern);
    if (!meshes) continue;

    applyMeshState(meshes, meshConfig, lightData.on, lightData.colour);
  }
};


// Update light source meshes (bulbs, screens, etc.)
//
function updateLightSources(systemData: LightSystemData, lightData: Model['light']): void{
  if(!lightData) return

  for (const [sourceType, meshes] of systemData.lightSources) {
    const sourceConfig = systemData.config.lightSources.find(s => s.type === sourceType);
    // there is no light source here; so move onto next light source
    if (!sourceConfig) continue;
   // console.log('source config is', sourceConfig)

    for (const mesh of meshes) {
      // pass in our light source mesh to return the correct emissive value
      const emissiveIntensity = getLightSourceEmissiveValue(mesh)
      // convert into array for a more universal way to handle materials
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.set(lightData.on ? lightData.colour : '#000000');
          mat.emissiveIntensity = lightData.on ? emissiveIntensity: 0
          mat.needsUpdate = true;
          // make sure to cache the light source matierial's emissive state
          cacheEmissiveState(mat)
        }
      }
    }
  }
};


// Main update function to update everything that is needed for a light emitting model to emit light
//
export function updateAllLights(model: THREE.Object3D, lightData: Model['light']): void {
  const systemData = model.userData.lightSystemData as LightSystemData;
  if (!lightData || !systemData) return;

  // update everyhting relating to lights for that specific model here 
  updatePointLights(model, systemData.pointLights, lightData);
  updateAffectedMeshes(systemData, lightData);

  // if the object has a three.js light; update it.
  if (hasAnyThreeLights(model))
  {
    updateLightSources(systemData, lightData);
  }

  // if the model has a screen; then it has a volumetricLightBeam mesh
  // update it.
  if (hasScreens(model))
  {
        
      toggleCubeLightBeamsvisibility(systemData, lightData.on)
      const lightBeams = getCubeLightBeams(model)// can extend this to other shapes as well
      if (!lightBeams) return
      updateAllLightBeamColours(lightBeams, new THREE.Color(lightData.colour))
      updateAllLightBeamDimensions(model)
      updateAllLightBeamIntensity(lightBeams, lightData.intensity)
      
  }

  // Update stored light data
  if (model.userData.light) {
    Object.assign(model.userData.light, lightData);
  }
};


/************* light beam management ***********/
//function to update systems data to add/ remove the external cube beams:
//
export function updateCubeLightBeamsArray(systemData: LightSystemData | null, action: "add" | "remove", beam: THREE.Mesh): void {
  if (!systemData) return
  if (action === "add") {
    if (!systemData.cubeLightBeams.includes(beam)) {
      systemData.cubeLightBeams.push(beam);
    }
  } else if (action === "remove") {
    systemData.cubeLightBeams = systemData.cubeLightBeams.filter(m => m !== beam);
  }
}

// function to toggle visibility status of all cube volumetricLightMeshes.
//
export function toggleCubeLightBeamsvisibility(systemData: LightSystemData, visibility: boolean)
{
  for (const lightBeam of systemData.cubeLightBeams)
  {
    toggleMeshvisibility(lightBeam, visibility)
  }
}

// function to update a light beam's colour.
//
function updateLightBeamColour(lightBeam: THREE.Mesh, colour: THREE.Color){
  updateLightBeamMeshColour(lightBeam, colour)
}

// function to take in an array of light beam meshs (volumetric light meshes)
//  and update their light beam's colour
//
function updateAllLightBeamColours(lightBeams: THREE.Mesh[], colour: THREE.Color = new THREE.Color('#ffffff')){
  for (const lightBeam of lightBeams)
  {
    if (lightBeam)
    {
      updateLightBeamColour(lightBeam, colour)
    }
  }
}

//function to update a lightBeam's size.
//
export function updateLightBeamSize(lightBeam: THREE.Mesh, newScale: number)
{
  // don't use scale factor; just update dimensions
  lightBeam.scale.set(newScale, newScale, newScale)
}

// function to upate all light's scale at once.
//
export function updateAllLightBeamSizes(lightBeams: THREE.Mesh[], newScale: number)
{
  // don't use scale factor; just update dimensions
  if (!lightBeams) return
  for (const lightBeam of lightBeams)
  {
    updateLightBeamSize(lightBeam, newScale)
  }
}

// function to update all light's intensities at once:
//
export function updateAllLightBeamIntensity(lightBeams: THREE.Mesh[], intensity: number)
{
  if (!lightBeams) return
  for (const lightBeam of lightBeams)
  {
    updateLightBeamIntensity(lightBeam, intensity)
  }
}

// Helper function to calculate the start offset for a light beam based on its linked mesh
function calculateLightBeamStartOffset(linkedMesh: THREE.Mesh, beamDepth?: number): {
  localPosition: [number, number, number]; startOffset: number;} {
  
    // Get the mesh's local bounding box geometry bounds, so we can correctly place beam in front of linked mesh
  linkedMesh.geometry.computeBoundingBox();
  const meshBBox = linkedMesh.geometry.boundingBox;
  const epsilon = -0.1// due to some precison issues; screen starts too forward; so we will use a negative
  // buffer to push back into the screen
  
  if (!meshBBox) {
    // Fallback position if bounding box calculation fails
    const fallbackDepth = beamDepth || 1;

    // position beam so that it starts at the front of the linked mesh
    return {localPosition: [0, 0, fallbackDepth / 2 + 0.1],startOffset: fallbackDepth / 2 + epsilon};
  }
  
  // Use provided depth or calculate default offset
  const depthForOffset = beamDepth || 1;
  
  // The light beam geometry is centered, so its back face is at -depth/2
  // We need to position the beam so its back face (-depth/2) starts at the screen's front face
  // Therefore: beam_center_z = screen_front_z + depth/2 + small_buffer
  
  const screenFrontZ = meshBBox.max.z;
  const beamCenterZ = screenFrontZ + (depthForOffset / 2) + epsilon; // Small buffer to prevent z-fighting
  
  // Position relative to the screen mesh (local coordinates)
  const localPosition: [number, number, number] = [0,  0, beamCenterZ];
  
  return {localPosition, startOffset: beamCenterZ};
}


// Updated function to generate light beam dimensions and position
export function generateCubeLightBeamDimensionsAndPosition(linkedMesh: THREE.Mesh): {
  dimensions: LightBeamDimensions; position: [number, number, number]} | null {
  const bbox = getScreenDimensions(linkedMesh)
  if (!bbox) return null;
  
  const depth = createCubeLightBeamDepth(bbox.width, bbox.height);
  const dimensions = { width: bbox.width, height: bbox.height, depth };
  
  // Calculate position using helper function
  const { localPosition } = calculateLightBeamStartOffset(linkedMesh, depth);  
  return { dimensions, position: localPosition };
}

//  function for the lighting system to update light beam positions
//
export function updateAllLightBeamPositions(model: THREE.Object3D): void {
  const lightBeams = getCubeLightBeams(model);
  if (!lightBeams) return;

  for (const lightBeam of lightBeams) {
    const linkedMesh = getLinkedMesh(lightBeam);
    if (linkedMesh) {
      // Get current light beam depth from its geometry
      const geom = lightBeam.geometry as THREE.BoxGeometry;
      const currentDepth = geom ? geom.parameters.depth * lightBeam.scale.z : 1;
      
      // Calculate position using helper function
      const { localPosition } = calculateLightBeamStartOffset(linkedMesh, currentDepth);
      
      lightBeam.position.set(localPosition[0], localPosition[1], localPosition[2]);
      }
  }
}

// function to update all light beam dimensions (width, height, depth) based on their linked meshes
// also makes sure to update the position of the light beam as well so that it stays in front of the 
// linked mesh.
//
export function updateAllLightBeamDimensions(model: THREE.Object3D): void {
  const lightBeams = getCubeLightBeams(model);
  if (!lightBeams) return;

  for (const lightBeam of lightBeams) {
    const linkedMesh = getLinkedMesh(lightBeam);
    if (linkedMesh) {
      const dimensions = getUpdatedCubeLightBeamDimensions(linkedMesh);// extend this later to other shapes as well
      if (dimensions) {
        // Update dimensions
        updateLightBeamMeshDimensions(lightBeam, dimensions);
        
        // Update position using helper function
        const { localPosition } = calculateLightBeamStartOffset(linkedMesh, dimensions.depth);
        
        lightBeam.position.set(localPosition[0], localPosition[1], localPosition[2]);
        // also update the light beam's spotlight position if it has one
        updateLightForLightBeam(lightBeam);
      }
    }
  }
}



//This function will be used to check if a light beam is 'connected' to the passed in object
// since light beams are not children of objects; they are connected via references in userdata
// we will use that check for the comparison.
//
export function isLightBeamConnectedToObject(lightBeam: THREE.Object3D | null, 
  object: THREE.Object3D | null) : boolean{
  if (!lightBeam || !object) return false
  const host = getCubeLightBeamHostModelRef(lightBeam)?.current;// TO DO: swap to general light beam
  if (!host) return false;
  return host.uuid === object.uuid// use the uuids for an accurate comparison
}

/******* geometry helpers ********/

// Returns the screen dimensions approximated as a rectangle (width, height, depth). 
// The rectangle is independent of the mesh’s rotation.
// We use PCA to compute the rectangular bounds because:
// - Screen meshes may have inconsistent local orientations.
// - World bounding boxes would change when rotating.
// - Local bounding boxes may mix up width, height, and depth due to inconsistent formatting in Blender/Maya.
// 
// alternative: Potential use face normal analysis to find the rectangular dimensions
export function getScreenDimensions(mesh: THREE.Mesh) {
  const dimensions = getMeshRectangleByPCA(mesh);
  if (!dimensions) return null;

  // Get the mesh’s world scale (includes global scale)
  const worldScale = new THREE.Vector3();
  mesh.getWorldScale(worldScale);

  // Store normalised base dimensions in userData
  // - Allows consistent scaling across multiple instances of the same model type.
  // - Base dimensions remain independent of the mesh’s current scale.
  mesh.userData.dimensions = {
    width: dimensions.width / worldScale.x,
    height: dimensions.height / worldScale.y,
    depth: dimensions.depth / worldScale.z,
  } as ScreenDimensions;

  return {
    width: dimensions.width,
    height: dimensions.height,
    depth: dimensions.depth,
  };
}

// function to get updated screen dimensions instead of recalculating new dimensions:
//
export function getUpdatedScreenDimensions(mesh: THREE.Mesh) {
  const base = mesh.userData.dimensions as ScreenDimensions;
  // if the userdata does not exist; then just reinitialise the user data via the get Screen Dimensions
  // function; also return it's result.
  if (!base) {
    return getScreenDimensions(mesh);
  }

  const worldScale = new THREE.Vector3();
  mesh.getWorldScale(worldScale);

  // we want to include the world scale; so that it fits our scene predticably (using world scale,
  // in case the mesh is a apart of a multi mesh model)
  return {
    width: base.width * worldScale.x,
    height: base.height * worldScale.y,
    depth: base.depth * worldScale.z,
  };
}

/***********getters  and queries*************/


// function to get the correct emissive value depending on mesh name (has a fallback)
//
function getLightSourceEmissiveValue(mesh: THREE.Mesh)
{
   // Try to find a matching key from the mesh's name
   const key = Object.keys(lightSourceEmissiveMap).find(k => mesh.name.includes(k)) as keyof typeof lightSourceEmissiveMap | undefined;

   // If found, return its value; otherwise return the default
   return key ? lightSourceEmissiveMap[key] : lightSourceEmissiveMap.default
}

//function to get the lightSystem Data from the object's userData.
//
export function getLightSystemData(object: THREE.Object3D | null): LightSystemData | null{
  if (!object || !object.userData.lightSystemData) {
    return null
  }

  return object.userData.lightSystemData as LightSystemData;
};

export function isObjectLight(objectRef: React.RefObject<THREE.Object3D | null>): boolean {
  const model = objectRef.current;
  if (!model) return false;
  return model.userData.light !== null; // if lights userdata is null; object cannot produce light
}

export function getObjectLightIntensity(object: THREE.Object3D | null): number | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light.intensity;
}

export function isObjectLightOn(object: THREE.Object3D | null): boolean | null {
  if (!object || !object.userData?.light) return null;
  return object.userData.light.on;
}

export function getObjectLightColour(object: THREE.Object3D | null): string | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light.colour;
}

export function getObjectLightData(object: THREE.Object3D | null): Model['light'] | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light; // null or a lights object
}

//Helper function to check if object has any pointlights
//
export function hasPointLightSources(object: THREE.Object3D | null): boolean{
  if (!object?.userData.lightSystemData) return false;
  
  const systemData = object.userData.lightSystemData as LightSystemData;
  return systemData.pointLights.length > 0;
};

// helper function to check if a a screen type object has any light sources.
//
export function hasScreenLightSources(object: THREE.Object3D | null): boolean{
  if (!object?.userData.lightSystemData) return false;

  // screen type objects' have their light sources stored in their seperate light beam mesh;
  // so get it from there.
  const lightBeams = getCubeLightBeams(object);
  for (const beam of lightBeams ?? [])
  {
    // if any of the light beams has a spotlight on it; return true.
    if (doesLightBeamHaveLightSource(beam)) return true
  }
  return false;
}


// Helper function to check if object has any screens.
//
export function hasScreens(object: THREE.Object3D | null): boolean {
  if (!object?.userData.lightSystemData)return false;
  const lightSystemData = object.userData.lightSystemData as LightSystemData;
  const screens = lightSystemData.lightSources.get('screen');
  // Return true if the Map has a 'screen' key and the array has at least one mesh
  return Array.isArray(screens) && screens.length > 0;
}

//Function to get the array of screen meshes.
//
export function getScreens(object: THREE.Object3D | null) :THREE.Mesh[] | null{
  if(!object || !hasScreens(object)) return null;
  const lightSystemData = object.userData.lightSystemData as LightSystemData;
  return lightSystemData.lightSources.get('screen') ?? null;
}

//helper function to get the entire array of the cube light beam meshes.
export function getCubeLightBeams(object: THREE.Object3D | null) :THREE.Mesh[] | null{
  if(!object || !hasScreens(object)) return null;
  const lightSystemData = object.userData.lightSystemData as LightSystemData;
  return lightSystemData.cubeLightBeams ?? null;
}
// function to get every single light beam associated with an object (not just cube light beams)
//
export function getObjectLightBeams(object: THREE.Object3D | null): THREE.Mesh[] | null{
  const lightBeams = getCubeLightBeams(object); // extend to other light beam shapes.
  return lightBeams
}

// Helper function to check if object has any light sources at all; this also includes e.g. screens
// (at this point in time screens doesn't have a three.js light linked to it yet)
//
export function hasAnyLightSources(object: THREE.Object3D | null): boolean{
  if (!object?.userData.lightSystemData) return false;
  
  const systemData = object.userData.lightSystemData as LightSystemData;
  return systemData.lightSources.size > 0;
};

//Helper function to check if model has any three.js lights to update
//
export function hasAnyThreeLights(object: THREE.Object3D | null): boolean{
  // extend this for other light sources that models may have e.g. spotlight; 
  let hasLights = false;
  hasLights = hasPointLightSources(object) || hasScreenLightSources(object)
  return hasLights//e.g. extend this code by:  | hasSpotLightSources(object)
}

// function to get a model's base light intensity (depending on what config a particular model has)
//
export function getModelBaseLightIntensity(object: THREE.Object3D | null): number {
  const defaultIntensity = defaultLightSystemConfig.defaultIntensity
  if (!object?.userData.lightSystemData) return defaultIntensity;

  // if a model has a screen; then it works a bit differently; grab base intensity from light beam
  //
  if (hasScreens(object))
  {
    const lightBeams = getCubeLightBeams(object);
    if (lightBeams && lightBeams.length > 0)
    {
      return getLightBeamBaseIntensity();
    }
    return defaultIntensity;// if no valid light beams; return default intensity
    // light beams all share same intensity so just grab the first one.
  }
  const systemData = object.userData.lightSystemData as LightSystemData;

   // Otherwise, check if any lightSources have pointLightConfig.intensity defined
   // (our current only other light source type is bulb, we can extend this later)
  for (const sourceConfig of systemData.config.lightSources) {
    if (sourceConfig.pointLightConfig?.intensity !== undefined) {
      return sourceConfig.pointLightConfig.intensity;
    }
  }

  return defaultIntensity; // fallback to default intensity
}