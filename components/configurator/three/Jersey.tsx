"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { customLogoRect, lockedRect } from "@/lib/configurator/layout";
import type { CustomZone, ProceduralJerseyParams, ProductModel, SurfaceKey, TextPlacement } from "@/lib/configurator/models/types";
import type { CustomLogo, DesignConfig, PlayerText } from "@/lib/configurator/types";
import { TEXT_FONT_FACES, ensureFontLoaded } from "../fonts";
import { loadImageTexture, loadLemnosTextures, textTexture, type LemnosTextures } from "./assets";
import { buildJerseyGeometries, disposeJerseyGeometries } from "./jerseyGeometry";
import { makeKnitNormalCanvas, paintBody, paintSleeve, shade } from "./painters";
import { decalAt, locate } from "./projection";

export type BrandStatus = "loading" | "ready" | "error";

type SurfaceMeshes = Record<SurfaceKey, THREE.Mesh>;

/** Matériau des impressions (logos, flocage) : plaqué, sans z-fighting. */
function printMaterial(map: THREE.Texture, color = "#ffffff") {
  return new THREE.MeshStandardMaterial({
    map,
    color,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    roughness: 0.55,
    metalness: 0,
  });
}

/** Une décalcomanie projetée : géométrie recalculée quand l'emplacement change. */
function Decal({
  mesh,
  surface,
  face,
  x,
  y,
  w,
  h,
  params,
  material,
  name,
  locked,
}: {
  mesh: THREE.Mesh;
  surface: SurfaceKey;
  face: CustomZone["face"];
  x: number;
  y: number;
  w: number;
  h: number;
  params: ProceduralJerseyParams;
  material: THREE.Material;
  name: string;
  locked?: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => {
    const hit = locate(mesh, face, x, y, params, surface === "sleeveLeft" ? -1 : 1);
    return hit ? decalAt(mesh, hit, w, h) : null;
  }, [mesh, surface, face, x, y, w, h, params]);
  useEffect(() => {
    invalidate();
    return () => geometry?.dispose();
  }, [geometry, invalidate]);
  if (!geometry) return null;
  return (
    <mesh
      name={name}
      geometry={geometry}
      material={material}
      receiveShadow
      renderOrder={locked ? 3 : 2}
      userData={{ locked: !!locked }}
    />
  );
}

/**
 * Les trois logos Lemnos OBLIGATOIRES. Emplacements, tailles et proportions
 * proviennent exclusivement de `model.lemnosPlacements` (figés) ; la seule
 * entrée venant du design est `color`, partagée par les trois.
 */
function LemnosLogos({
  model,
  params,
  meshes,
  textures,
  color,
}: {
  model: ProductModel;
  params: ProceduralJerseyParams;
  meshes: SurfaceMeshes;
  textures: LemnosTextures;
  color: string;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const materials = useMemo(
    () => ({ mark: printMaterial(textures.mark), lockup: printMaterial(textures.lockup) }),
    [textures],
  );
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  useLayoutEffect(() => {
    materials.mark.color.set(color);
    materials.lockup.color.set(color);
    invalidate();
  }, [materials, color, invalidate]);

  return (
    <group name="lemnos-locked-logos">
      {model.lemnosPlacements.map((p) => {
        const r = lockedRect(p);
        return (
          <Decal
            key={p.id}
            name={p.id}
            locked
            mesh={meshes[p.surface]}
            surface={p.surface}
            face={p.face}
            x={r.cx}
            y={r.cy}
            w={r.hw * 2}
            h={r.hh * 2}
            params={params}
            material={materials[p.asset]}
          />
        );
      })}
    </group>
  );
}

function CustomLogoDecal({
  logo,
  zone,
  meshes,
  params,
}: {
  logo: CustomLogo;
  zone: CustomZone;
  meshes: SurfaceMeshes;
  params: ProceduralJerseyParams;
}) {
  const [material, setMaterial] = useState<THREE.MeshStandardMaterial | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: THREE.MeshStandardMaterial | null = null;
    loadImageTexture(logo.src)
      .then((texture) => {
        if (cancelled) return texture.dispose();
        created = printMaterial(texture);
        setMaterial(created);
      })
      .catch(() => setMaterial(null));
    return () => {
      cancelled = true;
      created?.map?.dispose();
      created?.dispose();
    };
  }, [logo.src]);

  if (!material) return null;
  const r = customLogoRect(zone, logo);
  const along = zone.face === "sleeve";
  return (
    <Decal
      name={`custom-${zone.id}`}
      mesh={meshes[zone.surface]}
      surface={zone.surface}
      face={zone.face}
      x={along ? zone.region.cx : r.cx}
      y={along ? 0 : r.cy}
      w={r.hw * 2}
      h={r.hh * 2}
      params={params}
      material={material}
    />
  );
}

