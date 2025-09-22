"use strict";
// Grid for floor-based placement & collision
// Measured in meters, lightweight (no vertical stacks)
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridManager = void 0;
var GridManager = /** @class */ (function () {
    function GridManager(roomWidth, roomHeight, cellSize) {
        var _this = this;
        this.width = Math.floor(roomWidth / cellSize);
        this.height = Math.floor(roomHeight / cellSize);
        this.cellSize = cellSize;
        // initialize empty grid
        this.grid = Array.from({ length: this.height }, function () {
            return Array.from({ length: _this.width }, function () { return ({ occupiedBy: [] }); });
        });
    }
    // Convert world coords → grid cell
    GridManager.prototype.toGridCoords = function (x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize)
        };
    };
    // Occupy floor cells for an object
    GridManager.prototype.occupyFloor = function (x, y, width, depth, objId) {
        var startCol = Math.floor(x / this.cellSize);
        var startRow = Math.floor(y / this.cellSize);
        var endCol = Math.ceil((x + width) / this.cellSize);
        var endRow = Math.ceil((y + depth) / this.cellSize);
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                if (this.isInGrid(c, r)) {
                    this.grid[r][c].occupiedBy.push(objId);
                }
            }
        }
    };
    // Free occupied cells (when removing/moving an object)
    GridManager.prototype.unOccupyFloor = function (objId) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.grid[y][x].occupiedBy = this.grid[y][x].occupiedBy.filter(function (id) { return id !== objId; });
            }
        }
    };
    // Check if placement is valid on floor
    GridManager.prototype.canPlaceOnFloor = function (x, y, width, depth) {
        var startCol = Math.floor(x / this.cellSize);
        var startRow = Math.floor(y / this.cellSize);
        var endCol = Math.ceil((x + width) / this.cellSize);
        var endRow = Math.ceil((y + depth) / this.cellSize);
        // bounds check
        if (startCol < 0 || startRow < 0 || endCol > this.width || endRow > this.height) {
            return false;
        }
        // check cells for occupancy
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupiedBy.length > 0) {
                    return false; // collision
                }
            }
        }
        return true;
    };
    // HELPER METHODS
    // Convert grid coords back → world coords
    GridManager.prototype.gridToPosition = function (gx, gy) {
        return {
            x: gx * this.cellSize,
            y: gy * this.cellSize
        };
    };
    GridManager.prototype.getOccupiedCells = function (obj) {
        var occupiedCells = [];
        var startCol = Math.floor(obj.position.x / this.cellSize);
        var startRow = Math.floor(obj.position.y / this.cellSize);
        var endCol = Math.ceil((obj.position.x + obj.dimensions.width) / this.cellSize);
        var endRow = Math.ceil((obj.position.y + obj.dimensions.depth) / this.cellSize);
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupiedBy.length > 0) {
                    occupiedCells.push({ x: c * this.cellSize, y: r * this.cellSize });
                }
            }
        }
        return occupiedCells;
    };
    GridManager.prototype.checkCollision = function (obj1, obj2) {
        var occupiedCells1 = this.getOccupiedCells(obj1);
        var occupiedCells2 = this.getOccupiedCells(obj2);
        return occupiedCells1.some(function (cell) { return occupiedCells2.includes(cell); });
    };
    GridManager.prototype.isTouchingWall = function (obj) {
        var occupiedCells = this.getOccupiedCells(obj);
        var startCol = Math.floor(obj.position.x / this.cellSize);
        var startRow = Math.floor(obj.position.y / this.cellSize);
        var endCol = Math.ceil((obj.position.x + obj.dimensions.width) / this.cellSize);
        var endRow = Math.ceil((obj.position.y + obj.dimensions.depth) / this.cellSize);
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                if (this.grid[r][c].occupiedBy.length > 0) {
                    return true;
                }
            }
        }
        return false;
    };
    GridManager.prototype.isInGrid = function (x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    };
    return GridManager;
}());
exports.GridManager = GridManager;
