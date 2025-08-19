import { modelMaterialNames, moodTypes } from "@/utils/3d-canvas/const";
import { useRapier } from "@react-three/rapier";
// model type.
export type Model = {
    id: string;
    url: string;
    colourPalette?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
    position: [number, number, number];
    scale?: [number, number, number];
    rotation?: [number, number, number];// in radians.

    transform?: {// optional transform data for model during editing page (used to keep transform data in sync with the model)
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    };
    tags?: string[]; // Preloaded category tags (optional)
    colliderDataUrl?: string | null// pre loaded url of where the json file containing collider information of the specifc model is
    // stored in.
  };

// colour type (e.g. primary; secondary and tertiary)
export type MaterialColourType = typeof modelMaterialNames[number];

// rotation type (degrees)
export type RotationDegrees = { x: number; y: number; z: number };

// type to define a rigid bodie's max and min bounds.
export type RapierAABB = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};


// create a type for the world wrapper from three/ rapier rather than raw world js type.

// This gets the full type returned by the hook
type UseRapierReturn = ReturnType<typeof useRapier>;

// Extract the `world` type
export type RapierWorld = UseRapierReturn["world"];
export type Rapier = UseRapierReturn["rapier"];

// This is how the collider jsons should be structured:
export type ColliderJsonData={
  shape: 'box' | 'sphere' | "capsule",
  position: [number, number, number],
  rotation: [number, number, number],// stored as eular
  dimensions: number[]//depending on the shape it can be an array of 1, 2 or 3. (we are only using box, capsule and spheres)
}

export type HexColor = `#${string}`;
type colourRange = [HexColor, HexColor];// a range of colours (e.g. from light to dark) for the colour palette.
//The structure that each object colour palette will follow
export type ObjectColourPalette = {
  primary: colourRange,// a colour range for the primary colour of the object
  secondary: colourRange;
  tertiary?: colourRange;
};


//The structure that each room colour paletee will follow:
export type roomColourPalette = {
  primary: colourRange;// colour of the walls (given as a range of colours.)
  secondary: colourRange;// colour of the floor
  tertiary: colourRange;// colour of the skirting boards
  objectColourPalettes: ObjectColourPalette[]// colour palettes for each object in the room (general)
}

// the different types of moods that are available in the project. (mood type)
export type MoodType = typeof moodTypes[number];