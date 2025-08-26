import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React, { useRef, useEffect } from 'react';

/*This hook is used to just easily transition a light from current brightness to the target brightness */

type LightIntensityTransitionProps = {
  lightRef: React.RefObject<THREE.Light | null>;// reference of passing light that we want to smoothly transition with
  targetIntensity: number;// what the target intensity is.
  lerpFactor?: number; // how fast to interpolate (default 0.05)
};

export function LightIntensityTransition({ lightRef, targetIntensity, lerpFactor = 0.05}: LightIntensityTransitionProps) {
  // Store current intensity internally, sync on mount or when lightRef changes
  const currentIntensity = useRef(targetIntensity);

  useEffect(() => {
    if (lightRef.current) {
      currentIntensity.current = lightRef.current.intensity;
    }
  }, [lightRef]);

  useFrame(() => {
    if (!lightRef.current) return;

    // Smoothly interpolate current intensity toward target intensity
    currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, targetIntensity, lerpFactor);
    lightRef.current.intensity = currentIntensity.current;
  });

  return null;
}
