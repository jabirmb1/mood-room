// Model manipulation utilities (scaling, rotation, positioning, etc.)
import * as THREE from "three";
import { globalScale, modelMaterialNames } from "../const";
import { MaterialColourMap } from "./types";
import { initialiseLights } from "./lightingSystem";
import { getBaseMaterialName } from "./modelMaterialUtils";

// This function will make a model rough and non metallic (mimics lambert material)
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

// This function will move all meshes of the passed in object into a different layer
export function changeModelLayer(scene: THREE.Object3D, layer: number) {
    if (layer < 0 || layer > 31) return; // layers in three js are between 0 to 31
    // traverse through all the meshes of an object and then move it's layers into the passed in layer
    scene.traverse((child: any) => {
        child.layers.set(layer);
    });
}

// This function will be used to make an object cast/ not cast shadows
export function toggleModelCastingShadow(scene: THREE.Object3D, castShadow: boolean) {
    // traverse through all the meshes of an object and then move it's layers into the passed in layer
    scene.traverse((child: any) => {
        if (child.isMesh) {
            child.castShadow = castShadow;
        }
    });
}

// This function fully clones a model including its material
export function cloneModel(scene: THREE.Object3D) {
    // cloning the scene
    const clonedModel = scene.clone(true);
    // whilst we clone the model, we can also store the initial model's colours into the userdata
    const initialcolours: MaterialColourMap = {};
    // cache for meshes with materials
    const meshesWithMaterials: THREE.Mesh[] = [];

    // give every material a lambert esque feel (art style for this project) Artistic matte look
    makeRoughNonMetallic(clonedModel);

    // cloning the materials as well
    clonedModel.traverse((child: any) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.userData.isDraggable = true; // we also want all models (except for floors and walls) to be draggable
            child.castShadow = true; // Make every mesh cast shadows
            child.receiveShadow = true; // make it receive shadows too
            child.layers.set(0);
            meshesWithMaterials.push(child);
        }
        // also store the initial colours of the models, but only the parts that the user can change. (primary, secondary, tertiary)
        const mat = child.material;
        if (mat && mat instanceof THREE.MeshStandardMaterial && typeof mat.name === 'string') {
            const baseName = getBaseMaterialName(mat.name, modelMaterialNames);
            if (baseName) initialcolours[baseName] = `#${mat.color.getHexString()}`;
        }
    });

    // if the model has a bulb; initialise the light values
    initialiseLights(clonedModel);

    // attach cached meshes to the cloned model for later reuse
    (clonedModel as any).meshesWithMaterials = meshesWithMaterials;
    clonedModel.userData.initialcolours = initialcolours;

    return clonedModel;
}

// This function calculates the bounding box and maximum dimension of a 3D object
export function calculateObjectBoxSize(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    return { box, size, center, maxDim };
}

// This function just returns the object's current rotation in degrees
export function getObjectRotation(objectRef: React.RefObject<THREE.Object3D>) {
    const model = objectRef.current;
    if (model) {
        return THREE.MathUtils.radToDeg(model.rotation.y);
    }
    return 0;
}

// Returns the object's scale difference as a percentage
// precondition: model uses uniform scaling
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

// This function will just center the pivot of an object in all axis (gives consistent rotation and collision)
// it returns a new group with the model centered
export function centerPivot(object: THREE.Object3D) {
    // get bounding box and center the pivot based on that bounding box
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