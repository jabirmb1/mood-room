// PlacementEngine.ts
// Drives procedural placement using your GridManager + TS rule configuration

import { GridManager } from "./GridManager";


export type PlacementRule =
  | { type: "mustTouchWall"; value: boolean }
  | { type: "mustFaceAwayFromWall"; value: boolean }               // rotation not enforced yet; placeholder
  | { type: "mustTouchGround"; value: boolean }
  | { type: "allowStacking"; value: boolean }
  | { type: "alignWith"; target: string }
  | { type: "onTopOf"; target: string }
  | { type: "insideOf"; target: string }
  | { type: "under"; target: string }
  | { type: "toRightOf"; target: string; distance?: number }
  | { type: "toLeftOf"; target: string; distance?: number }
  | { type: "inFrontOf"; target: string; distance?: number }
  | { type: "behind"; target: string; distance?: number }
  | { type: "facingRelativeTo"; target: string; direction: "front" | "back" | "left" | "right" }
  | { type: "minClearance"; meters: number };

export type WorldObject = {
  name: string;
  path?: string;                             // from manifest
  dimensions: { width: number; depth: number; height: number }; // meters
  rules: PlacementRule[];
  // Optional container slots for "insideOf" (define in metadata if you have containers)
  slots?: Array<{ x: number; y: number; base?: number }>;
};

export type PlacedObject = WorldObject & {
  id: string;
  position: { x: number; y: number };        // meters on floor plane
  base: number;                               // meters above floor (0 for floor)
  rotation?: number;                          // radians (not enforced by grid yet)
  dimensions: { width: number; height: number; depth: number };
};

export type PlacementResult = {
  placed: PlacedObject[];
  failures: Array<{ obj: WorldObject; reason: string }>;
};

// -------------------------------
// Engine
// -------------------------------
export class PlacementEngine {
  private grid: GridManager;
  private roomWidth: number;   // meters (same values you passed into GridManager creator)
  private roomDepth: number;   // meters
  private wallHeight: number;  // meters
  private cellSize: number;    // meters (same as GridManager creator)

  constructor(opts: {
    grid: GridManager;
    roomWidth: number;
    roomDepth: number;
    wallHeight: number;
    cellSize: number;
  }) {
    this.grid = opts.grid;
    this.roomWidth = opts.roomWidth;
    this.roomDepth = opts.roomDepth;
    this.wallHeight = opts.wallHeight;
    this.cellSize = opts.cellSize;
  }

  /**
   * Place objects in the given order. Returns placed + failures.
   */
  placeSequential(objects: WorldObject[]): PlacementResult {
    const placed: PlacedObject[] = []; // array of PlacedObject
    const failures: PlacementResult["failures"] = []; // array of { obj: WorldObject; reason: string } why it failed

    // cycle through each object
    for (const obj of objects) {           
      const id = this.makeId(obj.name);
      const candidates = this.generateCandidates(obj, placed);

      // Validate each candidate with grid + rule checks. keep the valid set
      const valid = candidates.filter((c) =>
        this.isCandidateValid(obj, c, placed)
      );

      if (valid.length === 0) {
        failures.push({ obj, reason: "No valid candidates after rule/grid checks." });
        continue;
      }

      // Pick randomly (uniform). You can weight later if you want.
      const choice = valid[Math.floor(Math.random() * valid.length)];

      // Occupy the grid (important: use base/height for vertical stacking)
      this.occupy(choice, obj, id);

      placed.push({
        ...obj,
        id,
        position: { x: choice.x, y: choice.y },
        base: choice.base,
        rotation: choice.rotation,
      });
    }

    return { placed, failures };
  }

  // -------------------------------
  // Candidate generation
  // -------------------------------

  /**
   * Produce a pool of candidate placements from rules:
   * - relative (onTopOf/insideOf/adjacent) if targets exist
   * - otherwise floor scanning (entire room or just walls if required)
   */
  private generateCandidates(
    obj: WorldObject,
    placed: PlacedObject[]
  ): Array<{ x: number; y: number; base: number; rotation?: number; why: string }> {
    const out: Array<{ x: number; y: number; base: number; rotation?: number; why: string }> = [];

    // 1) relative rules first (depend on targets being already placed)
    const rel = this.generateRelativeCandidates(obj, placed);
    out.push(...rel);

    // 2) If no relative rules produced anything (or obj also supports floor),
    //    scan floor cells
    const wantsFloor =
      obj.rules.some(r => r.type === "mustTouchGround" && r.value) ||
      obj.rules.every(r => !["onTopOf","insideOf","under"].includes(r.type));

    if (wantsFloor) {
      const touchWall = obj.rules.find(r => r.type === "mustTouchWall" && r.value);
      if (touchWall) {
        out.push(...this.generateWallCandidates(obj));
      } else {
        out.push(...this.generateFloorCandidates(obj));
      }
    }

    // no duplicates in candidates
    return this.uniqueByCell(out); 
  }

