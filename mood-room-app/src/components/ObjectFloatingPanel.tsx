import { Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import {useEffect, useRef} from 'react';
import * as THREE from "three";

/* This component will be used to provide the user different options and flexability when they are trying to move the object,
This panel will float on top of the object when in move mode */

type ObjectFloatingPanelProps = {
  onClose: ()=> void;// function to run when closing the panel and do some clean up.
  isHorizontalMode: boolean
  setIsHorizontalMode: React.Dispatch<React.SetStateAction<boolean>>;
  setMode: (mode: string) => void;
  onDelete: ()=> void// function to delete object.
}

export function ObjectFloatingPanel({onClose, isHorizontalMode, setIsHorizontalMode, setMode, onDelete} : ObjectFloatingPanelProps )
{
  // we want the floating panel to always face camera to give it a 2-d hud feel, to do this we will manually rotate the panel
  // to always be perpendicular to the camera's face.
  const groupRef = useRef<THREE.Group>(null)
  const {camera} = useThree()// get current camera from the canavas.

  // On every frame, update group's quaternion to match camera's, so it faces exactly the camera (no depth)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  // clean up useEffect to make sure that when we first see the floating panel, it defaults into horizontal movement.
  useEffect(() => {
    return () => {
      setIsHorizontalMode(true); // always default into horizontal moving first
    };
  }, [setIsHorizontalMode]);

  return (
    <>
      <group ref={groupRef} position={[0, 1.2, 0]}>
        {/* using Html so we can create a floating bar on top of object when in move mode */}
        <Html position={[0, 1.2, 0]} center distanceFactor={8} transform>
          <div className="bg-white p-2 rounded shadow flex gap-2">
              <button onClick={() => setMode("edit")}>Edit</button>{/* if we set the mode into 'edit' then we can open editor menu */}

              {/* This button just allows the user to move the model vertically or horizontally*/}
              <button onClick={() => setIsHorizontalMode(prev => !prev)}>
              {isHorizontalMode ? "Move Vertically" : "Move Horizontally"}
            </button>
            
            <button onClick={onClose}>Close</button>

            {/* button to delete object */}
            <button onClick = {onDelete}>Delete</button>
          </div>
        </Html>
      </group>
    </>
  );
}