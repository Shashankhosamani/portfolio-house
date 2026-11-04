"use client";
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useHouse, walk } from "@/lib/store";
import { Shell, DOORS, zFront, zBack } from "./Shell";
import { Furniture } from "./Furniture";
import { NameSign, Pendant } from "./Home";
import { ProjectCards } from "./ProjectCards";
import { Lighting } from "./Lighting";
import { CeilingFixtures } from "./Ceiling";

const ease = (x: number) => x * x * (3 - 2 * x);
const EYE = 1.6;

/** Where the camera stands in each room, and what it looks at. */
const view = (j: number) => j === 0 ? new THREE.Vector3(0, EYE, -0.9) : new THREE.Vector3(DOORS[j - 1] * 0.55, EYE, zFront(j) - 1.25);
const look = (j: number) => new THREE.Vector3(j === 0 ? -0.35 : j === 2 ? -1.25 : 0, 1.5, zBack(j));
const doorPoint = (j: number) => new THREE.Vector3(DOORS[j], 1.3, zBack(j));

function CameraRig() {
  const { camera, size } = useThree();
  const smooth = useRef(0);
  const target = useRef(new THREE.Vector3());
  const mouse = useRef(new THREE.Vector2());
  const curves = useMemo(() => [0, 1, 2].map((k) => new THREE.CatmullRomCurve3([
    view(k),
    new THREE.Vector3(DOORS[k] * 0.9, EYE, zBack(k) + 1.0),
    new THREE.Vector3(DOORS[k], EYE, zBack(k) - 0.45),
    view(k + 1),
  ], false, "centripetal")), []);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useFrame((state, dt) => {
    // keep at least ~68° of horizontal view so phones still see the room
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const hfov = 72 * Math.PI / 180;
    const vfov = Math.max(48, (2 * Math.atan(Math.tan(hfov / 2) / aspect)) * 180 / Math.PI);
    if (Math.abs(cam.fov - vfov) > 0.01) { cam.fov = Math.min(vfov, 95); cam.updateProjectionMatrix(); }

    const p = useHouse.getState().progress;
    smooth.current = reduce ? p : THREE.MathUtils.damp(smooth.current, p, 5, dt);
    const { k, t, move } = walk(smooth.current);
    const c = (v: number) => Math.min(1, Math.max(0, v));
    let pos: THREE.Vector3, tgt: THREE.Vector3;
    if (k === 3 || move <= 0) {
      pos = view(k);
      const a = k === 3 ? 0 : ease(c((t - 0.3) / 0.2));
      tgt = look(k).lerp(k === 3 ? look(k) : doorPoint(k), a);
    } else {
      const m = ease(move);
      pos = curves[k].getPoint(m);
      tgt = doorPoint(k).lerp(look(k + 1), ease(c((move - 0.3) / 0.7)));
    }
    if (!reduce) {
      mouse.current.lerp(state.pointer, 0.05);
      tgt.x += mouse.current.x * 0.35;
      tgt.y += mouse.current.y * 0.18;
      pos.y += Math.sin(state.clock.elapsedTime * 0.6) * 0.008;
    }
    camera.position.copy(pos);
    target.current.lerp(tgt, reduce ? 1 : 0.25);
    camera.lookAt(target.current);
  });
  return null;
}

export default function Scene({ quality }: { quality: "high" | "low" }) {
  return (
    <Canvas
      shadows={quality === "high" ? "soft" : "basic"}
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, EYE, -0.9], fov: 55, near: 0.05, far: 40 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}
    >
      <color attach="background" args={["#050505"]} />
      <Suspense fallback={null}>
        <Lighting />
        <Shell />
        <Furniture />
        <CeilingFixtures />
        <NameSign />
        <Pendant z={-3.0} />
        <ProjectCards />
        <Preload all />
      </Suspense>
      <CameraRig />
      <AdaptiveDpr pixelated={false} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        {quality === "high" ? <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes /> : <></>}
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.25} darkness={0.55} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
