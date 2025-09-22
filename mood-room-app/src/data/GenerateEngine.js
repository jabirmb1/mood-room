"use strict";
// GenerateEngine.ts
// AI passes selected objects into here using and array of objects
// objects dimensions and path collected from json and rules 
// constructs new grid and runs placement engine one object at a time
// if all objects placed successfully return placed objects position to be passed to editor
// else return failures
// 
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateEngine = void 0;
// import { wallHeight } from "@/utils/3d-canvas/const";
var GridManager_1 = require("./GridManager");
var PlacementEngine_1 = require("./PlacementEngine");
// Room setup defaults
var roomWidth = 8; // meters
var roomDepth = 6; // meters
var cellSize = 0.25; // finer precision
var wallHeight = 10;
var objectsToPlace = [
    { name: "BookStackBasic" },
    { name: "WaterBottle" },
    { name: "armchair" },
    { name: "BedBasic" },
    { name: "BedsideTableBasic" },
    { name: "BookshelfBasic" }
];
var GenerateEngine = /** @class */ (function () {
    // construct new grid and placement engine
    function GenerateEngine(width, depth) {
        if (width === void 0) { width = roomWidth; }
        if (depth === void 0) { depth = roomDepth; }
        this.width = width;
        this.depth = depth;
        this.grid = new GridManager_1.GridManager(this.width, this.depth, cellSize);
        this.engine = new PlacementEngine_1.PlacementEngine({
            grid: this.grid,
            roomWidth: this.width,
            roomDepth: this.depth,
            wallHeight: wallHeight,
            cellSize: cellSize
        });
    }
    /**
     * Load asset manifest (once per call)
     */
    // private async loadManifest() {
    //   const res = await fetch("/assetsManifest.json");
    //   if (!res.ok) throw new Error("Failed to load assetManifest.json");
    //   return res.json();
    // }
    GenerateEngine.prototype.loadManifest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, readFile, path, filePath, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof window !== "undefined")) return [3 /*break*/, 2];
                        return [4 /*yield*/, fetch("/assetsManifest.json")];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error("Failed to load assetManifest.json");
                        return [2 /*return*/, res.json()];
                    case 2: return [4 /*yield*/, Promise.resolve().then(function () { return require("fs/promises"); })];
                    case 3:
                        readFile = (_a.sent()).readFile;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("path"); })];
                    case 4:
                        path = _a.sent();
                        filePath = path.resolve(__dirname, "../../public/assetsManifest.json");
                        return [4 /*yield*/, readFile(filePath, "utf-8")];
                    case 5:
                        data = _a.sent();
                        return [2 /*return*/, JSON.parse(data)];
                }
            });
        });
    };
    /**
     * Build a WorldObject from manifest + meta ie add paths and dimensions
     */
    GenerateEngine.prototype.buildWorldObject = function (name, manifest) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, metaRes, meta;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = manifest.find(function (m) { return m.name === name; });
                        if (!entry)
                            throw new Error("Object ".concat(name, " not found in manifest"));
                        return [4 /*yield*/, fetch(entry.meta)];
                    case 1:
                        metaRes = _a.sent();
                        if (!metaRes.ok)
                            throw new Error("Failed to load meta for ".concat(name));
                        return [4 /*yield*/, metaRes.json()];
                    case 2:
                        meta = _a.sent();
                        return [2 /*return*/, {
                                name: entry.name,
                                path: entry.path,
                                dimensions: meta.dimensions,
                                rules: [],
                            }];
                }
            });
        });
    };
    /**
     * Place objects one by one
     */
    GenerateEngine.prototype.placeObjects = function (objects) {
        return __awaiter(this, void 0, void 0, function () {
            var manifest, worldObjects, _i, objects_1, obj, built, _a, placed, failures;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadManifest()];
                    case 1:
                        manifest = _b.sent();
                        worldObjects = [];
                        _i = 0, objects_1 = objects;
                        _b.label = 2;
                    case 2:
                        if (!(_i < objects_1.length)) return [3 /*break*/, 5];
                        obj = objects_1[_i];
                        return [4 /*yield*/, this.buildWorldObject(obj.name, manifest)];
                    case 3:
                        built = _b.sent();
                        worldObjects.push(built);
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        _a = this.engine.placeSequential(worldObjects), placed = _a.placed, failures = _a.failures;
                        // ✅ Log placed objects (just name + position)
                        placed.forEach(function (p) {
                            console.log("Placed: ".concat(p.name, " at (x=").concat(p.position.x, ", y=").concat(p.position.y, "), rotation=").concat(p.rotation));
                        });
                        // ✅ Log failures
                        failures.forEach(function (f) {
                            console.log("Failed: ".concat(f.obj.name, " \u2192 ").concat(f.reason));
                        });
                        return [2 /*return*/, { placed: placed, failures: failures }];
                }
            });
        });
    };
    return GenerateEngine;
}());
exports.GenerateEngine = GenerateEngine;
// Run a quick test
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var engine, _a, placed, failures;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                engine = new GenerateEngine();
                return [4 /*yield*/, engine.placeObjects([
                        { name: "BookStackBasic" },
                        { name: "WaterBottle" },
                        { name: "armchair" },
                        { name: "BedBasic" },
                        { name: "BedsideTableBasic" },
                        { name: "BookshelfBasic" }
                    ])];
            case 1:
                _a = _b.sent(), placed = _a.placed, failures = _a.failures;
                console.log("Final placed:", placed);
                console.log("Final failures:", failures);
                return [2 /*return*/];
        }
    });
}); })();
