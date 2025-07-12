// model type.
export type Model = {
    id: string;
    url: string;
    colourPalette?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
    position: [number, number, number];
    scale?: [number, number, number];
    rotation?: [number, number, number];// in radians.

    transform?: {// optional transform data for model during editing page (used to keep transform data in sync with the model)
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    };
  };