function TextDecal({
  value,
  text,
  placement,
  meshes,
  params,
  name,
}: {
  value: string;
  text: PlayerText;
  placement: TextPlacement;
  meshes: SurfaceMeshes;
  params: ProceduralJerseyParams;
  name: string;
}) {
  const [print, setPrint] = useState<{ material: THREE.MeshStandardMaterial; aspect: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: THREE.MeshStandardMaterial | null = null;
    if (!value) {
      setPrint(null);
      return;
    }
    ensureFontLoaded(text.font, value).then(() => {
      if (cancelled) return;
      const face = TEXT_FONT_FACES[text.font];
      const { texture, aspect } = textTexture(value, face.family, face.weight, text.color, text.outline ? text.outlineColor : null);
      created = printMaterial(texture);
      setPrint({ material: created, aspect });
    });
    return () => {
      cancelled = true;
      created?.map?.dispose();
      created?.dispose();
    };
  }, [value, text.font, text.color, text.outline, text.outlineColor]);

  if (!print) return null;
  let h = placement.height * (text.outline ? 1.12 : 1);
  let w = h * print.aspect;
  if (w > placement.maxW) {
    w = placement.maxW;
    h = w / print.aspect;
  }
  return (
    <Decal
      name={name}
      mesh={meshes.torso}
      surface="torso"
      face={placement.face}
      x={placement.cx}
      y={placement.cy}
      w={w}
      h={h}
      params={params}
      material={print.material}
    />
  );
}

