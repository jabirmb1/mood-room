// Automated scaling of assets
// taked 3d object and target size as input
// Returns a uniform scale to shrink/grow the model so it fits inside a targetSize box while preserving proportions.

import * as THREE from 'three';

export function getNormalizedScale(scene: THREE.Object3D, targetSize: number): [number, number, number] {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = targetSize / maxDim;

  return [scaleFactor, scaleFactor, scaleFactor];
}
