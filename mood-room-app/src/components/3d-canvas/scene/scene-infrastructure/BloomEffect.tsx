import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function BloomEffect() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={3}    // only HDR >3 glows
        luminanceSmoothing={0.9}
        intensity={0.5}            // bloom strength
        height={256}               // smaller buffer = cheaper
        radius={0.2}               // glow spread
      />
    </EffectComposer>
  );
}
