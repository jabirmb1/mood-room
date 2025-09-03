/*********** Volumetric TV-style light beam shader with gradient and taper ***********/
import * as THREE from 'three'

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
    vertexShader: `
      uniform float uFadeLength;
      uniform float uSpread;
      varying vec3 vPos;

      void main() {
        vPos = position;

        // Z normalized 0-1 along beam
        float zNorm = (position.z + uFadeLength/2.0) / uFadeLength;

        // Spread outward: narrow at source, wider at end
        vec3 newPos = position;
        float scaleXY = mix(1.0, uSpread, zNorm);
        newPos.xy *= scaleXY;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColour;
      uniform float uFadeLength;
      uniform float uEdgeSoftness;
      uniform float uSpread;
      uniform float uWidth;
      uniform float uHeight;
      uniform float uIntensity;
      uniform float uInnerGlow;
      uniform float uOpacity;
      varying vec3 vPos;

      void main() {
        // Z normalized 0-1 along beam
        float zNorm = (vPos.z + uFadeLength/2.0) / uFadeLength;

        // Depth gradient: strong near source, taper at end
        float depthFade = pow(1.0 - zNorm, 2.5); // stronger taper

        // Spread hollow center backward
        float spreadFactor = mix(1.0, uSpread, zNorm);

        // Radial distance normalized
        float nx = vPos.x / (uWidth/2.0);
        float ny = vPos.y / (uHeight/2.0);
        float radius = length(vec2(nx, ny)) * spreadFactor;

        // Hollow effect near source
        float hollowStrength = smoothstep(0.0, 0.25, zNorm);

        // Inner glow
        float innerGlow = exp(-radius * 2.5) * uInnerGlow;

        // Edge softness
        float edgeAlpha = mix(1.0, smoothstep(0.8 - uEdgeSoftness, 1.2, radius), hollowStrength);
        edgeAlpha = max(0.0, edgeAlpha);

        float combinedAlpha = max(edgeAlpha, innerGlow);

        // Apply depth fade, intensity, opacity
        float alpha = depthFade * combinedAlpha * uIntensity * uOpacity;

        // Soft cutoff for blending
        if(alpha < 0.005) discard;

        gl_FragColor = vec4(uColour, alpha);
      }
    `
  });
}
