// Main room canvas
// sets the ligthing, camera, walls and floor, all consitant for all room types
// also handles the models

'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useHelper, Grid } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { DirectionalLight, DirectionalLightHelper, Vector3, MeshStandardMaterial } from 'three';
import BedroomScene from './BedroomScene';
import LivingroomScene from './LivingroomScene';

// constants for room dimensions
const WALL_HEIGHT = 10;
const WALL_THICKNESS = 0.3;
const ROOM_SIZE = 13;


// Light component setup
// uses ambient, point and directional light
function Light() {
    const directionalLightRef = useRef<DirectionalLight>(null);
    
    //remember to remove helper
    if (process.env.NODE_ENV === 'development') {
        // We need to cast the ref to any to make TypeScript happy with useHelper
        useHelper(directionalLightRef as any, DirectionalLightHelper);
    }

    return (
        <>
            <ambientLight intensity={2} color={0xffffff} />
            <pointLight position={[10, 20, 10]} intensity={1} />

            <directionalLight
                ref={directionalLightRef}
                position={[5, 10, 5]}
                intensity={1.2}
                castShadow
            />
        </>
    );
}


// main walls component
// sets the walls and floor
function MainWalls() {
    const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
    const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xFFE99A }), []);
    const [showGrid] = useState(true); // Hardcoded to true for now, can be chganged depending on the use case for editing and view

    
    return (
        <>
         {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial}>
            <boxGeometry args={[ROOM_SIZE, ROOM_SIZE, WALL_THICKNESS]} />
        </mesh>

        {/* Back Wall */}
        <mesh position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]}>
            <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial color="lightgray" />
        </mesh>

        {showGrid && (
            // Grid component
            // used for editing 
        <Grid
            args={[ROOM_SIZE, ROOM_SIZE]} 
            position={[0, 0.3, 0]}       
            cellColor="#888"
            fadeDistance={100}            
            fadeStrength={1}
            infiniteGrid
        />
        )}


        {/* Left Wall */}
        <mesh position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]}>
            <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
            <meshStandardMaterial color="lightgray" />
        </mesh>
                    
        </>
    )
}

// main room canvas component
export default function RoomCanvas() {
    
    return (
      <Canvas shadows camera={{ position: [14.8, 11.7, 15.9], fov: 50 }}>
        <OrbitControls />
        <Light />
        <MainWalls />
        <LogCameraPosition />
        {/* <BedroomScene /> */}
        <LivingroomScene />
      </Canvas>
    );
}

//finding camera position can be removed once development is done
function LogCameraPosition() {
  const { camera } = useThree();

  useEffect(() => {
    console.log('Camera position:', camera.position);
    console.log('Camera target:', camera.getWorldDirection(new THREE.Vector3()));
  }, [camera]);

  return null;
}