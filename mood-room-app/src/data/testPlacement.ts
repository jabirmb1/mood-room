// testPlacement.ts
import { GridManager } from "./GridManager";
import { PlacementEngine, PlacedObject } from "./PlacementEngine";
import { FurnitureRules, furnitureRules } from "./rules";

// Furniture instance for testing
interface FurnitureInstance {
  id: string;
  path: string;
  dimensions: { width: number; depth: number; height: number };
  rule: FurnitureRules;
  slots?: Array<{ x: number; y: number; base?: number }>;
}

// Room setup
const roomWidth = 8;    // meters
const roomDepth = 6;    // meters
const wallHeight = 3;   // meters
const cellSize = 0.25;  // finer precision

// Create grid + engine
const grid = new GridManager(roomWidth, roomDepth, cellSize);
const engine = new PlacementEngine({
  grid,
  roomWidth,
  roomDepth,
  wallHeight,
  cellSize,
});

// Helper to get rule
function getRule(name: string): FurnitureRules {
  const r = furnitureRules.find((f) => f.name === name);
  if (!r) throw new Error(`Rule not found: ${name}`);
  return r;
}

// Define bedroom objects
const objectsToPlace: FurnitureInstance[] = [
  { id: "bed1", path: "", dimensions: { width: 2, depth: 2, height: 2 }, rule: getRule("BedBasic") },
  { id: "bedside1", path: "", dimensions: { width: 1, depth: 1, height: 1 }, rule: getRule("BedsideTableBasic") },
  { id: "desk1", path: "", dimensions: { width: 1.5, depth: 1.5, height: 1 }, rule: getRule("DeskBasicNormal") },
  { id: "chair1", path: "", dimensions: { width: 1, depth: 1, height: 1 }, rule: getRule("armchair") },
  { id: "shelf1", path: "", dimensions: { width: 1, depth: 1, height: 2 }, rule: getRule("BookshelfBasic") },
];

// Run placement
const { placed, failures } = engine.placeSequential(
  objectsToPlace.map((o) => ({
    name: o.id,
    path: o.path,
    dimensions: o.dimensions,
    rules: o.rule.rules,
  }))
);

// ✅ Print results
console.log("=== Placed Furniture ===");
placed.forEach((q: PlacedObject) => {
  const occupiedCells = grid.getOccupiedCells(q); // assuming GridManager has this helper
  console.log(`Name: ${q.name}`);
  console.log(`  Position: x=${q.position.x}, y=${q.position.y}`);
  console.log(`  Base: ${q.base}, Rotation: ${q.rotation}`);
  console.log(`  Dimensions: w=${q.dimensions.width}, d=${q.dimensions.depth}, h=${q.dimensions.height}`);
  console.log(`  Occupied Cells:`, occupiedCells);
  console.log("------------------------");
});

console.log("=== Placement Failures ===");
failures.forEach((f) => {
  console.log(`Failed to place: ${f.obj.name}, reason: ${f.reason || "unknown"}`);
});

// Edge case checks
console.log("\n=== Edge Case Checks ===");
// Example: check collisions
for (let i = 0; i < placed.length; i++) {
  for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i];
    const b = placed[j];
    const collision = grid.checkCollision(a, b); // assuming you have this method
    if (collision) console.warn(`⚠️ Collision detected between ${a.name} and ${b.name}`);
  }
}

// Example: check wall alignment
placed.forEach((p) => {
  if (p.rules?.some((r) => r.type === "mustTouchWall" && r.value)) {
    const touchingWall = grid.isTouchingWall(p); // method in GridManager
    if (!touchingWall) console.warn(`⚠️ ${p.name} is supposed to touch wall but does not`);
  }
});
