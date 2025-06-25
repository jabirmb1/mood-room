// This file contains all logic that relates to the model and how to change it.
import * as THREE from "three";
import { globalScale, modelMaterialNames } from "./const";

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
export function getObjectMaterialMap(objectRef: React.RefObject<THREE.Object3D>): {
  materialMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>; // current mapping of object's different parts to different colours
  currentcolours: Partial<MaterialcolourMap>;// current colours that the model is using.
  initialcolours: Partial<MaterialcolourMap>; // what the default colours of the object was (e.g. before user changed them)
  availableTypes: Set<'primary' | 'secondary' | 'tertiary'>; // if object has primary, secondary or tertiary.
} {
  const obj = objectRef.current;
  const materialMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>> = {};
  const availableTypes = new Set<'primary' | 'secondary' | 'tertiary'>();
  const currentcolours: Partial<MaterialcolourMap> = {};
  const initialcolours: Partial<MaterialcolourMap> =
  (obj?.userData?.initialcolours as MaterialcolourMap) ?? {};// grab the inital model colours from the user data (if it doesn't exist, get empty array)
  if (!obj) return { materialMap,currentcolours, initialcolours, availableTypes };

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
      materialMap[baseName] = material;
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

  Object.entries(materialMap).forEach(([type, material]) => {
    const key = type as keyof MaterialcolourMap;
    const colour = materialcolourMap[key];
    if (colour) {
      material.color.set(colour);
      material.needsUpdate = true;
    }
  });
}

// This function resets an object's colour palette.
// it also returns the inital colours in case if it is needed
//
export function resetColourPalette(objectRef: React.RefObject<THREE.Object3D>) {
  const object = objectRef.current;
  if (!object) return;
  // grab the inital colours from the user daata if they exist.
  const initialcolours: MaterialcolourMap = object.userData.initialcolours ?? {};
  const { materialMap } = getObjectMaterialMap(objectRef);

  // go through all existing editable components and change their colour.
  Object.entries(materialMap).forEach(([type, material]) => {
    const key = type as keyof MaterialcolourMap;
    if (initialcolours[key]) {
      material.color.set(initialcolours[key]!);
      material.needsUpdate = true;
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

// This function will be used to move the object from the current position (an alternative to just dragging e.g. keyboard presses)
// UI buttons etc
//
export function moveObject(ref: React.RefObject<THREE.Object3D>, newPos: [number, number, number],  onChange: (newPos: [number, number, number]) => void)
{
  if (!ref.current) return;

  const pos = ref.current.position;
  pos.set(pos.x + newPos[0], pos.y + newPos[1], pos.z + newPos[2]);
  onChange([pos.x, pos.y, pos.z]);// pass the change up to parent component for rerender.
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
export function getObjectSizeDifference(objectRef: React.RefObject<THREE.Object3D>) {
  const model = objectRef.current;
  if (model) {
    const current = model.userData.baseScale ?? model.scale.x; // fall back to scale if no base

    // Useing only baseScale comparison to avoid hover distortion
    const percentageChange = ((current / globalScale) - 1) * 100;
    return percentageChange;
  }
  return 0;
}


// This function will just center the pivot of an object horizontally so that it can be rotated as expected.
// it retuns a new group with the model centered.
//
export function centerPivotHorizontal(object: THREE.Object3D) {
  // get bounding box and center the pivot based on that bounding box.
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  const pivotGroup = new THREE.Group();
  box.getCenter(center);

  // Shift horizontally only (X and Z), leave Y unchanged
  const centerXZ = new THREE.Vector3(center.x, 0, center.z);
  object.position.sub(centerXZ);
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
export function getBaseMaterialName<T extends string>(name: string, validBaseNames: T[]): T | undefined {
  const base = name.split('.')[0];
  return validBaseNames.includes(base as T) ? (base as T) : undefined;
}

