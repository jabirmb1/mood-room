// This file contains all logic that relates to the model and how to change it.
import * as THREE from "three";
import { globalScale } from "./const";

// declaring types here:
export type ColourPalette = {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };

type MaterialColorMap = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

// This function fully clones a model including its material.
//
export function cloneModel(scene: THREE.Object3D) {
    // cloning the scene
    const clonedModel = scene.clone(true);
    
    // cache for meshes with materials
    const meshesWithMaterials: THREE.Mesh[] = [];

    //cloning the materials as well
    clonedModel.traverse((child: any) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.userData.isDraggable = true// we also want all models (except for floors and walls) to be draggable.
            meshesWithMaterials.push(child);
        }
    });

    // attach cached meshes to the cloned model for later reuse
    (clonedModel as any).meshesWithMaterials = meshesWithMaterials;

    return clonedModel;
}

// This function will return an object's colour map given the reference of an object
// a colour map just stores what colour palette an object is using and at what parts:
//
export function getObjectMaterialMap(objectRef: React.RefObject<THREE.Object3D>): {
  materialMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>>; // current mapping of object's different parts to different colours
  initialColors: Partial<MaterialColorMap>; // what the default colours of the object was (e.g. before user changed them)
  availableTypes: Set<'primary' | 'secondary' | 'tertiary'>; // if object has primary, secondary or tertiary.
} {
  const obj = objectRef.current;
  const materialMap: Partial<Record<'primary' | 'secondary' | 'tertiary', THREE.MeshStandardMaterial>> = {};
  const availableTypes = new Set<'primary' | 'secondary' | 'tertiary'>();
  const initialColors: Partial<MaterialColorMap> = {};

  if (!obj) return { materialMap, initialColors, availableTypes };

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

  // collect materials and their colors
  for (const mesh of targets) {
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (!material) continue;

    ['primary', 'secondary', 'tertiary'].forEach((type) => {
      if (material.name === type) {
        materialMap[type] = material;
        availableTypes.add(type);
        initialColors[type] = `#${material.color.getHexString()}`;
      }
    });
  }

  return { materialMap, initialColors, availableTypes };
}

// This function applies a colour palette to the model.
// we use the getMaterialMapFromRef function to give it a slight performance boost.
//
export function applyColourPalette(model: THREE.Object3D, colourPalette?: ColourPalette) {
  if (!colourPalette) return; // user did not specify custom colours, so just use default ones instead.

  // mapping the colour palette to the material names in the model to reduce code
  // each material in a model will be primary, secondary, or tertiary.
  const materialColorMap: MaterialColorMap = {
    primary: colourPalette.primary,
    secondary: colourPalette.secondary,
    tertiary: colourPalette.tertiary,
  };

  // use material map utility to avoid redundant traversal
  const { materialMap } = getObjectMaterialMap({ current: model });

  Object.entries(materialMap).forEach(([type, material]) => {
    const key = type as keyof MaterialColorMap;
    const color = materialColorMap[key];
    if (color) {
      material.color.set(color);
      material.needsUpdate = true;
    }
  });
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

  return pivotGroup;
}