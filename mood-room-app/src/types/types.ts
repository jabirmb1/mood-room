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
  };