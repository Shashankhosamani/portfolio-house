"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, Preload, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useHouse } from "@/lib/store";
import { player, walkTo, use } from "@/lib/player";
import { HOTSPOTS, type HotspotId } from "@/lib/nav";
import { Shell } from "./Shell";
import { Furniture } from "./Furniture";
import { NameSign, Pendant } from "./Home";
import { Lighting } from "./Lighting";
import { CeilingFixtures } from "./Ceiling";
import { Player, look } from "./Player";
import { screens, spots } from "./screens";

const ease = (x: number) => x * x * (3 - 2 * x);
const EYE = 1.62, SEATED_EYE = 1.15;

/** First-person camera: your eyes. Lowers when you sit; glides into screens and up to the printer. */
function CameraRig() {
  const { camera, size } = useThree();
  const eye = useRef(new THREE.Vector3(player.x, EYE, player.z));
  const zoom = useRef(0);
  const zoomPos = useRef(new THREE.Vector3());
  const zoomLook = useRef(new THREE.Vector3());
  const bob = useRef(0);
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam3 = camera as THREE.PerspectiveCamera;
    // ~75° across on any screen; phones get a taller view
    const aspect = size.width / size.height;
    const vfov = Math.min(88, Math.max(55, (2 * Math.atan(Math.tan((75 * Math.PI) / 360) / aspect) * 180) / Math.PI));
    if (Math.abs(cam3.fov - vfov) > 0.01) { cam3.fov = vfov; cam3.updateProjectionMatrix(); }

    // head: smooth turning, gentle footstep bob, lower when seated
    const k = reduce ? 1 : Math.min(1, dt * 9);
    look.yaw += (look.yawTarget - look.yaw) * k;
    look.pitch += (look.pitchTarget - look.pitch) * k;
    const seated = player.mode === "seated" && player.seat;
    if (player.speed > 0.1 && !reduce) bob.current += dt * (player.speed > 2.4 ? 13 : 9);
    const bobY = reduce ? 0 : Math.sin(bob.current) * Math.min(0.03, player.speed * 0.012);
    const sway = player.mode === "dancing" && !reduce ? Math.sin(state.clock.elapsedTime * 4.2) * 0.05 : 0;
    const want = seated
      ? new THREE.Vector3(player.seat![0], SEATED_EYE, player.seat![2])
      : new THREE.Vector3(player.x, EYE + bobY, player.z);
    eye.current.lerp(want, seated || eye.current.y < EYE - 0.05 ? Math.min(1, dt * 5) : 1);
    if (!seated) { eye.current.x = want.x; eye.current.z = want.z; }

    const dir = new THREE.Vector3(-Math.sin(look.yaw) * Math.cos(look.pitch), Math.sin(look.pitch), -Math.cos(look.yaw) * Math.cos(look.pitch));
    const target = eye.current.clone().add(dir);

    // sitting at a computer or standing at the printer: glide in close
    const st = useHouse.getState();
    const mesh = st.computer ? screens[st.computer] : undefined;
    const printer = !mesh && st.printState !== "idle" ? spots.printer : undefined;
    if (printer) {
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
      const d = (worldH * 0.62) / Math.tan(THREE.MathUtils.degToRad(cam3.fov / 2));
      zoomPos.current.copy(zoomLook.current).addScaledVector(normal, d);
    }
    const focused = !!(mesh || printer);
    zoom.current = reduce ? (focused ? 1 : 0) : THREE.MathUtils.damp(zoom.current, focused ? 1 : 0, 3.2, dt);
    const z = ease(Math.min(1, zoom.current));
    camera.position.copy(eye.current).lerp(zoomPos.current, z);
    const sideways = new THREE.Vector3(Math.cos(look.yaw), 0, -Math.sin(look.yaw)).multiplyScalar(sway);
    camera.position.add(sideways.multiplyScalar(1 - z));
    camera.lookAt(target.lerp(zoomLook.current, z));
  });
  return null;
}

