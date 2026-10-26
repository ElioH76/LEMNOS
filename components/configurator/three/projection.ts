import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { Face, ProceduralJerseyParams } from "@/lib/configurator/models/types";
import { sleeveFrame } from "./jerseyGeometry";

/**
 * Projection des éléments imprimés (logos, flocage) sur le maillage : on lance
 * un rayon vers la surface, on récupère le point et la normale lissée, puis on
 * découpe une décalcomanie (DecalGeometry) qui épouse exactement la géométrie
 * — elle reste solidaire du maillot pendant la rotation.
 *
 * Le même mécanisme fonctionnera avec un maillage GLB : seules les
 * coordonnées des emplacements (dans la définition du modèle) changent.
 */

const raycaster = new THREE.Raycaster();
const tri = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() };
const nrm = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() };

export interface SurfaceHit {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  up: THREE.Vector3;
}

function cast(mesh: THREE.Mesh, origin: THREE.Vector3, dir: THREE.Vector3): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  raycaster.set(origin, dir);
  const hit = raycaster.intersectObject(mesh, false)[0];
  if (!hit || !hit.face) return null;
  const pos = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
  const normals = mesh.geometry.getAttribute("normal") as THREE.BufferAttribute;
  tri.a.fromBufferAttribute(pos, hit.face.a);
  tri.b.fromBufferAttribute(pos, hit.face.b);
  tri.c.fromBufferAttribute(pos, hit.face.c);
  nrm.a.fromBufferAttribute(normals, hit.face.a);
  nrm.b.fromBufferAttribute(normals, hit.face.b);
  nrm.c.fromBufferAttribute(normals, hit.face.c);
  const normal = new THREE.Vector3();
  THREE.Triangle.getInterpolation(hit.point, tri.a, tri.b, tri.c, nrm.a, nrm.b, nrm.c, normal);
  return { point: hit.point.clone(), normal: normal.normalize() };
}

/**
 * Trouve le point d'impression d'un élément :
 * - front / back : (x, y) dans le plan de la face (x vers la droite du
 *   spectateur placé face à cette face) ;
 * - sleeve : x = position le long de la manche (0 → 1), face extérieure.
 */
export function locate(
  mesh: THREE.Mesh,
  face: Face,
  x: number,
  y: number,
  params: ProceduralJerseyParams,
  side: 1 | -1 = 1,
): SurfaceHit | null {
  if (face === "front" || face === "back") {
    const sign = face === "front" ? 1 : -1;
    const hit = cast(mesh, new THREE.Vector3(x * sign, y, 2 * sign), new THREE.Vector3(0, 0, -sign));
    return hit && { ...hit, up: new THREE.Vector3(0, 1, 0) };
  }
  const frame = sleeveFrame(params, side, x);
  // Face extérieure, légèrement tournée vers l'avant pour être lisible de 3/4.
  const out = frame.up.clone().multiplyScalar(Math.cos(0.55)).add(new THREE.Vector3(0, 0, Math.sin(0.55))).normalize();
  const hit = cast(mesh, frame.center.clone().addScaledVector(out, 0.6), out.clone().negate());
  return hit && { ...hit, up: frame.tangent.clone().negate() };
}

/** Découpe une décalcomanie de taille (w × h) centrée sur le point, profondeur `depth`. */
export function decalAt(mesh: THREE.Mesh, hit: SurfaceHit, w: number, h: number, depth = 0.09): THREE.BufferGeometry {
  const z = hit.normal.clone();
  const x = new THREE.Vector3().crossVectors(hit.up, z);
  if (x.lengthSq() < 1e-8) x.set(1, 0, 0);
  x.normalize();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  const orientation = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  mesh.updateMatrixWorld(true);
  return new DecalGeometry(mesh, hit.point, orientation, new THREE.Vector3(w, h, depth));
}
