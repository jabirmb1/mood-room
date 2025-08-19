// This component will get passed in a single hex colour; where it will then display a square with passed
// in colour.
//
import { HexColor } from "@/types/types";

type ColouredSquareProps = {
  colour: HexColor; // colour of the square given as a hex code
  length: number
};

export default function ColouredSquare({ colour, length= 50 }: ColouredSquareProps) {
  return (
    <div
    // using inline styles since size can be anything, same with colour.
    style={{
      width: `${length}px`,
      height: `${length}px`,
      backgroundColor: colour, 
    }}
    />
  );
}