/** Floating markers over usable things, and the "E · Use it" prompt for the nearest one. */
function Hotspots() {
  const nearby = useHouse((s) => s.nearby);
  const busy = useHouse((s) => s.computer !== null || s.printState !== "idle");
  const markers = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!markers.current) return;
    markers.current.children.forEach((c, i) => {
      c.position.y = HOTSPOTS[i].at[1] + 0.25 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.04;
      c.rotation.y = state.clock.elapsedTime * 1.2 + i;
      c.visible = HOTSPOTS[i].id !== nearby;
    });
  });
  return (
    <group>
      <group ref={markers}>
        {HOTSPOTS.map((h) => (
          <mesh key={h.id} position={h.at} onClick={(e) => { e.stopPropagation(); use(h.id); }}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color="#C8FF5A" emissive="#C8FF5A" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {nearby && !busy && (() => {
        const h = HOTSPOTS.find((q) => q.id === nearby)!;
        return (
          <Html position={[h.at[0], h.at[1] + 0.35, h.at[2]]} center zIndexRange={[12, 0]}>
            <button type="button" className="prompt" onClick={() => use(h.id as HotspotId)}>
              <kbd>E</kbd>{h.label}
            </button>
          </Html>
        );
      })()}
    </group>
  );
}

/** Ring that flashes where you clicked to walk. */
function ClickMarker() {
  const ring = useRef<THREE.Mesh>(null);
  const t = useRef(10);
  useEffect(() => {
    const on = (e: Event) => {
      const { x, z } = (e as CustomEvent<{ x: number; z: number }>).detail;
      if (ring.current) { ring.current.position.set(x, 0.02, z); t.current = 0; }
    };
    addEventListener("house:walk", on);
    return () => removeEventListener("house:walk", on);
  }, []);
  useFrame((_, dt) => {
    t.current += dt;
    const m = ring.current; if (!m) return;
    const k = Math.min(1, t.current / 0.6);
    m.visible = k < 1;
    m.scale.setScalar(0.6 + k * 0.8);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
  });
  return (
    <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
      <ringGeometry args={[0.16, 0.2, 40]} />
      <meshBasicMaterial color="#C8FF5A" transparent toneMapped={false} />
    </mesh>
  );
}

function onHouseClick(e: ThreeEvent<MouseEvent>) {
  if (e.delta > 6) return; // that was a drag to turn the camera
  const st = useHouse.getState();
  if (st.computer || st.printState !== "idle") return;
  walkTo(e.point.x, e.point.z);
  dispatchEvent(new CustomEvent("house:walk", { detail: { x: e.point.x, z: e.point.z } }));
}

/** Drag anywhere on the canvas to look around (left/right and up/down). */
function useDragToTurn(el: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = el.current; if (!node) return;
    let down = false, lastX = 0, lastY = 0;
    const pd = (e: PointerEvent) => { down = true; lastX = e.clientX; lastY = e.clientY; };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      const k = e.pointerType === "touch" ? 0.007 : 0.005;
      look.yawTarget += dx * k;
      look.pitchTarget = Math.max(-1.1, Math.min(0.9, look.pitchTarget + dy * k));
    };
    const pu = () => { down = false; };
    node.addEventListener("pointerdown", pd); addEventListener("pointermove", pm); addEventListener("pointerup", pu);
    return () => { node.removeEventListener("pointerdown", pd); removeEventListener("pointermove", pm); removeEventListener("pointerup", pu); };
  }, [el]);
}

export default function Scene({ quality }: { quality: "high" | "low" }) {
  const paused = useHouse((s) => s.osOpen);
  const wrap = useRef<HTMLDivElement>(null);
  useDragToTurn(wrap);
  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0, touchAction: "none" }}>
      <Canvas
        frameloop={paused ? "never" : "always"}
        shadows={quality === "high" ? "soft" : "basic"}
        dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
        camera={{ position: [0, EYE, -1.2], fov: 60, near: 0.03, far: 40 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}
      >
        <color attach="background" args={["#050505"]} />
        <Suspense fallback={null}>
          <Lighting />
          <group onClick={onHouseClick}>
            <Shell />
            <Furniture />
          </group>
          <CeilingFixtures />
          <NameSign />
          <Pendant z={-3.0} />
          <Player />
          <Hotspots />
          <ClickMarker />
          <Preload all />
        </Suspense>
        <CameraRig />
        <AdaptiveDpr pixelated={false} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          {quality === "high" ? <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes /> : <></>}
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.9} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.25} darkness={0.5} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
