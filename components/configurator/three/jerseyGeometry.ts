import * as THREE from "three";
import type { ProceduralJerseyParams } from "@/lib/configurator/models/types";
import type { NeckStyle } from "@/lib/configurator/types";
import { ARMPIT_V } from "./constants";

export { ARMPIT_V };

/**
 * Géométrie procédurale du maillot de démonstration : surfaces paramétriques
 * (u autour, v en hauteur / le long de la manche), UV continus pour recevoir
 * les textures peintes, normales lissées.
 *
 * Convention UV du corps (reprise pour un futur GLB) :
 *   u = 0 et 0.5 → flancs ; u = 0.25 → milieu devant ; u = 0.75 → milieu dos
 *   v = 0 → ourlet ; v = ARMPIT_V → aisselles ; v = 1 → épaules / encolure
 */
const SUPERELLIPSE = 0.72;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const spow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p);

/** Encolure : profondeur (z) et abaissement (y) pour |x| < neckHalfWidth. */
function neckProfile(p: ProceduralJerseyParams, neck: NeckStyle, x: number, front: boolean) {
  const k = Math.min(1, Math.abs(x) / p.neckHalfWidth);
  const round = Math.sqrt(Math.max(0, 1 - k * k));
  if (!front) return { z: p.neckDepthBack * round, drop: p.neckDropBack * round };
  const drop = neck === "v" ? p.neckDropFront.v * (1 - k) * (0.35 + 0.65 * round) : p.neckDropFront.round * round;
  return { z: p.neckDepthFront * round, drop };
}

/** Point du corps pour (u, v). */
export function torsoPoint(p: ProceduralJerseyParams, neck: NeckStyle, u: number, v: number, out = new THREE.Vector3()) {
  const theta = u * Math.PI * 2;
  const sx = -spow(Math.cos(theta), SUPERELLIPSE);
  const s = Math.sin(theta);
  const sz = spow(s, SUPERELLIPSE);
  const backFactor = s < 0 ? 0.93 : 1;

  if (v <= ARMPIT_V) {
    const t = v / ARMPIT_V;
    const waistDip = lerp(p.widthHem, p.widthChest, 0.45) - p.widthWaist;
    const a = lerp(p.widthHem, p.widthChest, Math.pow(t, 1.25)) - waistDip * Math.sin(Math.PI * t);
    const b = lerp(p.depthHem, p.depthChest, t) - 0.008 * Math.sin(Math.PI * t);
    return out.set(a * sx, lerp(p.hemY, p.armpitY, t), b * sz * backFactor);
  }

  const w = (v - ARMPIT_V) / (1 - ARMPIT_V);
  const xA = p.widthChest * sx;
  const zA = p.depthChest * sz * backFactor;
  const xT = p.shoulderHalfWidth * sx;
  const front = s >= 0;
  const inNeck = Math.abs(xT) < p.neckHalfWidth;
  const profile = inNeck ? neckProfile(p, neck, xT, front) : { z: 0, drop: 0 };
  const zT = (front ? 1 : -1) * profile.z;
  const yT = p.topY - p.shoulderSlope * Math.max(0, Math.abs(xT) - p.neckHalfWidth) - profile.drop;

  const a = Math.sin((w * Math.PI) / 2);
  const b = Math.cos((w * Math.PI) / 2);
  return out.set(lerp(xA, xT, smooth(w)), p.armpitY + (yT - p.armpitY) * a, zT + (zA - zT) * b);
}

/** Axe de manche (courbe de Bézier quadratique) côté +x ; `side` = -1 pour la manche gauche. */
function sleeveAxis(p: ProceduralJerseyParams, side: 1 | -1) {
  const s = p.sleeve;
  const angle = (s.angleDeg * Math.PI) / 180;
  const p0 = new THREE.Vector2(s.rootX, s.rootY);
  const p1 = new THREE.Vector2(s.rootX + s.length * 0.36, s.rootY - s.length * 0.12);
  const p2 = new THREE.Vector2(p1.x + s.length * 0.62 * Math.cos(angle), p1.y - s.length * 0.62 * Math.sin(angle));
  const at = (t: number) => {
    const m = 1 - t;
    const x = m * m * p0.x + 2 * m * t * p1.x + t * t * p2.x;
    const y = m * m * p0.y + 2 * m * t * p1.y + t * t * p2.y;
    const dx = 2 * m * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * m * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const tangent = new THREE.Vector3(dx * side, dy, 0).normalize();
    // normale « vers le haut / l'extérieur » dans le plan frontal
    const up = new THREE.Vector3(-tangent.y * side, tangent.x * side, 0).normalize();
    return { center: new THREE.Vector3(x * side, y, 0), tangent, up };
  };
  return at;
}

