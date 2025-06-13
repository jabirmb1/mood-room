// bedroom scene
// sets furniture and positioning (will be done by AI in future)

'use client';

import { useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import { getNormalizedScale } from '@/utils/scale';
import { targetSizes } from '@/utils/scaleConfig';



export default function LivingroomScene() {

  const sofa = useGLTF('/assets/sofa.glb');
  const cofeetable = useGLTF('/assets/cofeetable.glb');
  const armchair = useGLTF('/assets/armchair.glb');
  const tvcabinet = useGLTF('/assets/tvcabinet.glb');
  const rug = useGLTF('/assets/rug.glb');
  const wallart = useGLTF('/assets/wallart.glb');

  console.log('Sofa model:', sofa); // can be removed once development is done
  console.log('Cafe Table model:', cofeetable);
  console.log('Armchair model:', armchair);
  console.log('TV Cabinet model:', tvcabinet);
  console.log('Rug model:', rug);
  console.log('Wall Art model:', wallart);


  return (
    <group>
      {/* Sofa */}
      <primitive
        object={sofa.scene}
        position={[-0.5, 0.3, 4]}
        scale={getNormalizedScale(sofa.scene, targetSizes.Sofa)}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/*Cofee Table */}
      <primitive
        object={cofeetable.scene}
        position={[-3, 0.3, 2]}
        scale={getNormalizedScale(cofeetable.scene, targetSizes.Table)}
        rotation={[0, -Math.PI, 0]}
      />
      {/* Arm Chair */}
      <primitive
        object={armchair.scene}
        position={[4, 1, 0]}
        scale={getNormalizedScale(armchair.scene, targetSizes.Armchair)}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* TV Cabinet */}
      <primitive
        object={tvcabinet.scene}
        position={[-4, 0.3, -4]}
        scale={getNormalizedScale(tvcabinet.scene, targetSizes.TVCabinet)}
        rotation={[0, -Math.PI, 0]}
      />
      {/* Rug */}
      <primitive
          object={rug.scene}
          position={[5.5, 0.3, 6]}
          scale={getNormalizedScale(rug.scene, targetSizes.Rug)}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Wall Art */}
        <primitive
          object={wallart.scene}
          position={[-6.3, 5, 0]}
          scale={getNormalizedScale(wallart.scene, targetSizes.WallArt)}
          rotation={[0, -Math.PI / 2, 0]}
        />
     
    </group>
  );
}

// Preload models for better performance
useGLTF.preload('/assets/sofa.glb');
useGLTF.preload('/assets/cofeetable.glb');
useGLTF.preload('/assets/armchair.glb');
useGLTF.preload('/assets/tvcabinet.glb');
useGLTF.preload('/assets/rug.glb');
useGLTF.preload('/assets/wallart.glb');

