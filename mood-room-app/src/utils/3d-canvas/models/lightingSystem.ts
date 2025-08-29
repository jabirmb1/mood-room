/*** contains logic for how internal lights works on models e.g. lamps, tv screens etc (local to model);
 * won't affect any other object inside scene other than it's repsective model. *******/
import * as THREE from "three";
import { LightMeshConfig, LightMeshGroups, Model } from "@/types/types";
import { baseModelLightIntensity, defaultLightMeshConfigs } from "../const";
import { LightSystemData } from "./types";
import { cacheEmissiveState, createPointLightForMesh, findMeshesByPattern, POINTLIGHT_DECAY_SCALE_EXPONENT, POINTLIGHT_DISTANCE_SCALE_FACTOR, POINTLIGHT_MIN_DECAY} from "../scene/meshes";
import { mixColours } from "@/utils/general/colours";
import { calculateObjectBoxSize } from "./modelManipulation";

// Helper function to initialise mesh groups for light-affected meshes (e.g.screens, lampshades.)
function initialiseLightMeshGroups(scene: THREE.Object3D, lightMeshTypes: LightMeshConfig[]): LightMeshGroups {
    const meshGroups: LightMeshGroups = {};
    
    // Initialise empty arrays for each mesh type
    for (const type of lightMeshTypes) {
        meshGroups[type.nameContains] = [];
    }
    
    // Collect meshes by type
    scene.traverse((child: any) => {
        if (!child.isMesh) return;
        
        for (const type of lightMeshTypes) {
            if (child.name.toLowerCase().includes(type.nameContains.toLowerCase())) {
                meshGroups[type.nameContains].push(child);
            }
        }
    });
    
    return meshGroups;
}

// Helper function to check if a mesh is a light-affected mesh that uses "meshColour"
//
function isLightAffectedMeshWithMeshColour(scene: THREE.Object3D, mesh: THREE.Mesh): boolean {
    const meshGroups: LightMeshGroups = scene.userData.meshGroups ?? {};
    const lightMeshTypes: LightMeshConfig[] = scene.userData.lightMeshTypes ?? [];
    
    for (const type of lightMeshTypes) {
        // Check if this mesh is in this light mesh group and uses "meshColour"
        const meshes = meshGroups[type.nameContains] ?? [];
        if (meshes.includes(mesh) && type.on.emissiveColour === "meshColour") {
            return true;
        }
    }
    return false;
}

// Helper function to sync emissive color for a specific mesh when its color changes
//
export function syncMeshEmissiveWithColor(scene: THREE.Object3D, mesh: THREE.Mesh): void {
    const isLightOn = scene.userData.light?.on ?? false;
    
    // Only sync if light is currently on and this mesh is light-affected
    if (!isLightOn || !isLightAffectedMeshWithMeshColour(scene, mesh)) return;

    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat) return;

    // Update emissive to match current material color
    mat.emissive.copy(mat.color);
    mat.needsUpdate = true;

    // Update cached emissive state
    cacheEmissiveState(mat);
}

// Helper function to apply light state to a specific mesh type
function applyLightStateToMeshType(meshes: THREE.Mesh[], config: LightMeshConfig, isOn: boolean, lightColour: string): void {
    const state = isOn ? config.on : config.off;
    
    for (const mesh of meshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) continue;

        // Handle special "meshColour" placeholder
        if (config.nameContains === 'fabric_light') {
            // as a fallback; if light colour is undefined then just make fabric light's emit the same colour as it's mesh
            if (!lightColour) {
                mat.emissive.copy(mat.color);
            }

            // otherwise mix the two colours for a more realistic effect
            const fabricLightRetentionRatio = 0.55; // how much the emissiveness of the fabric colour keeps it's original colour
            // between 0 to 1; higher = light barely affects fabric colour; lower = light affects fabric colour more (tints it more)
            mat.emissive.set(mixColours(mat.color, new THREE.Color(lightColour), fabricLightRetentionRatio));
        }
        if (state.emissiveColour === "meshColour") {
            mat.emissive.copy(mat.color);
        } else {
            mat.emissive.set(state.emissiveColour);
        }
        
        mat.emissiveIntensity = state.emissiveIntensity;

        // if light is on; some materials got new emissive properties to cache it
        if (isOn) {
            cacheEmissiveState(mat);
        } else {
            // reset the cache as now they are no longer emissive (i.e null)
            mat.userData.cachedEmissive = null;
        }

        if (state.transparent !== undefined) mat.transparent = state.transparent;
        if (state.opacity !== undefined) mat.opacity = state.opacity;
        
        mat.needsUpdate = true;
    }
}

// Helper function to update all point lights
// it will also dynamically calculate the decay and distance based on model's light intensity and
// model's current size.
// 
export function updatePointLights(object: THREE.Object3D, lights: THREE.PointLight[], lightData: { on: boolean; intensity: number; colour: string }) {
  const { maxDim } = calculateObjectBoxSize(object);
  const modelScale = object.scale.x; // uniform scale
  const scaledIntensity = lightData.intensity * Math.pow(modelScale, 0.5); // we want intensity to scale based on model scale

  const distance = maxDim * POINTLIGHT_DISTANCE_SCALE_FACTOR;
  const decay = Math.max(POINTLIGHT_MIN_DECAY, Math.pow(modelScale, POINTLIGHT_DECAY_SCALE_EXPONENT));

  for (const light of lights) {
    // apply the different attirbutes to the lights.
    light.color.set(lightData.colour);
    light.intensity = lightData.on ? scaledIntensity : 0;
    light.visible = lightData.on;
    light.distance = distance;
    light.decay = decay;
  }
}


