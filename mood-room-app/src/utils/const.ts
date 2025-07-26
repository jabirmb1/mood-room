//This file will include any constants that are needed for the client side.

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