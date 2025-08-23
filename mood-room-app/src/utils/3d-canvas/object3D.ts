// This file contains all logic that relates to the model and how to change it.
import * as THREE from "three";
import { defaultLightMeshConfigs, globalScale, modelMaterialNames } from "./const";
import { LightMeshConfig, LightMeshGroups, MaterialColourType, Model } from "@/types/types";
import { fetchModelMeta } from "@/services/modelServices";

// declaring types here:
export type ColourPalette = {
    primary?: string;
    secondary?: string;
    tertiary?: string;
};

type MaterialcolourMap = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

// each model tag inside json folders must be in this format.
export type ModelTags = {
  addTags?: string[];
  removeTags?: string[];
}

/******* some helper functions to help with light properties relating to objects.
 * e.g. shanging certain propertied of certain meshes inside objects based if a light is on or not.
 */


// Helper function to cache material emissive state
//
function cacheEmissiveState(material: THREE.MeshStandardMaterial): void {
    material.userData.cachedEmissive = {
      color: material.emissive.clone(),
      intensity: material.emissiveIntensity
    };
}

// Helper function to restore material emissive state
//
function restoreEmissiveState(material: THREE.MeshStandardMaterial): void {
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

// Helper function to apply hover emissive effect
//
function applyHoverEmissive(material: THREE.MeshStandardMaterial, hovered: boolean): void {
  if (hovered) {
    material.emissive.set('yellow');// make it glow yellow
    material.emissiveIntensity = 1.0;// default hover intensity of 1.0
  } else {
    // Restore the cached emissive state
    restoreEmissiveState(material);
  }
}

// Helper function to find meshes by name pattern
// just finds all meshes that has a name that includes the passed in patter and returns an array of meshes.
//
function findMeshesByPattern(object: THREE.Object3D, pattern: string): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  object.traverse((child: any) => {
    if (child.isMesh && child.name.toLowerCase().includes(pattern.toLowerCase())) {
      meshes.push(child);
    }
  });
  return meshes;
}

// Helper function to create a single point light for a mesh
//
function createPointLightForMesh(mesh: THREE.Mesh, config = { color: '#ffffff', intensity: 0, distance: 10, decay: 2 }): THREE.PointLight | null {
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

// Helper function to initialise mesh groups for light-affected meshes (e.g.screens, lampshades.)
//
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
//
function applyLightStateToMeshType(meshes: THREE.Mesh[], config: LightMeshConfig, isOn: boolean): void {
  const state = isOn ? config.on : config.off;
  
  for (const mesh of meshes) {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat) continue;

    // Handle special "meshColour" placeholder
    if (state.emissiveColour === "meshColour") {
      console.log('hello, the mat colour is:', mat.color)
      mat.emissive.copy(mat.color);
    } else {
      mat.emissive.set(state.emissiveColour);
    }
    
    mat.emissiveIntensity = state.emissiveIntensity;

    // if light is on; some materials got new emissive properties to cache it
    if (isOn)
    {
      cacheEmissiveState(mat);
    }
    else// reset the cache as now they are no longer emissive (i.e null)
    {
      mat.userData.cachedEmissive = null
    }

    
    if (state.transparent !== undefined) mat.transparent = state.transparent;
    if (state.opacity !== undefined) mat.opacity = state.opacity;
    
    mat.needsUpdate = true;
  }
}

// Helper function to update all point lights
function updatePointLights(lights: THREE.PointLight[], lightData: { on: boolean; intensity: number; colour: string }): void {
  for (const light of lights) {
    light.color.set(lightData.colour);
    light.intensity = lightData.on ? lightData.intensity : 0;
    light.visible = lightData.on;
  }
}


/******* Main functions **************/

// This function will make a model rough and non metalic (mimics lambert material)
export function makeRoughNonMetallic(object: THREE.Object3D) {
  object.traverse((child: any) => {
    if (child.isMesh && child.material) {
      if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.roughness = 1.0;
        child.material.metalness = 0.0;
      }
    }
  });
}

