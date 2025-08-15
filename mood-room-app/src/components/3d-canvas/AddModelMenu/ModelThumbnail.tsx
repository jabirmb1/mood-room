// stes model thumbnail depending on hover or not

'use client';

import { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree} from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { fitCameraToObject } from '@/utils/3d-canvas/camera';
import { centerPivot, makeRoughNonMetallic } from '@/utils/3d-canvas/object3D';

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
  // make the model rough and non metalic; like how they appear when they are loaded in:
  makeRoughNonMetallic(scene);
  const centeredScene = centerPivot(scene) // center the model's pivot so they also rotate properly.
  const rotationSpeed = 0.01; // speed of rotation of the models inside preview thumbnail.
  const { camera } = useThree();
  // console.log("Path being passed:", gltf.scene); // remove

  useEffect(() => {
    if (!group.current) return;
    const{ center} = fitCameraToObject(camera as THREE.PerspectiveCamera, centeredScene)
   // Offset group so it is centered at origin for rotation
   group.current.position.set(-center.x, -center.y, -center.z);
 }, [scene, camera]);

  // rotate the model
  useFrame(() => {
    if (group.current && isHovered) {
      group.current.rotation.y += rotationSpeed;
     /* console.log("Rotating…"); // REMOVE
      console.log("isHovered?", isHovered);
      console.log("group.current?", group.current); 
      */
    }
  });

  // return the group with the model inside it
  return (
    <group ref={group}>
      <primitive object={centeredScene} />
    </group>
  );
}

// display static image and 3D object when we hover
export function ModelThumbnail({ path, name, thumbnail, hoveredModel, setHoveredModel, onError }: ModelThumbnailProps) {
  const [gltf, setGltf] = useState<{ scene: THREE.Group } | null>(null);
  const [gltfExists, setGltfExists] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);// we may want to use this for debugging e.g. to figure out 
  // if a thumnail exists or not.

  const imgSrc = thumbnail || path.replace(/\.glb$/, '.png'); // load the thumbnail
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
  const isHovered = hoveredModel === name; // check if the model is hovered

  const { ref: group, inView } = useInView({ // check if the model is in view so we diplay for performance purposes
    threshold: 0.1, // 10% of the model needs to be in view
  });

   // load GLTF model and detect errors
   useEffect(() => {
    let canceled = false;
    const loader = new GLTFLoader();
    loader.load(
      path,
      (data: unknown) => {
        const loadedGltf = data as { scene: THREE.Group };
        if (!canceled) {
          setGltf(loadedGltf);
          setGltfExists(true)
        }
      },
      undefined,
      () => {
        if (!canceled) {
          setGltfExists(false); // hide the block if loading fails
        }
      }
    );

    return () => { canceled = true; };
  }, [path]);

  // if there is an error (e.g. the gltf model does not exist), call the onError function if provided
  useEffect(() => {
    if (!gltfExists && onError) {
      onError();
    }
  }, [!gltfExists, onError]);



  // function to handle when thumnail is hovered
  const handleMouseEnter = () => {
   // console.log('hovering over:', name);
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
            setThumbnailError(true); // set thumbnail error to true if the image fails to load
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
