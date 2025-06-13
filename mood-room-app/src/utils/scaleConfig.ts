// presets for target sizes of models
// This object maps model names to their desired max bounding size (targetSize)
// the scale utility uses the largest asset dimenstion to decide how to scale the rest of thr models

export const targetSizes: Record<string, number> = {
    Bed: 7,
    Closet: 4.8,
    Rug: 11.6,
    Desk: 5.1,
    DeskChair: 3.5,
    SideTable: 2.5,
    Sofa: 7,
    Table: 4,
    Armchair: 3,
    TVCabinet: 6,
    WallArt: 2,
};
  