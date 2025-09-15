/******** functions relating to pca (principle component analysis), used for our three.js scene *********/

import * as THREE from "three";

// Sample mesh vertices in world space
//
function sampleMeshPoints(mesh: THREE.Mesh, sampleLimit: number): THREE.Vector3[] {
  const geom = mesh.geometry as THREE.BufferGeometry;
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const stride = Math.max(1, Math.ceil(pos.count / sampleLimit));
  const pts: THREE.Vector3[] = [];
  const tmp = new THREE.Vector3();

  for (let i = 0; i < pos.count; i += stride) {
    tmp.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld);
    pts.push(tmp.clone());
  }

  return pts;
}

//Compute centroid (average) of points
//
function computeCentroid(points: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const p of points) c.add(p);
  return c.multiplyScalar(1 / points.length);
}

// Build 3x3 covariance matrix from points
//
function computeCovarianceMatrix(points: THREE.Vector3[], centroid: THREE.Vector3): number[][] {
  const n = points.length;
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (const p of points) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dz = p.z - centroid.z;
    cov[0][0] += dx * dx;
    cov[0][1] += dx * dy;
    cov[0][2] += dx * dz;
    cov[1][1] += dy * dy;
    cov[1][2] += dy * dz;
    cov[2][2] += dz * dz;
  }

  cov[0][0] /= n; cov[0][1] /= n; cov[0][2] /= n;
  cov[1][1] /= n; cov[1][2] /= n; cov[2][2] /= n;
  cov[1][0] = cov[0][1];
  cov[2][0] = cov[0][2];
  cov[2][1] = cov[1][2];

  return cov;
}

// Matrix-vector multiply 
//
function matVec(M: number[][], v: number[]): number[] {
  return [
    M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
    M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
    M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
  ];
}

//Power iteration for dominant eigenvector 
//
function powerIteration(M: number[][], iters = 30): { vec: number[]; lambda: number } {
  let x = [Math.random()+0.5, Math.random()+0.5, Math.random()+0.5];
  let norm = Math.hypot(...x);
  x = x.map(v => v / norm);

  for (let k = 0; k < iters; k++) {
    const y = matVec(M, x);
    const yNorm = Math.hypot(...y);
    if (yNorm === 0) break;
    x = y.map(v => v / yNorm);
  }

  const Mx = matVec(M, x);
  const lambda = x[0]*Mx[0] + x[1]*Mx[1] + x[2]*Mx[2];
  return { vec: x, lambda };
}

//Create orthonormal basis from top 2 eigenvectors
//
function orthonormalBasisFromEigenvectors(cov: number[][], v1: THREE.Vector3, lambda1: number): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const deflated = [
    [cov[0][0] - lambda1*v1.x*v1.x, cov[0][1]-lambda1*v1.x*v1.y, cov[0][2]-lambda1*v1.x*v1.z],
    [cov[1][0] - lambda1*v1.y*v1.x, cov[1][1]-lambda1*v1.y*v1.y, cov[1][2]-lambda1*v1.y*v1.z],
    [cov[2][0] - lambda1*v1.z*v1.x, cov[2][1]-lambda1*v1.z*v1.y, cov[2][2]-lambda1*v1.z*v1.z],
  ];
  const p2 = powerIteration(deflated);
  let v2 = new THREE.Vector3(...p2.vec).normalize();

  // Gram-Schmidt
  const proj = v1.dot(v2);
  v2.addScaledVector(v1, -proj).normalize();

  let v3 = new THREE.Vector3().crossVectors(v1, v2).normalize();
  if (v3.lengthSq() < 1e-8) {
    v3 = new THREE.Vector3().crossVectors(v1, new THREE.Vector3(0,1,0));
    if (v3.lengthSq() < 1e-8) v3 = new THREE.Vector3().crossVectors(v1, new THREE.Vector3(1,0,0));
    v3.normalize();
    v2 = new THREE.Vector3().crossVectors(v3, v1).normalize();
  }

  return [v1, v2, v3];
}

//Project points into PCA plane and get min/max extents
//
function projectPointsAndComputeExtents(points: THREE.Vector3[], centroid: THREE.Vector3, axisX: THREE.Vector3, axisY: THREE.Vector3, normal: THREE.Vector3) {
  let minU=Infinity,maxU=-Infinity, minV=Infinity,maxV=-Infinity, minD=Infinity,maxD=-Infinity;

  for (const p of points) {
    const rel = p.clone().sub(centroid);
    const u = rel.dot(axisX);
    const v = rel.dot(axisY);
    const d = rel.dot(normal);
    if (u<minU) minU=u; if (u>maxU) maxU=u;
    if (v<minV) minV=v; if (v>maxV) maxV=v;
    if (d<minD) minD=d; if (d>maxD) maxD=d;
  }

  return {
    width: maxU - minU,
    height: maxV - minV,
    depth: maxD - minD
  };
}

//This function will be used to generate a rectangle from a passed in three.js mesh with some dimensions and
// other informations.
//
export function getMeshRectangleByPCA(mesh: THREE.Mesh, sampleLimit=5000): {width:number; height:number; 
    depth:number;center:THREE.Vector3; normal:THREE.Vector3; axisX:THREE.Vector3; axisY:THREE.Vector3;} | null {
  if (!mesh.geometry || !(mesh.geometry as THREE.BufferGeometry).attributes.position) return null;


  const pts = sampleMeshPoints(mesh, sampleLimit);
  if (pts.length === 0) return null;

  const centroid = computeCentroid(pts);
  const cov = computeCovarianceMatrix(pts, centroid);

  const p1 = powerIteration(cov);
  const v1 = new THREE.Vector3(...p1.vec).normalize();
  const [axisX, axisY, normal] = orthonormalBasisFromEigenvectors(cov, v1, p1.lambda);

  const {width, height, depth} = projectPointsAndComputeExtents(pts, centroid, axisX, axisY, normal);

  return { width, height, depth, center: centroid, normal, axisX, axisY };
}
