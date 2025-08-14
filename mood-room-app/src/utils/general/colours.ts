// This script will handle all general logic that relates to colours.
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
  