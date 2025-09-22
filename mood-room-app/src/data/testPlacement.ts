import { GenerateEngine } from "./GenerateEngine";
import { PlacedObject } from "./PlacementEngine";



async function runTest() {
  // Create GenerateEngine (room defaults inside it)
  const engine = new GenerateEngine();

  // Objects to test → only names needed now
  const objectsToPlace = [
    { name: "BedBasic" },
    { name: "BedsideTableBasic" },
    { name: "DeskBasicNormal" },
    { name: "armchair" },
    { name: "BookshelfBasic" },
  ];

  // Run placement
  const { placed, failures } = await engine.placeObjects(objectsToPlace);

  // ✅ Print placed results
  console.log("=== Placed Furniture ===");
  placed.forEach((p: PlacedObject) => {
    console.log(`Name: ${p.name}`);
    console.log(`  Position: x=${p.position.x}, y=${p.position.y}`);
    console.log(`  Base: ${p.base}, Rotation: ${p.rotation}`);
    console.log(
      `  Dimensions: w=${p.dimensions.width}, d=${p.dimensions.depth}, h=${p.dimensions.height}`
    );

    if (engine.grid.getOccupiedCells) {
      const occupied = engine.grid.getOccupiedCells(p);
      console.log("  Occupied Cells:", occupied);
    }
    console.log("------------------------");
  });

  // ✅ Print failures
  console.log("=== Placement Failures ===");
  failures.forEach((f) => {
    console.log(`Failed to place: ${f.obj.name}, reason: ${f.reason || "unknown"}`);
  });

  // ✅ Extra checks
  console.log("\n=== Edge Case Checks ===");

  // Collisions
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      if (engine.grid.checkCollision && engine.grid.checkCollision(a, b)) {
        console.warn(`⚠️ Collision detected between ${a.name} and ${b.name}`);
      }
    }
  }

  // Wall alignment
  placed.forEach((p) => {
    if (p.rules?.some((r) => r.type === "mustTouchWall" && r.value)) {
      if (engine.grid.isTouchingWall && !engine.grid.isTouchingWall(p)) {
        console.warn(`⚠️ ${p.name} should touch wall but does not`);
      }
    }
  });
}

// Run it
runTest().catch((err) => console.error("Test run failed:", err));