//This function will move all meshes of the passed in object into a different layer.
export function changeModelLayer(scene: THREE.Object3D, layer: number) {
  if (layer < 0 || layer > 31) return; // layers in three js are between 0 to 31
  // traverse through all the meshes of an object and then move it's layers into the passed in layer.
  scene.traverse((child: any) => {
    child.layers.set(layer);
  });
}

//This function will be used to make an object cast/ not cast shadows.
export function toggleModelCastingShadow(scene: THREE.Object3D, castShadow: boolean) {
  // traverse through all the meshes of an object and then move it's layers into the passed in layer.
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
    }
  });
}

// Main function to initialise lights  into a model (e.g. lamps)
//
function initialiseLights(scene: THREE.Object3D): void {
  const bulbMeshes = findMeshesByPattern(scene, 'bulb');// each object that has a light will have a bulb mesh.
  const lightMeshTypes = defaultLightMeshConfigs;// config of how certain meshes inside model will react when
  //  it's light is on/off
  
  if (bulbMeshes.length === 0) {
    scene.userData.light = null;
    return;
  }
  
  // initialise bulb meshe with an emissive colour of white; but make it intensity 0 by default.
  for (const bulb of bulbMeshes)
  {
       if (bulb.material instanceof THREE.MeshStandardMaterial) {
         bulb.material.emissive.set('#ffffff'); // Set emissive color to white
         bulb.material.emissiveIntensity = 0; // Default intensity
       }
  }
  // Create point lights for bulb meshes
  const bulbs = bulbMeshes
    .map(mesh => createPointLightForMesh(mesh))
    .filter(light => light !== null);
  
  if (bulbs.length === 0) {
    scene.userData.light = null;
    return;
  }
  
  // Initialise mesh groups for light-affected meshes
  const meshGroups = initialiseLightMeshGroups(scene, lightMeshTypes);
  
  // Store all data in userData
  scene.userData.light = {on: false, intensity: 20,colour: '#ffffff',};
  scene.userData.bulbs = bulbs;
  scene.userData.bulbMeshes = bulbMeshes;
  scene.userData.lightMeshTypes = lightMeshTypes;
  scene.userData.meshGroups = meshGroups;
}

// This function fully clones a model including its material.
export function cloneModel(scene: THREE.Object3D) {
  // cloning the scene
  const clonedModel = scene.clone(true);
  // whilst we clone the model, we can also store the initial model's colours into the userdata.
  const initialcolours: MaterialcolourMap = {};
  // cache for meshes with materials
  const meshesWithMaterials: THREE.Mesh[] = [];

  // give every material a lambert esque feel (art style for this project) Artistic matte look
  makeRoughNonMetallic(clonedModel);

  //cloning the materials as well
  clonedModel.traverse((child: any) => {
    if (child.isMesh && child.material) {
      child.material = child.material.clone();
      child.userData.isDraggable = true; // we also want all models (except for floors and walls) to be draggable.
      child.castShadow = true; // Make every mesh cast shadows
      child.receiveShadow = true; //  make it receive shadows too
      child.layers.set(0);
      meshesWithMaterials.push(child);
    }
    // also store the initial colours of the models, but only the parts that the user can change. (primary, secondary, tertiary).
    const mat = child.material;
    if (mat && mat instanceof THREE.MeshStandardMaterial && typeof mat.name === 'string') {
      const baseName = getBaseMaterialName(mat.name, modelMaterialNames);
      if (baseName) initialcolours[baseName] = `#${mat.color.getHexString()}`;
    }
  });

  // if the model has a bulb; initialise the light values:
  initialiseLights(clonedModel);

  // attach cached meshes to the cloned model for later reuse
  (clonedModel as any).meshesWithMaterials = meshesWithMaterials;
  clonedModel.userData.initialcolours = initialcolours;

  return clonedModel;
}

