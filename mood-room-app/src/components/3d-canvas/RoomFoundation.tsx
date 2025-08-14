'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { wallHeight, wallThickness, roomSize } from '@/utils/3d-canvas/const';
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
  const wallSize: [number, number, number] = [roomSize, wallHeight, wallThickness]
  const rightDirection : [number, number, number] = [0, Math.PI/2, 0];
  const leftDirection : [number, number, number]= [0, -Math.PI/2, 0]

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
      <Wall name="backWall" position={[0, wallHeight / 2, -roomSize / 2]} size={wallSize} enableColliders={true}/>
      <Wall name="frontWall" position={[0, wallHeight / 2, roomSize / 2]} size={wallSize} enableColliders={true} 
      invisible={true}/>
      <Wall name="leftWall" position={[0, wallHeight / 2, -roomSize/2]} size={wallSize} enableColliders={true} 
      rotation={rightDirection}/>
      <Wall name="rightWall" position={[0, wallHeight / 2, -roomSize/2]} size={wallSize} enableColliders={true}
       rotation={leftDirection} invisible={true} />

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
