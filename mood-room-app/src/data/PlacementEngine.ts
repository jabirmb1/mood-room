// PlacementEngine.ts
// Drives procedural placement using your GridManager + TS rule configuration
// places object recieved one by one.
//

import { GridManager } from "./GridManager";

// rules types
export type PlacementRule =
  | { type: "mustTouchWall"; value: boolean }
  | { type: "mustFaceAwayFromWall"; value: boolean }               // rotation not enforced yet; placeholder
  | { type: "mustTouchGround"; value: boolean }
  | { type: "mustBeNextTo"; target: string}
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


// argument from object
export type WorldObject = {
  name: string;
  path?: string;                             
  dimensions: { width: number; depth: number; height: number }; // meters 
  rules: PlacementRule[];
  slots?: Array<{ x: number; y: number; base?: number }>; // add slots for objects
  rotation?: number;
};
// output object location and rotation
export type PlacedObject = WorldObject & {
  id: string;
  position: { x: number; y: number };
  base: number; // height or ontop
  rotation?: number; // direction 
  dimensions: { width: number; height: number; depth: number };
  occupiedCells?: { x: number; y: number }[];
};

// return result- move on to next or try again
export type PlacementResult = {
  placed: PlacedObject[];
  failures: Array<{ obj: WorldObject; reason: string; details?: string[] }>;
};


// -------------------------------
// Engine- procedural placement
// -------------------------------
export class PlacementEngine {
  private grid: GridManager;
  private roomWidth: number;  
  private roomDepth: number;   
  private wallHeight: number;  
  private cellSize: number;   

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


  // Place objects in the given order. Returns placed + failures.
  //
  placeSequential(objects: WorldObject[], maxRetries = 5): PlacementResult {
    const placed: PlacedObject[] = [];
    const failures: PlacementResult["failures"] = [];
  
    for (const obj of objects) {
      const id = this.makeId(obj.name);
      let success = false;
  
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const candidates = this.generateCandidates(obj, placed);
  
        const valid = candidates.filter(c => this.isCandidateValid(obj, c, placed).valid);
  
        if (valid.length > 0) {
          const choice = valid[Math.floor(Math.random() * valid.length)];
  
          this.occupy(choice, obj, id);
  
          //info about placed object
          placed.push({
            ...obj,
            id,
            position: { x: choice.x, y: choice.y },
            base: choice.base,
            rotation: choice.rotation,
            occupiedCells: this.grid.getOccupiedCells({ 
              position: { x: choice.x, y: choice.y },
              dimensions: { width: obj.dimensions.width, depth: obj.dimensions.depth },
            })
          });
  
          success = true;
          break; // stop retrying
        }
      }
  
      if (!success) {
        const candidates = this.generateCandidates(obj, placed); // regenerate to get reasons
        failures.push({ 
          obj, 
          reason: `Failed after ${maxRetries} retries`,
        });
      }
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
      const hasMustTouchWall = obj.rules.some(r => r.type === "mustTouchWall" && r.value);
      if (hasMustTouchWall) {
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
    const res: Array<{ x:number; y:number; base:number; why:string; rotation?: number }> = [];
    const step = this.cellSize; // aligned to grid cells

    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
      for (let x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
        res.push({ x, y, base: 0, why: "floor-scan", rotation: 0 });
      }
    }
    return res;
  }

  // Only along the 4 walls (object fully inside room) MODIFY!!!!
  private generateWallCandidates(obj: WorldObject) {
    const res: Array<{ x: number; y: number; base: number; why: string; rotation?: number }> = [];
    const step = this.cellSize;
  
    const mustFaceAway = obj.rules.some(r => r.type === "mustFaceAwayFromWall" && r.value);
  
    // ✅ North wall (y = 0) → object faces +Z
    for (let x = 0; x + obj.dimensions.width <= this.roomWidth + 1e-6; x += step) {
      const rotation = mustFaceAway ? 0 : undefined; // face +Z
      res.push({
        x,
        y: 0,
        base: 0,
        why: "wall-north",
        rotation
      });
    }
  
    // ✅ West wall (x = 0) → object faces +X
    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + 1e-6; y += step) {
      const rotation = mustFaceAway ? Math.PI / 2 : undefined; // face +X
      res.push({
        x: 0,
        y,
        base: 0,
        why: "wall-west",
        rotation
      });
    }
  
    // ❌ Skipping South (frontWall, invisible)
    // ❌ Skipping East (rightWall, invisible)
  
