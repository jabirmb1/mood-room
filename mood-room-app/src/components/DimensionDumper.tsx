"use client";

import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Box3, Vector3, Object3D } from "three";

// Configure a single GLTFLoader instance
const loader = new GLTFLoader();

// Fetch manifest
async function loadManifest() {
  const res = await fetch("/assetsManifest.json", { cache: "no-store" });
  if (!res.ok) throw new Error("❌ Failed to load manifest");
  return res.json();
}

// Get dimensions and front vector of one GLB
async function getObjectInfo(modelPath: string) {
  return new Promise<{
    width: number;
    height: number;
    depth: number;
    frontVector: Vector3;
  }>((resolve, reject) => {
    try {
      const url = new URL(modelPath, window.location.origin).toString();
      loader.load(
        url,
        (gltf: unknown) => {
          const scene = (gltf as { scene: Object3D }).scene;

          // --- Dimensions ---
          const box = new Box3().setFromObject(scene);
          const size = new Vector3();
          box.getSize(size);

          // --- Front vector (+Z in local space) ---
          const front = new Vector3(0, 0, 1);
          scene.updateMatrixWorld(true);
          front.applyQuaternion(scene.quaternion);

          resolve({
            width: Number(size.x.toFixed(3)),
            height: Number(size.y.toFixed(3)),
            depth: Number(size.z.toFixed(3)),
            frontVector: front,
          });
        },
        undefined,
        (err) => {
          console.error("GLTF load failed:", { url, error: err });
          reject(err);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

export default function DimensionDumper() {
  useEffect(() => {
    async function dumpDimensions() {
      try {
        const assetManifest = await loadManifest();

        for (const item of assetManifest) {
          try {
            const info = await getObjectInfo(item.path);
            console.log(
              `${item.name} (${item.path}):`,
              "Dimensions →",
              `W:${info.width}, H:${info.height}, D:${info.depth}`,
              "Front (+Z) vector →",
              info.frontVector
            );
          } catch (err) {
            console.error(`❌ Failed to load ${item.name} from ${item.path}`, err);
          }
        }
      } catch (err) {
        console.error("❌ Could not load manifest:", err);
      }
    }

    dumpDimensions();
  }, []);

  return <div>Logging object dimensions and front vector to console...</div>;
}
