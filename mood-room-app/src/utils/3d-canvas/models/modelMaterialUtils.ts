/**********This file relates to how we can change the properties of a model's materials ******/
// specific to only this model:


// Material and color manipulation utilities
import * as THREE from "three";
import { MaterialColourType } from "@/types/types";
import { modelMaterialNames } from "../const";
import { ColourPalette, MaterialColourMap, MaterialMap, ObjectMaterialInfo } from "./types";
import { cacheEmissiveState, restoreEmissiveState } from "../scene/meshes";

// Helper function to apply hover emissive effect
export function applyHoverEmissive(material: THREE.MeshStandardMaterial, hovered: boolean): void {
    if (!material || !material.emissive) return;
    
    if (hovered) {
        material.emissive.set('yellow'); // make it glow yellow
        material.emissiveIntensity = 1.0; // default hover intensity of 1.0
    } else {
        // Restore the cached emissive state
        restoreEmissiveState(material);
    }
}

// This function is used to quickly get the object's materials's names and normalize the models
// e.g. primary.001 and primary.002 will both be turned into just primary
export function getBaseMaterialName<T extends string>(name: string, validBaseNames: readonly T[]): T | undefined {
    const base = name.split('.')[0];
    return validBaseNames.includes(base as T) ? (base as T) : undefined;
}

// This function will return an object's colour map given the reference of an object
export function getObjectMaterialMap(objectRef: React.RefObject<THREE.Object3D | null>): ObjectMaterialInfo {
    const obj = objectRef.current;
    const materialMap: MaterialMap = {};
    const availableTypes = new Set<MaterialColourType>();
    const currentcolours: Partial<MaterialColourMap> = {};
    const initialcolours: Partial<MaterialColourMap> =
        (obj?.userData?.initialcolours as MaterialColourMap) ?? {};
    
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

// This function applies a colour palette to the model
export function applyColourPalette(model: THREE.Object3D, colourPalette?: ColourPalette) {
    if (!colourPalette) return; // user did not specify custom colours, so just use default ones instead.

    // mapping the colour palette to the material names in the model
    const materialcolourMap: MaterialColourMap = {
        primary: colourPalette.primary,
        secondary: colourPalette.secondary,
        tertiary: colourPalette.tertiary,
    };

    // use material map utility to avoid redundant traversal
    const { materialMap } = getObjectMaterialMap({ current: model });

    Object.entries(materialMap).forEach(([type, materials]) => {
        const key = type as keyof MaterialColourMap;
        const colour = materialcolourMap[key];
        if (colour && materials) {
            for (const mat of materials) {
                mat.color.set(colour);
                mat.needsUpdate = true;
            }
        }
    });
}

// This function resets an object's colour palette
export function resetColourPalette(objectRef: React.RefObject<THREE.Object3D | null>) {
    const object = objectRef.current;
    if (!object) return;
    
    // grab the initial colours from the user data if they exist
    const initialcolours: MaterialColourMap = object.userData.initialcolours ?? {};
    const { materialMap } = getObjectMaterialMap(objectRef);

    // go through all existing editable components and change their colour
    Object.entries(materialMap).forEach(([type, materials]) => {
        const key = type as keyof MaterialColourMap;
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
export function applyHoverEffect(
    model: THREE.Object3D & { meshesWithMaterials?: THREE.Mesh[] },
    hovered: boolean,
    mode: 'view' | 'edit',
): void {
    if (!model || mode !== 'edit') return;

    const meshes = model.meshesWithMaterials ?? [];
    if (meshes.length > 0) {
        // Use cached meshes to revert back after model has stopped being hovered
        for (const mesh of meshes) {
            if (!mesh || !mesh.material) continue;
            // Handle both single material and material arrays
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) {
                if (material instanceof THREE.MeshStandardMaterial) {
                    applyHoverEmissive(material, hovered);
                    material.needsUpdate = true;
                }
            }
        }
    } else {
        // Fallback: traverse through the model
        model.traverse((child) => {
            if (!(child instanceof THREE.Mesh) || !child.material) return;
            
            // handle when material is an array of materials; or when it is singular
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            
            for (const material of materials) {
                if (material instanceof THREE.MeshStandardMaterial) {
                    applyHoverEmissive(material, hovered);
                    material.needsUpdate = true;
                }
            }
        });
    }
}