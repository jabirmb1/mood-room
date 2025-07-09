// decides what the thumbnail is for a model
// access from assetsManifest.json file the path to the thumbnail and object
// 3d when hover and static when not hovered


'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { div } from 'framer-motion/client';

interface ModelThumbnailProps {
  path: string;             // path to .glb
  name: string;
  thumbnail: string;   // path to .png/.jpg
}

function ModelPreview({ path, isHovered }: { path: string; isHovered: boolean }) {
  const group = useRef<THREE.Group>(null);
  console.log("Path being passed:", path);

  const { scene } = useGLTF(path); // what this does is load the 3d model from the path

  // simple auto-rotate when hovered
  useFrame(() => {
    if (group.current && isHovered) {
      group.current.rotation.y += 0.005;
    }
  });

   // Center and scale model once after it's loaded
   useEffect(() => {
    if (scene) {
      // Compute bounding box
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      scene.position.set(-center.x, -center.y, -center.z);
      scene.scale.setScalar(1.5 / maxDim);
    }
  }, [scene]);

  return <primitive object={scene} ref={group} />;
}


export function ModelThumbnail({ path, name, thumbnail }: ModelThumbnailProps) {
  const [hoveredModel, setHoveredModel] = useState<{
    path: string;
    id: string;
  } | null>(null);

  const imgSrc = thumbnail || path.replace(/\.glb$/, '.png');

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (model: { path: string; id: string }) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModel(model); // only set after 3 seconds
      console.log("Model being hovered:", model);
      setIsHovered(true);
    }, 3000);
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredModel(null); // reset immediately
    setIsHovered(false);
  };

  return (
    <div
      className="relative w-full h-[30vh] w-[30vh] bg-gray-100 rounded overflow-hidden"
      onMouseEnter={() => handleMouseEnter({ path, id: name })}
      onMouseLeave={handleMouseLeave}
    >
      {/* static image */}
      <img
        src={imgSrc}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${hoveredModel?.id === name ? 'opacity-0' : 'opacity-100'}`}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/placeholder-thumbnail.jpg';
        }}
      />  

      {/* 3D preview */}
      {hoveredModel && isHovered &&  (
        <Suspense
          fallback={<div className="absolute inset-0 flex items-center justify-center">Loading…</div>}
        >
          <Canvas
            className="absolute inset-0"
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            frameloop="always"
          >
            {/* ✅ This sets the background color of the 3D scene */}
            <color attach="background" args={['black']} /> {/* Tailwind red-500 */}


            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} intensity={1} />
            <ModelPreview path={hoveredModel.path} isHovered={isHovered} />
            
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
