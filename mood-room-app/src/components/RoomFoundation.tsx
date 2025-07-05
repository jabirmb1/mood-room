// components/MainWalls.tsx
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { wallHeight, wallThickness, roomSize } from '@/utils/const';

type RoomFoundationProps = {
  onFloorReady?: (objects: THREE.Object3D[]) => void;
}
export default function RoomFoundation({ onFloorReady }: RoomFoundationProps) {
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Refs to the floor and walls meshes
  const floorRef = useRef<THREE.Mesh>(null);
  const backWallRef = useRef<THREE.Mesh>(null);
  const leftWallRef = useRef<THREE.Mesh>(null);

   // Notify parent with the floor ref when ready
   useEffect(() => {
    if (floorRef?.current && onFloorReady) {
      onFloorReady(floorRef.current);
    }
  }, []);

  return (
    <>
      {/* floor */}
      <mesh ref = {floorRef}  name = 'floor' receiveShadow = {true}  castShadow = {true} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial}>
        <boxGeometry args={[roomSize, roomSize, wallThickness]} />
      </mesh>

      {/* walls */}
      <mesh  ref = {backWallRef} name = 'backWall' receiveShadow = {true}  castShadow = {true} position={[0, wallHeight / 2, -roomSize / 2]}>
        <boxGeometry args={[roomSize, wallHeight, wallThickness]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
      {showGrid && (
        <Grid
          args={[roomSize, roomSize]}
          position={[0, 0.3, 0]}
          cellColor="#888"
          fadeDistance={100}
          fadeStrength={1}  
        />
      )}
      <mesh  ref = {leftWallRef} name='leftWall' receiveShadow = {true}  castShadow = {true} position={[-roomSize / 2, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, roomSize]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
    </>
  );
}
  