import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders/volumetricLightBeam';

type cuboidVolumetricLightBeamProps = {
  width: number;
  height: number;
  depth: number;
  colour?: THREE.Color;
  opacity?: number;
  spread?: number; // how much the beam widens along Z
};

export function createCuboidVolumetricLightBeamMaterial({
  width,
  height,
  depth,
  colour = new THREE.Color('#fff'),
  opacity = 1.0,
  spread = 2
}: cuboidVolumetricLightBeamProps) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColour: { value: new THREE.Color(colour) },
      uFadeLength: { value: depth },
      uEdgeSoftness: { value: 0.55 },
      uSpread: { value: spread },
      uIntensity: { value: 0.9 },
      uInnerGlow: { value: 0.4 },
      uWidth: { value: width },
      uHeight: { value: height },
      uOpacity: { value: opacity },
    },
    vertexShader,
    fragmentShader
  });
}
