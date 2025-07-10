// decides what the thumbnail is for a model
// access from assetsManifest.json file the path to the thumbnail and object
// 3d when hover and static when not hovered


'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { div } from 'framer-motion/client';
import { SharedCanvas } from './SharedCanvas';

interface ModelThumbnailProps {
  path: string;             // path to .glb
  name: string;
  thumbnail: string;   // path to .png/.jpg
}


// displaye 3d object when we hover
export function ModelPreview({ path, isHovered }: { path: string; isHovered: boolean }) {
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

// display static image and 3d object when we hover
export function ModelThumbnail({ path, name, thumbnail }: ModelThumbnailProps) {
  const [hoveredModel, setHoveredModel] = useState<{
    path: string;
    id: string;
  } | null>(null);

  const imgSrc = thumbnail || path.replace(/\.glb$/, '.png');

  const [isHovered, setIsHovered] = useState(false);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverActive = useRef(false);

  // what happens when mouse enters the thumbnail
  const handleMouseEnter = (model: { path: string; id: string }) => {
    hoverActive.current = true;
    hoverTimeoutRef.current = setTimeout(() => {
      if (hoverActive.current) {
        setHoveredModel(model); // only set after 2 seconds
        console.log("Model being hovered:", model);
        setIsHovered(true);
      }
    }, 2000);
  };
  
  // what happens when mouse leaves the thumbnail
  const handleMouseLeave = () => {
    hoverActive.current = false;
    if (hoverTimeoutRef.current !== null) {
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
      {!isHovered && (
        <img
          src={imgSrc}
          alt={name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${hoveredModel?.id === name ? 'opacity-0' : 'opacity-100'}`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder-thumbnail.jpg';
          }}
        />  
      )}
      {/* 3D preview */}
      {hoveredModel && isHovered &&  (
       <SharedCanvas path={hoveredModel.path} isVisible={isHovered} position={{ top: 0, left: 0 }} />
      )}
    </div>
  );
}