// This function will return an object's colour map given the reference of an object
// a colour map just stores what colour palette an object is using and at what parts:
//
export function getObjectMaterialMap(objectRef: React.RefObject<THREE.Object3D | null>): {
  materialMap: Partial<Record<MaterialColourType, THREE.MeshStandardMaterial[]>>; // current mapping of object's different parts to different colours
  currentcolours: Partial<MaterialcolourMap>; // current colours that the model is using.
  initialcolours: Partial<MaterialcolourMap>; // what the default colours of the object was (e.g. before user changed them)
  availableTypes: Set<MaterialColourType>; // if object has primary, secondary or tertiary.
} {
  const obj = objectRef.current;
  const materialMap: Partial<Record<MaterialColourType, THREE.MeshStandardMaterial[]>> = {}; // using an array for each category
  // as e.g. a model may have multiple primaries that needs to be grouped together.
  const availableTypes = new Set<MaterialColourType>();
  const currentcolours: Partial<MaterialcolourMap> = {};
  const initialcolours: Partial<MaterialcolourMap> =
    (obj?.userData?.initialcolours as MaterialcolourMap) ?? {}; // grab the initial model colours from the user data (if it doesn't exist, get empty array)
  if (!obj) return { materialMap, currentcolours, initialcolours, availableTypes };

  // check for cached meshes first (e.g. if model was cloned and stored cache)
  const meshes: THREE.Mesh[] = (obj as any).meshesWithMaterials ?? [];

  const targets = meshes.length > 0 ? meshes : [];

  // fallback: traverse if no cache exists
  if (targets.length === 0) {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        targets.push(child as THREE.Mesh);
      }
    });
  }

  // collect materials and their colours
  for (const mesh of targets) {
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (!material) continue;

    const baseName = getBaseMaterialName(material.name, modelMaterialNames);
    if (baseName) {
      if (!materialMap[baseName]) {
        materialMap[baseName] = [];
      }

      materialMap[baseName]!.push(material);
      availableTypes.add(baseName);
      currentcolours[baseName] = `#${material.color.getHexString()}`;
    }
  }

  return { materialMap, currentcolours, initialcolours, availableTypes };
}

// This function applies a colour palette to the model.
// we use the getMaterialMapFromRef function to give it a slight performance boost.
//
export function applyColourPalette(model: THREE.Object3D, colourPalette?: ColourPalette) {
  if (!colourPalette) return; // user did not specify custom colours, so just use default ones instead.

  // mapping the colour palette to the material names in the model to reduce code
  // each material in a model will be primary, secondary, or tertiary.
  const materialcolourMap: MaterialcolourMap = {
    primary: colourPalette.primary,
    secondary: colourPalette.secondary,
    tertiary: colourPalette.tertiary,
  };

  // use material map utility to avoid redundant traversal
  const { materialMap } = getObjectMaterialMap({ current: model });

  Object.entries(materialMap).forEach(([type, materials]) => {
    const key = type as keyof MaterialcolourMap;
    const colour = materialcolourMap[key];
    if (colour && materials) {
      for (const mat of materials) {
        mat.color.set(colour);
        mat.needsUpdate = true;
      }
    }
  });
}

// This function resets an object's colour palette.
// it also returns the initial colours in case if it is needed
//
export function resetColourPalette(objectRef: React.RefObject<THREE.Object3D | null>) {
  const object = objectRef.current;
  if (!object) return;
  // grab the initial colours from the user data if they exist.
  const initialcolours: MaterialcolourMap = object.userData.initialcolours ?? {};
  const { materialMap } = getObjectMaterialMap(objectRef);

  // go through all existing editable components and change their colour.
  Object.entries(materialMap).forEach(([type, materials]) => {
    const key = type as keyof MaterialcolourMap;
    const initialColour = initialcolours[key];
    if (initialColour && materials) {
      for (const mat of materials) {
        mat.color.set(initialColour);
        mat.needsUpdate = true;
      }
    }
  });

  return initialcolours;
}

