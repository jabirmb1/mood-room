// testGrid.ts
import { GridManager } from "./GridManager"; // adjust path if needed

// --- Sample Test ---
function runGridTests() {
  console.log("=== GRID TEST START ===");

  // Room size: 10m x 10m, cell size: 0.5m (fine grid)
  const grid = new GridManager(10, 10, 0.1);

  // Add a bed
  const bed = {
    x: 1,
    y: 1,
    width: 3.2,
    depth: 2.1,
    id: "Bed01"
  };

  const canPlaceBed = grid.canPlaceOnFloor(
    bed.x,
    bed.y,
    bed.width,
    bed.depth
  );
  console.log("Can place bed?", canPlaceBed);

  if (canPlaceBed) {
    grid.occupyFloor(
      bed.x,
      bed.y,
      bed.width,
      bed.depth,
      bed.id
    );
    console.log("Placed bed:", bed.id);
  }

  // Try placing a bookshelf overlapping the bed
  const bookshelf = {
    x: 2, // overlaps with bed area
    y: 1,
    width: 1.5,
    depth: 0.5,
    id: "Bookshelf01"
  };

  const canPlaceShelf = grid.canPlaceOnFloor(
    bookshelf.x,
    bookshelf.y,
    bookshelf.width,
    bookshelf.depth
  );
  console.log("Can place bookshelf?", canPlaceShelf);

  if (canPlaceShelf) {
    grid.occupyFloor(
      bookshelf.x,
      bookshelf.y,
      bookshelf.width,
      bookshelf.depth,
      bookshelf.id
    );
    console.log("Placed bookshelf:", bookshelf.id);
  } else {
    console.log("❌ Bookshelf blocked by bed.");
  }

  // Free the bed
  grid.unOccupyFloor(bed.id);
  console.log("Removed bed:", bed.id);

  // Now try placing bookshelf again
  const canPlaceShelfAfterBedRemoved = grid.canPlaceOnFloor(
    bookshelf.x,
    bookshelf.y,
    bookshelf.width,
    bookshelf.depth
  );
  console.log("Can place bookshelf after bed removed?", canPlaceShelfAfterBedRemoved);

  console.log("=== GRID TEST END ===");
}

runGridTests();
