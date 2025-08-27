/*********** soem extra useful functions that relates to arrays *******/

//This function will pick out and return a random element from passed in array.
//
export function pickRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Deep clone for objects and arrays and then returns the clone
export function deepClone<T>(value: T): T {
    if (value === null || typeof value !== "object") {
      return value; // primitives just return as-is
    }
  
    if (Array.isArray(value)) {
      return value.map(item => deepClone(item)) as T;
    }
  
    // Plain object
    const clonedObj: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clonedObj[key] = deepClone((value as any)[key]);
      }
    }
    return clonedObj as T;
}