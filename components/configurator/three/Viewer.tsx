"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import type { ProductModel } from "@/lib/configurator/models/types";
import type { DesignConfig } from "@/lib/configurator/types";
import type { ViewerApi, ViewName } from "./api";
import { Jersey, type BrandStatus } from "./Jersey";

const { ACTION } = CameraControlsImpl;

const AZIMUTH: Record<ViewName, number> = { front: 0, back: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
const POLAR = Math.PI / 2 - 0.06;
const INTRO_AZIMUTH = -0.38;

function Bridge({
  apiRef,
  controlsRef,
  model,
}: {
  apiRef: RefObject<ViewerApi | null>;
  controlsRef: RefObject<CameraControlsImpl | null>;
  model: ProductModel;
}) {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const [tx, ty, tz] = model.camera.target;
    const distance = model.camera.distance;
    const home = (smooth: boolean) => {
      const c = controlsRef.current;
      if (!c) return;
      c.normalizeRotations();
      // Écrans étroits (mobile) : on recule pour garder les manches dans le cadre.
      const aspect = gl.domElement.clientWidth / Math.max(1, gl.domElement.clientHeight);
      const d = distance * Math.max(1, 1.25 / aspect);
      const x = Math.sin(INTRO_AZIMUTH) * d;
      const z = Math.cos(INTRO_AZIMUTH) * d;
      void c.setLookAt(tx + x, ty + 0.1, tz + z, tx, ty, tz, smooth);
    };
    home(false);
    apiRef.current = {
      setView(view) {
        const c = controlsRef.current;
        if (!c) return;
        c.normalizeRotations();
        let target = AZIMUTH[view];
        // Chemin le plus court vers la vue demandée.
        const delta = Math.atan2(Math.sin(target - c.azimuthAngle), Math.cos(target - c.azimuthAngle));
        target = c.azimuthAngle + delta;
        void c.rotateTo(target, POLAR, true);
      },
      zoom(step) {
        void controlsRef.current?.dolly(step, true);
      },
      reset: () => home(true),
      capture({ size, background, format }) {
        const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 20);
        const fit = 0.47 / Math.tan(THREE.MathUtils.degToRad(14));
        const prevRatio = gl.getPixelRatio();
        const prevSize = gl.getSize(new THREE.Vector2());
        const prevClear = gl.getClearColor(new THREE.Color());
        const prevAlpha = gl.getClearAlpha();
        const out = { front: "", back: "" };
        try {
          gl.setPixelRatio(1);
          gl.setSize(size, size, false);
          if (background) gl.setClearColor(background, 1);
          else gl.setClearColor(0x000000, 0);
          for (const view of ["front", "back"] as const) {
            const sign = view === "front" ? 1 : -1;
            camera.position.set(tx, ty + 0.06, tz + fit * sign);
            camera.lookAt(tx, ty, tz);
            camera.updateProjectionMatrix();
            gl.render(scene, camera);
            // Lecture immédiate, dans la même tâche que le rendu.
            out[view] = gl.domElement.toDataURL(format, 0.92);
          }
        } finally {
          gl.setPixelRatio(prevRatio);
          gl.setSize(prevSize.x, prevSize.y, false);
          gl.setClearColor(prevClear, prevAlpha);
          invalidate();
        }
        return out;
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, controlsRef, gl, scene, invalidate, model]);
  return null;
}

/** Libère explicitement le contexte WebGL au démontage du configurateur. */
function ContextReleaser() {
  const gl = useThree((s) => s.gl);
  useEffect(
    () => () => {
      gl.dispose();
      gl.forceContextLoss();
    },
    [gl],
  );
  return null;
}

export default function Viewer({
  model,
  design,
  quality,
  apiRef,
  onBrandStatus,
  onContextLost,
}: {
  model: ProductModel;
  design: DesignConfig;
  quality: "high" | "low";
  apiRef: RefObject<ViewerApi | null>;
  onBrandStatus: (status: BrandStatus, error?: string) => void;
  onContextLost: () => void;
}) {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const [tx, ty, tz] = model.camera.target;
  const d = model.camera.distance;
  const high = quality === "high";

  return (
    <Canvas
      flat
      shadows={high ? "soft" : false}
      frameloop="demand"
      dpr={high ? [1, 2] : [1, 1.5]}
      camera={{
        fov: 30,
        near: 0.05,
        far: 20,
        position: [tx + Math.sin(INTRO_AZIMUTH) * d, ty + 0.1, tz + Math.cos(INTRO_AZIMUTH) * d],
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
      className="!touch-none"
    >
      <hemisphereLight args={["#ffffff", "#c9cfcb", 1.1]} />
      <directionalLight
        position={[1.6, 2.4, 2.6]}
        intensity={1.9}
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-camera-left={-0.7}
        shadow-camera-right={0.7}
        shadow-camera-top={0.7}
        shadow-camera-bottom={-0.7}
      />
      <directionalLight position={[-2.2, 1.4, -2.4]} intensity={0.9} />
      <directionalLight position={[-2, 0.6, 1.6]} intensity={0.35} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 2.5, 2.5]} scale={[4, 1.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[-3, 1, -1]} scale={[2, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[3, 1, -1]} scale={[2, 3, 1]} target={[0, 0, 0]} />
      </Environment>

      <Jersey model={model} design={design} quality={quality} onBrandStatus={onBrandStatus} />

      <ContactShadows position={[0, -0.5, 0]} scale={1.8} blur={2.6} far={0.7} opacity={0.32} resolution={high ? 512 : 256} color="#1A1D1F" />

      <CameraControls
        ref={controlsRef}
        makeDefault
        minDistance={0.85}
        maxDistance={3.2}
        minPolarAngle={0.28 * Math.PI}
        maxPolarAngle={0.66 * Math.PI}
        smoothTime={0.22}
        draggingSmoothTime={0.08}
        dollySpeed={0.6}
        truckSpeed={0}
        // Pas de déplacement latéral : la cible reste le maillot.
        mouseButtons={{ left: ACTION.ROTATE, middle: ACTION.DOLLY, right: ACTION.NONE, wheel: ACTION.DOLLY }}
        touches={{ one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY, three: ACTION.NONE }}
      />
      <Bridge apiRef={apiRef} controlsRef={controlsRef} model={model} />
      <ContextReleaser />
    </Canvas>
  );
}
