// PreviewCanvas.tsx
'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ModelPreview } from './ModelThumbnail'; // same as yours

interface PreviewCanvasProps {
  path: string;
  isVisible: boolean;
}

export function SharedCanvas({ path, isVisible }: PreviewCanvasProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute w-[200px] h-[200px] z-50"
    >
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading…</div>}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          frameloop="always"
        >
          <color attach="background" args={['black']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 2, 2]} intensity={1} />
          <ModelPreview path={path} isHovered={isVisible} />
        </Canvas>
      </Suspense>
    </div>
  );
}
