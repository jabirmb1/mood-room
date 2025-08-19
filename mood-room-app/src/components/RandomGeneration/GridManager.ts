// Grid for random generation
// create and maintains grid 
//for validation of placement and objects measured in meters
//
import { wallHeight } from "../../utils/3d-canvas/const";

export type GridStack = {
    base: number;      // bottom of the object (m)
    height: number;    // height of the object (m)
    objectRef: string; // object ID
};

export type GridCell = {
    stacks: GridStack[];  // multiple stacked objects allowed
};


export class GridManager{
    private grid: GridCell[][];
    private cellsize: number;
    width: number;
    height: number;
    
    //constructor: creates a new empty grid
    constructor(Width: number, Height:number , CellSize: number){
        this.width = Math.floor(Width / CellSize);
        this.height = Math.floor(Height / CellSize);
        this.cellsize = CellSize;
        
        //initialize grid (Empty grid)
        this.grid = Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => ({ stacks: [] }))
        );
    }

    //Mark occupied cells, for whole of grid in meters
    ooccupyCellInMeters(
        x: number,
        y: number,
        width: number,
        depth: number,
        base: number,
        height: number,
        objId: string
    ) {
        const startCol = Math.floor(x / this.cellsize);
        const startRow = Math.floor(y / this.cellsize);
        const endCol = Math.ceil((x + width) / this.cellsize);
        const endRow = Math.ceil((y + depth) / this.cellsize);
    
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                this.grid[r][c].stacks.push({ base, height, objectRef: objId });
            }
        }
    }
    
    

    // check if a cell is in the grid so we dont go out of bounds
    private isInGrid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // free a occupied cell, used when replacing an object or deleting an object
    unOccupyCell(objectId: string){
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].stacks = this.grid[y][x].stacks.filter(
                    stack => stack.objectRef !== objectId
                );
            }
        }
    }
    
    //check if a cell is free aswell as the height of the object
    canPlaceObjectInMeters(
        x: number,
        y: number,
        width: number,
        depth: number,
        base: number,
        height: number,
        wallHeight: number
    ): boolean {
        const startCol = Math.floor(x / this.cellsize);
        const startRow = Math.floor(y / this.cellsize);
        const endCol = Math.ceil((x + width) / this.cellsize);
        const endRow = Math.ceil((y + depth) / this.cellsize);
    
        // bounds check
        if (startCol < 0 || startRow < 0 || endCol > this.width || endRow > this.height) {
            return false;
        }
    
        // check wall height
        if (base + height > wallHeight || height <= 0 || base < 0) {
            return false;
        }
    
        // check every cell
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const cell = this.grid[r][c];
    
                for (const stack of cell.stacks) {
                    const existingTop = stack.base + stack.height;
    
                    // overlap if: new base < existing top AND new top > existing base
                    if (base < existingTop && (base + height) > stack.base) {
                        return false;
                    }
                }
            }
        }
    
        return true;
    }
    

    // to convert from x y cords to grid cell cordinates sinch grid cell not same as screen cordinates
    gridToPosition(gx: number, gy: number): {x: number, y: number}{
        return {
            x: gx * this.cellsize,
            y: gy * this.cellsize

        };
    }


    // // for double checking and debugging
    // debugPrint(width = this.width, height = this.height) {
    //     for (let y = 0; y < height; y++) {
    //         console.log(this.grid[y].slice(0, width).map(c => (c.occupied ? "X" : ".")).join(" "));
    //     }
    // }

}