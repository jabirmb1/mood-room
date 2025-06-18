import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { defaultCameraPosition } from '@/utils/const';
import * as THREE from 'three';
import { computeCameraTargetPositions } from '@/utils/camera';
import { useDevice } from '@/hooks/useIsDevice';

type CameraControllerProps = {
  controlsRef?: React.RefObject<any>;// reference to a controller e.g. Orbital controls (we need to disbale them during animation)
  targetRef: React.RefObject<THREE.Object3D> | null;// reference to the target object that the camera will be zooming towards
  resetPosition?: [number, number, number];// where does camera reset after animation finishes.
};

// This component will be used to smoothly go in and out of a selected object.
export function CameraController({ controlsRef,  targetRef, resetPosition = defaultCameraPosition,}: CameraControllerProps) {
  const [controlsReady, setControlsReady] = useState(false);// boolean flag stating of when the controller is not null
  const isMoving = useRef(false);// flag that indicates that we are still in an animartion (zooming in/out)
  const desiredCameraPos = useRef(new THREE.Vector3());// target position
  const desiredLookAt = useRef(new THREE.Vector3());// target face/ orientation
  let cameraOffsetX = 0;// how much to offset the camera by (e.g since panel covers half of screen in desktop)
  let zoomOffset = 0;// how much to zoom camera out by depending on screen size/ type.
  // we need to offset the camera by a certain amount to recenter the camera.
  const {isDesktop} = useDevice();

  // once the controller is not null, set it the flag to true so that we can start calling it's functions.
  useEffect(() => {
    if (controlsRef?.current && !controlsReady) {
      setControlsReady(true);
    }
  }, [controlsRef?.current]);

  // when the controller is ready, just find out where our target location and orientation is.
  useEffect(() => {
    if (!controlsReady) return;
    cameraOffsetX = isDesktop ? 2.45 : 0;// for desktops, panel coveres half of the canvas, so shift camera to the right to offset it.
    zoomOffset = isDesktop? 0: 2.5// for smaller devices, pan the camera back a pit
    console.log("is it a desktop?", isDesktop)

    const { desiredCameraPos: camPos, desiredLookAt: lookAt } = computeCameraTargetPositions(targetRef?.current ?? null, resetPosition, cameraOffsetX, zoomOffset);
    // copying current camera and position.
    desiredCameraPos.current.copy(camPos);
    desiredLookAt.current.copy(lookAt);
    isMoving.current = true;
  }, [targetRef, resetPosition, controlsReady, isDesktop]);

  // smoothly moving the camera to the target location.
  useFrame(({ camera }) => {
    if (!controlsReady || !isMoving.current || !controlsRef?.current) return;

    const controls = controlsRef.current;

    camera.position.lerp(desiredCameraPos.current, 0.15);
    controls.target.lerp(desiredLookAt.current, 0.15);
    camera.lookAt(desiredLookAt.current);
    controls.update();

    // when we get close enough, just snap the camera in place.
    if ( camera.position.distanceTo(desiredCameraPos.current) < 0.02 && controls.target.distanceTo(desiredLookAt.current) < 0.02) {
      camera.position.copy(desiredCameraPos.current);
      controls.target.copy(desiredLookAt.current);
      controls.update();
      isMoving.current = false;// reset flag as the animation is over.
    }
  });

  // make sure to disable the controller whilst we are zooming in/ out as to stop any wierd behaviours.
  useEffect(() => {
    if (controlsRef?.current) {
      controlsRef.current.enabled = !isMoving.current;
    }
  }, [isMoving.current, controlsRef?.current]);

  return null;
}
