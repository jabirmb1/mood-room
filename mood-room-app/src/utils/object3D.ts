// This file contains all logic that relates to the model and how to change it.
import * as THREE from "three";

// declaring types here:
export type ColourPalette = {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };

type MaterialColorMap = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

// This function fully clones a model including its material.
//
export function cloneModel(scene: THREE.Object3D) {
    // cloning the scene
    const clonedModel = scene.clone(true);
    
    // cache for meshes with materials
    const meshesWithMaterials: THREE.Mesh[] = [];

    //cloning the materials as well
    clonedModel.traverse((child: any) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.userData.isDraggable = true// we also want all models (except for floors and walls) to be draggable.
            meshesWithMaterials.push(child);
        }
    });

    // attach cached meshes to the cloned model for later reuse
    (clonedModel as any).meshesWithMaterials = meshesWithMaterials;

    return clonedModel;
}

// This function applies a colour pallete to the model.
//note: since changing colour of a model isn't that frequent, this function won't using caching.
//
export function applyColourPalette(model: THREE.Object3D, colourPalette?: ColourPalette)
{
    if(!colourPalette) return // user did not specify custom colours, so just use default ones instead.

   // mapping the colour palette to the material names in the model to reduce code
       // each material in a model will be primary, secondary, or tertiary.
       const materialColorMap: MaterialColorMap = {
         primary: colourPalette.primary,
         secondary: colourPalette.secondary,
         tertiary: colourPalette.tertiary,
       };
     
       // traverse through the model and apply the colors to the materials
       model.traverse((child) => {
         if (child instanceof THREE.Mesh) {
           // Handle both single material and array of materials
           const materials = Array.isArray(child.material) ? child.material : [child.material];

           materials.forEach((material) => {
             if (!material) return; // if object e.g. doesn't have secondary, it means that it also doesn't have tertiary, so return early.

             if (material.name === 'primary' || material.name === 'secondary' || material.name === 'tertiary') {
               const key = material.name as keyof MaterialColorMap;
                 // getting the material name to apply the color e.g. if material name is 'primary', then apply the primary color from the color palette.
               const color = materialColorMap[key];
               if (color) { // if the color is defined in the color palette, then apply it to the material
                 material.color.set(color);
                 material.needsUpdate = true;
               }
             }
           });
         }
      });
}


// This function will get a model and apply a hover effect (making it slightly larger and highlighting it as yellow)
//
export function applyHoverEffect(
    model: THREE.Object3D & { meshesWithMaterials?: THREE.Mesh[] },
    hovered: boolean,
    mode: 'view' | 'edit',
    currentSize: number) {
    
    const scaleFactor = hovered ? 1.2 : 1.0;
    // uniformly scale up the model by 20%.
    model.scale.set( currentSize * scaleFactor,  currentSize * scaleFactor,  currentSize * scaleFactor);
  
      const meshes = model.meshesWithMaterials ?? [];
  
      if (meshes.length > 0) {
        // use cached meshes to apply hover effect
        for (const mesh of meshes) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (hovered && mode === 'edit') {
            material.emissive.set('yellow');
            material.emissiveIntensity = 1.0;
          } else {
            material.emissive.set(0x000000);
            material.emissiveIntensity = 0;
          }
        }
      } else {
        // fallback: traverse through the model and apply hover effect
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material as THREE.MeshStandardMaterial;
            if (hovered && mode === 'edit') {
              material.emissive.set('yellow');
              material.emissiveIntensity = 1.0;
            } else {
              material.emissive.set(0x000000);
              material.emissiveIntensity = 0;
            }
          }
        });
      }
  }

// This function will be used to move the object from the current position (an alternative to just dragging e.g. keyboard presses)
// UI buttons etc
//
export function moveObject(ref: React.RefObject<THREE.Object3D>, newPos: [number, number, number],  onChange: (newPos: [number, number, number]) => void)
{
  if (!ref.current) return;

  const pos = ref.current.position;
  pos.set(pos.x + newPos[0], pos.y + newPos[1], pos.z + newPos[2]);
  onChange([pos.x, pos.y, pos.z]);// pass the change up to parent component for rerender.
}



// This function calculates the bounding box and maximum dimension of a 3D object.
//
export function calculateObjectBoxSize(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  return { box, size, center, maxDim };
}