// Fixed hover effect function that preserves emissive states
//
export function applyHoverEffect(
  model: THREE.Object3D & { meshesWithMaterials?: THREE.Mesh[] },
  hovered: boolean,
  mode: 'view' | 'edit',
): void {
  const meshes = model.meshesWithMaterials ?? [];

  if (meshes.length > 0) {
    // Use cached meshes to revert back after model has stopped being hovered.
    for (const mesh of meshes) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (mode === 'edit') {
        applyHoverEmissive(material, hovered);
        material.needsUpdate = true;
      }
    }
  } else {
    // Fallback: traverse through the model
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (mode === 'edit') {
          applyHoverEmissive(material, hovered);
          material.needsUpdate = true;
        }
      }
    });
  }
}

// This function calculates the bounding box and maximum dimension of a 3D object.
//
export function calculateObjectBoxSize(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  return { box, size, center, maxDim };
}

// function to update model light-affected meshes
//
export function updateModelLightAffectedMeshes(scene: THREE.Object3D, isOn: boolean): void {
  const meshGroups: LightMeshGroups = scene.userData.meshGroups ?? {};
  const lightMeshTypes: LightMeshConfig[] = scene.userData.lightMeshTypes ?? [];

  for (const type of lightMeshTypes) {
    const meshes = meshGroups[type.nameContains] ?? [];
    applyLightStateToMeshType(meshes, type, isOn);
  }
}

// function to find the object's bulb and toggle it on/ off by toggling emissive properties.
//
function toggleModelBulb(model: THREE.Object3D, isOn: boolean) {
  if (!model.userData.bulbMeshes) return;
  for (const bulb of model.userData.bulbMeshes) {
    const materials = Array.isArray(bulb.material) ? bulb.material : [bulb.material];
    for (const mat of materials) {
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive.set(isOn ? '#ffffff' : '#000000');
        mat.emissiveIntensity = isOn ? 5 : 0;
        mat.needsUpdate = true;
      }
    }
  }
}


// function to update all lights (point lights only for now)
export function updateAllLights(scene: THREE.Object3D, lightData: { on: boolean; intensity: number; colour: string }): void {
  const bulbs: THREE.PointLight[] = scene.userData.bulbs ?? [];

  // Update point lights
  updatePointLights(bulbs, lightData);

  // Update light-affected meshes
  updateModelLightAffectedMeshes(scene, lightData.on);

  // also update the bulb.
  if(lightData.on !== undefined)// light has turned on/ off; so update bulb.
  toggleModelBulb(scene, lightData.on)
  // Update stored light data
  if (scene.userData.light) {
    Object.assign(scene.userData.light, lightData);
  }
}

// Helper function to get all light data for easy access
export function getLightSystemData(object: THREE.Object3D | null): {
  lightData: Model['light'] | null; bulbs: THREE.PointLight[]; meshGroups: LightMeshGroups; lightMeshTypes: LightMeshConfig[]} {

    // ifobject or the object light user data does not exist; tjen return default values.
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

//This function will be used to check if the object/ model can produce light (e.g. it's a lamp)
export function isObjectLight(objectRef: React.RefObject<THREE.Object3D | null>) {
  const model = objectRef.current;
  if (!model) return false;
  return model.userData.light !== null; // if lights userdata is null; object cannot produce light
}

// This function just returns the object's current rotation in degrees.
//
export function getObjectRotation(objectRef: React.RefObject<THREE.Object3D>) {
  const model = objectRef.current;
  if (model) {
    return THREE.MathUtils.radToDeg(model.rotation.y);
  }
  return 0;
}

//This function will get the object's light's intensity.
// for this project (every light in object share same value).
//
export function getObjectLightIntensity(object: THREE.Object3D | null): number | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light.intensity;
}

//This function will get the object's light's status (on/ off)
// for this project (every light in object share same value).
//
export function isObjectLightOn(object: THREE.Object3D | null): boolean | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light.on;
}

//This function will get the object's light's colour
// for this project (every light in object share same value).
//
export function getObjectLightColour(object: THREE.Object3D | null): string | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light.colour;
}

//This function will return the entire light user data object
//
export function getObjectLightData(object: THREE.Object3D | null): Model['light'] | null {
  if (!object || !object.userData.light) return null;
  return object.userData.light; // null or a lights object
}

