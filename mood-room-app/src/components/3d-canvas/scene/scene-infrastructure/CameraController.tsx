'use client'
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { defaultCameraPosition } from '@/utils/3d-canvas/const';
import { computeCameraTargetPositions } from '@/utils/3d-canvas/scene/camera';
import { calculateObjectBoxSize } from '@/utils/3d-canvas/models';
import { useDevice } from '@/hooks/general/useIsDevice';
import { createSpotLight, createDirectionalLight } from '@/utils/3d-canvas/scene/lights'; // make sure both imported
import { useOcclusionTransparency } from '@/hooks/3d-canvas/useOcclusion';
import { RapierRigidBody } from '@react-three/rapier';
/************ This component wil be used to control the camera to zoom in and out of a selected object, and to
 * optionally, alsow allow background lighting to the selected object to make it stand out more.
 */
type CameraControllerProps = {
  controlsRef?: React.RefObject<any>; // reference to a controller e.g. Orbital controls (we need to disable them during animation)
  rigidBodyRef: React.RefObject<RapierRigidBody | null>; // reference to a rigid body of the object that we are zooming towards
  targetRef: React.RefObject<THREE.Object3D | null>; // reference to the target object that the camera will be zooming towards
  resetPosition?: [number, number, number]; // where does camera reset after animation finishes.
  showSpotlight?: boolean;// should the camera controller show a spotlight on selelected object.
  showDirectionLight?: boolean;// should camera controller show a direction light on selected object.
};

