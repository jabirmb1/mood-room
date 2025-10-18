// PlacementEngine.ts - FIXED VERSION
// Critical fixes:
// 1. Rotation-aware wall touch detection
// 2. Proper height/base matching for adjacency
// 3. Better rule priority enforcement
// 4. Collision-aware candidate generation
// 5. Fixed mustFaceAwayFromWall + adjacency interaction

import { GridManager } from "./GridManager";

export type PlacementRule =
| { type: "mustTouchWall"; value: boolean }
| { type: "mustFaceAwayFromWall"; value: boolean }
| { type: "mustTouchGround"; value: boolean }
| { type: "mustBeNextTo"; target: string }
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
  path?: string;
  dimensions: { width: number; depth: number; height: number };
  rules: PlacementRule[];
  slots?: Array<{ x: number; y: number; base?: number }>;
  rotation?: number;
};

export type PlacedObject = WorldObject & {
  id: string;
  position: { x: number; y: number };
  base: number;
  rotation?: number;
  dimensions: { width: number; height: number; depth: number };
  occupiedCells?: { x: number; y: number }[];
};

export type PlacementResult = {
  placed: PlacedObject[];
  failures: Array<{ obj: WorldObject; reason: string; details?: string[] }>;
};

type Candidate = {
  x: number;
  y: number;
  base: number;
  why: string;
  rotation?: number;
};

