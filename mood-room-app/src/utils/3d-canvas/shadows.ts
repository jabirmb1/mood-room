/******** some functions that relates with shadows. */
import * as THREE from 'three'


//This function will get all objects inside a scene and print if their shadows are active or frozen
//
export function logSceneObjectsShadowStatus(scene: THREE.Scene, staticLight: THREE.DirectionalLight | null,dynamicLight: THREE.DirectionalLight | null) {
    if (!staticLight || !dynamicLight) return;
  
    const frozenObjects: string[] = [];
    const activeObjects: string[] = [];
    console.log( "Static light shadow autoUpdate:", staticLight?.shadow.autoUpdate)
    const inactiveObjects: string[] = [];
  
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return; // Only check Meshes
  
      const isInStaticLayer = obj.layers.test(staticLight.layers);
      const isInDynamicLayer = obj.layers.test(dynamicLight.layers);

      //console.log('is object in static or dynaic layer?' ,isInStaticLayer, isInDynamicLayer)
  
      if (isInStaticLayer && !isInDynamicLayer) frozenObjects.push(obj.name || obj.id.toString());
      else if (isInDynamicLayer) activeObjects.push(obj.name || obj.id.toString());
      else inactiveObjects.push(obj.name || obj.id.toString());
    });
  
    console.log(" Frozen (baked shadow) objects:", frozenObjects);
    console.log("Active (dynamic shadow) objects:", activeObjects);
    console.log("Inactive objects (no shadow):", inactiveObjects);
  }
  