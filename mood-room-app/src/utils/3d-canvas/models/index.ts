// Main entry point for model utilities
// Re-export all functions and types for easy importing

// Types
export * from './types';

// Material and color utilities
export {
    applyHoverEmissive,
    getBaseMaterialName,
    getObjectMaterialMap,
    applyColourPalette,
    resetColourPalette,
    applyHoverEffect
} from './modelMaterialUtils';

// Lighting system
export {
    initialiseLights,
    updateAllLights,
    getLightSystemData,
    isObjectLight,
    getObjectLightIntensity,
    isObjectLightOn,
    getObjectLightColour,
    getObjectLightData
} from './lightingSystem';

// Model manipulation
export {
    makeRoughNonMetallic,
    changeModelLayer,
    toggleModelCastingShadow,
    cloneModel,
    calculateObjectBoxSize,
    getObjectRotation,
    getObjectSizeDifference,
    centerPivot
} from './modelManipulation';

// Tag and metadata utilities
export {
    getCategoryTagsFromURL,
    getModelColliderDataUrl,
    applyTagsToObject,
    applyCategoryTags
} from './tagMetaDataUtils';