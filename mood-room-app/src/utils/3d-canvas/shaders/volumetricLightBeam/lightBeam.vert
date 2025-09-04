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
