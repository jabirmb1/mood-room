/* This script handles all logic related to generic light functions */

import * as THREE from 'three';

type CreateSpotLightParams = {
  position: THREE.Vector3;     // Where the light is placed
  targetPosition: THREE.Vector3; // Where the light points
  intensity?: number;// how intense it is
  distance?: number;// distance from target
  angle?: number;      // cone angle in radians
  penumbra?: number; // the penumbra of the spot light
  decay?: number; // how hard we want the edges of the spotlight to drop off
  colour?: THREE.Color | string | number;// colour of the spotlight
  castShadow?: boolean;// if we want the sptlight to cast a shadow or not.
};

type CreateDirectionalLightParams = {
    position: THREE.Vector3;// starting pos of directional light
    targetPosition: THREE.Vector3;// where it's target's position is
    intensity?: number;// how intense light is
    colour?: THREE.Color | string | number;// colour of light
    castShadow?: boolean;// if iwe want it to cast a show or not.
  };

// This function just creates a spot light specifying where it is placed and also what it's target is.
// returns a spotlight
//
export function createSpotLight({position, targetPosition, intensity, distance, angle, penumbra, decay, colour, 
    castShadow}: CreateSpotLightParams) {


  const spotLight = new THREE.SpotLight(colour, intensity, distance, angle, penumbra, decay);
  spotLight.position.copy(position);

  const target = new THREE.Object3D();
  target.position.copy(targetPosition);
  spotLight.target = target;
  spotLight.add(target);
  if (castShadow) spotLight.castShadow = castShadow;

  return spotLight;
}

//This function just creates a directional light.
// returns a direction light
//
export function createDirectionalLight({position, targetPosition, intensity, colour, castShadow}: CreateDirectionalLightParams) {
  const directionalLight = new THREE.DirectionalLight(colour, intensity);
  directionalLight.position.copy(position);

  const target = new THREE.Object3D();
  target.position.copy(targetPosition);
  directionalLight.target = target;
  directionalLight.add(target);

  if (castShadow)directionalLight.castShadow = castShadow;

  return directionalLight;
}


//This function will be used to update a light's shadow map whenever it is called (assuming that
// the light's auto update is turned off)
//returns a boolean of whether or not it has been successfully updated or not/
export function updateShadowMap(lightRef:  React.RefObject<THREE.DirectionalLight | null>) : boolean
  {
    // if the ref does not point to a null/ undefined; update shadow map
    if(lightRef.current)
    {
      lightRef.current.shadow.needsUpdate = true;
      return true
    }
    // otherwise return false.
    return false;
  }