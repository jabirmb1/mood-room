/**functions relating to light creation and management for any light beam types */
import * as THREE from 'three'
import { baseScreenLightIntensity } from '../../const';
import { calculateBeamOriginPosition, calculateBeamTargetPosition, getBeamGeometryParams, getBeamSpreadParameter, LightBeamDimensions } from './lightBeam';
import { createSpotLightForMesh, SpotlightConfig } from '../meshes';

// function to check if light beam has any lights attatched to it
//
export function doesLightBeamHaveLightSource(lightBeamMesh: THREE.Mesh): boolean {
  return !!lightBeamMesh.userData.spotlight;// can extend this to other light types later
}


// function to get base intensity of light beam's internal light
//
export function getLightBeamBaseIntensity(): number {
  return baseScreenLightIntensity;
}


/********spotlight specific function ***********/

// Calculate spotlight cone angle based on beam dimensions and spread
function calculateBeamConeAngle(width: number, height: number, depth: number, spread: number): number {
  // Calculate the maximum dimensions at the end of the beam (where spread is fully applied)
  const maxWidth = width * spread;
  const maxHeight = height * spread;
  
  // Half-diagonal of the maximum end face (widest part of the beam)
  const maxHalfDiagonal = 0.5 * Math.sqrt(maxWidth * maxWidth + maxHeight * maxHeight);

  // Cone angle = 2 * atan(opposite / adjacent)
  const coneAngle = Math.atan2(maxHalfDiagonal, depth) * 2;
  
  // Cap the angle to prevent extreme values
  return Math.min(coneAngle, Math.PI * 0.7);
}



// Configure spotlight shadow settings
function configureSpotlightShadows(spotlight: THREE.SpotLight, coneAngle: number, distance: number): void {
  if (!spotlight.castShadow) return;
  
  spotlight.shadow.mapSize.width = 1024;
  spotlight.shadow.mapSize.height = 1024;
  spotlight.shadow.camera.near = 0.1;
  spotlight.shadow.camera.far = distance;
  spotlight.shadow.camera.fov = (coneAngle * 180 / Math.PI);
}

// function to update the light beam's intensity.
//
export function updateLightBeamIntensity(lightBeamMesh: THREE.Mesh, intensity: number): void {
  const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
  if (!spotlight) return;
  spotlight.intensity = intensity;
}
// Helper function to update beam's internal light (spotlight) parameters when beam dimensions change
//
export function updateLightForLightBeam(lightBeamMesh: THREE.Mesh, dimensions?: LightBeamDimensions): void {
  try {
    const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
    if (!spotlight) return;

    // Get current or provided dimensions
    const geometryParams = getBeamGeometryParams(lightBeamMesh);
    if (!geometryParams) return;

    const { width, height, depth } = dimensions || geometryParams;

    // sync spotlight distance to beam depth
    spotlight.distance = depth;
    const spread = getBeamSpreadParameter(lightBeamMesh);
    const coneAngle = calculateBeamConeAngle(width, height, depth, spread);
    
    // Update spotlight angle
    spotlight.angle = coneAngle;

    // Update positions
    const originPos = calculateBeamOriginPosition(lightBeamMesh, depth);
    const targetPos = calculateBeamTargetPosition(lightBeamMesh, depth);

    spotlight.position.copy(originPos);
    spotlight.target.position.copy(targetPos);

    // Update shadow settings
    configureSpotlightShadows(spotlight, coneAngle, spotlight.distance);

  } catch (error) {
    console.error('Error updating spotlight for light beam:', error);
  }
}

// Helper function to remove spotlight from light beam
export function removeSpotlightFromLightBeam(lightBeamMesh: THREE.Mesh): void {
  const spotlight = lightBeamMesh.userData.spotlight as THREE.SpotLight;
  if (spotlight) {
    lightBeamMesh.remove(spotlight);
    lightBeamMesh.remove(spotlight.target);
    spotlight.dispose();
    delete lightBeamMesh.userData.spotlight;
  }
}


// Helper function to create a spotlight for the light beam mesh using the general spotlight function
export function createSpotlightForLightBeam(lightBeamMesh: THREE.Mesh, config: SpotlightConfig = {},
  castShadow: boolean = false,): THREE.SpotLight | null {
  try {
    // Get beam geometry parameters
    const geometryParams = getBeamGeometryParams(lightBeamMesh);
    if (!geometryParams) {
      console.error('Invalid geometry for light beam mesh');
      return null;
    }

    const { width, height, depth } = geometryParams;
    const spread = getBeamSpreadParameter(lightBeamMesh);
    const coneAngle = calculateBeamConeAngle(width, height, depth, spread);
    const intensity = getLightBeamBaseIntensity();

    // Create spotlight config with calculated cone angle
    const spotlightConfig: SpotlightConfig = {...config, angle: coneAngle, intensity: intensity};

    // Use the general spotlight function
    const spotlight = createSpotLightForMesh(lightBeamMesh, spotlightConfig);
    if (!spotlight) return null;

    // Calculate and set initial positions
    const originPos = calculateBeamOriginPosition(lightBeamMesh, depth);
    const targetPos =calculateBeamTargetPosition(lightBeamMesh, depth);
   
    spotlight.position.copy(originPos);
    spotlight.target.position.copy(targetPos);
    spotlight.visible = false; // Start invisible, will be toggled by beam visibility
    spotlight.castShadow = castShadow;

    // Configure shadows with beam-specific settings
    configureSpotlightShadows(spotlight, coneAngle * 0.2, spotlight.distance);
    lightBeamMesh.userData.spotlight = spotlight;

    return spotlight;

  } catch (error) {
    console.error('Error creating spotlight for light beam mesh:', error);
    return null;
  }
}
