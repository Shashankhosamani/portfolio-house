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
import { screens, spots } from "./screens";
import { Lighting } from "./Lighting";
import { CeilingFixtures } from "./Ceiling";

const ease = (x: number) => x * x * (3 - 2 * x);
const EYE = 1.6;

/** The four stops: Home and About in the living room, Workshop and Contact in the studio. */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const STOPS = [
  { pos: V(0, EYE, -0.9), look: V(-0.35, 1.45, zBack(0)) },         // Home: name on the back wall
  { pos: V(-1.5, EYE, -2.55), look: V(3.5, 1.5, -3.25) },            // About: reading-corner wall
  { pos: V(1.0, EYE, zFront(1) - 1.2), look: V(-0.4, 1.45, zBack(1)) }, // Workshop: pegboard + skill bins
  { pos: V(1.5, EYE, zFront(1) - 2.9), look: V(-3.5, 1.3, zFront(1) - 4.3) }, // Contact: the desk
];
const DOOR = V(DOORS[0], 1.3, zBack(0));

function CameraRig() {
  const { camera, size } = useThree();
  const smooth = useRef(0);
  const target = useRef(new THREE.Vector3());
  const mouse = useRef(new THREE.Vector2());
  const doorCurve = useMemo(() => new THREE.CatmullRomCurve3([
    STOPS[1].pos,
    V(DOORS[0] * 0.9, EYE, zBack(0) + 1.0),
    V(DOORS[0], EYE, zBack(0) - 0.45),
    STOPS[2].pos,
  ], false, "centripetal"), []);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const zoom = useRef(0);
  const zoomPos = useRef(new THREE.Vector3());
  const zoomLook = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    // keep at least ~72° of horizontal view so phones still see the room
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const hfov = 72 * Math.PI / 180;
    const vfov = Math.max(48, (2 * Math.atan(Math.tan(hfov / 2) / aspect)) * 180 / Math.PI);
    if (Math.abs(cam.fov - vfov) > 0.01) { cam.fov = Math.min(vfov, 95); cam.updateProjectionMatrix(); }

    const p = useHouse.getState().progress;
    smooth.current = reduce ? p : THREE.MathUtils.damp(smooth.current, p, 5, dt);
    const { k, t, move, door } = walk(smooth.current);
    const c = (v: number) => Math.min(1, Math.max(0, v));
    let pos: THREE.Vector3, tgt: THREE.Vector3;
    if (k === 3) {
      pos = STOPS[3].pos.clone(); tgt = STOPS[3].look.clone();
    } else if (door) {
      if (move <= 0) {
        pos = STOPS[1].pos.clone();
        tgt = STOPS[1].look.clone().lerp(DOOR, ease(c((t - 0.3) / 0.2)));
      } else {
        pos = doorCurve.getPoint(ease(move));
        tgt = DOOR.clone().lerp(STOPS[2].look, ease(c((move - 0.3) / 0.7)));
      }
    } else {
      const m = ease(move);
      pos = STOPS[k].pos.clone().lerp(STOPS[k + 1].pos, m);
      tgt = STOPS[k].look.clone().lerp(STOPS[k + 1].look, m);
    }
    if (!reduce) {
      mouse.current.lerp(state.pointer, 0.05);
      tgt.x += mouse.current.x * 0.3;
      tgt.y += mouse.current.y * 0.15;
      pos.y += Math.sin(state.clock.elapsedTime * 0.6) * 0.008;
    }
    // sitting down at a computer: glide in until the screen fills the view
    const st = useHouse.getState();
    const mesh = st.computer ? screens[st.computer] : undefined;
    const printer = !mesh && st.printState !== "idle" ? spots.printer : undefined;
    if (printer) {
      // walking up to the printer: look down at the tray from a step away
      printer.updateWorldMatrix(true, false);
      zoomLook.current.copy(printer.localToWorld(new THREE.Vector3(0, 0.1, 0.14)));
      zoomPos.current.copy(printer.localToWorld(new THREE.Vector3(-0.05, 0.62, 1.0)));
    }
    if (mesh) {
      const geo = (mesh.geometry as THREE.PlaneGeometry).parameters;
      mesh.updateWorldMatrix(true, false);
      mesh.getWorldPosition(zoomLook.current);
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
      const worldH = geo.height * mesh.matrixWorld.getMaxScaleOnAxis();
      const dist = (worldH * 0.62) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      zoomPos.current.copy(zoomLook.current).addScaledVector(normal, dist);
    }
    const focused = !!(mesh || printer);
    zoom.current = reduce ? (focused ? 1 : 0) : THREE.MathUtils.damp(zoom.current, focused ? 1 : 0, 3.2, dt);
    const z = ease(Math.min(1, zoom.current));
    camera.position.copy(pos.lerp(zoomPos.current, z));
    target.current.lerp(tgt, reduce ? 1 : 0.25);
    camera.lookAt(target.current.clone().lerp(zoomLook.current, z));
  });
  return null;
}

export default function Scene({ quality }: { quality: "high" | "low" }) {
  // nothing in the room is visible while the desktop covers the screen, so stop drawing it
  const paused = useHouse((s) => s.osOpen);
  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
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
