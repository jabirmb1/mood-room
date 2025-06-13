// bedroom scene
// sets furniture and positioning (will be done by AI in future)

'use client';

import { useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import { getNormalizedScale } from '@/utils/scale';
import { targetSizes } from '@/utils/scaleConfig';

export default function BedroomScene() {
  // Load models
  const bed = useGLTF('/assets/bed.glb');
  const closetModel = useGLTF('/assets/closetmodel.glb');
  const rug = useGLTF('/assets/rug.glb');
  const sideTable = useGLTF('/assets/sidetable.glb');
  const desk = useGLTF('/assets/desk.glb');
  const deskChair = useGLTF('/assets/deskchair.glb');

  console.log('Bed model:', bed); // can be removed once development is done
  console.log('Closet model:', closetModel);
  console.log('Rug model:', rug);
  console.log('Side Table model:', sideTable);
  console.log('Desk model:', desk);
  console.log('Desk Chair model:', deskChair);
 
  return (
    <Suspense fallback={null}>
      <group>
        {/* Bed */}
        <primitive
          object={bed.scene}
          position={[1, 0.3, 0]}
          scale={getNormalizedScale(bed.scene, targetSizes.Bed)}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Rug */}
        <primitive
          object={rug.scene}
          position={[6, 0.3, 6]}
          scale={getNormalizedScale(rug.scene, targetSizes.Rug)}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Closet */}
        <primitive
          object={closetModel.scene}
          position={[3, 0.3, -4.5]}
          scale={getNormalizedScale(closetModel.scene, targetSizes.Closet)}
          rotation={[0, Math.PI, 0]}
        />
        {/* Side Table */}
        <primitive
          object={sideTable.scene}
          position={[-4.5, 0.3, 0.5]}
          scale={getNormalizedScale(sideTable.scene, targetSizes.SideTable)}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Desk */}
        <primitive
          object={desk.scene}
          position={[-3.5, 0.3, 6]}
          scale={getNormalizedScale(desk.scene, targetSizes.Desk)}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Desk Chair */}
        <primitive
          object={deskChair.scene}
          position={[-4.5, 0.3, 2]}
          scale={getNormalizedScale(deskChair.scene, targetSizes.DeskChair)}
          rotation={[0, Math.PI / 2, 0]}
        />
      </group>
    </Suspense>
  );
}

// Preload models for better performance
useGLTF.preload('/assets/bed.glb');
useGLTF.preload('/assets/closetmodel.glb');
useGLTF.preload('/assets/rug.glb');
useGLTF.preload('/assets/sidetable.glb');
useGLTF.preload('/assets/desk.glb');
useGLTF.preload('/assets/deskchair.glb');


