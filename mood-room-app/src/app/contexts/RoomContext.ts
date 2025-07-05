// RoomContext.ts
import { createContext, useContext } from "react";
import * as THREE from "three";

type RoomContextType = {
  floorRef: React.RefObject<THREE.Object3D>;
  wallHeight: number;
  wallThickness: number;
};

export const RoomContext = createContext<RoomContextType | null>(null);

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) throw new Error("useRoomContext must be used inside a <RoomProvider>");
  return context;
}
