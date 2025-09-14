//This file will include any constants that are needed for the client side.

import { LightMeshConfig, LightSystemConfig, MoodType } from "@/types/types";
import * as THREE from 'three'

export const globalScale = 0.05;// global scale to be applied to all objects so they fit our scene.
export const modelMaterialNames = ['primary', 'secondary', 'tertiary'] as const;// names of the materilas that we want to edit colour of for objects.
export const defaultCameraPosition: [number, number, number] = [10, 10, 10];// TO-DO: scale off room size to center the room in the canvas.
export const collisionSpecificTags = ['decor', 'furniture', 'wall-art'] as const;// object specific tags which directly correlate to how 
// they are placed in rooms. 

// room layout specific consts
export const wallHeight = 10;
export const wallThickness = 0.3
export const roomSize = 13;

export const snapDownwardsCountdown = 0// how quikcly an object should snap downwards after movement (ms) (trying to test out
// different values to see which one fits best; so far 500 seems too late; and 0 seems too sudden (e.g. we want
// for it to not snap when user changes movement axis; which might take a few milliseconds))

/***********consts relating to internal model lights e.g. bulb of a lamp or tv ******/

export const baseModelPointLightIntensity = 55;
export const baseModelSpotLightIntensity = 30;
export const baseScreenLightIntensity = 30;// base intensity for screen light sources

// const mapping every light source's default emissive value.
export const lightSourceEmissiveMap={
  screen_light: 100,
  bulb: 20,
  default: 20
}

export const defaultLightSystemConfig: LightSystemConfig = {
  lightSources: [
    {
      type: 'bulb',
      meshPattern: 'bulb',
      createPointLight: true,
      defaultMaterial: {
        emissiveColor: '#ffffff',
        emissiveIntensity: 0
      },
      pointLightConfig: {
        intensity: baseModelPointLightIntensity,
        color: '#ffffff'
      }
    },
    {
      type: 'screen',
      meshPattern: 'screen_light',
      createPointLight: false, //screens won't use pointlights
      defaultMaterial: {
        emissiveColor: '#ffffff',
        emissiveIntensity: 0
      }
    },
  ],
  affectedMeshes: [
    {
      meshPattern: "screen_light",
      on: { 
        // when light is on; screen becomes emissive white
        //TO DO: make emissive colour match light colour; but make it more white
        emissiveColour: new THREE.Color('#ffffff'), 
        // screen_lights are both light sources and affected meshes; so reuse emissive Intensity here
        emissiveIntensity: lightSourceEmissiveMap.screen_light
      },
      off: { 
        emissiveColour: new THREE.Color('#000000'), 
        emissiveIntensity: 0 
      }
    },
    {
      meshPattern: "fabric_light",
      on: { 
        emissiveColour: "meshColour", 
        emissiveIntensity: 2, 
        transparent: true, 
        opacity: 0.5 
      },
      off: { 
        emissiveColour: new THREE.Color('#000000'), 
        emissiveIntensity: 0, 
        transparent: false, 
        opacity: 1.0 
      }
    },
  ],
  defaultIntensity: baseModelPointLightIntensity,
  defaultColor: '#ffffff'
};

/**********consts relating to the mood aspect. ************/

//the different type of moods that's in our project:
export const moodTypes = ['happy', 'sad', 'angry', 'depressed', 'disgusted', 'love', 'pride', 'jealousy', 
    'guilt', 'stressed', 'calm', 'lonely', 'excited', 'anxious', 'content', 'inspired', 'nostalgic','fearful',
     'bored', 'adventurous', 'embarrassed', 'curious'] as const;// moods that are available in the project.

export const defaultMoodType: MoodType = 'content'// default mood type to use if no mood is selected.

