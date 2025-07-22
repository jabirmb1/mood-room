'use client'

import { RigidBody } from "@react-three/rapier";

/************This coponent will just create  three js walls efficiently with an optional flag to turn on/ off colliders. */

type WallProps = {
    position: [number, number, number]; // position of wall
    size: [number, number, number]; // how big it should be
    name: string;// name of wall
    invisible?: boolean// whether or not the wall should invisible
    enableColliders?: boolean;//  whether or not the colliders should be active or not.

}
export function Wall({ position, size, name, invisible = false, enableColliders}: WallProps){

    return(
    /* conditionally redender the rigid body; let user data be on top most mesh so it can be accessed easily by other parts of program */
    enableColliders ? (
      <RigidBody type="fixed" colliders="cuboid" includeInvisible userData={{permanentInvisible: invisible}}> 
        <mesh name={name} position={position} receiveShadow castShadow visible={!invisible}>
          <boxGeometry args={size} />
          <meshStandardMaterial color="lightgray" />
        </mesh>
      </RigidBody>
    ) : (
      <mesh name={name} position={position} receiveShadow castShadow visible={!invisible}
      userData={{permanentInvisible: invisible}}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
    ));
}