    return res;
  }
  

  // Relative to already placed targets (onTopOf / insideOf / adjacency...)
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

    //mustBeNextTo : place next to target
    // mustBeNextTo : place object adjacent to target object
    const nextToRules = obj.rules.filter(
      (r): r is Extract<PlacementRule, { type: "mustBeNextTo" }> => r.type === "mustBeNextTo"
    );

    for (const rule of nextToRules) {
      const t = placed.find(p => p.name === rule.target);
      if (!t) continue;

      const gap = 0.05;

      // Same Y, placed to the right of target
      res.push({
        x: t.position.x + t.dimensions.width + gap,
        y: t.position.y,
        base: 0,
        why: `mustBeNextTo:${rule.target}:right`
      });

      // Same Y, placed to the left of target
      res.push({
        x: t.position.x - obj.dimensions.width - gap,
        y: t.position.y,
        base: 0,
        why: `mustBeNextTo:${rule.target}:left`
      });

      // Same X, placed below target
      res.push({
        x: t.position.x,
        y: t.position.y + t.dimensions.depth + gap,
        base: 0,
        why: `mustBeNextTo:${rule.target}:below`
      });

      // Same X, placed above target
      res.push({
        x: t.position.x,
        y: t.position.y - obj.dimensions.depth - gap,
        base: 0,
        why: `mustBeNextTo:${rule.target}:above`
      });
    }


    return res;
  }

  // -------------------------------
  // Candidate validation - floor placement
  // initial colision rule checks
  // -------------------------------

  private isCandidateValid(
    obj: WorldObject,
    c: { x: number; y: number; base: number },
    placed: PlacedObject[]
  ): { valid: boolean; reason?: string } {
    // 1) room bounds
    if (c.x < 0 || c.y < 0) return { valid: false, reason: "Outside room bounds" };
    if (c.x + obj.dimensions.width > this.roomWidth + 1e-6)
      return { valid: false, reason: "Exceeds room width" };
    if (c.y + obj.dimensions.depth > this.roomDepth + 1e-6)
      return { valid: false, reason: "Exceeds room depth" };
  
    // 2) height limits
    if (c.base < 0) return { valid: false, reason: "Below floor" };
    if (c.base + obj.dimensions.height > this.wallHeight + 1e-6)
      return { valid: false, reason: "Above ceiling" };
  
    // 3) mustTouchGround
    const mustGround = obj.rules.find(r => r.type === "mustTouchGround" && r.value);
    if (mustGround && Math.abs(c.base) > 1e-6)
      return { valid: false, reason: "Must touch ground but base > 0" };
  
    // 4) minClearance
    const clearanceRule = obj.rules.find(
      (r): r is Extract<PlacementRule, { type: "minClearance" }> =>
        r.type === "minClearance"
    );
    if (clearanceRule && !this.hasClearance(c, obj, placed, clearanceRule.meters))
      return { valid: false, reason: `Not enough clearance (${clearanceRule.meters}m required)` };
  
    // 5) base > 0 but no support
    if (
      c.base > 0 &&
      !obj.rules.some(r => r.type === "onTopOf" || r.type === "insideOf")
    ) {
      if (!this.hasSupportUnderneath(c, obj, placed))
        return { valid: false, reason: "No support underneath" };
    }
  
    // 6) collision
    if (
      c.base === 0 &&
      !this.grid.canPlaceOnFloor(
        c.x,
        c.y,
        obj.dimensions.width,
        obj.dimensions.depth
      )
    ) {
      return { valid: false, reason: "Grid cell occupied" };
    }
  
    return { valid: true };
  }

  // PlacementEngine.ts
  checkCandidateRules(
    obj: WorldObject,
    c: { x: number; y: number; base: number },
    placed: PlacedObject[]
  ): { rule: string; passed: boolean; reason?: string }[] {
    const results: { rule: string; passed: boolean; reason?: string }[] = [];

    // 1. Room bounds
    const inBounds = c.x >= 0 && c.y >= 0 &&
                    c.x + obj.dimensions.width <= this.roomWidth &&
                    c.y + obj.dimensions.depth <= this.roomDepth;
    results.push({ rule: "roomBounds", passed: inBounds, reason: inBounds ? undefined : "Out of room bounds" });

    // 2. Must touch ground
    const mustGround = obj.rules.find(r => r.type === "mustTouchGround" && r.value);
    if (mustGround) {
      const passed = Math.abs(c.base) < 1e-6;
      results.push({ rule: "mustTouchGround", passed, reason: passed ? undefined : "Base > 0" });
    }

    // 3. Support underneath
    if (c.base > 0 && !obj.rules.some(r => r.type === "onTopOf" || r.type === "insideOf")) {
      const supported = this.hasSupportUnderneath(c, obj, placed);
      results.push({ rule: "supportUnderneath", passed: supported, reason: supported ? undefined : "No support below" });
    }

    return results;
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
