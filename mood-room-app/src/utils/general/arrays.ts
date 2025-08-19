/*********** soem extra useful functions that relates to arrays *******/

//This function will pick out and return a random element from passed in array.
//
// helper to pick a random element from an array
export function pickRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}