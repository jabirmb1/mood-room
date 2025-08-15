// import { GridManager } from "./GridManager";

// // Create a 13m x 10m room, 0.5m per cell
// const grid = new GridManager(13, 10, 0.5);

// console.log("Total cells:", grid.width * grid.height);

// // --- Test 1: Place a 2m x 3m object at (2m,2m)
// if (grid.validCellInMeters(2, 2, 2, 3)) {
//     grid.occupyCellInMeters(2, 2, 2, 3, "obj1");
//     console.log("Placed object obj1 at (2m,2m)");
// } else {
//     console.log("Can't place obj1 at (2m,2m)");
// }

// // Check occupancy
// console.log("Is (2.5m,2.5m) occupied?", !grid.validCellInMeters(2.5, 2.5, 0.1, 0.1));
// console.log("Is (5m,5m) free?", grid.validCellInMeters(5, 5, 0.1, 0.1));

// // Print grid snapshot
// console.log("\nGrid snapshot after obj1:");
// grid.debugPrint(10, 6);

// // --- Test 2: Place object at bottom-right corner (should fail)
// if (grid.validCellInMeters(10.0, 8.0, 3, 2)) {
//     grid.occupyCellInMeters(10.0, 8.0, 3, 2, "obj2");
//     console.log("Placed object obj2 at bottom-right corner");
// } else {
//     console.log("Can't place obj2 at bottom-right corner");
// }

// // --- Test 3: Place object at top-left corner (exact fit)
// if (grid.validCellInMeters(0, 0, 3, 2)) {
//     grid.occupyCellInMeters(0, 0, 3, 2, "obj3");
//     console.log("Placed object obj3 at top-left corner");
// }

// // --- Test 4: Attempt overlapping object
// if (grid.validCellInMeters(3, 3, 2, 2)) {
//     grid.occupyCellInMeters(3, 3, 2, 2, "obj4");
//     console.log("Placed overlapping object obj4");
// } else {
//     console.log("Cannot place overlapping object obj4");
// }

// // --- Test 5: Tiny object
// if (grid.validCellInMeters(5, 5, 0.2, 0.2)) {
//     grid.occupyCellInMeters(5, 5, 0.2, 0.2, "tinyObj");
//     console.log("Placed tiny object at (5,5)");
// }

// // --- Final grid snapshot
// console.log("\nFinal grid snapshot:");
// grid.debugPrint(20, 10);