/**
 * Point de manche pour (u, v) : u autour (0 = dessus, 0.25 = devant,
 * 0.5 = dessous, 0.75 = dos), v le long (0 = racine dans le corps, 1 = bout).
 */
export function sleevePoint(p: ProceduralJerseyParams, side: 1 | -1, u: number, v: number, out = new THREE.Vector3()) {
  const { center, up } = sleeveAxis(p, side)(v);
  const r = lerp(p.sleeve.radiusRoot, p.sleeve.radiusCuff, Math.pow(v, 0.7));
  const phi = u * Math.PI * 2;
  const front = new THREE.Vector3(0, 0, 1);
  return out
    .copy(center)
    .addScaledVector(up, Math.cos(phi) * r)
    .addScaledVector(front, Math.sin(phi) * r * p.sleeve.flatten);
}

/** Repère d'une manche à l'abscisse t (pour placer un logo sur la face extérieure). */
export function sleeveFrame(p: ProceduralJerseyParams, side: 1 | -1, t: number) {
  return sleeveAxis(p, side)(t);
}

/** Construit une grille paramétrique fermée en u. */
function parametric(
  fn: (u: number, v: number, out: THREE.Vector3) => THREE.Vector3,
  nu: number,
  nv: number,
  flip: boolean,
): THREE.BufferGeometry {
  const positions = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uvs = new Float32Array((nu + 1) * (nv + 1) * 2);
  const tmp = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const v = j / nv;
      fn(u === 1 ? 0 : u, v, tmp);
      const k = j * (nu + 1) + i;
      positions.set([tmp.x, tmp.y, tmp.z], k * 3);
      uvs.set([u, v], k * 2);
    }
  }
  const indices: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + 1;
      const c = a + nu + 1;
      const d = c + 1;
      if (flip) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Couture u = 0 / u = 1 : mêmes positions, on moyenne les normales.
  const normals = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const n0 = new THREE.Vector3();
  const n1 = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1);
    const b = a + nu;
    n0.fromBufferAttribute(normals, a);
    n1.fromBufferAttribute(normals, b);
    n0.add(n1).normalize();
    normals.setXYZ(a, n0.x, n0.y, n0.z);
    normals.setXYZ(b, n0.x, n0.y, n0.z);
  }
  normals.needsUpdate = true;
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}

export interface JerseyGeometries {
  torso: THREE.BufferGeometry;
  sleeveLeft: THREE.BufferGeometry;
  sleeveRight: THREE.BufferGeometry;
  collar: THREE.BufferGeometry;
}

export function buildJerseyGeometries(p: ProceduralJerseyParams, neck: NeckStyle, detail: "high" | "low"): JerseyGeometries {
  const q = detail === "high" ? 1 : 0.6;
  const torso = parametric((u, v, out) => torsoPoint(p, neck, u, v, out), Math.round(180 * q), Math.round(130 * q), false);
  const sleeveRight = parametric((u, v, out) => sleevePoint(p, 1, u, v, out), Math.round(72 * q), Math.round(40 * q), false);
  const sleeveLeft = parametric((u, v, out) => sleevePoint(p, -1, u, v, out), Math.round(72 * q), Math.round(40 * q), true);

  // Col : tube qui suit le bord de l'encolure (devant + dos).
  const points: THREE.Vector3[] = [];
  const steps = 96;
  for (let i = 0; i < steps; i++) {
    const phi = (i / steps) * Math.PI * 2;
    const x = p.neckHalfWidth * Math.cos(phi);
    const front = Math.sin(phi) >= 0;
    const prof = neckProfile(p, neck, x, front);
    points.push(new THREE.Vector3(x * 1.02, p.topY - prof.drop + 0.004, (front ? 1 : -1) * prof.z * 1.02));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
  const collar = new THREE.TubeGeometry(curve, Math.round(220 * q), 0.0115, 12, true);

  return { torso, sleeveLeft, sleeveRight, collar };
}

export function disposeJerseyGeometries(g: JerseyGeometries) {
  g.torso.dispose();
  g.sleeveLeft.dispose();
  g.sleeveRight.dispose();
  g.collar.dispose();
}
