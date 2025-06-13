import { Html } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import React from "react";

// This component is will be used to show a menu to edit a selected 3dObject e.g. changing colours, size, rotation etc.
//

type ObjectEditorPanelProps = {
  objectRef: React.RefObject<THREE.Object3D>,// what object this panel is referencing from.
  onClose: ()=> void;// function to happen when the panel closes
}
export function ObjectEditorPanel({objectRef, onClose}: ObjectEditorPanelProps)
{
  return(
    <>
      <Html className = "absolute right-0 h-full w-[10rem] bg-white-100">
        <button type = "button" onClick = {onClose}>X</button>
      </Html>
    </>
  )
}