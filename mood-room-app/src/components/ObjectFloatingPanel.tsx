import { Billboard, Html } from "@react-three/drei";
import { useEffect} from "react";
import * as THREE from "three";
/*This component will be used to provide the user different options and flexability when they are trying to move the object,
This panel will float on top of the object when in move mode */

type ObjectFloatingPanelProps = {
  modelRef: React.RefObject<THREE.Object3D | null>; // ref of object so we know what position it is at.
  isHorizontalMode: boolean;// whether the object is in horizontal movement mode or not.
  onClose: () => void;
  setIsHorizontalMode: React.Dispatch<React.SetStateAction<boolean>>;// a function to toggle between horizontal and vertical movement modes.
  setMode: (mode: string) => void;// a function to change the editing mode of the object.
  onDelete: () => void;// function to delete object
};

export function ObjectFloatingPanel({ modelRef,  isHorizontalMode,  onClose,  setIsHorizontalMode, setMode,  onDelete,}: ObjectFloatingPanelProps) {
   // clean up useEffect to make sure that when we first see the floating panel, it defaults into horizontal movement.
  useEffect(() => {
    return () => {
      setIsHorizontalMode(true); // always default into horizontal moving first
    };
  }, [setIsHorizontalMode]);

  return (
    //  use drei's billbaord to make the panel always follow the camera ans act as a 2-d hud on top of object 
    <Billboard position={modelRef?.current?.position.clone().add(new THREE.Vector3(0, 2, 0))}  lockX={false} lockY={false}  lockZ={false}>
        {/* using Html so we can create a floating bar on top of object when in move mode */}
      <Html center distanceFactor={8} transform>
        <aside className="bg-white p-2 rounded shadow flex gap-2">
          <button onClick={() => setMode("edit")}>Edit</button>{/* if we set the mode into 'edit' then we can open editor menu */}
            {/* This button just allows the user to move the model vertically or horizontally*/}
          <button onClick={() => setIsHorizontalMode((prev) => !prev)}>
            {isHorizontalMode ? "Move Vertically" : "Move Horizontally"}
          </button>
          <button onClick={onClose}>Close</button>
            {/* button to delete object */}
          <button onClick={onDelete}>Delete</button>
        </aside>
      </Html>
    </Billboard>
  );
}
