'use client'
import { Html } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
import React from "react";

// This component is will be used to show a menu to edit a selected 3dObject e.g. changing colours, size, rotation etc.
//

type ObjectEditorPanelProps = {
  objectRef: React.RefObject<THREE.Object3D>,// what object this panel is referencing from.
  onClose: ()=> void;// function to run when closing the panel and do some clean up.
}
export function ObjectEditorPanel({objectRef, onClose}: ObjectEditorPanelProps)
{

  return(
    <>
    {/* I can't seem to get the menu to take half width of canavas and full height of canavas */}
     <Html className="absolute top-0 right-0 h-full w-1/2 bg-black text-white z-50 p-4">

        <button type = "button" onClick = {onClose}>X</button>
      </Html>
    </>
  )
}