//TO DO: probs add a prob to allow the lights to castshadow or not
// This component will be used to smoothly go in and out of a selected object.
export function CameraController({controlsRef, rigidBodyRef, targetRef, resetPosition = defaultCameraPosition, 
  showSpotlight = false, showDirectionLight = false,}: CameraControllerProps) { 
  const {scene} = useThree();
  const [controlsReady, setControlsReady] = useState(false); // boolean flag stating of when the controller is not null
  const [isMoving, setIsMoving] = useState(false); // flag that indicates that we are still in an animation (zooming in/out)
  const desiredCameraPos = useRef(new THREE.Vector3()); // target position
  const desiredLookAt = useRef(new THREE.Vector3()); // target face/ orientation

  // Spotlight refs
  const spotlightRef = useRef<THREE.SpotLight | null>(null);
  const spotlightTarget = useRef(new THREE.Object3D());

  // Directional light refs
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const directionalLightTarget = useRef(new THREE.Object3D());

  const { isDesktop } = useDevice();

  /* uncomment this after using dynamic scaling for volumetric light mesh 
  
  const potentialOccluders = useMemo(() => {
    // creating a list of potential occluders which filter out e.g. camera; target object ; light or invisible objects.
    return scene.children.filter((obj) => {
      if (obj === targetRef?.current || obj.type === 'Camera' || obj.type.includes('Light') || obj.visible === false 
    || obj.userData?.permanentInvisible) return false;
      return true;
    });
  }, [scene, targetRef?.current]);

  useOcclusionTransparency({targetRef:targetRef, potentialOccluders:potentialOccluders, makeInvisible:true, sampleCount:15, throttleMs:50})
  // test out throttling speed for 250 objects; might need to increase it

  */

   // clean up the lights unmount.
   useEffect(() => {
    return () => {
      if (spotlightRef.current) scene.remove(spotlightRef.current);
      if (spotlightTarget.current) scene.remove(spotlightTarget.current);
      if (directionalLightRef.current) scene.remove(directionalLightRef.current);
      if (directionalLightTarget.current) scene.remove(directionalLightTarget.current);
    };
  }, []);
  
  // once the controller is not null, set it the flag to true so that we can start calling it's functions.
  useEffect(() => {
    if (controlsRef?.current && !controlsReady) {
      setControlsReady(true);
    }
  }, [controlsRef?.current]);

  // when the controller is ready, just find out where our target location and orientation is.
  useEffect(() => {
    if (!controlsReady) return;

    let cameraOffsetX = 0;
    const zoomOffset = isDesktop ? 1 : 2.5;

    if (isDesktop && targetRef?.current) {
      // calculate the needed offset here.
      const { maxDim } = calculateObjectBoxSize(targetRef.current);
      const panelFraction = 0.5; // 50% panel width
      cameraOffsetX = -(panelFraction / 2) * maxDim * 2.25; // shift left so object fits in visible area
    }

    const {desiredCameraPos: camPos,desiredLookAt: lookAt, } = computeCameraTargetPositions(rigidBodyRef?.current?? null, targetRef?.current ?? null, resetPosition, cameraOffsetX, zoomOffset);

    // copying current camera and position.
    desiredCameraPos.current.copy(camPos);
    desiredLookAt.current.copy(lookAt);
    setIsMoving(true);
  }, [targetRef, resetPosition, controlsReady, isDesktop]);

  // Setup spotlight when needed
  useEffect(() => {
    if (!controlsReady || !targetRef?.current || !showSpotlight) return;

    const { desiredCameraPos, desiredLookAt } = computeCameraTargetPositions(rigidBodyRef?.current?? null, targetRef.current, resetPosition, 0, 0);

    const { maxDim } = calculateObjectBoxSize(targetRef.current);
    const radius = maxDim * 0.75;
    const distance = desiredCameraPos.distanceTo(desiredLookAt);
    const spotlightPos = desiredCameraPos.clone().add(new THREE.Vector3(0, 2, 0));

    const spotLight = createSpotLight({position: spotlightPos, targetPosition: desiredLookAt, 
      intensity: 15,  distance: distance + 5, angle: 2 * Math.atan(radius / distance),  
      penumbra: 0,decay: 1, colour: 0xffffff,castShadow: false,});

    spotlightRef.current = spotLight;
    spotlightTarget.current = spotLight.target;
  }, [targetRef, controlsReady, resetPosition, showSpotlight]);

  // Setup directional light when needed
  useEffect(() => {
    if (!controlsReady || !targetRef?.current || !showDirectionLight) return;
    const { desiredCameraPos, desiredLookAt } = computeCameraTargetPositions(rigidBodyRef?.current?? null, targetRef.current, resetPosition, 0, 0);
    const { maxDim } = calculateObjectBoxSize(targetRef.current);

    // Example directional light position: slightly above and in front of object
    const directionLightPos = desiredCameraPos.clone().add(new THREE.Vector3(0, maxDim, maxDim));
    // creating the actual light now:
    const directionalLight = createDirectionalLight({ position: directionLightPos, targetPosition: desiredLookAt, 
      intensity: 1.5, colour: 0xffffff, castShadow: false });
    
    // syncing up the directional light to everything
    directionalLightRef.current = directionalLight;
   directionalLightTarget.current = directionalLight.target;
  }, [targetRef, controlsReady, resetPosition, showDirectionLight]);

  // smoothly moving the camera to the target location.
  useFrame(({ camera }) => {
    if (!controlsReady || !isMoving || !controlsRef?.current) return;

    const controls = controlsRef.current;

    camera.position.lerp(desiredCameraPos.current, 0.15);
    controls.target.lerp(desiredLookAt.current, 0.15);
    camera.lookAt(desiredLookAt.current);
    controls.update();

    // when we get close enough, just snap the camera in place.
    if (camera.position.distanceTo(desiredCameraPos.current) < 0.02 && controls.target.distanceTo(desiredLookAt.current) < 0.02) {
      camera.position.copy(desiredCameraPos.current);
      controls.target.copy(desiredLookAt.current);
      controls.update();
      setIsMoving(false); // reset flag as the animation is over.
    }
  });

  // make sure to disable the controller whilst we are zooming in/ out as to stop any weird behaviours.
  useEffect(() => {
    if (controlsRef?.current) {
      controlsRef.current.enabled = !isMoving;
    }
  }, [isMoving, controlsRef?.current]);

  return (
    <>
    {/*  stop showing the lights when object is no longer selected  or if we specified that we don't need them in props*/}
      {targetRef.current && showSpotlight && spotlightRef.current && (
        <>
          <primitive object={spotlightRef.current} />
          <primitive object={spotlightTarget.current} />
        </>
      )}

      {targetRef.current && showDirectionLight && directionalLightRef.current && (
        <>
          <primitive object={directionalLightRef.current} />
          <primitive object={directionalLightTarget.current} />
        </>
      )}
    </>
  );
}