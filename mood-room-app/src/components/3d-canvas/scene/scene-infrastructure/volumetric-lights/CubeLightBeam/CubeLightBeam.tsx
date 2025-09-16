import * as THREE from "three";
import React, {useEffect, useMemo, useRef } from "react";
import { createCuboidVolumetricLightBeamMaterial } from "@/utils/3d-canvas/custom-materials/volumetricLightBeam";
import { createSpotlightForLightBeam, removeSpotlightFromLightBeam } from "@/utils/3d-canvas/scene/lightBeam/lights";

type CubeLightBeamProps = {
  lightBeamRef?: React.RefObject<THREE.Mesh | null>;// optional external ref to be passed into light beam
  hostModelRef?: React.RefObject<THREE.Object3D | null>// optional ref which is a model that this light beam is linked to
  linkedMesh?: THREE.Object3D | null// specifically what mesh of the host object that this light beam is linked to (if any).
  width: number;// width of light beam
  height: number;// height of light beam
  depth: number;// how long the light beam should go
  position?: [number, number, number]// position of light beam (starting point)
  rotation?: [number, number, number]//rotation of light beam
  scale?: [number, number, number]
  colour?: THREE.Color;// colour of light beam
  visible?: boolean;// whther the beam should be visible or not
  castLight?: boolean;// whether an actual light should be attatced to mesh for illumination
  castShadow?:boolean;// whether light should cast shadow or not
  onMount?: (mesh: THREE.Mesh) => void;// function to run on model mount
  onUnmount?: (mesh: THREE.Mesh) => void;// function to run on model unmount
};


/******* functions relating to the spotlight side of the light beams ********/

export function CubeLightBeam({ lightBeamRef,hostModelRef, linkedMesh, width, height, depth, position = [0, 0, 0], rotation, 
    scale=[1, 1, 1], colour = new THREE.Color('#fff'), visible = false, castLight = false, 
    castShadow = false, onMount, onUnmount}:CubeLightBeamProps) {
  // if a ref has been passed in; then just use the passed in ref; otherwise create and use an internal ref
  const meshRef = (lightBeamRef) ? lightBeamRef : useRef<THREE.Mesh>(null);

  // Create geometry and material once, memoized by initial dimensions
  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mat = createCuboidVolumetricLightBeamMaterial({ width: width, height: height,depth:  depth, colour, opacity: 0.4});
    mat.depthWrite = false;// makes the edges of the light beam blend in more
    // this means that geometry will no longer block light
    // but we can compensate by adding a function to keep track of spotlight angle
    // so spotlight influence is not more than the cube light beam
    return { geometry: geom, material: mat };
  }, [width, height, depth]);

  // adding in user data during initial mount
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.isCubeLightBeam = true;
      meshRef.current.userData.hostModelRef = hostModelRef;
      meshRef.current.userData.linkedMesh = linkedMesh;
    }
  }, []);
  

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

  // use effect to handle spotlight creation/ removal/ updates
  useEffect(() => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    
    if (castLight && !mesh.userData.spotlight) {
      // Create spotlight
      const spotlight = createSpotlightForLightBeam(mesh, {distance: depth, penumbra: 1, decay: 0}, castShadow);
      
      if (spotlight) {
        spotlight.visible = visible;
        spotlight.color.copy(colour);
      }
    } 
    else if (!castLight && mesh.userData.spotlight) {
      // Remove spotlight
      removeSpotlightFromLightBeam(mesh);
    } 
    else if (castLight && mesh.userData.spotlight) {
      // Update existing spotlight
      const spotlight = mesh.userData.spotlight as THREE.SpotLight;
      spotlight.visible = visible;
      spotlight.color.copy(colour);
    }
  }, [castLight, visible, colour, depth, castShadow]);

  // Update spotlight visibility when beam visibility changes
  useEffect(() => {
    if (meshRef.current?.userData.spotlight) {
      meshRef.current.userData.spotlight.visible = visible;
    }
  }, [visible]);


  // Update material uniforms when dimensions change
  useEffect(() => {
    if (material) {
      material.uniforms.uWidth.value = width;
      material.uniforms.uHeight.value = height;
      material.uniforms.uFadeLength.value = depth;
    }
  }, [geometry, material]);

  // Update colour dynamically if needed
  useEffect(() => {
    if (material) {
      material.uniforms.uColour.value.set(colour);
    }

    // we want spotlight to be same colour as the light beam
    // can extend this later to be independent if needed
    if (meshRef.current && castLight) {
      const spotlight = meshRef.current.userData.spotlight as THREE.SpotLight;
      if (spotlight) {
        spotlight.color.copy(colour);
      }
    }
  }, [colour, material, castLight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (castLight && meshRef.current) {
        removeSpotlightFromLightBeam(meshRef.current);
      }
    };
  }, [geometry, material, castLight]);
  
  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      scale={scale} 
      visible={visible}
      geometry={geometry} 
      material={material}
    />
  );
}