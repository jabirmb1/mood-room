'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { wallHeight, wallThickness, roomSize } from '@/utils/const';
import { RigidBody } from '@react-three/rapier';
import { Wall } from './Wall';

type RoomFoundationProps = {
  onFloorReady?: (objects: THREE.Object3D) => void;
  collidersEnabled?: boolean; // Toggle physics colliders (e.g., disable in view mode)
};

export default function RoomFoundation({ onFloorReady, collidersEnabled = false }: RoomFoundationProps) {
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
  const [showGrid, setShowGrid] = useState(true);

  const floorRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (floorRef.current && onFloorReady) {
      onFloorReady(floorRef.current);
    }
  }, []);

  return (
    <>
      {/* Floor */}
      {collidersEnabled ? (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            ref={floorRef}
            name="floor"
            receiveShadow
            castShadow
            position={[0, 0, 0]}
            material={floorMaterial}
          >
            <boxGeometry args={[roomSize,wallThickness, roomSize]} />
          </mesh>
        </RigidBody>
      ) : (
        <mesh
          ref={floorRef}
          name="floor"
          receiveShadow
          castShadow
          position={[0, 0, 0]}
          material={floorMaterial}
        >
          <boxGeometry args={[roomSize,wallThickness, roomSize]} />
        </mesh>
      )}

      {/* Walls */}
      <Wall name="backWall" position={[0, wallHeight / 2, -roomSize / 2]} size={[roomSize, wallHeight, wallThickness]} enableColliders={true}/>
      <Wall name="frontWall" position={[0, wallHeight / 2, roomSize / 2]} size={[roomSize, wallHeight, wallThickness]} enableColliders={true} 
      invisible={true}/>
      <Wall name="leftWall" position={[-roomSize / 2, wallHeight / 2, 0]} size={[wallThickness, wallHeight, roomSize]} enableColliders={true} />
      <Wall name="rightWall" position={[roomSize / 2, wallHeight / 2, 0]} size={[wallThickness, wallHeight, roomSize]} enableColliders={true}
      invisible={true} />

      {/* Ceiling */}
      <Wall name="ceiling" position={[0, wallHeight, 0]} size={[roomSize, wallThickness, roomSize]}  enableColliders={true}
      invisible={true}/>

      {showGrid && (
        <Grid
          args={[roomSize, roomSize]}
          position={[0, 0.3, 0]}
          cellColor="#888"
          fadeDistance={100}
          fadeStrength={1}
        />
      )}
    </>
  );
}
