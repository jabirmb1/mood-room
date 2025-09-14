import * as THREE from "three";
import React, {useEffect, useMemo, useRef } from "react";
import { createCuboidVolumetricLightBeamMaterial } from "@/utils/3d-canvas/custom-materials/volumetricLightBeam";
import { isObjectLightOn } from "@/utils/3d-canvas/models";
import { createPointLightForMesh, createSpotLightForMesh, generateMeshBoundingBox, SpotlightConfig } from "@/utils/3d-canvas/scene/meshes";
import {baseScreenLightIntensity } from "@/utils/3d-canvas/const";

export type CubeLightBeamDimensions={
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

// Update visibility depending if the linked object is 'on' or 'off'
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

//function to generate the dimensions for the light beam; by passing in a mesh for it to come out of 
// (e.g. screens)
//
export function generateCubeLightBeamDimensions(linkedMesh: THREE.Mesh): CubeLightBeamDimensions | null 
{
   const bbox = generateMeshBoundingBox(linkedMesh);
  if (!bbox) return null;
  const depth = createCubeLightBeamDepth(bbox.width, bbox.height);
  return {width: bbox.width, height: bbox.height, depth}
}

// function to update the light beam dimensions
//
export function updateLightBeamMeshDimensions(lightBeam: THREE.Mesh,dimensions: CubeLightBeamDimensions) {
  const { width, height, depth } = dimensions;
  if (!lightBeam) return;

  // Get the original geometry parameters to calculate proper scaling
  const geom = lightBeam.geometry as THREE.BoxGeometry;
  if (!geom || !geom.parameters) return;

  // Calculate scale factors based on original geometry dimensions
  const scaleX = width / geom.parameters.width;
  const scaleY = height / geom.parameters.height;
  const scaleZ = depth / geom.parameters.depth;

  // Apply scaling to the mesh
  lightBeam.scale.set(scaleX, scaleY, scaleZ);

  // Update material uniforms with the TARGET dimensions (not scaled by mesh scale)
  const mat = lightBeam.material as THREE.ShaderMaterial;
  if (mat && mat.uniforms) {
    // Use the original geometry dimensions for shader calculations
    // The shader will work with these base dimensions, and mesh scaling handles the visual size
    if (mat.uniforms.uWidth) mat.uniforms.uWidth.value = geom.parameters.width;
    if (mat.uniforms.uHeight) mat.uniforms.uHeight.value = geom.parameters.height;
    if (mat.uniforms.uFadeLength) mat.uniforms.uFadeLength.value = geom.parameters.depth;
    mat.needsUpdate = true;
  }

  lightBeam.updateMatrix();
}

// function to get base intensity of light beam's internal light
//
export function getLightBeamBaseIntensity(): number {
  return baseScreenLightIntensity;
}

/******* functions relating to the spotlight side of the light beams ********/

// function to check if light beam has any lights attatched to it
//
export function doesLightBeamHaveLightSource(lightBeamMesh: THREE.Mesh): boolean {
  return !!lightBeamMesh.userData.spotlight;// can extend this to other light types later
}


// Extract beam geometry parameters
function getBeamGeometryParams(lightBeamMesh: THREE.Mesh) : CubeLightBeamDimensions | null {
  const geometry = lightBeamMesh.geometry as THREE.BoxGeometry;
  if (!geometry || !geometry.parameters) {
    return null;
  }
  
  return {
    width: geometry.parameters.width * lightBeamMesh.scale.x,
    height: geometry.parameters.height * lightBeamMesh.scale.y,
    depth: geometry.parameters.depth * lightBeamMesh.scale.z
  };
}

// Get spread parameter from beam material
function getBeamSpreadParameter(lightBeamMesh: THREE.Mesh): number {
  const material = lightBeamMesh.material as THREE.ShaderMaterial;
  return material?.uniforms?.uSpread?.value || 2.0;
}

// Calculate spotlight cone angle based on beam dimensions and spread
function calculateBeamConeAngle(width: number, height: number, depth: number, spread: number): number {
  // Calculate the maximum dimensions at the end of the beam (where spread is fully applied)
  const maxWidth = width * spread;
  const maxHeight = height * spread;
  
  // Half-diagonal of the maximum end face (widest part of the beam)
  const maxHalfDiagonal = 0.5 * Math.sqrt(maxWidth * maxWidth + maxHeight * maxHeight);

  // Cone angle = 2 * atan(opposite / adjacent)
  const coneAngle = Math.atan2(maxHalfDiagonal, depth) * 2;
  
  // Cap the angle to prevent extreme values
  return Math.min(coneAngle, Math.PI * 0.7);
}



// Calculate beam origin position (back of the beam) based on mesh position and depth
export function calculateBeamOriginPosition(mesh: THREE.Mesh, depth: number): THREE.Vector3 {
  // Origin is one beam length behind the mesh position
  return mesh.position.clone().add(new THREE.Vector3(0, 0, -depth));
}

// Calculate beam target position (front of the beam)
export function calculateBeamTargetPosition(mesh: THREE.Mesh, depth: number): THREE.Vector3 {
  // Target is one beam length in front of the mesh position
  return mesh.position.clone().add(new THREE.Vector3(0, 0, depth));
}

// Configure spotlight shadow settings
function configureSpotlightShadows(spotlight: THREE.SpotLight, coneAngle: number, distance: number): void {
  if (!spotlight.castShadow) return;
  
  spotlight.shadow.mapSize.width = 1024;
  spotlight.shadow.mapSize.height = 1024;
  spotlight.shadow.camera.near = 0.1;
  spotlight.shadow.camera.far = distance;
  spotlight.shadow.camera.fov = (coneAngle * 180 / Math.PI);
}

// Helper function to create a spotlight for the light beam mesh using the general spotlight function
export function createSpotlightForLightBeam(lightBeamMesh: THREE.Mesh, config: SpotlightConfig = {},
  castShadow: boolean = false,): THREE.SpotLight | null {
  try {
    // Get beam geometry parameters
    const geometryParams = getBeamGeometryParams(lightBeamMesh);
    if (!geometryParams) {
      console.error('Invalid geometry for light beam mesh');
      return null;
    }

    const { width, height, depth } = geometryParams;
    const spread = getBeamSpreadParameter(lightBeamMesh);
    const coneAngle = calculateBeamConeAngle(width, height, depth, spread);
    const intensity = getLightBeamBaseIntensity();

    // Create spotlight config with calculated cone angle
    const spotlightConfig: SpotlightConfig = {...config, angle: coneAngle, intensity: intensity};

    // Use the general spotlight function
    const spotlight = createSpotLightForMesh(lightBeamMesh, spotlightConfig);
    if (!spotlight) return null;

    // Calculate and set initial positions
    const originPos = calculateBeamOriginPosition(lightBeamMesh, depth);
    const targetPos =calculateBeamTargetPosition(lightBeamMesh, depth);
   
    spotlight.position.copy(originPos);
    spotlight.target.position.copy(targetPos);
    spotlight.visible = false; // Start invisible, will be toggled by beam visibility
    spotlight.castShadow = castShadow;

    // Configure shadows with beam-specific settings
    configureSpotlightShadows(spotlight, coneAngle * 0.2, spotlight.distance);
    lightBeamMesh.userData.spotlight = spotlight;

    return spotlight;

  } catch (error) {
    console.error('Error creating spotlight for light beam mesh:', error);
    return null;
  }
}

// function to update the light beam's intensity.
//
export function updateLightBeamIntensity(lightBeamMesh: THREE.Mesh, intensity: number): void {
  const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
  if (!spotlight) return;
  spotlight.intensity = intensity;
}
// Helper function to update beam's internal light (spotlight) parameters when beam dimensions change
//
export function updateLightForLightBeam(lightBeamMesh: THREE.Mesh, dimensions?: CubeLightBeamDimensions): void {
  try {
    const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
    if (!spotlight) return;

    // Get current or provided dimensions
    const geometryParams = getBeamGeometryParams(lightBeamMesh);
    if (!geometryParams) return;

    const { width, height, depth } = dimensions || geometryParams;

    // sync spotlight distance to beam depth
    spotlight.distance = depth;
    const spread = getBeamSpreadParameter(lightBeamMesh);
    const coneAngle = calculateBeamConeAngle(width, height, depth, spread);
    
    // Update spotlight angle
    spotlight.angle = coneAngle;

    // Update positions
    const originPos = calculateBeamOriginPosition(lightBeamMesh, depth);
    const targetPos = calculateBeamTargetPosition(lightBeamMesh, depth);

    spotlight.position.copy(originPos);
    spotlight.target.position.copy(targetPos);

    // Update shadow settings
    configureSpotlightShadows(spotlight, coneAngle, spotlight.distance);

  } catch (error) {
    console.error('Error updating spotlight for light beam:', error);
  }
}

// Helper function to remove spotlight from light beam
export function removeSpotlightFromLightBeam(lightBeamMesh: THREE.Mesh): void {
  const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
  if (spotlight) {
    lightBeamMesh.remove(spotlight);
    lightBeamMesh.remove(spotlight.target);
    spotlight.dispose();
    delete lightBeamMesh.userData.spotlight;
  }
}

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