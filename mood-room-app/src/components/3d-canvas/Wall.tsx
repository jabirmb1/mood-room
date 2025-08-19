'use client'

import { RigidBody } from "@react-three/rapier";

/************This coponent will just create  three js walls efficiently with an optional flag to turn on/ off colliders. */

type WallProps = {
    position: [number, number, number]; // position of wall
    size: [number, number, number]; // how big it should be
    rotation?: [number, number, number]// how should wall be rotated?
    colour?: string; // colour of the walls.
    name?: string;// name of wall
    invisible?: boolean// whether or not the wall should invisible
    enableColliders?: boolean;//  whether or not the colliders should be active or not.

}
export function Wall({ position, size,rotation,  name, colour, invisible = false, enableColliders}: WallProps){

    return(
    /* conditionally redender the rigid body; let user data be on top most mesh so it can be accessed easily by other parts of program */
    enableColliders ? (
      <RigidBody type="fixed" colliders="cuboid"  rotation={rotation} includeInvisible 
      userData={{permanentInvisible: invisible, tags: [!invisible ? 'wall' : null]}}>
        {/* we only want our internal code to keep track of it being a 'wall' if it's visible 
        (for wall specific collision logic; otherwise we will use just default collisions
        */}

        <mesh name={name} position={position} receiveShadow castShadow visible={!invisible}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={colour ?? "lightgray"} />
        </mesh>
      </RigidBody>
    ) : (
      <mesh name={name} position={position} rotation={rotation} receiveShadow castShadow visible={!invisible}
      userData={{permanentInvisible: invisible}}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={colour ??"lightgray"} />
      </mesh>
    ));
}