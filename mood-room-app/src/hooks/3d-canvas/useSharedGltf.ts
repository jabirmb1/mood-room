/******This hook will be used to cache our geometries per model (saves memory.) */
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

// global cache.
const geometryCache = new Map<string, THREE.BufferGeometry>()

export function useSharedGLTF(url: string) {
  const { scene } = useGLTF(url)

  return useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse((child: any) => {
      if (child.isMesh) {
        // Deduplicate geometry
        if (!geometryCache.has(child.name)) {
          geometryCache.set(child.name, child.geometry)
        }
        child.geometry = geometryCache.get(child.name)!

        // clone material, so each object can have its own colors
        child.material = child.material.clone()
      }
    })

    return clone
  }, [scene])
}
