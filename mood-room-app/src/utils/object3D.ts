// This file contains all logic that relates to the model and how to change it.
import * as THREE from "three";
import { globalScale, modelMaterialNames } from "./const";
import { MaterialColourType } from "@/types/types";

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
};

// This function fully clones a model including its material.
//
export function cloneModel(scene: THREE.Object3D) {
    // cloning the scene
    const clonedModel = scene.clone(true);
    // whilst we clone the model, we can also store the inital model's colours into the userdata.
    const initialcolours: MaterialcolourMap = {};
    // cache for meshes with materials
    const meshesWithMaterials: THREE.Mesh[] = [];

    //cloning the materials as well
    clonedModel.traverse((child: any) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.userData.isDraggable = true// we also want all models (except for floors and walls) to be draggable.
            meshesWithMaterials.push(child);
        }
        // also store the initial colours of the models, but only the parts that the user can change. (primary, secondary, tertiary).
        const mat = child.material;
        if (mat &&  mat instanceof THREE.MeshStandardMaterial &&typeof mat.name === 'string'){
          const baseName = getBaseMaterialName(mat.name, modelMaterialNames);
          if (baseName) initialcolours[baseName] = `#${mat.color.getHexString()}`;

        } 
    });

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
  currentcolours: Partial<MaterialcolourMap>;// current colours that the model is using.
  initialcolours: Partial<MaterialcolourMap>; // what the default colours of the object was (e.g. before user changed them)
  availableTypes: Set<MaterialColourType>;// if object has primary, secondary or tertiary.
} {
  const obj = objectRef.current;
  const materialMap: Partial<Record<MaterialColourType, THREE.MeshStandardMaterial[]>> = {};// using an array for each category
  // as e.g. a model may have multiple primaries that needs to be grouped together.
  const availableTypes = new Set<MaterialColourType>();
  const currentcolours: Partial<MaterialcolourMap> = {};
  const initialcolours: Partial<MaterialcolourMap> =
    (obj?.userData?.initialcolours as MaterialcolourMap) ?? {};// grab the inital model colours from the user data (if it doesn't exist, get empty array)
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
// it also returns the inital colours in case if it is needed
//
export function resetColourPalette(objectRef: React.RefObject<THREE.Object3D | null>) {
  const object = objectRef.current;
  if (!object) return;
  // grab the inital colours from the user daata if they exist.
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



// This function will get a model and apply a hover effect (making it slightly larger and highlighting it as yellow)
//
export function applyHoverEffect(
    model: THREE.Object3D & { meshesWithMaterials?: THREE.Mesh[] },
    hovered: boolean,
    mode: 'view' | 'edit',
) {
      const meshes = model.meshesWithMaterials ?? [];
  
      if (meshes.length > 0) {
        // use cached meshes to apply hover effect
        for (const mesh of meshes) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (hovered && mode === 'edit') {
            material.emissive.set('yellow');
            material.emissiveIntensity = 1.0;
          } else {
            material.emissive.set(0x000000);
            material.emissiveIntensity = 0;
          }
        }
      } else {
        // fallback: traverse through the model and apply hover effect
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            if (hovered && mode === 'edit') {
              material.emissive.set('yellow');
              material.emissiveIntensity = 1.0;
            } else {
              material.emissive.set(0x000000);
              material.emissiveIntensity = 0;
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

// This function just returns the object's current rotation in degrees.
//
export function getObjectRotation(objectRef:  React.RefObject<THREE.Object3D>)
{
  const model = objectRef.current;
  if (model) {
    return THREE.MathUtils.radToDeg(model.rotation.y);
  }
  return 0;
}

// Returns the object's scale difference as a percentage
// precondtion: model uses uniform scaling
//
export function getObjectSizeDifference(objectRef: React.RefObject<THREE.Object3D | null>) {
  const model = objectRef.current;
  if (model) {
    const current = model.userData.baseScale ?? model.scale.x; // fall back to scale if no base

    // Useing only baseScale comparison to avoid hover distortion
    const percentageChange = ((current / globalScale) - 1) * 100;
    return percentageChange;
  }
  return 0;
}


// This function will just center the pivot of an object in all axis(gives consistent rotation and collision)
// it retuns a new group with the model centered.
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
  // Deep copy userData from the object to the pivot group
  // (assuming userData is a simple object without functions or circular references)
  pivotGroup.userData = JSON.parse(JSON.stringify(object.userData));

  return pivotGroup;
}

// This function is used to quickly get the object's materials's names and e.g. normalise the models e.g. primary.001 and primary.002
// will both be turned into just primary. we pass in the name that we want to compare and also an array of valid basenames to compare with.
// returs undefined if basename does not exist.
//
export function getBaseMaterialName<T extends string>(name: string, validBaseNames: readonly T[]): T | undefined {
  const base = name.split('.')[0];
  return validBaseNames.includes(base as T) ? (base as T) : undefined;
}

// This fucntion will get category tags from the url; it will also replace some default tag via a json depending
// if the url has a sub folder or not ( for extra tags, or to remove tags)
//
export async function getCategoryTagsFromURL(url: string){
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

  // Only look for .meta.json if in its own subfolder
  const match = url.match(/([^/]+)\/\1\.glb$/i);
  if (!match) return Array.from(tags);

  const jsonUrl = url.replace(/\.glb$/i, '.meta.json');

  try {
    const response = await fetch(jsonUrl);
    if (response.ok) {
      const meta: ModelTags = await response.json();

      if (Array.isArray(meta.addTags)) {
        for (const tag of meta.addTags) tags.add(tag);
      }
      if (Array.isArray(meta.removeTags)) {
        for (const tag of meta.removeTags) tags.delete(tag);
      }
    }
  } catch {
    console.warn(`[Meta Tags] No meta.json found or failed for ${url}`);
  }

  return Array.from(tags);
}

// Applies tags to object.userData.tags safely (deduplicates)
//
export function applyTagsToObject(object: THREE.Object3D, tags: string[]) {
  const current = new Set(object.userData.tags || []);
  for (const tag of tags) current.add(tag);
  object.userData.tags = Array.from(current);
}

// a wrapper function whicih is used to apply tags to the passed in object.
//
export async function applyCategoryTags(url: string,  object: THREE.Object3D)
{
  const tags = await getCategoryTagsFromURL(url);
  applyTagsToObject(object, tags);
}