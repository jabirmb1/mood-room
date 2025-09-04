// used to get all the dimensions of assest using assetsManifest.json

"use client";

import { useEffect } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Box3, Vector3 } from "three";

const loader = new GLTFLoader();

// Fetch manifest
async function loadManifest() {
  const res = await fetch("/assetsManifest.json");
  if (!res.ok) throw new Error("❌ Failed to load manifest");
  return res.json();
}

// Get dimensions of one GLB
async function getObjectDimensions(modelPath: string) {
  return new Promise<{ width: number; height: number; depth: number }>(
    (resolve, reject) => {
      loader.load(
        modelPath,
        (gltf) => {
          const box = new Box3().setFromObject(gltf.scene);
          const size = new Vector3();
          box.getSize(size);
          resolve({
            width: Number(size.x.toFixed(3)),
            height: Number(size.y.toFixed(3)),
            depth: Number(size.z.toFixed(3)),
          });
        },
        undefined,
        (err) => reject(err)
      );
    }
  );
}

export default function DimensionDumper() {
  useEffect(() => {
    async function dumpDimensions() {
      try {
        const assetManifest = await loadManifest();
        for (const item of assetManifest) {
          try {
            const dims = await getObjectDimensions(item.path);
            console.log(`${item.name}:`, dims);
          } catch (err) {
            console.error(`❌ Failed ${item.name}`, err);
          }
        }
      } catch (err) {
        console.error("❌ Could not load manifest:", err);
      }
    }

    dumpDimensions();
  }, []);

  return <div> Logging object dimensions to console...</div>;
}
