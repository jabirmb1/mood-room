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
  | { type: "facingRelativeTo"; target: string; direction: "front" | "back" | "left" | "right" };


export type FurnitureRules = {
  name: string;
  roomType: string;
  rules: PlacementRule[];
};

// START: furnitureRules
export const furnitureRules: FurnitureRules[] = [
  {
    name: "BookStackBasic",
    roomType: "Both",
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: true }
    ],
  },
  {
    name: "WaterBottle",
    roomType: "Both",
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: true }
    ],
  },
  {
    name: "armchair",
    roomType: "Livingroom",
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "mustFaceAwayFromWall", value: false },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "BedBasic",
    roomType: "BedRoom",
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "alignWith", target: "BedsideTableBasic" },
    ],
  },
  {
    name: "BedsideTableBasic",
    roomType: "BedRoom",
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustFaceAwayFromWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
      { type: "alignWith", target: "BedBasic" },
      { type: "mustBeNextTo", target: "BedBasic" },
    ],
  },
  {
    name: "BookshelfBasic",
    roomType: "LivingRoom",
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "BookShelfFancy",
    roomType: "LivingRoom",
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "ChairBasicBroken",
    roomType: "LivingRoom",
    rules: [
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "DeskBasicNormal",
    roomType: "Both",
    rules: [
      { type: "mustTouchWall", value: false },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "DrawerBasicBroken",
    roomType: "Both",
    rules: [
      { type: "mustTouchWall", value: true },
      { type: "mustTouchGround", value: true },
      { type: "allowStacking", value: false },
    ],
  },
  {
    name: "BookStackBasic",
    roomType: "Both",
    rules: [
      { type: "mustTouchGround", value: false },
      { type: "allowStacking", value: true },
      { type: "insideOf", target: "DeskBasicNormal" },
    ],
  },
  // ...add remaining furniture following this pattern
];
// END: furnitureRules
