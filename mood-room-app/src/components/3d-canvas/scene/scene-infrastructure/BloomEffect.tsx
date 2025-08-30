import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function BloomEffect() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={50}    // we will make threshold extremly high to stop any artifacts
        luminanceSmoothing={0.9}
        intensity={0.5}            // bloom strength
        height={256}               // smaller buffer = cheaper
        radius={0.2}               // glow spread
      />
    </EffectComposer>
  );
}
