import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { createCuboidVolumetricLightBeamMaterial } from "@/utils/3d-canvas/custom-materials/volumetricLightBeam";
import { isObjectLightOn } from "@/utils/3d-canvas/models";
import { generateMeshBoundingBox } from "@/utils/3d-canvas/scene/meshes";

type CubeLightBeamDimensions={
  width: number;
  height:number;
  depth: number;
}

type CubeLightBeamProps = {
  lightBeamRef?: React.RefObject<THREE.Mesh | null>;// optional external ref to be passed into light beam
  hostModelRef?: React.RefObject<THREE.Object3D | null>// optional ref which is a model that this light beam is linked to
  linkedMesh?: THREE.Object3D | null// specifically what mesh of the host object that this light beam is linked to (if any).
  width: number;// width of light beam
  height: number;// height of light beam
  depth: number;// how long the light beam should go
  position?: [number, number, number]// position of light beam
  rotation?: [number, number, number]//rotation of light beam
  scale?: [number, number, number]
  colour?: THREE.Color;// colour of light beam
  visible?: boolean;// whther the beam should be visible or not
  castLight?: boolean;// whether an actual light should be attatced to mesh for illumination
  castShadow?:boolean;// whether light should cast shadow or not
  onMount?: (mesh: THREE.Mesh) => void;// function to run on model mount
  onUnmount?: (mesh: THREE.Mesh) => void;// function to run on model unmount
};

 /********* some functions relating to this specific component ******/

//function to dynamically create depth of light beam depending on passed in width and height
//
export function createCubeLightBeamDepth(width:number, height: number) : number{
  // simple algorithm for now; mabye extend it later for smaller screens
  const DEPTH_SCALE_FACTOR = 2
  const depth = (width * height) * DEPTH_SCALE_FACTOR
  return depth;
}

//if this mesh is a cubeLightBeam or not
//
export function isCubeLightBeam(mesh: THREE.Object3D): boolean {
  return mesh.userData.isCubeLightBeam;
}

// Returns the host model ref itself (this cube mesh may be attatched to another mesh e.g. tv screen)
// so this function would return the ref that it may be linked to e.g. tv
//
export function getCubeLightBeamHostModelRef(mesh: THREE.Object3D) {
  return mesh.userData.isCubeLightBeam ? (mesh.userData.hostModelRef as React.RefObject<THREE.Object3D | null>) : null;
}

// Update visibility depending if the linke object is 'on' or 'off'
//
export function updateCubeLightBeamVisibility(mesh: THREE.Object3D) {
  const hostModelRef = getCubeLightBeamHostModelRef(mesh);
  mesh.visible = hostModelRef ? isObjectLightOn(hostModelRef.current) ?? false : false;
}

// function to update the lightBeams colour:
//
export function updateLightBeamMeshColour(lightBeam: THREE.Mesh, colour: THREE.Color) {
  const mat = lightBeam.material as THREE.ShaderMaterial;
  if (mat && mat.uniforms && mat.uniforms.uColour) {
    mat.uniforms.uColour.value.copy(colour);
  }
}

//function to return what mesh lightBeam linked to (if at all); otherwise returns null
//
export function getLinkedMesh(lightBeam: THREE.Object3D): THREE.Mesh | null{
  if (lightBeam.userData.linkedMesh)
  {
    const mesh = lightBeam.userData.linkedMesh as THREE.Mesh | null
    return mesh
  }
  return null
}

//function to get the dimensions for the light beam; by passing in a mesh for it to come out of 
// (e.g. screens)
//
export function getCubeLightBeamDimensions(linkedMesh: THREE.Mesh): CubeLightBeamDimensions | null 
{
   const bbox = generateMeshBoundingBox(linkedMesh);
  if (!bbox) return null;
  const depth = createCubeLightBeamDepth(bbox.width, bbox.height);
  return {width: bbox.width, height: bbox.height, depth}
}


export function CubeLightBeam({ lightBeamRef,hostModelRef, linkedMesh, width, height, depth, position = [0, 0, 0], rotation, 
    scale=[1, 1, 1], colour = new THREE.Color('#fff'), visible = false, onMount, onUnmount}:
     CubeLightBeamProps) {
  // if a ref has been passed in; then just use the passed in ref; otherwise create and use an internal ref
  const meshRef = (lightBeamRef) ? lightBeamRef : useRef<THREE.Mesh>(null);

  // Create geometry and material once, memoized by initial dimensions
  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mat = createCuboidVolumetricLightBeamMaterial({ width: width, height: height,depth:  depth, colour, opacity: 0.5});
    return { geometry: geom, material: mat };
  }, [width, height, depth]); // Empty dependency array - create only once on mount

  // on mount/ unmount; perform the passed in mount/ unmount functions if passed in
  useEffect(() => {
    if (meshRef.current && onMount) {
      onMount(meshRef.current);
    }
    return () => {
      if (meshRef.current && onUnmount) {
        onUnmount(meshRef.current);
      }
    };
  }, [onMount, onUnmount]);

  // Update geometry dimensions by scaling (more efficient than remaking geometry)
  useEffect(() => {
    if (meshRef.current) {

      // Calculate the scale factors relative to original geometry for dimension changes
      const dimensionScaleX = width / geometry.parameters.width;
      const dimensionScaleY = height / geometry.parameters.height;
      const dimensionScaleZ = depth / geometry.parameters.depth;
      
      // Apply dimension scaling to the mesh (this handles width/height/depth changes)
      meshRef.current.scale.set(dimensionScaleX, dimensionScaleY, dimensionScaleZ);
    }
  }, [width, height, depth, geometry]);

  useEffect(()=>{
    console.log('beam mesh has just been remounted')
  },[])

  // Update material uniforms when dimensions change
  useEffect(() => {
    if (material) {
      material.uniforms.uWidth.value = width;
      material.uniforms.uHeight.value = height;
      material.uniforms.uFadeLength.value = depth;
    }
  }, [width, height, depth, material]);

  // Update colour dynamically if needed
  useEffect(() => {
    if (material) {
      material.uniforms.uColour.value.set(colour);
    }
  }, [colour, material]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, [geometry, material]);


  
  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      scale={scale} 
      visible={visible}
      geometry={geometry} 
      material={material}
      userData={{isCubeLightBeam: true, 
        hostModelRef: hostModelRef,
        linkedMesh: linkedMesh}}
    />
  );
}