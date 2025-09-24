/******This hook will be used to cache our geometries per model (saves memory.) */
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'


// Global caches
const geometryCache = new Map<string, THREE.BufferGeometry>()
const modelRegistry = new Map<string, number>()

export function useSharedGLTF(url: string) {
  const { scene } = useGLTF(url)

  const clone = useMemo(() => {
    const clonedScene = scene.clone(true)

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
          // Deduplicate geometry
        const key = `${url}:${child.name}` // avoid name collisions

        if (!geometryCache.has(key)) {
          geometryCache.set(key, child.geometry)
          modelRegistry.set(key, 1) // first reference so add it to the registery.
        } else {
          modelRegistry.set(key, modelRegistry.get(key)! + 1)// increment counter
        }

        child.geometry = geometryCache.get(key)!
         // clone material, so each object can have its own colors
        child.material = child.material.clone()
      }
    })

    return clonedScene
  }, [scene, url])

  // function to call when a model has been deleted
  //
  function deleteInstance(){
    clone.traverse((child: any) => {
      if (child.isMesh) {
        const key = `${url}:${child.name}`

        if (modelRegistry.has(key)) {
          const count = modelRegistry.get(key)! - 1//decrement

          // dispose the geometries if no model in the scene is using it; also delete the keys.
          if (count <= 0) {
            geometryCache.get(key)?.dispose()
            geometryCache.delete(key)
            modelRegistry.delete(key)
          } else {
            modelRegistry.set(key, count)// set the decremented count
          }
        }
      }
    })
  }

  return { scene, deleteInstance }
}