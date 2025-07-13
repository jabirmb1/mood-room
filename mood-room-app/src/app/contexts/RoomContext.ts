// RoomContext.ts
import { createContext, useContext } from "react";
import * as THREE from "three";

/**********This context will help us manage the room in a global way *************/
type RoomContextType = {
  floorRef: React.RefObject<THREE.Object3D | null>;// the reference of the floor (used for collisin and room bounding checks.)
  wallHeight: number;// height of the wall
  wallThickness: number;// how thick the walls should be
};

export const RoomContext = createContext<RoomContextType | null>(null);

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRoomContext must be used inside a <RoomProvider>");
  return context;
}
