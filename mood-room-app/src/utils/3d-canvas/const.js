"use strict";
//This file will include any constants that are needed for the client side.
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapDownwardsCountdown = exports.roomSize = exports.wallThickness = exports.wallHeight = exports.collisionSpecificTags = exports.defaultCameraPosition = exports.modelMaterialNames = exports.globalScale = void 0;
exports.globalScale = 0.05; // global scale to be applied to all objects so they fit our scene.
exports.modelMaterialNames = ['primary', 'secondary', 'tertiary']; // names of the materilas that we want to edit colour of for objects.
exports.defaultCameraPosition = [10, 10, 10]; // TO-DO: scale off room size to center the room in the canvas.
exports.collisionSpecificTags = ['decor', 'furniture', 'wall-art']; // object specific tags which directly correlate to how 
// they are placed in rooms. 
// room layout specific consts
exports.wallHeight = 10;
exports.wallThickness = 0.3;
exports.roomSize = 13;
exports.snapDownwardsCountdown = 0; // how quikcly an object should snap downwards after movement (ms) (trying to test out
// different values to see which one fits best; so far 500 seems too late; and 0 seems too sudden (e.g. we want
// for it to not snap when user changes movement axis; which might take a few milliseconds))
