export type PlacementRule =
  | { type: "mustTouchWall"; value: boolean }
  | { type: "mustFaceAwayFromWall"; value: boolean }
  | { type: "mustTouchGround"; value: boolean }
  | { type: "mustBeNextTo"; target: string }
  | { type: "allowStacking"; value: boolean }
  | { type: "alignWith"; target: string }
  | { type: "insideOf"; target: string }
  | { type: "onTopOf"; target: string }
  | { type: "under"; target: string }
  | { type: "toRightOf"; target: string; distance?: number }
  | { type: "toLeftOf"; target: string; distance?: number }
  | { type: "inFrontOf"; target: string; distance?: number }
  | { type: "behind"; target: string; distance?: number }
  | { type: "facingRelativeTo"; target: string; direction: "front" | "back" | "left" | "right" }
  | { type: "minClearance"; meters: number };

export type FurnitureRules = {
  name: string;
  roomType: string;
  rules: PlacementRule[];
  priority?: number; // Higher = place first
};

// ============================================
// IMPROVED FURNITURE RULES
// Key improvements:
// 1. Removed conflicting constraints
// 2. Added placement priorities
// 3. Better spatial relationships
// 4. More realistic positioning
// ============================================

export const furnitureRules: FurnitureRules[] = [
  
  // ========== BEDROOM FURNITURE ==========
  
  {
    name: "BedBasic",
    roomType: "BedRoom",
    priority: 100,
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },

  {
    name: "BedsideTableBasic",
    roomType: "BedRoom",
    priority: 90,
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      // CHANGED: Use mustBeNextTo instead of toRightOf for flexibility
      { type: "mustBeNextTo", target: "BedBasic" },
      // This generates 4 positions and picks the first valid one
    ],
  },

  {
    name: "BookshelfBasic",
    roomType: "LivingRoom",
    priority: 80,
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "minClearance", meters: 0.5 },
    ],
  },

  {
    name: "ChairBasicBroken",
    roomType: "LivingRoom",
    priority: 40,
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "minClearance", meters: 0.5 }, // Reduced from 0.8
    ],
  },

  {
    name: "DeskBasicNormal",
    roomType: "Both",
    priority: 70,
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "minClearance", meters: 0.6 }, // Reduced from 0.8
    ],
  },

  {
    name: "DrawerBasicBroken",
    roomType: "Both",
    priority: 50,
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "minClearance", meters: 0.5 }, // REDUCED from 0.8m
      // Note: If room is crowded, this might still fail
    ],
  },

  {
    name: "WaterBottle",
    roomType: "Both",
    priority: 5,
    rules: [
      { type: "allowStacking", value: true },
    ],
  },

  {
    name: "BookStackBasic",
    roomType: "Both",
    priority: 10,
    rules: [
      { type: "allowStacking", value: true },
    ],
  },


  {
    name: "WaterBottle",
    roomType: "Both",
    priority: 5, // Very last
    rules: [
      { type: "allowStacking", value: true },
      // Can be anywhere - floor or on furniture
    ],
  },

  {
    name: "TableLamp",
    roomType: "Both",
    priority: 20,
    rules: [
      { type: "onTopOf", target: "BedsideTableBasic" }, // Must be on nightstand
      { type: "allowStacking", value: true },
    ],
  },

  {
    name: "DeskChair",
    roomType: "Both",
    priority: 30,
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "inFrontOf", target: "DeskBasicNormal", distance: 0.3 },
      { type: "facingRelativeTo", target: "DeskBasicNormal", direction: "back" }, // Face desk
      { type: "allowStacking", value: false },
    ],
  },

  {
    name: "RugLarge",
    roomType: "Both",
    priority: 95, // Place early - other furniture goes on it
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },

  {
    name: "WallArt",
    roomType: "Both",
    priority: 1, // Very last
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "allowStacking", value: false },
      // Note: Would need special handling for wall-mounted items (different base height)
    ],
  },
];

// ============================================
// USAGE NOTES & BEST PRACTICES
// ============================================

/*
RULE STRENGTH GUIDELINES:

1. **Anchors (Priority 90-100)**
   - Large furniture that defines room layout
   - Example: Bed, Sofa, Large Desk
   - Rules: mustTouchWall + mustFaceAwayFromWall

2. **Supporting Furniture (Priority 50-80)**
   - Medium items that relate to anchors
   - Example: Nightstands, Bookshelves, Dressers
   - Rules: Adjacency to anchors (toRightOf, mustBeNextTo)

3. **Flexible Furniture (Priority 30-50)**
   - Items that can float in the room
   - Example: Chairs, Small Tables
   - Rules: minClearance only, maybe inFrontOf

4. **Decorations (Priority 1-20)**
   - Small items placed last
   - Example: Lamps, Books, Bottles
   - Rules: onTopOf, insideOf, or allowStacking

AVOIDING CONFLICTS:

❌ BAD: alignWith + mustBeNextTo (redundant)
✅ GOOD: Just use toRightOf/toLeftOf

❌ BAD: mustTouchWall + inFrontOf (likely impossible)
✅ GOOD: Choose one positioning strategy

❌ BAD: Referencing objects placed later
✅ GOOD: Use priority to ensure dependencies exist first

PLACEMENT ORDER EXAMPLE:
1. BedBasic (priority 100)
2. BedsideTableBasic (priority 90, references Bed)
3. TableLamp (priority 20, references BedsideTable)
4. WaterBottle (priority 5, can go anywhere)

*/