export function Jersey({
  model,
  design,
  quality,
  onBrandStatus,
}: {
  model: ProductModel;
  design: DesignConfig;
  quality: "high" | "low";
  onBrandStatus: (status: BrandStatus, error?: string) => void;
}) {
  if (model.geometry.kind !== "procedural-jersey") throw new Error("Modèle GLB non encore disponible.");
  const params = model.geometry.params;
  const invalidate = useThree((s) => s.invalidate);
  const neck = design.finish.neck;

  // ── Géométrie ──────────────────────────────────────────────────────────
  const geometries = useMemo(() => buildJerseyGeometries(params, neck, quality), [params, neck, quality]);
  useEffect(() => () => disposeJerseyGeometries(geometries), [geometries]);
  const meshes = useMemo<SurfaceMeshes>(
    () => ({
      torso: new THREE.Mesh(geometries.torso),
      sleeveLeft: new THREE.Mesh(geometries.sleeveLeft),
      sleeveRight: new THREE.Mesh(geometries.sleeveRight),
    }),
    [geometries],
  );

  // ── Textures peintes (couleurs, motifs, finitions) ────────────────────
  const size = quality === "high" ? 2048 : 1024;
  const surfaces = useMemo(() => {
    const body = document.createElement("canvas");
    body.width = size;
    body.height = size / 2;
    const sleeve = document.createElement("canvas");
    sleeve.width = size / 2;
    sleeve.height = size / 4;
    const make = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const knit = new THREE.CanvasTexture(makeKnitNormalCanvas());
    knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
    const knitSleeve = knit.clone();
    knit.repeat.set(36, 18);
    knitSleeve.repeat.set(14, 9);
    return { body, sleeve, bodyTex: make(body), sleeveTex: make(sleeve), knit, knitSleeve };
  }, [size]);

  const materials = useMemo(() => {
    const fabric = (map: THREE.Texture, normalMap: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        normalMap,
        normalScale: new THREE.Vector2(0.32, 0.32),
        roughness: 0.82,
        metalness: 0,
        sheen: 0.35,
        sheenRoughness: 0.75,
        sheenColor: new THREE.Color("#ffffff"),
      });
    return {
      body: fabric(surfaces.bodyTex, surfaces.knit),
      sleeve: fabric(surfaces.sleeveTex, surfaces.knitSleeve),
      collar: new THREE.MeshPhysicalMaterial({ roughness: 0.9, sheen: 0.4, sheenRoughness: 0.8 }),
      inner: new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 1 }),
    };
  }, [surfaces]);

  useEffect(
    () => () => {
      Object.values(materials).forEach((m) => m.dispose());
      [surfaces.bodyTex, surfaces.sleeveTex, surfaces.knit, surfaces.knitSleeve].forEach((t) => t.dispose());
    },
    [materials, surfaces],
  );

  const { colors, pattern, finish } = design;
  useLayoutEffect(() => {
    paintBody(surfaces.body, design);
    paintSleeve(surfaces.sleeve, design);
    surfaces.bodyTex.needsUpdate = true;
    surfaces.sleeveTex.needsUpdate = true;
    materials.collar.color.set(colors.collar);
    materials.inner.color.set(shade(colors.body, -0.45));
    invalidate();
    // `design` est lu via ses sous-objets listés ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaces, materials, colors, pattern, finish, invalidate]);

  // ── Logo officiel Lemnos ──────────────────────────────────────────────
  const [lemnos, setLemnos] = useState<LemnosTextures | null>(null);
  useEffect(() => {
    let cancelled = false;
    let loaded: LemnosTextures | null = null;
    onBrandStatus("loading");
    loadLemnosTextures()
      .then((t) => {
        if (cancelled) return Object.values(t).forEach((x) => x.dispose());
        loaded = t;
        setLemnos(t);
        onBrandStatus("ready");
      })
      .catch((err: Error) => !cancelled && onBrandStatus("error", err.message));
    return () => {
      cancelled = true;
      if (loaded) Object.values(loaded).forEach((x) => x.dispose());
    };
  }, [onBrandStatus]);

  const zones = model.customZones;
  return (
    <group name="jersey">
      <mesh name="torso" geometry={geometries.torso} material={materials.body} castShadow receiveShadow />
      <mesh geometry={geometries.torso} material={materials.inner} />
      <mesh name="sleeveLeft" geometry={geometries.sleeveLeft} material={materials.sleeve} castShadow receiveShadow />
      <mesh geometry={geometries.sleeveLeft} material={materials.inner} />
      <mesh name="sleeveRight" geometry={geometries.sleeveRight} material={materials.sleeve} castShadow receiveShadow />
      <mesh geometry={geometries.sleeveRight} material={materials.inner} />
      <mesh name="collar" geometry={geometries.collar} material={materials.collar} castShadow />

      {lemnos && (
        <LemnosLogos model={model} params={params} meshes={meshes} textures={lemnos} color={design.lemnosLogoColor} />
      )}

      {design.customLogos.map((logo) => {
        const zone = zones.find((z) => z.id === logo.zone);
        return zone ? <CustomLogoDecal key={logo.id} logo={logo} zone={zone} meshes={meshes} params={params} /> : null;
      })}

      {model.text && design.playerText.enabled && (
        <>
          <TextDecal
            name="player-name"
            value={design.playerText.name.trim()}
            text={design.playerText}
            placement={model.text.name}
            meshes={meshes}
            params={params}
          />
          <TextDecal
            name="player-number"
            value={design.playerText.number}
            text={design.playerText}
            placement={model.text.number}
            meshes={meshes}
            params={params}
          />
        </>
      )}
    </group>
  );
}
