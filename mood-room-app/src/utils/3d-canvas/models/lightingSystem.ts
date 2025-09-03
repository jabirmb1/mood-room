/*** contains logic for how internal lights works on models e.g. lamps, tv screens etc (local to model);
 * won't affect any other object inside scene other than it's repsective model. *******/

import { LightMeshConfig, LightMeshState, LightSourceConfig, LightSystemConfig, LightSystemData, Model } from "@/types/types";
import * as THREE from "three";
import { defaultLightSystemConfig } from "../const";
import { cacheEmissiveState, createPointLightForMesh, findMeshesByPattern, getMeshColour, toggleMeshvisibility } from "../scene/meshes";
import { calculateObjectBoxSize } from "./modelManipulation";
import { getLinkedMesh, updateLightBeamMeshColour } from "@/components/3d-canvas/scene/scene-infrastructure/volumetric-lights/CubeLightBeam/CubeLightBeam";



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
  if (!lightData) return;
  const { maxDim } = calculateObjectBoxSize(model);
  const scaledIntensity = lightData.intensity * Math.pow(maxDim, 0.5);

  // update every single light
  for (const light of pointLights) {
    light.color.set(lightData.colour);
    light.intensity = lightData.on ? scaledIntensity : 0;
    light.visible = lightData.on;
  }
};

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

    for (const mesh of meshes) {
      // convert into array for a more universal way to handle materials
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.set(lightData.on ? lightData.colour : '#000000');
          mat.emissiveIntensity = lightData.on ? 20 : 0;
          mat.needsUpdate = true;
          // make sure to cache the light source matierial's emissive state
          cacheEmissiveState(mat)
        }
      }
    }
  }
};

// function to toggle visibility status of all cube volumetricLightMeshes.
//
export function toggleCubeLightBeamsvisibility(systemData: LightSystemData, visibility: boolean)
{
  for (const lightBeam of systemData.cubeLightBeams)
  {
    toggleMeshvisibility(lightBeam, visibility)
  }
}

//This function will take in an array of screen meshes; and update the volemetric light mesh colour
// to be same colour as the screen meshes
//
function updateLightBeamColour(lightBeam: THREE.Mesh, screen : THREE.Mesh)
{
  const colour = getMeshColour(screen);
  updateLightBeamMeshColour(lightBeam, colour)
}

// function to take in an array of light beam meshs (volumetric light meshes)
//  and update their light beam's colour
//
function updateAllLightBeamColours(lightBeams: THREE.Mesh[]){
  for (const lightBeam of lightBeams)
  {
    // light beams in our project will either be linked to a screen mesh or no mesh
    const screen = getLinkedMesh(lightBeam)
    if (lightBeam && screen)
    {
      updateLightBeamColour(lightBeam, screen)
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

  //use existing lihgt data if it exists; otherwise give it default values
  model.userData.light = lightData || {on: false, intensity: config.defaultIntensity, colour: config.defaultColor};
  model.userData.lightSystemData = systemData;
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

  //if the object has a screen then it has a volumetric light mesh; update it
  if (hasScreens(model))
  {
    const lightBeams = getCubeLightBeams(model)// can extend this to other shapes as well
    if (!lightBeams) return
    updateAllLightBeamColours(lightBeams)
  }
 

  // Update stored light data
  if (model.userData.light) {
    Object.assign(model.userData.light, lightData);
  }
};

/***********Light property getters *************/

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

// Helper function to check if object has any screens.
//
export function hasScreens(object: THREE.Object3D | null): boolean {
  if (!object?.userData.lightSystemData) return false;
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
  const lightBeams = getCubeLightBeams(object); // extend o other light beam shapes.
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
  return hasPointLightSources(object)//e.g. extend this code by:  | hasSpotLightSources(object)
}