import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function BloomEffect() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={1}    // only HDR >1 glows
        luminanceSmoothing={0.9}
        intensity={0.6}            // bloom strength
        height={256}               // smaller buffer = cheaper
        radius={0.3}               // glow spread
      />
    </EffectComposer>
  );
}