// Main function to initialise lights into a model (e.g. lamps)
export function initialiseLights(scene: THREE.Object3D, lightData?: Model['light']): void {
    const bulbMeshes = findMeshesByPattern(scene, 'bulb'); // each object that has a light will have a bulb mesh 

    //TO DO: screens e.g. tv screens won't have a bulb; so we will need to extend this to use bulbmeshes OR screen meshes
    const lightMeshTypes = defaultLightMeshConfigs; // config of how certain meshes inside model will react when it's light is on/off
    
    // if no bulb meshes; then just return as this model is not one that can produce light.
    if (bulbMeshes.length === 0) {
        scene.userData.light = null;
        return;
    }
    
    // initialise bulb meshes with an emissive colour of white; but make it intensity 0 by default
    for (const bulb of bulbMeshes) {
        if (bulb.material instanceof THREE.MeshStandardMaterial) {
            bulb.material.emissive.set('#ffffff'); // Set emissive color to white
            bulb.material.emissiveIntensity = 0; // Default intensity
        }
    }
    
    // Create point lights for bulb meshes
    const bulbs = bulbMeshes
        // scale the pointlight effects with mesh size

        // if lightData was passed in; use it to recreate the pointlightMesh (intensity and colour)
    .map(mesh => createPointLightForMesh(mesh,{colour: lightData?.colour, intensity:lightData?.intensity}))
        .filter(light => light !== null);
    
    if (bulbs.length === 0) {
        scene.userData.light = null;
        return;
    }
    
    // Initialise mesh groups for light-affected meshes
    const meshGroups = initialiseLightMeshGroups(scene, lightMeshTypes);
    
    // Store all data in userData
    // if a lightData was passed in for this model; instead of recreating the userData; reuse the passed in data
    scene.userData.light =lightData? lightData:  { on: false, intensity: baseModelLightIntensity, colour: '#ffffff' };
    scene.userData.bulbs = bulbs;
    scene.userData.bulbMeshes = bulbMeshes;
    scene.userData.lightMeshTypes = lightMeshTypes;
    scene.userData.meshGroups = meshGroups;
}

// function to update model light-affected meshes
export function updateModelLightAffectedMeshes(scene: THREE.Object3D, isOn: boolean): void {
    const meshGroups: LightMeshGroups = scene.userData.meshGroups ?? {};
    const lightMeshTypes: LightMeshConfig[] = scene.userData.lightMeshTypes ?? [];
    const lightColour = scene.userData.light.colour;

    for (const type of lightMeshTypes) {
        const meshes = meshGroups[type.nameContains] ?? [];
        applyLightStateToMeshType(meshes, type, isOn, lightColour);
    }
}

// function to find the object's bulb and toggle it on/ off by toggling emissive properties
function toggleModelBulb(model: THREE.Object3D, isOn: boolean) {
    if (!model.userData.bulbMeshes) return;
    
    for (const bulb of model.userData.bulbMeshes) {
        const materials = Array.isArray(bulb.material) ? bulb.material : [bulb.material];
        for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
                mat.emissive.set(isOn ? '#ffffff' : '#000000');
                mat.emissiveIntensity = isOn ? 20 : 0;
                mat.needsUpdate = true;
                cacheEmissiveState(mat); // cache emissive state of bulb so that it does not get overwritten by hover effects
            }
        }
    }
}

// function to update all lights (point lights only for now)
//
export function updateAllLights(scene: THREE.Object3D, lightData: { on: boolean; intensity: number; colour: string }): void {
    if(!lightData) return;
    const bulbs: THREE.PointLight[] = scene.userData.bulbs ?? [];

    // Update point lights
    updatePointLights(scene, bulbs, lightData);

    // Update light-affected meshes
    updateModelLightAffectedMeshes(scene, lightData.on);

    // also update the bulb
    if (lightData.on !== undefined) { // light has turned on/ off; so update bulb
        toggleModelBulb(scene, lightData.on);
    }
    
    // Update stored light data
    if (scene.userData.light) {
        Object.assign(scene.userData.light, lightData);
    }
}

// Helper function to get all light data for easy access
export function getLightSystemData(object: THREE.Object3D | null): LightSystemData {
    // if object or the object light user data does not exist; then return default values
    if (!object || !object.userData.light) {
        return {
            lightData: null,
            bulbs: [],
            meshGroups: {},
            lightMeshTypes: []
        };
    }

    return {
        lightData: object.userData.light,
        bulbs: object.userData.bulbs ?? [],
        meshGroups: object.userData.meshGroups ?? {},
        lightMeshTypes: object.userData.lightMeshTypes ?? []
    };
}

// Light property getters
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
    if (!object || !object.userData.light) return null;
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