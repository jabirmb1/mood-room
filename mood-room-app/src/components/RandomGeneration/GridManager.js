"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridManager = void 0;
var GridManager = /** @class */ (function () {
    //constructor: creates a new empty grid
    function GridManager(Width, Height, CellSize) {
        var _this = this;
        this.width = Math.floor(Width / CellSize);
        this.height = Math.floor(Height / CellSize);
        this.cellsize = CellSize;
        //initialize grid (Empty grid)
        this.grid = Array.from({ length: this.height }, function () {
            return Array.from({ length: _this.width }, function () { return ({ stacks: [] }); });
        });
    }
    //Mark occupied cells, for whole of grid in meters
    GridManager.prototype.ooccupyCellInMeters = function (x, y, width, depth, base, height, objId) {
        var startCol = Math.floor(x / this.cellsize);
        var startRow = Math.floor(y / this.cellsize);
        var endCol = Math.ceil((x + width) / this.cellsize);
        var endRow = Math.ceil((y + depth) / this.cellsize);
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                this.grid[r][c].stacks.push({ base: base, height: height, objectRef: objId });
            }
        }
    };
    // check if a cell is in the grid so we dont go out of bounds
    GridManager.prototype.isInGrid = function (x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    };
    // free a occupied cell, used when replacing an object or deleting an object
    GridManager.prototype.unOccupyCell = function (objectId) {
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                this.grid[y][x].stacks = this.grid[y][x].stacks.filter(function (stack) { return stack.objectRef !== objectId; });
            }
        }
    };
    //check if a cell is free aswell as the height of the object
    GridManager.prototype.canPlaceObjectInMeters = function (x, y, width, depth, base, height, wallHeight) {
        var startCol = Math.floor(x / this.cellsize);
        var startRow = Math.floor(y / this.cellsize);
        var endCol = Math.ceil((x + width) / this.cellsize);
        var endRow = Math.ceil((y + depth) / this.cellsize);
        // bounds check
        if (startCol < 0 || startRow < 0 || endCol > this.width || endRow > this.height) {
            return false;
        }
        // check wall height
        if (base + height > wallHeight || height <= 0 || base < 0) {
            return false;
        }
        // check every cell
        for (var r = startRow; r < endRow; r++) {
            for (var c = startCol; c < endCol; c++) {
                var cell = this.grid[r][c];
                for (var _i = 0, _a = cell.stacks; _i < _a.length; _i++) {
                    var stack = _a[_i];
                    var existingTop = stack.base + stack.height;
                    // overlap if: new base < existing top AND new top > existing base
                    if (base < existingTop && (base + height) > stack.base) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    // to convert from x y cords to grid cell cordinates sinch grid cell not same as screen cordinates
    GridManager.prototype.gridToPosition = function (gx, gy) {
        return {
            x: gx * this.cellsize,
            y: gy * this.cellsize
        };
    };
    return GridManager;
}());
exports.GridManager = GridManager;
