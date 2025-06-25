// components/MainWalls.tsx
'use client';

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';

const WALL_HEIGHT = 10;
const WALL_THICKNESS = 0.3;
const ROOM_SIZE = 13;

export default function MainWalls() {
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  return (
    <>
      <mesh receiveShadow = {true}  castShadow = {true} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial}>
        <boxGeometry args={[ROOM_SIZE, ROOM_SIZE, WALL_THICKNESS]} />
      </mesh>
      <mesh  receiveShadow = {true}  castShadow = {true} position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
      {showGrid && (
        <Grid
          args={[ROOM_SIZE, ROOM_SIZE]}
          position={[0, 0.3, 0]}
          cellColor="#888"
          fadeDistance={100}
          fadeStrength={1}  
        />
      )}
      <mesh  receiveShadow = {true}  castShadow = {true} position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
    </>
  );
}
  