// Returns the object's scale difference as a percentage
// precondition: model uses uniform scaling
//
export function getObjectSizeDifference(objectRef: React.RefObject<THREE.Object3D | null>) {
  const model = objectRef.current;
  if (model) {
    const current = model.userData.baseScale ?? model.scale.x; // fall back to scale if no base

    // Using only baseScale comparison to avoid hover distortion
    const percentageChange = ((current / globalScale) - 1) * 100;
    return percentageChange;
  }
  return 0;
}

// This function will just center the pivot of an object in all axis(gives consistent rotation and collision)
// it returns a new group with the model centered.
//
export function centerPivot(object: THREE.Object3D) {
  // get bounding box and center the pivot based on that bounding box.
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  const pivotGroup = new THREE.Group();
  box.getCenter(center);

  // Center the pivot group at the center of the bounding box
  object.position.sub(center);
  pivotGroup.add(object);

  // we will not json.stringify anymore e.g. in case object has references to three.js objects like lights
  // Copy all properties (including non-enumerable ones) from userData
  const sourceDescriptors = Object.getOwnPropertyDescriptors(object.userData);
  Object.defineProperties(pivotGroup.userData, sourceDescriptors);

  // Also copy enumerable properties with shallow copy
  Object.assign(pivotGroup.userData, object.userData);

  return pivotGroup;
}

// This function is used to quickly get the object's materials's names and e.g. normalise the models e.g. primary.001 and primary.002
// will both be turned into just primary. we pass in the name that we want to compare and also an array of valid basenames to compare with.
// returns undefined if basename does not exist.
//
export function getBaseMaterialName<T extends string>(name: string, validBaseNames: readonly T[]): T | undefined {
  const base = name.split('.')[0];
  return validBaseNames.includes(base as T) ? (base as T) : undefined;
}

// This function will get category tags from the url; it will also replace some default tag via a json depending
// if the url has a sub folder or not ( for extra tags, or to remove tags)
//
export async function getCategoryTagsFromURL(url: string) {
  const tags = new Set<string>();
  const lowerUrl = url.toLowerCase();

  // Infer base tags from folder
  if (lowerUrl.includes('lights')) {
    tags.add('light');
    tags.add('decor');
  } else if (lowerUrl.includes('furniture')) {
    tags.add('furniture');
  } else if (lowerUrl.includes('decor')) {
    tags.add('decor');
  } else if (lowerUrl.includes('wall-art')) {
    tags.add('wall-art');
  }

  const jsonUrl = url.replace(/\.glb$/i, '.meta.json');
  const metaData = await fetchModelMeta(jsonUrl); // grab the metadata from the server.

  if (metaData) {
    // add/ subtract tags as necessary depending on the meta data.
    if (Array.isArray(metaData.addTags)) {
      for (const tag of metaData.addTags) tags.add(tag);
    }
    if (Array.isArray(metaData.removeTags)) {
      for (const tag of metaData.removeTags) tags.delete(tag);
    }
  }
  return Array.from(tags); // return the tags as an array
}

//This function will get a model url and then return it's collider url
// This is because the collider url is standardised and each collider json is named colliders.json and is inside each model's sub folder
//
export async function getModelColliderDataUrl(url: string): Promise<string> {
  // Replace the model file name (e.g., NormTable.glb) with 'colliders.json'
  const colliderUrl = url.replace(/[^/]+\.glb$/i, 'colliders.json');
  return colliderUrl;
}

// Applies tags to object.userData.tags safely (deduplicates)
//
export function applyTagsToObject(object: THREE.Object3D, tags: string[]) {
  const current = new Set(object.userData.tags || []);
  for (const tag of tags) current.add(tag);
  object.userData.tags = Array.from(current);
}

// a wrapper function which is used to apply tags to the passed in object.
//
export async function applyCategoryTags(url: string, object: THREE.Object3D) {
  const tags = await getCategoryTagsFromURL(url);
  applyTagsToObject(object, tags);
}