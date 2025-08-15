// Grid for random generation
// create and maintains grid 
//for validation of placement and objects measured in meters 
//
export type GridCell = {
    occupied: boolean;
    objectref?: string;
}

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
        this.grid = Array.from({ length: this.height}, () =>
            Array.from({ length:this.width}, () => ({occupied:false}))
        );
    }

    //Mark occupied cells, for whole of grid in meters
    occupyCellInMeters(x: number, y: number, width: number, height: number, objId: string) {
        const startCol = Math.floor(x / this.cellsize);
        const startRow = Math.floor(y / this.cellsize);
        const endCol = Math.ceil((x + width) / this.cellsize);
        const endRow = Math.ceil((y + height) / this.cellsize);
    
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                this.grid[r][c].occupied = true;
                this.grid[r][c].objectref = objId;
            }
        }
    }
    

    // check if a cell is in the grid so we dont go out of bounds
    private isInGrid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // free a occupied cell, used when replacing an object or deleting an object
    toFreeCell(objectId: string){
        for(let y= 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.grid[y][x].objectref === objectId){
                    this.grid[y][x].occupied = false;
                    this.grid[y][x].objectref = undefined;
                }
            }
        }
    }
    
    //check if a cell is free 
    validCellInMeters(x: number, y: number, width: number, height: number): boolean {
        const startCol = Math.floor(x / this.cellsize); //make from meters to grid cells
        const startRow = Math.floor(y / this.cellsize);
        const endCol = Math.ceil((x + width) / this.cellsize); 
        const endRow = Math.ceil((y + height) / this.cellsize);
    
        // Check bounds to make sure we dont go out of bounds
        if (startCol < 0 || startRow < 0 || endCol > this.width || endRow > this.height) {
            return false;
        }
    
        // Check occupancy to make sure the cell is not occupied
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupied) {
                    return false; // already occupied
                }
            }
        }
    
        return true; // all clear
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