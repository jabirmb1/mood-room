//This file will include any constants that are needed for the client side.

import { LightMeshConfig, MoodType } from "@/types/types";
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

//maps mesh names that are supposed to change properties when a light within  model turns on/ off
// to different mesh values.
export const defaultLightMeshConfigs: LightMeshConfig[] = [
    {
      nameContains: "screen_light",
      on: { emissiveColour: new THREE.Color('#ffffff'), emissiveIntensity: 2 },
      off: { emissiveColour: new THREE.Color('#000000'), emissiveIntensity: 0 },
    },
    {
      nameContains: "fabric_light",
      // make the emissive colour be the same colour as the mesh itself.
      on: { emissiveColour: "meshColour", emissiveIntensity: 2, transparent: true, opacity: 0.5 },
      off: { emissiveColour: new THREE.Color('#000000'), emissiveIntensity: 0, transparent: false, opacity: 1.0 },
    },
  ];

// base light intensity for e.g. lamps; etc.
export const baseModelLightIntensity = 3;
/**********consts relating to the mood aspect. ************/

//the different type of moods that's in our project:
export const moodTypes = ['happy', 'sad', 'angry', 'depressed', 'disgusted', 'love', 'pride', 'jealousy', 
    'guilt', 'stressed', 'calm', 'lonely', 'excited', 'anxious', 'content', 'inspired', 'nostalgic','fearful',
     'bored', 'adventurous', 'embarrassed', 'curious'] as const;// moods that are available in the project.

export const defaultMoodType: MoodType = 'content'// default mood type to use if no mood is selected.

