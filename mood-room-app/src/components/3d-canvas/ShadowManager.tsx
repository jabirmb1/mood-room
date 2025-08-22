/***************This file will be used to handle shadows for the scene efficiently *********** */
import * as THREE from "three";
import { LightingConfig } from "./LightingPanel/LightingPanel";
import React, { useEffect, useState } from "react";
import { changeModelLayer, toggleModelCastingShadow } from "@/utils/3d-canvas/object3D";
import { useThree } from "@react-three/fiber";
import { useDevice } from "@/hooks/general/useIsDevice";
import { logSceneObjectsShadowStatus } from "@/utils/3d-canvas/shadows";
import { Model } from "@/types/types";
import { updateShadowMap } from "@/utils/3d-canvas/lights";

type ShadowManagerProps = {
  staticLightRef: React.RefObject<THREE.DirectionalLight | null>;// reference of our main light (light for the scene)
  dynamicLightRef: React.RefObject<THREE.DirectionalLight | null>;// reference to our dynamic light; light that will allow active shadows.
  lightColour: LightingConfig["directional"]["colour"];// colour of light
  lightIntensity: LightingConfig["directional"]["intensity"];//intensity of light
  lightPosition: [number, number, number];// position of light
  selectedObject: THREE.Object3D | null;// selected object which will have dynamic shadows.
  models: Model[]// an array of models passed in.
};

/*
    to effieciently handle shadows; this manager will freeze all object's shadows in place (basically
    baking in their shadows in real time); and then allow only one object to have real active shadows.
    baked shadows and active shadows will be in different layer; camera will see both layers;
    but since the shadows will overlap it will give illusion that all shadows are dynamic (when in
    reality only one shadow is).
    The two lights will be practically inside each other (to not break the illusion); with same
    settings; except dynamic light will have next to no intensity; and it will have auto updates on.

    //we will only show one light at a time as to stop the lights from unnecessary overlapping with each other

    we will turn off auto updates for the static light as it will 'bake' the entire scene
*/
export default function ShadowManager({staticLightRef,dynamicLightRef, lightColour,lightIntensity,lightPosition,selectedObject, models}: ShadowManagerProps) {
  const [prevSelectedObject, setPrevSelectedObject] = useState<THREE.Object3D | null>(null);
  const { scene, camera } = useThree();
  const {isDesktop} = useDevice();
  const shadowMapSize = isDesktop? 2048: 512// for the live shadows in the editor; we will lower quality for phone.
  const defaultLayer = 0;// layer where all objects live (the world/scene)
  const selectedObjectLayer = 1;// a layer where the selected object will live (so we ca render
  // it's dynamic shadows indepentandly of the others; massive improvement on performance,)

  // on load, make camera see both layers
  useEffect(() => {
    camera.layers.enable(defaultLayer);
    camera.layers.enable(selectedObjectLayer);
  }, [camera]);

  // dev use effect to see if objects are truly frozen or not:
 /* useEffect(()=>{
    logSceneObjectsShadowStatus(scene, staticLightRef.current, dynamicLightRef.current)
  }, [selectedObject]) */

  //use effect to remove auto update on static light. and also assign layers to the lights.
  //
  useEffect(() => {
    if (staticLightRef.current) {
      // our main light for the scene; must be frozen to stop recalulating expensive shadows when it's not necessary.
      staticLightRef.current.layers.enable(defaultLayer);
      staticLightRef.current.layers.disable(selectedObjectLayer); 

      // update the static light when it's ready and then freeze it by disable auto update.
      staticLightRef.current.shadow.needsUpdate = true;
      staticLightRef.current.shadow.autoUpdate = false;
    }

   
    if (dynamicLightRef.current) {
      dynamicLightRef.current.layers.disable(defaultLayer); // make sure it doesn’t affect frozen objects
      dynamicLightRef.current.layers.enable(selectedObjectLayer); // only affect selected
    }
    
  
  }, [staticLightRef, dynamicLightRef]);

  // take a snapshot on static camera whenever the models array changes and refreeze it (
  //e.g. adding/ removing a model)
  //
  useEffect(()=>{
    updateShadowMap(staticLightRef)
  }, [models])

 
  // Handle object selection/unselection
  useEffect(() => {
    // new object has been selected
    if (selectedObject) {
      setPrevSelectedObject(selectedObject);

      // move object to the layer where it can have active real time dynamic shadows.
      changeModelLayer(selectedObject, selectedObjectLayer);
      toggleModelCastingShadow(selectedObject, false);// make it stop casting shadows,

      // for a moment we remove it from the frozen shadow map in default layer, so that
      // selected object's shadow is not inside the static shadow map.
      updateShadowMap(staticLightRef)

      // cast next frame After static map updates to not include selected object shadow; as to prevent double shadows.
      requestAnimationFrame(() => toggleModelCastingShadow(selectedObject, true));// allow casting next frame.
    } 
    else if (prevSelectedObject) {
      // using a try catch statement since e.g. user may delete the object whilst it's selected.
      try {
        changeModelLayer(prevSelectedObject, defaultLayer);
      } catch {}

      // after object has been done editing; refresh the static map to include it
      updateShadowMap(staticLightRef)
    }
  }, [selectedObject]);

  return (
    <>
      {/* to prevent light overlap which will cause many errors; we will simply run only one light at 
       a single time; since shadows baked in will be treated as textures; making light invisible;
        will not affect already laid out textures; which is what we want */}

      {/* out static light; used to 'bake'/ 'freeze' the world in real time */}
      {/* Static light: only visible when no object is selected */}
      <directionalLight
        ref={staticLightRef}
        visible={!selectedObject}   // hide light when an object is selected.
        intensity={lightIntensity}
        color={lightColour}
        position={lightPosition}
        castShadow={!selectedObject} // stop recalculating while editing
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-normalBias={0.05}
      />

      {/* Dynamic light: only visible when an object is selected */}
      <directionalLight
        ref={dynamicLightRef}
        visible={!!selectedObject}   // show only when needed (e.g. editing)
        intensity={lightIntensity}
        color={lightColour}
        position={lightPosition}
        castShadow={!!selectedObject}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-normalBias={0.05}
      />
    </>
  );
}
