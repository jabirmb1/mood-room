"use strict";
// PlacementEngine.ts
// Drives procedural placement using your GridManager + TS rule configuration
// places object recieved one by one.
//
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacementEngine = void 0;
// -------------------------------
// Engine
// -------------------------------
var PlacementEngine = /** @class */ (function () {
    function PlacementEngine(opts) {
        this.grid = opts.grid;
        this.roomWidth = opts.roomWidth;
        this.roomDepth = opts.roomDepth;
        this.wallHeight = opts.wallHeight;
        this.cellSize = opts.cellSize;
    }
    /**
     * Place objects in the given order. Returns placed + failures.
     */
    PlacementEngine.prototype.placeSequential = function (objects) {
        var _this = this;
        var placed = []; // array of PlacedObject
        var failures = []; // array of { obj: WorldObject; reason: string } why it failed
        var _loop_1 = function (obj) {
            var id = this_1.makeId(obj.name);
            var candidates = this_1.generateCandidates(obj, placed);
            // Validate each candidate with grid + rule checks. keep the valid set
            var valid = candidates.filter(function (c) {
                return _this.isCandidateValid(obj, c, placed);
            });
            if (valid.length === 0) {
                failures.push({ obj: obj, reason: "No valid candidates after rule/grid checks." });
                return "continue";
            }
            // Pick randomly (uniform). You can weight later if you want.
            var choice = valid[Math.floor(Math.random() * valid.length)];
            // Occupy the grid (important: use base/height for vertical stacking)
            this_1.occupy(choice, obj, id);
            placed.push(__assign(__assign({}, obj), { id: id, position: { x: choice.x, y: choice.y }, base: choice.base, rotation: choice.rotation }));
        };
        var this_1 = this;
        // cycle through each object
        for (var _i = 0, objects_1 = objects; _i < objects_1.length; _i++) {
            var obj = objects_1[_i];
            _loop_1(obj);
        }
        return { placed: placed, failures: failures };
    };
    // -------------------------------
    // Candidate generation
    // -------------------------------
    /**
     * Produce a pool of candidate placements from rules:
     * - relative (onTopOf/insideOf/adjacent) if targets exist
     * - otherwise floor scanning (entire room or just walls if required)
     */
    PlacementEngine.prototype.generateCandidates = function (obj, placed) {
        var out = [];
        // 1) relative rules first (depend on targets being already placed)
        var rel = this.generateRelativeCandidates(obj, placed);
        out.push.apply(out, rel);
        // 2) If no relative rules produced anything (or obj also supports floor),
        //    scan floor cells
        var wantsFloor = obj.rules.some(function (r) { return r.type === "mustTouchGround" && r.value; }) ||
            obj.rules.every(function (r) { return !["onTopOf", "insideOf", "under"].includes(r.type); });
        if (wantsFloor) {
            var touchWall = obj.rules.find(function (r) { return r.type === "mustTouchWall" && r.value; });
            if (touchWall) {
                out.push.apply(out, this.generateWallCandidates(obj));
            }
            else {
                out.push.apply(out, this.generateFloorCandidates(obj));
            }
        }
        // no duplicates in candidates
        return this.uniqueByCell(out);
    };
    // Floor scan over the whole room
    PlacementEngine.prototype.generateFloorCandidates = function (obj) {
        var res = [];
        var step = this.cellSize; // aligned to grid cells
        for (var y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
            for (var x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
                res.push({ x: x, y: y, base: 0, why: "floor-scan" });
            }
        }
        return res;
    };
    // Only along the 4 walls (object fully inside room) MODIFY!!!!
    PlacementEngine.prototype.generateWallCandidates = function (obj) {
        var res = [];
        var step = this.cellSize;
        // North wall (y = 0), slide along X
        for (var x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
            res.push({ x: x, y: 0, base: 0, why: "wall-north" });
        }
        // South wall (y + depth = roomDepth)
        for (var x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
            res.push({ x: x, y: this.roomDepth - obj.dimensions.depth, base: 0, why: "wall-south" });
        }
        // West wall (x = 0), slide along Y
        for (var y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
            res.push({ x: 0, y: y, base: 0, why: "wall-west" });
        }
        // East wall (x + width = roomWidth)
        for (var y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
            res.push({ x: this.roomWidth - obj.dimensions.width, y: y, base: 0, why: "wall-east" });
        }
        return res;
    };
    // Relative to already placed targets (onTopOf / insideOf / adjacency)
    PlacementEngine.prototype.generateRelativeCandidates = function (obj, placed) {
        var _a, _b;
        var res = [];
        var onTopRules = obj.rules.filter(function (r) { return r.type === "onTopOf"; });
        var _loop_2 = function (rule) {
            var t = placed.find(function (p) { return p.name === rule.target; }); // find target so we can calculate position
            if (!t)
                return "continue";
            // center-on-top by default - so the onject will be placed in the middle of the target
            var x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
            var y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
            var base = t.base + t.dimensions.height; // stack
            res.push({ x: x, y: y, base: base, why: "onTopOf:".concat(rule.target) }); // add to list of candidates
        };
        for (var _i = 0, onTopRules_1 = onTopRules; _i < onTopRules_1.length; _i++) {
            var rule = onTopRules_1[_i];
            _loop_2(rule);
        }
        var insideRules = obj.rules.filter(function (r) { return r.type === "insideOf"; });
        var _loop_3 = function (rule) {
            var t = placed.find(function (p) { return p.name === rule.target; }); // find target so we can calculate position
            if (!t)
                return "continue";
            // Prefer explicit slots on the container- (add slots to shelves and ect)
            if (t.slots && t.slots.length) {
                for (var _g = 0, _h = t.slots; _g < _h.length; _g++) {
                    var slot = _h[_g];
                    res.push({
                        x: t.position.x + slot.x,
                        y: t.position.y + slot.y,
                        base: ((_a = slot.base) !== null && _a !== void 0 ? _a : t.base),
                        why: "insideOf:".concat(rule.target, ":slot"),
                    });
                }
            }
            else {
                // fallback: center inside target’s footprint at same base
                var x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
                var y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
                res.push({ x: x, y: y, base: t.base, why: "insideOf:".concat(rule.target, ":fallback") });
            }
        };
        for (var _c = 0, insideRules_1 = insideRules; _c < insideRules_1.length; _c++) {
            var rule = insideRules_1[_c];
            _loop_3(rule);
        }
        var underRules = obj.rules.filter(function (r) { return r.type === "under"; });
        var _loop_4 = function (rule) {
            var t = placed.find(function (p) { return p.name === rule.target; });
            if (!t)
                return "continue";
            // Put on floor, centered under the target’s footprint
            var x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
            var y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
            res.push({ x: x, y: y, base: 0, why: "under:".concat(rule.target) });
        };
        for (var _d = 0, underRules_1 = underRules; _d < underRules_1.length; _d++) {
            var rule = underRules_1[_d];
            _loop_4(rule);
        }
        // Adjacency helpers (left/right/front/back) with optional distance
        var adjacents = [
            { key: "toRightOf", dx: +1, dy: 0 },
            { key: "toLeftOf", dx: -1, dy: 0 },
            { key: "inFrontOf", dx: 0, dy: +1 },
            { key: "behind", dx: 0, dy: -1 },
        ];
        var _loop_5 = function (adj) {
            var rules = obj.rules.filter(function (r) { return r.type === adj.key; });
            var _loop_7 = function (rule) {
                var t = placed.find(function (p) { return p.name === rule.target; });
                if (!t)
                    return "continue";
                var gap = (_b = rule.distance) !== null && _b !== void 0 ? _b : 0.2; // default 20 cm gap
                // calculate position based on target's position e.g sidetablt to right of bed
                var x = t.position.x +
                    (adj.dx > 0
                        ? t.dimensions.width + gap
                        : adj.dx < 0
                            ? -obj.dimensions.width - gap
                            : (t.dimensions.width - obj.dimensions.width) / 2);
                var y = t.position.y +
                    (adj.dy > 0
                        ? t.dimensions.depth + gap
                        : adj.dy < 0
                            ? -obj.dimensions.depth - gap
                            : (t.dimensions.depth - obj.dimensions.depth) / 2);
                res.push({ x: x, y: y, base: 0, why: "".concat(adj.key, ":").concat(rule.target) });
            };
            for (var _j = 0, rules_1 = rules; _j < rules_1.length; _j++) {
                var rule = rules_1[_j];
                _loop_7(rule);
            }
        };
        for (var _e = 0, adjacents_1 = adjacents; _e < adjacents_1.length; _e++) {
            var adj = adjacents_1[_e];
            _loop_5(adj);
        }
        // alignWith : try to share one axis with target (e.g., bedside aligned to bed)
        var alignRules = obj.rules.filter(function (r) { return r.type === "alignWith"; });
        var _loop_6 = function (rule) {
            var t = placed.find(function (p) { return p.name === rule.target; });
            if (!t)
                return "continue";
            // Align along Y (depth), place to the right side by default with small gap
            var gap = 0.05;
            var y = t.position.y; // same Y origin
            var x = t.position.x + t.dimensions.width + gap;
            res.push({ x: x, y: y, base: 0, why: "alignWith:".concat(rule.target) });
        };
        for (var _f = 0, alignRules_1 = alignRules; _f < alignRules_1.length; _f++) {
            var rule = alignRules_1[_f];
            _loop_6(rule);
        }
        return res;
    };
    // -------------------------------
    // Candidate validation - floor placement
    // initial colision rule checks
    // -------------------------------
    PlacementEngine.prototype.isCandidateValid = function (obj, c, placed) {
        // 1) room bounds (meters)
        if (c.x < 0 || c.y < 0)
            return false; // outside room bounds    
        if (c.x + obj.dimensions.width > this.roomWidth + 1e-6)
            return false;
        if (c.y + obj.dimensions.depth > this.roomDepth + 1e-6)
            return false;
        // 2) height limits 
        if (c.base < 0)
            return false; // under floor
        if (c.base + obj.dimensions.height > this.wallHeight + 1e-6)
            return false; // above ceiling
        // 3) mustTouchGround → require base=0
        var mustGround = obj.rules.find(function (r) { return r.type === "mustTouchGround" && r.value; }); // if obj has rule mustTouchGround
        if (mustGround && Math.abs(c.base) > 1e-6)
            return false;
        // 4) minClearance (expand obj footprint and check vs placed footprints where vertical overlap happens)
        var clearanceRule = obj.rules.find(function (r) { return r.type === "minClearance"; });
        if (clearanceRule) {
            if (!this.hasClearance(c, obj, placed, clearanceRule.meters))
                return false;
        }
        // 5) If base > 0 and not explicitly onTopOf/insideOf 
        if (c.base > 0 && !obj.rules.some(function (r) { return r.type === "onTopOf" || r.type === "insideOf"; })) {
            if (!this.hasSupportUnderneath(c, obj, placed))
                return false;
        }
        // 6) Defer hard collision/bounds to GridManager (fast + authoritative)
        if (c.base === 0 &&
            !this.grid.canPlaceOnFloor(c.x, c.y, obj.dimensions.width, obj.dimensions.depth)) {
            return false;
        }
        return true;
    };
    // clearance in meters between footprints when vertical intervals overlap
    PlacementEngine.prototype.hasClearance = function (c, obj, placed, clearance) {
        var ax1 = c.x - clearance, ay1 = c.y - clearance;
        var ax2 = c.x + obj.dimensions.width + clearance;
        var ay2 = c.y + obj.dimensions.depth + clearance;
        var aBase = c.base, aTop = c.base + obj.dimensions.height;
        for (var _i = 0, placed_1 = placed; _i < placed_1.length; _i++) {
            var p = placed_1[_i];
            var bx1 = p.position.x, by1 = p.position.y;
            var bx2 = p.position.x + p.dimensions.width;
            var by2 = p.position.y + p.dimensions.depth;
            var bBase = p.base, bTop = p.base + p.dimensions.height;
            var verticalOverlap = aBase < bTop && aTop > bBase;
            if (!verticalOverlap)
                continue;
            var overlapX = ax1 < bx2 && ax2 > bx1;
            var overlapY = ay1 < by2 && ay2 > by1;
            if (overlapX && overlapY)
                return false;
        }
        return true;
    };
    // require solid support directly below footprint that fully covers it at c.base
    PlacementEngine.prototype.hasSupportUnderneath = function (c, obj, placed) {
        var neededTop = c.base;
        for (var _i = 0, placed_2 = placed; _i < placed_2.length; _i++) {
            var p = placed_2[_i];
            var top_1 = p.base + p.dimensions.height;
            if (Math.abs(top_1 - neededTop) > 1e-6)
                continue; // needs exact top level match
            // check horizontal coverage (A inside B)
            var coversX = c.x >= p.position.x - 1e-6 &&
                c.x + obj.dimensions.width <= p.position.x + p.dimensions.width + 1e-6;
            var coversY = c.y >= p.position.y - 1e-6 &&
                c.y + obj.dimensions.depth <= p.position.y + p.dimensions.depth + 1e-6;
            if (coversX && coversY)
                return true;
        }
        return false;
    };
    // -------------------------------
    // Grid occupation
    // -------------------------------
    PlacementEngine.prototype.occupy = function (c, obj, id) {
        var _a, _b;
        var anyGrid = this.grid;
        var occupyFn = ((_a = anyGrid.occupyFloor) === null || _a === void 0 ? void 0 : _a.bind(anyGrid)) ||
            ((_b = anyGrid.occupyFloor) === null || _b === void 0 ? void 0 : _b.bind(anyGrid));
        if (!occupyFn) {
            throw new Error("GridManager is missing occupyFloor method.");
        }
        occupyFn(c.x, c.y, obj.dimensions.width, obj.dimensions.depth, c.base, obj.dimensions.height, id);
    };
    // -------------------------------
    // Utils
    // -------------------------------
    PlacementEngine.prototype.makeId = function (name) {
        return "".concat(name, "_").concat(Math.random().toString(36).slice(2, 8));
    };
    PlacementEngine.prototype.uniqueByCell = function (arr) {
        var _this = this;
        var seen = new Set();
        var out = [];
        var q = function (v) { return Math.round(v / _this.cellSize); }; // bucket by cell
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var it = arr_1[_i];
            var key = "".concat(q(it.x), "|").concat(q(it.y), "|").concat(Math.round(it.base * 1000)); // base in mm buckets
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push(it);
        }
        return out;
    };
    return PlacementEngine;
}());
exports.PlacementEngine = PlacementEngine;