const EPS = 1e-6;

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class PlacementEngine {
  private grid: GridManager;
  private roomWidth: number;
  private roomDepth: number;
  private wallHeight: number;
  private cellSize: number;

  private RULE_PRIORITY = [
    "mustTouchGround",
    "onTopOf",
    "insideOf",
    "under",
    "mustTouchWall",
    "mustBeNextTo",
    "toRightOf",
    "toLeftOf",
    "inFrontOf",
    "behind",
    "mustFaceAwayFromWall",  // MOVED AFTER adjacency rules
    "facingRelativeTo",
    "alignWith",
    "minClearance",
  ] as const;

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

  placeSequential(objects: WorldObject[], maxRetries = 5): PlacementResult {
    const placed: PlacedObject[] = [];
    const failures: PlacementResult["failures"] = [];

    for (const obj of objects) {
      console.log(`\n🔷 Placing: ${obj.name}`);
      console.log(`   Rules:`, obj.rules.map(r => r.type).join(", "));

      const id = this.makeId(obj.name);
      let success = false;
      let lastDetails: string[] = [];

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        let allCandidates = this.generateAllCandidates(obj, placed);
        console.log(`   Generated ${allCandidates.length} candidates (attempt ${attempt})`);
        
        if (allCandidates.length === 0) {
          lastDetails = ["No candidates could be generated"];
          continue;
        }

        allCandidates = shuffle(allCandidates);

        const pipelineResult = this.applyRulePipeline(obj, allCandidates, placed);
        console.log(`   Pipeline details:`, pipelineResult.details);

        if (pipelineResult.candidates.length === 0) {
          lastDetails = pipelineResult.details.length ? pipelineResult.details : ["No candidates after pipeline"];
          console.log(`   ❌ No candidates after pipeline (attempt ${attempt})`);
          continue;
        }

        const validated = pipelineResult.candidates
          .map(c => ({ c, v: this.isCandidateValid(obj, c, placed) }))
          .filter(x => x.v.valid)
          .map(x => x.c);

        console.log(`   Validated: ${validated.length}/${pipelineResult.candidates.length} candidates`);

        if (validated.length === 0) {
          const reasons = pipelineResult.candidates.slice(0, 5).map(c => {
            const v = this.isCandidateValid(obj, c, placed);
            return `${c.why} @ (${c.x.toFixed(2)}, ${c.y.toFixed(2)}, base:${c.base}): ${v.reason}`;
          });
          lastDetails = ["All pipeline survivors failed validation", ...reasons];
          console.log(`   ❌ Validation failures:`, reasons);
          continue;
        }

        validated.sort((a, b) => a.base - b.base);

        const TOP_N = 5;
        const pool = validated.slice(0, Math.min(TOP_N, validated.length));
        const choice = pool[Math.floor(Math.random() * pool.length)];

        console.log(`   ✅ Chose: ${choice.why} at (${choice.x.toFixed(2)}, ${choice.y.toFixed(2)}, base:${choice.base}, rot:${choice.rotation})`);

        try {
          this.occupy(choice, obj, id);
        } catch (e) {
          lastDetails = [`Grid occupy error: ${(e as Error).message}`];
          continue;
        }

        placed.push({
          ...obj,
          id,
          position: { x: choice.x, y: choice.y },
          base: choice.base,
          rotation: choice.rotation ?? 0,
          occupiedCells: this.grid.getOccupiedCells({
            position: { x: choice.x, y: choice.y },
            dimensions: { width: obj.dimensions.width, depth: obj.dimensions.depth },
          }),
        });

        success = true;
        break;
      }

      if (!success) {
        console.log(`   ❌ FAILED after ${maxRetries} retries`);
        failures.push({ obj, reason: `Failed after ${maxRetries} retries`, details: lastDetails });
      }
    }

    return { placed, failures };
  }

  // ========== CANDIDATE GENERATION - FIXED ==========
  
  private generateAllCandidates(obj: WorldObject, placed: PlacedObject[]) {
    const out: Candidate[] = [];

    const hasStrictRelative = obj.rules.some(r => r.type === "onTopOf" || r.type === "insideOf" || r.type === "under");
    const mustTouchWall = obj.rules.some(r => r.type === "mustTouchWall" && r.value === true);
    const hasAdjacencyRule = obj.rules.some(r => 
      r.type === "mustBeNextTo" || r.type === "toRightOf" || r.type === "toLeftOf" || 
      r.type === "inFrontOf" || r.type === "behind"
    );

    const relativeCandidates = this.generateRelativeCandidates(obj, placed);
    
    // CRITICAL FIX: If has adjacency/relative rules, ONLY use those candidates
    if ((hasStrictRelative || hasAdjacencyRule) && relativeCandidates.length > 0) {
      // FIX: If mustTouchWall + adjacency, filter to wall-touching only
      if (mustTouchWall && hasAdjacencyRule) {
        const wallTouchingRelatives = relativeCandidates.filter(c => 
          this.touchesAnyWall(c, obj, c.rotation ?? 0)
        );

        if (wallTouchingRelatives.length > 0) {
          return wallTouchingRelatives.map(c => ({
            ...c,
            rotation: c.rotation ?? 0
          }));
        }
        // If no wall-touching relatives, fall through to try all relatives
      }
      
      // Return ONLY relative candidates - don't add floor/wall scans
      return relativeCandidates.map(c => ({
        ...c,
        rotation: c.rotation ?? 0
      }));
    }

    // Only generate geometric candidates if NO relative/adjacency rules
    if (mustTouchWall) {
      out.push(...this.generateWallCandidates(obj));
    } else {
      out.push(...this.generateFloorCandidates(obj));
      out.push(...this.generateWallCandidates(obj));
    }

    // Set default rotations
    for (const c of out) {
      if (c.rotation === undefined) {
        c.rotation = 0;
      }
    }

    return out;
  }

  private generateFloorCandidates(obj: WorldObject) {
    const res: Candidate[] = [];
    const step = this.cellSize;

    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + EPS; y += step) {
      for (let x = 0; x + obj.dimensions.width <= this.roomWidth + EPS; x += step) {
        res.push({ x, y, base: 0, why: "floor-scan", rotation: 0 });
      }
    }
    return res;
  }

  private generateWallCandidates(obj: WorldObject) {
    const res: Candidate[] = [];
    const step = this.cellSize;

    // North wall (y = 0) - face into room (rotation = 0)
    for (let x = 0; x + obj.dimensions.width <= this.roomWidth + EPS; x += step) {
      res.push({ x, y: 0, base: 0, why: "wall-north", rotation: 0 });
    }

    // South wall (y = max) - face north (rotation = π)
    for (let x = 0; x + obj.dimensions.width <= this.roomWidth + EPS; x += step) {
      const y = Math.max(0, this.roomDepth - obj.dimensions.depth);
      res.push({ x, y, base: 0, why: "wall-south", rotation: Math.PI });
    }

    // West wall (x = 0) - face east (rotation = π/2)
    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + EPS; y += step) {
      res.push({ x: 0, y, base: 0, why: "wall-west", rotation: Math.PI / 2 });
    }

    // East wall (x = max) - face west (rotation = -π/2)
    for (let y = 0; y + obj.dimensions.depth <= this.roomDepth + EPS; y += step) {
      const x = Math.max(0, this.roomWidth - obj.dimensions.width);
      res.push({ x, y, base: 0, why: "wall-east", rotation: -Math.PI / 2 });
    }

    return res;
  }

  private generateRelativeCandidates(obj: WorldObject, placed: PlacedObject[]) {
    const res: Candidate[] = [];
    const missingTargets: string[] = [];

    // onTopOf
    const onTopRules = obj.rules.filter((r): r is Extract<PlacementRule, { type: "onTopOf" }> => r.type === "onTopOf");
    for (const rule of onTopRules) {
      const targets = placed.filter(p => p.name === rule.target);
      if (!targets.length) { missingTargets.push(`onTopOf:${rule.target}`); continue; }
      for (const t of targets) {
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        const base = t.base + t.dimensions.height;
        res.push({ x, y, base, why: `onTopOf:${rule.target}`, rotation: t.rotation });
      }
    }

    // insideOf
    const insideRules = obj.rules.filter((r): r is Extract<PlacementRule, { type: "insideOf" }> => r.type === "insideOf");
    for (const rule of insideRules) {
      const targets = placed.filter(p => p.name === rule.target);
      if (!targets.length) { missingTargets.push(`insideOf:${rule.target}`); continue; }
      for (const t of targets) {
        if (t.slots && t.slots.length) {
          for (const slot of t.slots) {
            res.push({
              x: t.position.x + slot.x,
              y: t.position.y + slot.y,
              base: (slot.base ?? t.base),
              why: `insideOf:${rule.target}:slot`,
              rotation: t.rotation,
            });
          }
        } else {
          const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
          const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
          res.push({ x, y, base: t.base, why: `insideOf:${rule.target}:fallback`, rotation: t.rotation });
        }
      }
    }

    // under
    const underRules = obj.rules.filter((r): r is Extract<PlacementRule, { type: "under" }> => r.type === "under");
    for (const rule of underRules) {
      const targets = placed.filter(p => p.name === rule.target);
      if (!targets.length) { missingTargets.push(`under:${rule.target}`); continue; }
      for (const t of targets) {
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        res.push({ x, y, base: 0, why: `under:${rule.target}`, rotation: t.rotation });
      }
    }

    // ADJACENCY RULES - FIXED: Preserve target's base height
    const adjacencyRules = obj.rules.filter(r =>
      ["mustBeNextTo", "toRightOf", "toLeftOf", "inFrontOf", "behind"].includes((r as any).type)
    ) as Array<Extract<PlacementRule, { type: "mustBeNextTo" | "toRightOf" | "toLeftOf" | "inFrontOf" | "behind" }>>;

    for (const rule of adjacencyRules) {
      const targets = placed.filter(p => p.name === rule.target);
      if (!targets.length) { missingTargets.push(`${rule.type}:${rule.target}`); continue; }

      for (const t of targets) {
        const gap = (rule as any).distance ?? 0.2;
        const base = t.base;

        if (rule.type === "mustBeNextTo") {
          // Generate ALL 4 sides with boundary checks
          const candidates: Candidate[] = [];

          // Right side (positive X)
          const rightX = t.position.x + t.dimensions.width + gap;
          if (rightX >= 0 && rightX + obj.dimensions.width <= this.roomWidth + EPS) {
            candidates.push({ 
              x: rightX, 
              y: t.position.y, 
              base,
              why: `mustBeNextTo:${rule.target}:right`,
              rotation: -Math.PI / 2
            });
          }

          // Left side (negative X)
          const leftX = t.position.x - obj.dimensions.width - gap;
          if (leftX >= -EPS && leftX + obj.dimensions.width <= this.roomWidth + EPS) {
            candidates.push({ 
              x: leftX, 
              y: t.position.y, 
              base,
              why: `mustBeNextTo:${rule.target}:left`,
              rotation: Math.PI / 2
            });
          }

          // Front (positive Y/South)
          const frontY = t.position.y + t.dimensions.depth + gap;
          if (frontY >= 0 && frontY + obj.dimensions.depth <= this.roomDepth + EPS) {
            candidates.push({ 
              x: t.position.x, 
              y: frontY, 
              base,
              why: `mustBeNextTo:${rule.target}:front`,
              rotation: Math.PI
            });
          }

          // Back (negative Y/North)
          const backY = t.position.y - obj.dimensions.depth - gap;
          if (backY >= -EPS && backY + obj.dimensions.depth <= this.roomDepth + EPS) {
            candidates.push({ 
              x: t.position.x, 
              y: backY, 
              base,
              why: `mustBeNextTo:${rule.target}:back`,
              rotation: 0
            });
          }

          if (candidates.length === 0) {
            console.warn(`⚠️ No valid mustBeNextTo positions for ${obj.name} next to ${t.name}`);
          }

          res.push(...candidates);

        } else if (rule.type === "toRightOf") {
          const x = t.position.x + t.dimensions.width + gap;
          if (x >= 0 && x + obj.dimensions.width <= this.roomWidth + EPS) {
            const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
            if (y >= -EPS && y + obj.dimensions.depth <= this.roomDepth + EPS) {
              res.push({ x, y, base, why: `toRightOf:${rule.target}`, rotation: -Math.PI / 2 });
            }
          }

        } else if (rule.type === "toLeftOf") {
          const x = t.position.x - obj.dimensions.width - gap;
          if (x >= -EPS && x + obj.dimensions.width <= this.roomWidth + EPS) {
            const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
            if (y >= -EPS && y + obj.dimensions.depth <= this.roomDepth + EPS) {
              res.push({ x, y, base, why: `toLeftOf:${rule.target}`, rotation: Math.PI / 2 });
            }
          }

        } else if (rule.type === "inFrontOf") {
          const y = t.position.y + t.dimensions.depth + gap;
          if (y >= 0 && y + obj.dimensions.depth <= this.roomDepth + EPS) {
            const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
            if (x >= -EPS && x + obj.dimensions.width <= this.roomWidth + EPS) {
              res.push({ x, y, base, why: `inFrontOf:${rule.target}`, rotation: Math.PI });
            }
          }

        } else if (rule.type === "behind") {
          const y = t.position.y - obj.dimensions.depth - gap;
          if (y >= -EPS && y + obj.dimensions.depth <= this.roomDepth + EPS) {
            const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
            if (x >= -EPS && x + obj.dimensions.width <= this.roomWidth + EPS) {
              res.push({ x, y, base, why: `behind:${rule.target}`, rotation: 0 });
            }
          }
        }
      }
    }

    // facingRelativeTo
    const facingRules = obj.rules.filter((r): r is Extract<PlacementRule, { type: "facingRelativeTo" }> => r.type === "facingRelativeTo");
    for (const rule of facingRules) {
      const targets = placed.filter(p => p.name === rule.target);
      if (!targets.length) { missingTargets.push(`facingRelativeTo:${rule.target}`); continue; }
      for (const t of targets) {
        let rotation: number | undefined;
        switch (rule.direction) {
          case "front": rotation = 0; break;
          case "back": rotation = Math.PI; break;
          case "left": rotation = -Math.PI / 2; break;
          case "right": rotation = Math.PI / 2; break;
        }
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        res.push({ x, y, base: t.base, why: `facingRelativeTo:${rule.target}:${rule.direction}`, rotation });
      }
    }

    if (missingTargets.length) {
      console.warn(`⚠️ Missing placement targets for ${obj.name}: ${missingTargets.join(", ")}`);
    }

    return res;
  }

  // ========== RULE PIPELINE - FIXED ==========
  
  private applyRulePipeline(obj: WorldObject, candidatesIn: Candidate[], placed: PlacedObject[]) {
    let candidates = candidatesIn.slice();
    const details: string[] = [];

    for (const ruleType of this.RULE_PRIORITY) {
      const rulesOfType = obj.rules.filter(r => (r as any).type === ruleType) as PlacementRule[];
      if (!rulesOfType.length) continue;

      const before = candidates.length;

      for (const rule of rulesOfType) {
        switch (rule.type) {
          case "mustTouchGround": {
            if (rule.value === true) {
              candidates = candidates.filter(c => Math.abs(c.base - 0) < EPS);
            }
            break;
          }

          case "onTopOf": {
            const expect = this.expectedOnTopPositions(rule.target, obj, placed);
            candidates = candidates.filter(c => this.matchesAnyCandidate(c, expect));
            break;
          }

          case "insideOf": {
            const expect = this.expectedInsidePositions(rule.target, obj, placed);
            candidates = candidates.filter(c => 
              this.matchesAnyCandidate(c, expect) || c.why.startsWith("insideOf:")
            );
            break;
          }

          case "under": {
            const expect = this.expectedUnderPositions(rule.target, obj, placed);
            candidates = candidates.filter(c => this.matchesAnyCandidate(c, expect));
            break;
          }

          case "mustTouchWall": {
            if (rule.value === true) {
              candidates = candidates.filter(c => 
                this.touchesAnyWall(c, obj, c.rotation ?? 0)
              );
            }
            break;
          }

          case "mustBeNextTo":
          case "toRightOf":
          case "toLeftOf":
          case "inFrontOf":
          case "behind": {
            const expect = this.expectedAdjacencyPositions(rule as any, obj, placed);
            candidates = candidates.filter(c => 
              this.matchesAnyCandidate(c, expect) || c.why.includes(rule.type)
            );
            break;
          }

          case "mustFaceAwayFromWall": {
            if (rule.value === true) {
              // ONLY apply if no adjacency rules (they set rotation)
              const hasAdjacency = obj.rules.some(r => 
                ["mustBeNextTo", "toRightOf", "toLeftOf", "inFrontOf", "behind"].includes((r as any).type)
              );
              
              if (!hasAdjacency) {
                candidates = candidates
                  .filter(c => this.touchesAnyWall(c, obj, c.rotation ?? 0))
                  .map(c => ({
                    ...c,
                    rotation: this.rotationFacingAwayFromNearestWall(c, obj)
                  }));
              }
            }
            break;
          }

          case "facingRelativeTo": {
            const expect = this.expectedFacingPositions(rule as any, obj, placed);
            candidates = candidates.filter(c => {
              if (c.rotation === undefined) return false;
              return expect.some(e => 
                this.nearlyEquals(c.x, e.x) && 
                this.nearlyEquals(c.y, e.y) && 
                Math.abs(this.angleDiff(c.rotation!, e.rotation!)) < 1e-3
              );
            });
            break;
          }

          case "alignWith": {
            candidates = candidates.filter(c => {
              return rulesOfType.some(ar => {
                if ((ar as any).type !== "alignWith") return false;
                const targets = placed.filter(t => t.name === (ar as any).target);
                return targets.some(t => {
                  const txCenter = t.position.x + t.dimensions.width / 2;
                  const tyCenter = t.position.y + t.dimensions.depth / 2;
                  const cx = c.x + obj.dimensions.width / 2;
                  const cy = c.y + obj.dimensions.depth / 2;
                  
                  const alignsX = Math.abs(cx - txCenter) < 1e-3;
                  const alignsY = Math.abs(cy - tyCenter) < 1e-3;
                  
                  return alignsX || alignsY;
                });
              });
            });
            break;
          }

          case "minClearance": {
            const clrRule = rule as Extract<PlacementRule, { type: "minClearance" }>;
            candidates = candidates.filter(c => 
              this.hasClearance(c, obj, placed, clrRule.meters)
            );
            break;
          }
        }
      }

      const after = candidates.length;
      details.push(`${ruleType}: ${before} -> ${after}`);
      
      if (candidates.length === 0) {
        details.push(`Eliminated all candidates during "${ruleType}" stage.`);
        return { candidates: [], details };
      }
    }

    details.push(`pipeline-survivors: ${candidates.length}`);
    return { candidates, details };
  }

  // ========== VALIDATION - ENHANCED ==========
  
  private isCandidateValid(obj: WorldObject, c: Candidate, placed: PlacedObject[]) {
    // 1) Room bounds
    if (c.x < -EPS || c.y < -EPS) return { valid: false, reason: "Outside room bounds" };
    if (c.x + obj.dimensions.width > this.roomWidth + EPS) return { valid: false, reason: "Exceeds room width" };
    if (c.y + obj.dimensions.depth > this.roomDepth + EPS) return { valid: false, reason: "Exceeds room depth" };

    // 2) Height limits
    if (c.base < -EPS) return { valid: false, reason: "Below floor" };
    if (c.base + obj.dimensions.height > this.wallHeight + EPS) return { valid: false, reason: "Above ceiling" };

    // 3) mustTouchGround
    const mustGround = obj.rules.find(r => r.type === "mustTouchGround" && (r as any).value);
    if (mustGround && Math.abs(c.base) > EPS) return { valid: false, reason: "Must touch ground but base > 0" };

    // 4) minClearance
    const clearanceRule = obj.rules.find((r): r is Extract<PlacementRule, { type: "minClearance" }> => r.type === "minClearance");
    if (clearanceRule && !this.hasClearance(c, obj, placed, clearanceRule.meters)) {
      return { valid: false, reason: `Not enough clearance (${clearanceRule.meters}m)` };
    }

    // 5) Collision check - ENHANCED
    for (const p of placed) {
      const verticalOverlap = c.base < p.base + p.dimensions.height + EPS && 
                             c.base + obj.dimensions.height > p.base - EPS;

      if (verticalOverlap) {
        const overlapX = c.x < p.position.x + p.dimensions.width + EPS && 
                        c.x + obj.dimensions.width > p.position.x - EPS;
        const overlapY = c.y < p.position.y + p.dimensions.depth + EPS && 
                        c.y + obj.dimensions.depth > p.position.y - EPS;

        if (overlapX && overlapY) {
          return { valid: false, reason: `Collision with ${p.name}` };
        }
      }
    }

    // 6) Support check
    const allowStacking = obj.rules.some(r => r.type === "allowStacking" && (r as any).value);
    const hasOnTopOrInside = obj.rules.some(r => r.type === "onTopOf" || r.type === "insideOf");
    
    if (c.base > EPS && !hasOnTopOrInside && !allowStacking) {
      if (!this.hasSupportUnderneath(c, obj, placed)) {
        return { valid: false, reason: "No support underneath" };
      }
    }

    // 7) Grid collision (floor only)
    if (Math.abs(c.base) < EPS) {
      const anyGrid = this.grid as any;
      const canPlaceOnFloorFn = anyGrid.canPlaceOnFloor?.bind(anyGrid);
      if (!canPlaceOnFloorFn) {
        return { valid: false, reason: "GridManager missing canPlaceOnFloor" };
      }
      if (!canPlaceOnFloorFn(c.x, c.y, obj.dimensions.width, obj.dimensions.depth)) {
        return { valid: false, reason: "Grid cell occupied" };
      }
    }

    return { valid: true };
  }

  // ========== HELPER METHODS - FIXED ==========

  private expectedOnTopPositions(targetName: string, obj: WorldObject, placed: PlacedObject[]): Candidate[] {
    const result: Candidate[] = [];
    const targets = placed.filter(p => p.name === targetName);
    for (const t of targets) {
      const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
      const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
      const base = t.base + t.dimensions.height;
      result.push({ x, y, base, why: `expectedOnTop:${targetName}`, rotation: t.rotation });
    }
    return result;
  }

  private expectedInsidePositions(targetName: string, obj: WorldObject, placed: PlacedObject[]): Candidate[] {
    const result: Candidate[] = [];
    const targets = placed.filter(p => p.name === targetName);
    for (const t of targets) {
      if (t.slots && t.slots.length) {
        for (const slot of t.slots) {
          result.push({
            x: t.position.x + slot.x,
            y: t.position.y + slot.y,
            base: (slot.base ?? t.base),
            why: `expectedInside:${targetName}:slot`,
            rotation: t.rotation
          });
        }
      } else {
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        result.push({ x, y, base: t.base, why: `expectedInside:${targetName}`, rotation: t.rotation });
      }
    }
    return result;
  }

  private expectedUnderPositions(targetName: string, obj: WorldObject, placed: PlacedObject[]): Candidate[] {
    const result: Candidate[] = [];
    const targets = placed.filter(p => p.name === targetName);
    for (const t of targets) {
      const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
      const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
      result.push({ x, y, base: 0, why: `expectedUnder:${targetName}`, rotation: t.rotation });
    }
    return result;
  }

  private expectedAdjacencyPositions(
    rule: Extract<PlacementRule, { type: "mustBeNextTo" | "toRightOf" | "toLeftOf" | "inFrontOf" | "behind" }>,
    obj: WorldObject,
    placed: PlacedObject[]
  ): Candidate[] {
    const out: Candidate[] = [];
    const targets = placed.filter(p => p.name === (rule as any).target);
    const gap = (rule as any).distance ?? 0.2;

    for (const t of targets) {
      const base = t.base; // CRITICAL: Use target's base

      if (rule.type === "mustBeNextTo") {
        out.push({ 
          x: t.position.x + t.dimensions.width + gap, 
          y: t.position.y, 
          base,
          why: `adj:${t.name}:right`,
          rotation: -Math.PI / 2
        });
        out.push({ 
          x: t.position.x - obj.dimensions.width - gap, 
          y: t.position.y, 
          base,
          why: `adj:${t.name}:left`,
          rotation: Math.PI / 2
        });
        out.push({ 
          x: t.position.x, 
          y: t.position.y + t.dimensions.depth + gap, 
          base,
          why: `adj:${t.name}:front`,
          rotation: Math.PI
        });
        out.push({ 
          x: t.position.x, 
          y: t.position.y - obj.dimensions.depth - gap, 
          base,
          why: `adj:${t.name}:back`,
          rotation: 0
        });
      } else if (rule.type === "toRightOf") {
        const x = t.position.x + t.dimensions.width + gap;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        out.push({ x, y, base, why: `toRightOf:${t.name}`, rotation: -Math.PI / 2 });
      } else if (rule.type === "toLeftOf") {
        const x = t.position.x - obj.dimensions.width - gap;
        const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
        out.push({ x, y, base, why: `toLeftOf:${t.name}`, rotation: Math.PI / 2 });
      } else if (rule.type === "inFrontOf") {
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y + t.dimensions.depth + gap;
        out.push({ x, y, base, why: `inFrontOf:${t.name}`, rotation: Math.PI });
      } else if (rule.type === "behind") {
        const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
        const y = t.position.y - obj.dimensions.depth - gap;
        out.push({ x, y, base, why: `behind:${t.name}`, rotation: 0 });
      }
    }
    return out;
  }

  private expectedFacingPositions(
    rule: Extract<PlacementRule, { type: "facingRelativeTo" }>,
    obj: WorldObject,
    placed: PlacedObject[]
  ): Candidate[] {
    const result: Candidate[] = [];
    const targets = placed.filter(p => p.name === rule.target);
    
    for (const t of targets) {
      let rotation: number | undefined;
      switch (rule.direction) {
        case "front": rotation = 0; break;
        case "back": rotation = Math.PI; break;
        case "left": rotation = -Math.PI / 2; break;
        case "right": rotation = Math.PI / 2; break;
      }
      const x = t.position.x + (t.dimensions.width - obj.dimensions.width) / 2;
      const y = t.position.y + (t.dimensions.depth - obj.dimensions.depth) / 2;
      result.push({ x, y, base: t.base, why: `facingExp:${t.name}`, rotation });
    }
    return result;
  }

  private matchesAnyCandidate(c: Candidate, expect: Candidate[]) {
    return expect.some(e => 
      this.nearlyEquals(c.x, e.x) && 
      this.nearlyEquals(c.y, e.y) && 
      Math.abs(c.base - e.base) < EPS
    );
  }

  private nearlyEquals(a: number, b: number, tol = 1e-3) {
    return Math.abs(a - b) <= tol;
  }

  // FIXED: Rotation-aware wall touching
  private touchesAnyWall(c: Candidate, obj: WorldObject, rotation: number) {
    // Get rotated dimensions
    const rot = rotation % (2 * Math.PI);
    const isRotated = Math.abs(Math.abs(rot) - Math.PI/2) < 0.1 || 
                      Math.abs(Math.abs(rot) - 3*Math.PI/2) < 0.1;
    
    const width = isRotated ? obj.dimensions.depth : obj.dimensions.width;
    const depth = isRotated ? obj.dimensions.width : obj.dimensions.depth;

    const left = Math.abs(c.x - 0) < 1e-3;
    const top = Math.abs(c.y - 0) < 1e-3;
    const right = Math.abs(c.x + width - this.roomWidth) < 1e-3;
    const bottom = Math.abs(c.y + depth - this.roomDepth) < 1e-3;
    
    return left || top || right || bottom;
  }

  private rotationFacingAwayFromNearestWall(c: Candidate, obj: WorldObject) {
    const hits: Array<{ wall: string; dist: number }> = [];
    hits.push({ wall: "left", dist: Math.abs(c.x - 0) });
    hits.push({ wall: "top", dist: Math.abs(c.y - 0) });
    hits.push({ wall: "right", dist: Math.abs(c.x + obj.dimensions.width - this.roomWidth) });
    hits.push({ wall: "bottom", dist: Math.abs(c.y + obj.dimensions.depth - this.roomDepth) });
    hits.sort((a, b) => a.dist - b.dist);
    
    const nearest = hits[0].wall;
    // Face away from wall
    if (nearest === "top") return 0;      // North wall -> face south (into room)
    if (nearest === "left") return Math.PI / 2;  // West wall -> face east
    if (nearest === "bottom") return Math.PI;    // South wall -> face north
    if (nearest === "right") return -Math.PI / 2; // East wall -> face west
    return 0;
  }

  private angleDiff(a: number, b: number) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d <= -Math.PI) d += 2 * Math.PI;
    return d;
  }

  private hasClearance(c: Candidate, obj: WorldObject, placed: PlacedObject[], clearance: number) {
    const ax1 = c.x - clearance;
    const ay1 = c.y - clearance;
    const ax2 = c.x + obj.dimensions.width + clearance;
    const ay2 = c.y + obj.dimensions.depth + clearance;
    const aBase = c.base;
    const aTop = c.base + obj.dimensions.height;

    for (const p of placed) {
      const bx1 = p.position.x;
      const by1 = p.position.y;
      const bx2 = p.position.x + p.dimensions.width;
      const by2 = p.position.y + p.dimensions.depth;
      const bBase = p.base;
      const bTop = p.base + p.dimensions.height;

      const verticalOverlap = aBase < bTop && aTop > bBase;
      if (!verticalOverlap) continue;

      const overlapX = ax1 < bx2 && ax2 > bx1;
      const overlapY = ay1 < by2 && ay2 > by1;
      if (overlapX && overlapY) return false;
    }
    return true;
  }

  private hasSupportUnderneath(c: Candidate, obj: WorldObject, placed: PlacedObject[]) {
    const neededTop = c.base;
    
    for (const p of placed) {
      const top = p.base + p.dimensions.height;
      if (Math.abs(top - neededTop) > EPS) continue;

      // Check if support fully covers the object's footprint
      const coversX = c.x >= p.position.x - EPS && 
                     c.x + obj.dimensions.width <= p.position.x + p.dimensions.width + EPS;
      const coversY = c.y >= p.position.y - EPS && 
                     c.y + obj.dimensions.depth <= p.position.y + p.dimensions.depth + EPS;

      if (coversX && coversY) return true;
    }
    return false;
  }

  private occupy(c: Candidate, obj: WorldObject, id: string) {
    const anyGrid = this.grid as any;
    const occupyFn = anyGrid.occupyFloor?.bind(anyGrid);
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

  private makeId(name: string) {
    return `${name}_${Math.random().toString(36).slice(2, 8)}`;
  }
}