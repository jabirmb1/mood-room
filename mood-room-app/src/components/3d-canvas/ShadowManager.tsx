/***************This file will be used to handle shadows for the scene efficiently *********** */
import * as THREE from "three";
import { LightingConfig } from "./LightingPanel/LightingPanel";
import React, { useEffect, useState } from "react";
import { changeModelLayer, toggleModelCastingShadow } from "@/utils/3d-canvas/object3D";
import { useThree } from "@react-three/fiber";

type ShadowManagerProps = {
  staticLightRef: React.RefObject<THREE.DirectionalLight | null>;// reference of our main light (light for the scene)
  dynamicLightRef: React.RefObject<THREE.DirectionalLight | null>;// reference to our dynamic light; light that will allow active shadows.
  lightColour: LightingConfig["directional"]["colour"];// colour of light
  lightIntensity: LightingConfig["directional"]["intensity"];//intensity of light
  lightPosition: [number, number, number];// position of light
  selectedObject: THREE.Object3D | null;// selected object which will have dynamic shadows.
};

/*
    to effieciently handle shadows; this manager will freeze all object's shadows in place (basically
    baking in their shadows in real time); and then allow only one object to have real active shadows.
    baked shadows and active shadows will be in different layer; camera will see both layers;
    but since the shadows will overlap it will give illusion that all shadows are dynamic (when in
    reality only one shadow is).
    The two lights will be practically inside each other (to not break the illusion); with same
    settings; except dynamic light will have next to no intensity; and it will have auto updates on.

    we will turn off auto updates for the static light as it will 'bake' the entire scene
*/
export default function ShadowManager({staticLightRef,dynamicLightRef, lightColour,lightIntensity,lightPosition,selectedObject,}: ShadowManagerProps) {
  const [prevSelectedObject, setPrevSelectedObject] = useState<THREE.Object3D | null>(null);
  const { camera } = useThree();

  const defaultLayer = 0;// layer where all objects live (the world/scene)
  const selectedObjectLayer = 1;// a layer where the selected object will live (so we ca render
  // it's dynamic shadows indepentandly of the others; massive improvement on performance,)

  // on load, make camera see both layers
  useEffect(() => {
    camera.layers.enable(defaultLayer);
    camera.layers.enable(selectedObjectLayer);
  }, [camera]);

  // Configure lights for layers
  useEffect(() => {
    if (staticLightRef.current) staticLightRef.current.layers.set(defaultLayer);
    if (dynamicLightRef.current) {
      dynamicLightRef.current.layers.set(selectedObjectLayer);

      // since camera can see both layers; lighting from both layers will be added up resulting in
      // darker than normal shadows for frozen objects when an object is selected;
      // so we will simply reduce dynamic light's intensity to basically 0; and scale up the shadow intensity
      // until it fits the normal static layer's shadow.

      dynamicLightRef.current.intensity = 0.001; // almost zero (don't want it to affect brightness)
      dynamicLightRef.current.shadow.intensity = lightIntensity; // match static shadow
    }
  }, [staticLightRef, dynamicLightRef, lightIntensity]);

  // Handle object selection/unselection
  useEffect(() => {
    // new object has been selected
    if (selectedObject) {
      setPrevSelectedObject(selectedObject);

      // move object to the layer where it can have active real time dynamic shadows.
      changeModelLayer(selectedObject, selectedObjectLayer);
      toggleModelCastingShadow(selectedObject, false);// make it stop casting shadows,
      // for a moment so we remove it from the frozen shadow map in default layer.

      requestAnimationFrame(() => toggleModelCastingShadow(selectedObject, true));// allow casting next frame.
    } 
    else if (prevSelectedObject) {
      // using a try catch statement since e.g. user may delete the object whilst it's selected.
      try {
        changeModelLayer(prevSelectedObject, defaultLayer);
      } catch {}
    }
  }, [selectedObject]);

  return (
    <>
      {/* out static light; used to 'bake'/ 'freeze' the world in real time */}
      <directionalLight
        ref={staticLightRef}
        intensity={lightIntensity}
        color={lightColour}
        position={lightPosition}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-normalBias={0.05}
      />

      {/* our dynamic light; used to generate shadows in real time but only for one object at a time */}
      <directionalLight
        ref={dynamicLightRef}
        intensity={0.001}
        color={lightColour}
        position={lightPosition}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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
