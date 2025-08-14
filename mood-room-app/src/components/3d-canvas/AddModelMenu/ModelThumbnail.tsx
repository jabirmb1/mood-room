// stes model thumbnail depending on hover or not

'use client';

import { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ModelThumbnailProps {
  path: string;    // path to .glb
  name: string;
  thumbnail: string; // path to .png/.jpg
  hoveredModel: string | null;
  setHoveredModel: (model: string | null) => void;
  onError?: () => void; // optional
  }

// display 3D object when we hover
export function ModelPreview({gltf,isHovered}: {gltf: { scene: THREE.Group },isHovered: boolean}) {
  const group = useRef<THREE.Group>(null);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]); // clone the scene to avoid mutation since we are moving the group
  console.log("Path being passed:", gltf.scene); // remove

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene); // can be adjusted when we have proper models
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // move parent group to center the model
    if (group.current) {
      group.current.position.set(-center.x, -center.y, -center.z);
    }

    scene.scale.setScalar(1.5 / maxDim);
  }, [scene]);

  // rotate the model
  useFrame(() => {
    if (group.current && isHovered) {
      group.current.rotation.y += 0.01;
      console.log("Rotating…"); // REMOVE
      console.log("isHovered?", isHovered);
      console.log("group.current?", group.current);
    }
  });

  // return the group with the model inside it
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

// display static image and 3D object when we hover
export function ModelThumbnail({ path, name, thumbnail, hoveredModel, setHoveredModel, onError }: ModelThumbnailProps) {
  const [gltf, setGltf] = useState<{ scene: THREE.Group } | null>(null);
  const [exists, setExists] = useState(true); // track if the GLTF exists

  const imgSrc = thumbnail || path.replace(/\.glb$/, '.png'); // load the thumbnail
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const isHovered = hoveredModel === name; // check if the model is hovered

  const { ref: group, inView } = useInView({ // check if the model is in view so we diplay for performance purposes
    threshold: 0.1, // 10% of the model needs to be in view
  });

   // load GLTF model and detect errors
   useEffect(() => {
    let canceled = false;
    if (!path || !inView){ // do not load if no path or not in view
      setExists(false);
      return;
    }
    const loader = new GLTFLoader();
    loader.load(
      path,
      (data: unknown) => {
        const loadedGltf = data as { scene: THREE.Group };
        if (!canceled) {
          setGltf(loadedGltf);
        }
      },
      undefined,
      () => {
        if (!canceled) {
          setExists(false); // hide the block if loading fails
        }
      }
    );

    return () => { canceled = true; };
  }, [path]);

  // if there is an error (e.g. the gltf model does not exist), call the onError function if provided
  useEffect(() => {
    if (exists === false && onError) {
      onError();
    }
  }, [exists, onError]);



  // function to handle when thumnail is hovered
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModel(name);
    }, 2000); // delay to ensure on purpose hover
  };

  // function to handle when thumbnail is not hovered/ stopped being hovered.
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      // reset everything
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredModel(null); // reset the hovered model when hop off
  };

  // don't render anything if the gltf loader failed to load in a model.
  if (!exists)
  {
    return;
  }

  return (
    <div
      ref={group}
      className="relative w-[100%] h-[100%] bg-gray-100 rounded overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* static image */}
      {!isHovered && inView && (
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder-thumbnail.jpg';
          }}
        />
      )}

      {/* 3D preview */}
      {isHovered && inView && gltf &&(
        <div className="absolute inset-0">
          <Suspense
            fallback={ // for time due to loading
              <div className="w-full h-full flex items-center justify-center">
                Loading…
              </div>
            }
          >
            <Canvas
              style={{ width: '100%', height: '100%' }}
              camera={{ position: [0, 0, 5], fov: 50 }}
              gl={{ antialias: true, alpha: true }}
              frameloop="always" // always update the canvas ie rotation
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 2, 2]} intensity={1} />
              <ModelPreview gltf={gltf} isHovered={isHovered} /> {/* display the model */}
            </Canvas>
          </Suspense>
        </div>
      )}
    </div>
  );
}
