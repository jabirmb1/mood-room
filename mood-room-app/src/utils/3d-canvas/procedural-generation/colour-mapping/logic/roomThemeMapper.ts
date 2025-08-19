/*************This file will handle all the logic to map the colour maps to a room/scene ****/

import { colourRange, HexColor, MoodType, ObjectColourPalette, resolvedObjectColourPalette, resolvedRoomColourPalette, roomColourPalette } from "@/types/types";
import { defaultMoodType } from "@/utils/3d-canvas/const";
import { moodColourPaletteEmotionMap } from "../maps/moodColourPaletteMap";
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "@/utils/general/colours";
import { lerp } from "three/src/math/MathUtils.js";
import { pickRandomElement } from "@/utils/general/arrays";


//This function will get an emotion and return the corresponding mood colour palette.
//
function getColourPalette(mood: MoodType) : roomColourPalette[]{
    return moodColourPaletteEmotionMap[mood]
}

// helper to generate a resolved object colour palette
function resolveObjectPalette(palette: ObjectColourPalette): resolvedObjectColourPalette {
    return {
        primary: generateRandomColour(palette.primary),
        secondary: generateRandomColour(palette.secondary),
        tertiary: palette.tertiary ? generateRandomColour(palette.tertiary) : undefined
    };
}

// helper to generate a resolved room palette
function resolveRoomPalette(palette: roomColourPalette, objectPalette: resolvedObjectColourPalette): resolvedRoomColourPalette {
    return {
        primary: generateRandomColour(palette.primary),
        secondary: generateRandomColour(palette.secondary),
        tertiary: palette.tertiary ? generateRandomColour(palette.tertiary) : '#FFFFFF',
        objectColourPalette: objectPalette
    };
}

//This function is used to lerp hues; but it find take the shortest path so that we don't 
// cross any unwanted colours.
//
function lerpHue(h1: number, h2: number, t: number): number {
    let d = h2 - h1;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return (h1 + d * t + 360) % 360;
  }

//This function will be used to randommly pick colours between the given ranges for the passed in colour range
// from the room colour palette type.
// returns colour as a hex string.
//
function generateRandomColour(colourRange: colourRange) : HexColor
{
    // for both the colours within the colour range, convert it into hsl values.
    const [colour1, colour2] = colourRange.map((hex)=>rgbToHsl(hexToRgb(hex)))

    const t = Math.random();

    // interpolate each channel
    const h = lerpHue(colour1.h, colour2.h, t);
    const s = lerp(colour1.s, colour2.s, t);
    const l = lerp(colour1.l, colour2.l, t);

    // convert it back into rgb
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);// convert back into hex (our map uses hex codes)
}

// This function will get an emotion; and then find the corresponding colour palette; and then generate
// random colours within the palette and return it.
//
export function generateMoodRoomColourPalette(mood: MoodType) : resolvedRoomColourPalette | null
{
    let palettes = getColourPalette(mood);// get the array of palettes associated with that mood.
    
    // if no palettes were found; use the default mood instead; which should always have palettes.
    if (!palettes.length){
        console.warn('no palettes for the mood:', mood, 'was found; using default mood instead.')
        palettes = getColourPalette(defaultMoodType);
    } 

    const chosenPalette = pickRandomElement(palettes);
    const chosenObjectPalette = pickRandomElement(chosenPalette.objectColourPalettes);

    const resolvedObject = resolveObjectPalette(chosenObjectPalette);
    return resolveRoomPalette(chosenPalette, resolvedObject);
}