  // Floor scan over the whole room
  private generateFloorCandidates(obj: WorldObject) {
    const res: Array<{ x:number; y:number; base:number; why:string }> = [];
    const step = this.cellSize; // aligned to grid cells

    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
      for (let x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
        res.push({ x, y, base: 0, why: "floor-scan" });
      }
    }
    return res;
  }

  // Only along the 4 walls (object fully inside room) MODIFY!!!!
  private generateWallCandidates(obj: WorldObject) {
    const res: Array<{ x:number; y:number; base:number; why:string }> = [];
    const step = this.cellSize;

    // North wall (y = 0), slide along X
    for (let x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
      res.push({ x, y: 0, base: 0, why: "wall-north" });
    }
    // South wall (y + depth = roomDepth)
    for (let x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
      res.push({ x, y: this.roomDepth - obj.dimensions.depth, base: 0, why: "wall-south" });
    }
    // West wall (x = 0), slide along Y
    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
      res.push({ x: 0, y, base: 0, why: "wall-west" });
    }
    // East wall (x + width = roomWidth)
    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
      res.push({ x: this.roomWidth - obj.dimensions.width, y, base: 0, why: "wall-east" });
    }
    return res;
  }

  // Relative to already placed targets (onTopOf / insideOf / adjacency)
  private generateRelativeCandidates(obj: WorldObject, placed: PlacedObject[]) {
    const res: Array<{ x:number; y:number; base:number; why:string }> = [];

    const onTopRules = obj.rules.filter((r): r is Extract<PlacementRule, {type:"onTopOf"}> => r.type === "onTopOf");
    for (const rule of onTopRules) {
      const t = placed.find(p => p.name === rule.target); // find target so we can calculate position
      if (!t) continue;
      // center-on-top by default - so the onject will be placed in the middle of the target
      const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
      const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
      const base = t.base + t.dimensions.height; // stack
      res.push({ x, y, base, why: `onTopOf:${rule.target}` });  // add to list of candidates
    }

    const insideRules = obj.rules.filter((r): r is Extract<PlacementRule, {type:"insideOf"}> => r.type === "insideOf");
    for (const rule of insideRules) {
      const t = placed.find(p => p.name === rule.target); // find target so we can calculate position
      if (!t) continue;

      // Prefer explicit slots on the container- (add slots to shelves and ect)
      if (t.slots && t.slots.length) {
        for (const slot of t.slots) {
          res.push({
            x: t.position.x + slot.x,
            y: t.position.y + slot.y,
            base: (slot.base ?? t.base),
            why: `insideOf:${rule.target}:slot`,
          });
        }
      } else {
        // fallback: center inside target’s footprint at same base
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        res.push({ x, y, base: t.base, why: `insideOf:${rule.target}:fallback` });
      }
    }

    const underRules = obj.rules.filter((r): r is Extract<PlacementRule, {type:"under"}> => r.type === "under");
    for (const rule of underRules) {
      const t = placed.find(p => p.name === rule.target);
      if (!t) continue;
      // Put on floor, centered under the target’s footprint
      const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
      const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
      res.push({ x, y, base: 0, why: `under:${rule.target}` });
    }

    // Adjacency helpers (left/right/front/back) with optional distance
    const adjacents = [
      { key: "toRightOf", dx: +1, dy: 0 },
      { key: "toLeftOf",  dx: -1, dy: 0 },
      { key: "inFrontOf", dx: 0, dy: +1 },
      { key: "behind",    dx: 0, dy: -1 },
    ] as const;

    for (const adj of adjacents) {
      const rules = obj.rules.filter((r) => (r as any).type === adj.key) as Array<
        Extract<
          PlacementRule,
          { type: "toRightOf" | "toLeftOf" | "inFrontOf" | "behind" }
        >
      >;

      for (const rule of rules) {
        const t = placed.find(p => p.name === rule.target);
        if (!t) continue;

        const gap = rule.distance ?? 0.2; // default 20 cm gap

        // calculate position based on target's position e.g sidetablt to right of bed
        const x =
          t.position.x +
          (adj.dx > 0
            ? t.dimensions.width + gap
            : adj.dx < 0
            ? -obj.dimensions.width - gap
            : (t.dimensions.width - obj.dimensions.width) / 2);

        const y =
          t.position.y +
          (adj.dy > 0
            ? t.dimensions.depth + gap
            : adj.dy < 0
            ? -obj.dimensions.depth - gap
            : (t.dimensions.depth - obj.dimensions.depth) / 2);

        res.push({ x, y, base: 0, why: `${adj.key}:${rule.target}` });
      }
    }

    // alignWith : try to share one axis with target (e.g., bedside aligned to bed)
    const alignRules = obj.rules.filter((r): r is Extract<PlacementRule, {type:"alignWith"}> => r.type === "alignWith");
    for (const rule of alignRules) {
      const t = placed.find(p => p.name === rule.target);
      if (!t) continue;

      // Align along Y (depth), place to the right side by default with small gap
      const gap = 0.05;
      const y = t.position.y; // same Y origin
      const x = t.position.x + t.dimensions.width + gap;
      res.push({ x, y, base: 0, why: `alignWith:${rule.target}` });
    }

    return res;
  }

  // -------------------------------
  // Candidate validation - floor placement
  // initial colision rule checks
  // -------------------------------

  private isCandidateValid(
    obj: WorldObject,
    c: { x:number; y:number; base:number },
    placed: PlacedObject[]
  ): boolean {

    // 1) room bounds (meters)
    if (c.x < 0 || c.y < 0) return false; // outside room bounds    
    if (c.x + obj.dimensions.width  > this.roomWidth  + 1e-6) return false; 
    if (c.y + obj.dimensions.depth  > this.roomDepth  + 1e-6) return false;

    // 2) height limits 
    if (c.base < 0) return false; // under floor
    if (c.base + obj.dimensions.height > this.wallHeight + 1e-6) return false; // above ceiling

    // 3) mustTouchGround → require base=0
    const mustGround = obj.rules.find(r => r.type === "mustTouchGround" && r.value); // if obj has rule mustTouchGround
    if (mustGround && Math.abs(c.base) > 1e-6) return false;

    // 4) minClearance (expand obj footprint and check vs placed footprints where vertical overlap happens)
    const clearanceRule = obj.rules.find((r): r is Extract<PlacementRule, {type:"minClearance"}> => r.type === "minClearance");
    if (clearanceRule) {
      if (!this.hasClearance(c, obj, placed, clearanceRule.meters)) return false;
    }

    // 5) If base > 0 and not explicitly onTopOf/insideOf 
    if (c.base > 0 && !obj.rules.some(r => r.type === "onTopOf" || r.type === "insideOf")) {
      if (!this.hasSupportUnderneath(c, obj, placed)) return false;
    }

    // 6) Defer hard collision/bounds to GridManager (fast + authoritative)
    if ( c.base === 0 &&
    !this.grid.canPlaceOnFloor    (
        c.x,
        c.y,
        obj.dimensions.width,
        obj.dimensions.depth,
      )
    ) {
      return false;
    }

    return true;
  }

  // clearance in meters between footprints when vertical intervals overlap
  private hasClearance(
    c: {x:number;y:number;base:number},
    obj: WorldObject,
    placed: PlacedObject[],
    clearance: number
  ) {
    const ax1 = c.x - clearance, ay1 = c.y - clearance;
    const ax2 = c.x + obj.dimensions.width  + clearance;
    const ay2 = c.y + obj.dimensions.depth + clearance;
    const aBase = c.base, aTop = c.base + obj.dimensions.height;

    for (const p of placed) {
      const bx1 = p.position.x, by1 = p.position.y;
      const bx2 = p.position.x + p.dimensions.width;
      const by2 = p.position.y + p.dimensions.depth;
      const bBase = p.base, bTop = p.base + p.dimensions.height;

      const verticalOverlap = aBase < bTop && aTop > bBase;
      if (!verticalOverlap) continue;

      const overlapX = ax1 < bx2 && ax2 > bx1;
      const overlapY = ay1 < by2 && ay2 > by1;
      if (overlapX && overlapY) return false;
    }
    return true;
  }

  // require solid support directly below footprint that fully covers it at c.base
  private hasSupportUnderneath(
    c: {x:number;y:number;base:number},
    obj: WorldObject,
    placed: PlacedObject[]
  ) {
    const neededTop = c.base;
    for (const p of placed) {
      const top = p.base + p.dimensions.height;
      if (Math.abs(top - neededTop) > 1e-6) continue; // needs exact top level match

      // check horizontal coverage (A inside B)
      const coversX =
        c.x >= p.position.x - 1e-6 &&
        c.x + obj.dimensions.width <= p.position.x + p.dimensions.width + 1e-6;
      const coversY =
        c.y >= p.position.y - 1e-6 &&
        c.y + obj.dimensions.depth <= p.position.y + p.dimensions.depth + 1e-6;

      if (coversX && coversY) return true;
    }
    return false;
  }

  // -------------------------------
  // Grid occupation
  // -------------------------------
  private occupy(
    c: {x:number;y:number;base:number},
    obj: WorldObject,
    id: string
  ) {

    const anyGrid = this.grid as any;
    const occupyFn =
      anyGrid.occupyFloor?.bind(anyGrid) ||
      anyGrid.occupyFloor?.bind(anyGrid);

    if (!occupyFn) {
      throw new Error("GridManager is missing occupyFloor method.");
    }

    occupyFn(
      c.x,
      c.y,
      obj.dimensions.width,
      obj.dimensions.depth,
      c.base,
      obj.dimensions.height,
      id
    );
  }

  // -------------------------------
  // Utils
  // -------------------------------
  private makeId(name: string) { // generate unique id for each object
    return `${name}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private uniqueByCell<T extends { x:number;y:number;base:number }>(arr: T[]) { // remove duplicates
    const seen = new Set<string>();
    const out: T[] = [];
    const q = (v: number) => Math.round(v / this.cellSize); // bucket by cell
    for (const it of arr) {
      const key = `${q(it.x)}|${q(it.y)}|${Math.round(it.base*1000)}`; // base in mm buckets
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  }
}
