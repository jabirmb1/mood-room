"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEdgeCaseTests = runEdgeCaseTests;
var GridManager_1 = require("./GridManager");
function logTest(name, expected, got) {
    console.log("".concat(name, "\nExpected: ").concat(expected, " \u2192 Got: ").concat(got, "\n"));
}
function runEdgeCaseTests() {
    console.log("==== EDGE CASE TEST SUITE START ====");
    var wallHeight = 10;
    var grid = new GridManager_1.GridManager(10, 10, 0.5); // 10x10 room, 0.5m cells
    // 1. Floating object (base > 0 but nothing beneath)
    var result1 = grid.canPlaceObjectInMeters(0, 0, 1, 1, 5, 1, wallHeight);
    logTest("Test 1: Floating object at base=5, height=1", "false", result1);
    // 2. Object with height = 0
    var result2 = grid.canPlaceObjectInMeters(1, 1, 1, 1, 0, 0, wallHeight);
    logTest("Test 2: Object with height=0", "false", result2);
    // 3. Exact fit at wall height
    var result3a = grid.canPlaceObjectInMeters(2, 2, 1, 1, wallHeight - 1, 1, wallHeight);
    logTest("Test 3a: Base=9, Height=1 (fits exactly)", "true", result3a);
    var result3b = grid.canPlaceObjectInMeters(2, 2, 1, 1, wallHeight - 1, 2, wallHeight);
    logTest("Test 3b: Base=9, Height=2 (too tall)", "false", result3b);
    // 4. Tiny gap
    grid.ooccupyCellInMeters(3, 3, 1, 1, 0, 1, "bed");
    var result4 = grid.canPlaceObjectInMeters(3, 3, 1, 1, 1.001, 2, wallHeight);
    logTest("Test 4: Tiny gap above bed (1.001)", "false", result4);
    // 5. Negative base/height
    var result5a = grid.canPlaceObjectInMeters(4, 4, 1, 1, -1, 2, wallHeight);
    logTest("Test 5a: Base=-1", "false", result5a);
    var result5b = grid.canPlaceObjectInMeters(4, 4, 1, 1, 0, -2, wallHeight);
    logTest("Test 5b: Height=-2", "false", result5b);
    // 6. Mixed overlaps
    grid.ooccupyCellInMeters(5, 5, 1, 1, 0, 1, "bed");
    grid.ooccupyCellInMeters(5, 5, 1, 1, 1, 2, "wardrobe");
    var result6 = grid.canPlaceObjectInMeters(5, 5, 1, 1, 2, 0.5, wallHeight);
    logTest("Test 6: Lamp overlapping wardrobe", "false", result6);
    // 7. Clearing objects
    grid.ooccupyCellInMeters(6, 6, 1, 1, 0, 1, "bed");
    grid.ooccupyCellInMeters(6, 6, 1, 1, 1, 1, "chair");
    grid.unOccupyCell("bed");
    var result7 = grid.canPlaceObjectInMeters(6, 6, 1, 1, 0, 1, wallHeight);
    logTest("Test 7: Clear bed, chair collapses?", "true", result7);
    // 8. Too tall pillar
    var result8 = grid.canPlaceObjectInMeters(7, 7, 1, 1, 0, wallHeight + 5, wallHeight);
    logTest("Test 8: Pillar taller than wall", "false", result8);
    // 9. Out of bounds
    var result9 = grid.canPlaceObjectInMeters(11, 11, 3, 3, 0, 1, wallHeight);
    logTest("Test 9: Sofa 3x3 at (11,11) in 10x10 grid", "false", result9);
    // 10. Non-square room
    var grid2 = new GridManager_1.GridManager(8, 13, 0.5);
    var result10 = grid2.canPlaceObjectInMeters(7, 12, 3, 3, 0, 1, wallHeight);
    logTest("Test 10: Sofa at edge of 8x13 room", "false", result10);
    console.log("==== EDGE CASE TEST SUITE END ====");
}
runEdgeCaseTests();
