/********* some extra math functions that the default in built math module does not have*/


// This function will lerp between two different numbers.
//
export function lerp(start: number, end: number, lerpingFactor: number) : number{
    return start + (end - start) * lerpingFactor;
}