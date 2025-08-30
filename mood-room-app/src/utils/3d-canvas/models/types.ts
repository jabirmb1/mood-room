/***********local types specific to only this model folder ************/

// Type definitions for model system
import * as THREE from "three";
import {MaterialColourType} from "@/types/types";

export type ColourPalette = {
    primary?: string;
    secondary?: string;
    tertiary?: string;
};

export type MaterialColourMap = {
    primary?: string;
    secondary?: string;
    tertiary?: string;
}

export type ModelTags = {
    addTags?: string[];
    removeTags?: string[];
}

export type MaterialMap = Partial<Record<MaterialColourType, THREE.MeshStandardMaterial[]>>;

export type ObjectMaterialInfo = {
    materialMap: MaterialMap;
    currentcolours: Partial<MaterialColourMap>;
    initialcolours: Partial<MaterialColourMap>;
    availableTypes: Set<MaterialColourType>;
};