// Grid for floor-based placement & collision
// Measured in meters, lightweight (no vertical stacks)

import { PlacedObject } from "./PlacementEngine";

export type GridCell = {
    occupiedBy: string[]; // IDs of objects occupying this floor cell
};

export class GridManager {
    private grid: GridCell[][];
    private cellSize: number;
    width: number;
    height: number;

    constructor(roomWidth: number, roomHeight: number, cellSize: number) {
        this.width = Math.floor(roomWidth / cellSize);
        this.height = Math.floor(roomHeight / cellSize);
        this.cellSize = cellSize;

        // initialize empty grid
        this.grid = Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => ({ occupiedBy: [] }))
        );
    }

    // Convert world coords → grid cell
    private toGridCoords(x: number, y: number) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    }

    // Occupy floor cells for an object
    occupyFloor(
        x: number,
        y: number,
        width: number,
        depth: number,
        objId: string
    ) {
        const startCol = Math.floor(x / this.cellSize);
        const startRow = Math.floor(y / this.cellSize);
        const endCol = Math.ceil((x + width) / this.cellSize);
        const endRow = Math.ceil((y + depth) / this.cellSize);

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (this.isInGrid(c, r)) {
                    this.grid[r][c].occupiedBy.push(objId);
                }
            }
        }
    }

    // Free occupied cells (when removing/moving an object)
    unOccupyFloor(objId: string) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].occupiedBy = this.grid[y][x].occupiedBy.filter(
                    id => id !== objId
                );
            }
        }
    }

    // Check if placement is valid on floor
    canPlaceOnFloor(
        x: number,
        y: number,
        width: number,
        depth: number
    ): boolean {
        const startCol = Math.floor(x / this.cellSize);
        const startRow = Math.floor(y / this.cellSize);
        const endCol = Math.ceil((x + width) / this.cellSize);
        const endRow = Math.ceil((y + depth) / this.cellSize);

        // bounds check
        if (startCol < 0 || startRow < 0 || endCol > this.width || endRow > this.height) {
            return false;
        }

        // check cells for occupancy
        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupiedBy.length > 0) {
                    return false; // collision
                }
            }
        }

        return true;
    }

    // HELPER METHODS
    

    // Convert grid coords back → world coords
    gridToPosition(gx: number, gy: number): { x: number; y: number } {
        return {
            x: gx * this.cellSize,
            y: gy * this.cellSize
        };
    }

    getOccupiedCells(obj: { position: { x: number; y: number }; dimensions: { width: number; depth: number } }) {
        const occupiedCells: { x: number; y: number }[] = [];
        const startCol = Math.floor(obj.position.x / this.cellSize);
        const startRow = Math.floor(obj.position.y / this.cellSize);
        const endCol = Math.ceil((obj.position.x + obj.dimensions.width) / this.cellSize);
        const endRow = Math.ceil((obj.position.y + obj.dimensions.depth) / this.cellSize);
    
        for (let r = startRow; r < endRow; r++) {
          for (let c = startCol; c < endCol; c++) {
            const cell = this.grid[r]?.[c];
            if (cell && cell.occupiedBy.length > 0) {
              occupiedCells.push({ x: c * this.cellSize, y: r * this.cellSize });
            }
          }
        }
    
        return occupiedCells;
      }
      
    checkCollision(obj1: PlacedObject, obj2: PlacedObject): boolean {
        const occupiedCells1 = this.getOccupiedCells(obj1);
        const occupiedCells2 = this.getOccupiedCells(obj2);

        return occupiedCells1.some(cell => occupiedCells2.includes(cell));
    }
    isTouchingWall(obj: PlacedObject): boolean {
        const occupiedCells = this.getOccupiedCells(obj);
        const startCol = Math.floor(obj.position.x / this.cellSize);
        const startRow = Math.floor(obj.position.y / this.cellSize);
        const endCol = Math.ceil((obj.position.x + obj.dimensions.width) / this.cellSize);
        const endRow = Math.ceil((obj.position.y + obj.dimensions.depth) / this.cellSize);

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupiedBy.length > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    private isInGrid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    
}
