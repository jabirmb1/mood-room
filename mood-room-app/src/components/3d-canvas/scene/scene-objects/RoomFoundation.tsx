'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Grid } from '@react-three/drei';
import { wallHeight, wallThickness, roomSize } from '@/utils/3d-canvas/const';
import { RigidBody } from '@react-three/rapier';
import { Wall } from './Wall';
import Skirting from './Skirting';
import { getThreeColour } from '@/utils/general/colours';

type RoomFoundationProps = {
  onFloorReady?: (objects: THREE.Object3D) => void;
  collidersEnabled?: boolean; // Toggle physics colliders (e.g., disable in view mode)
  floorColour?: string;
  skirtingColour?: string;
  enableShadows?: boolean;
  wallColour?:string
};
export default function RoomFoundation({ onFloorReady, wallColour, floorColour, skirtingColour,
  enableShadows = false, collidersEnabled = false }: RoomFoundationProps) {
  
  // if an invalid colour was passed in; then just fallback to a correct colour
  const threeFloorColour = getThreeColour(floorColour ?? '#FFE99A', '#FFE99A');
  const threeWallColour=getThreeColour(wallColour ?? 'grey', 'grey');
  const threeSkirtingColour=getThreeColour(skirtingColour ?? 'white', 'white');


  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color:threeFloorColour }), []);
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color:threeWallColour }), []);
  const [showGrid, setShowGrid] = useState(false);
  const wallSize: [number, number, number] = [roomSize, wallHeight, wallThickness]
  const rightDirection : [number, number, number] = [0, Math.PI/2, 0];
  const leftDirection : [number, number, number]= [0, -Math.PI/2, 0]
  const skirtingHeight = 1
  const skirtingDepth = 0.3

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
            receiveShadow={enableShadows}
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
          receiveShadow={enableShadows}
          position={[0, 0, 0]}
          material={floorMaterial}
        >
          <boxGeometry args={[roomSize,wallThickness, roomSize]} />
        </mesh>
      )}

      {/* Walls */}
      <Wall name="backWall" position={[0, wallHeight / 2, -roomSize / 2]} size={wallSize} enableColliders={true}
      colour={threeWallColour} enableShadows={enableShadows}/>
      <Wall name="frontWall" position={[0, wallHeight / 2, roomSize / 2]} size={wallSize} enableColliders={true} 
      invisible={true} enableShadows={false}/>
      <Wall name="leftWall" position={[0, wallHeight / 2, -roomSize/2]} size={wallSize} enableColliders={true} 
      rotation={rightDirection} colour={threeWallColour} enableShadows={enableShadows}/>
      <Wall name="rightWall" position={[0, wallHeight / 2, -roomSize/2]} size={wallSize} enableColliders={true}
       rotation={leftDirection} invisible={true} enableShadows={false}/>

       {/* skirting on the visible walls */}
       
       {/* back wall skirting */}
       <Skirting position={[-roomSize / 2, wallThickness/2, -roomSize / 2 + (wallThickness/2)]} 
       colour={threeSkirtingColour} width={roomSize} height={skirtingHeight} depth={skirtingDepth} 
       rotation = {[0, 0, 0]} enableShadows={enableShadows} enableColliders={collidersEnabled}/>

      {/*left wall skirting */}
      <Skirting position={[-roomSize/2 + (wallThickness/2), wallThickness/2, roomSize/2 ]} 
      colour={threeSkirtingColour} width={roomSize} height={skirtingHeight} depth={skirtingDepth}
       rotation = {rightDirection} enableShadows={enableShadows} enableColliders={collidersEnabled}/>

      {/* Ceiling */}
      <Wall name="ceiling" position={[0, wallHeight, 0]} size={[roomSize, wallThickness, roomSize]}  enableColliders={true}
      invisible={true} enableShadows={false}/>

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
