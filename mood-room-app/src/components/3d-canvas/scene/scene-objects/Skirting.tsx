/****** component for skirting on walls ************/
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three'

type SkirtingProps = {
  colour?: THREE.Color;// colour of the skirting
  position?: [number, number, number];
  rotation?: [number, number, number];
  width: number;   // length along the wall
  height: number;  // height of the skirting
  depth?: number;  // thickness of the skirting (defaults to 0.02)
  roundingFactor?: number;// how much to round off the edges (0-1)
  invisible?: boolean// whether or not the wall should invisible
  enableShadows?: boolean;
  enableColliders?: boolean;//  whether or not the colliders should be active or not.

}

// a skiriting board made entirely by three.js with a rounded top
export default function Skirting({ colour= new THREE.Color('white'), position=[0,0,0], 
    rotation=[0, 0, 0], width, height, depth = 0.02, roundingFactor = 0.1, invisible=false, 
    enableShadows=false, enableColliders=false}: SkirtingProps) {
  // Create skirting cross section shape
  const shape = new THREE.Shape();

  const cornerRadius = height * roundingFactor;// round off the top
  const flatTopWidth = width;

  // Start bottom-left
  shape.moveTo(0, 0);
  shape.lineTo(flatTopWidth, 0);
  shape.lineTo(flatTopWidth, height - cornerRadius);
  // Rounded top edge (right to left)
  shape.quadraticCurveTo(flatTopWidth, height, flatTopWidth - cornerRadius, height);
  shape.lineTo(cornerRadius, height);
  shape.quadraticCurveTo(0, height, 0, height - cornerRadius);
  shape.lineTo(0, 0);

  // Extrude along Z to give it thickness
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: false
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const material = new THREE.MeshStandardMaterial({ color: colour });

  return (
    enableColliders?  (
        <RigidBody type='fixed' colliders='cuboid' rotation={rotation} position={position}>

            <mesh geometry={geometry} material={material} visible={!invisible}
             castShadow={enableShadows} receiveShadow={enableShadows}/>
        </RigidBody>
    ):
    <mesh geometry={geometry} material={material} visible={!invisible} rotation={rotation}
     position={position} castShadow={enableShadows} receiveShadow={enableShadows}/>
  );
}
