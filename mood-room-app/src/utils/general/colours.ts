// This script will handle all general logic that relates to colours.
import { HexColor } from '@/types/types';
import tinycolor from 'tinycolor2';

// This function will get a string, and if it's a valid colour it will convert it into hex and return the hex string.
// if it's not valid, it will return an empty string.
//
export function convertValidColourToHex(colour: string): string
{
    const validColour = tinycolor(colour);
    if (validColour.isValid())
    {
        return validColour.toHexString();
    }
    return '';
}
  
// This function will take in a hex code and convert it into a rgb value
//
export function hexToRgb(hex: HexColor) {
    const cleanHex = hex.replace(/^#/, "");// remove the leading '#'
    const bigint = parseInt(cleanHex, 16);// convert into base 16

    // extract the seperate components (r, g, b)
    return {
        // shift the big int by x bits to extract the seperate components.
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

// function to take in rgb values and convert it into hex; returna a hex colour
//
export function rgbToHex(r: number, g: number, b: number) : HexColor{
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);// convert each channel to hex
          return hex.length === 1 ? "0" + hex : hex;// pad with 0 if needed (normalises output)
        })
        .join("") as HexColor
    );
}

//function to convert hue values into rgb values
//Interpolates a temporary hue value `t` between p/q ranges.
//
function hue2rgb(p: number, q: number, t: number){
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
};

// function to convert rgb values to hsl values
// ranges of each value:
// H: 0-259  (hue)
// S: (0- 100)% (saturation)
// L: lightness (0-100)%  (lightness)
//
export function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }) {
    // Normalise RGB to range [0–1]
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
  
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        // determine the hue type based on what channel is dominant.
    
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } 
        else if (max === g) {
            h = (b - r) / d + 2;
        } 
        else if (max === b) {
            h = (r - g) / d + 4;
        }
    
        h /= 6;
    }
  
    // Convert to standard ranges
    let hue = Math.round(h * 359);
    let sat = Math.round(s * 100);
    let light = Math.round(l * 100);
  
    // Clamp to avoid rounding errors
    hue = Math.max(0, Math.min(359, hue));
    sat = Math.max(0, Math.min(100, sat));
    light = Math.max(0, Math.min(100, light));
  
    return { h: hue, s: sat, l: light };
  }
  
//function to convert hsl values to rgb values
//
export function hslToRgb(h: number, s: number, l: number) {
    // Clamp inputs
    h = Math.max(0, Math.min(360, h % 360)); // wrap hue
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));
  
    // normalise [0-1]
    h /= 360; s /= 100; l /= 100;
    let r: number, g: number, b: number;
  
    if (s === 0) {
        // grey, therefore has no hue (saturation is 0)
        r = g = b = l; // grey
    } 
    else {  
        // Calculate temporary p/q values for hue interpolation
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        // interpolate each channel
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
  
    // Scale back to [0–255] and clamp
    return {
        r: Math.round(Math.max(0, Math.min(255, r * 255))),
        g: Math.round(Math.max(0, Math.min(255, g * 255))),
        b: Math.round(Math.max(0, Math.min(255, b * 255))),
    };
  }
  