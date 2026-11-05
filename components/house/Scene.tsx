"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, Preload, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, N8AO, ToneMapping, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useHouse } from "@/lib/store";
import { player, walkTo, use } from "@/lib/player";
import { HOTSPOTS, roomOf, type HotspotId } from "@/lib/nav";
import { Shell } from "./Shell";
import { Furniture } from "./Furniture";
import { NameSign, Pendant } from "./Home";
import { Lighting } from "./Lighting";
import { CeilingFixtures } from "./Ceiling";
import { Character, cam } from "./Character";
import { screens, spots } from "./screens";

const ease = (x: number) => x * x * (3 - 2 * x);
const HEIGHT = 4.2, DIST = 5.0, AHEAD = 1.1;

/** Third-person camera: above and behind the character, dollhouse-style. Zooms into screens and the printer. */
function CameraRig() {
  const { camera, size, scene } = useThree();
  const look = useRef(new THREE.Vector3(player.x, 1, player.z));
  const pos = useRef(new THREE.Vector3());
  const zoom = useRef(0);
  const zoomPos = useRef(new THREE.Vector3());
  const zoomLook = useRef(new THREE.Vector3());
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const occluders = useRef<THREE.Mesh[]>([]);
  const faded = useRef(new Set<THREE.Mesh>());
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    const collect = () => {
      const list: THREE.Mesh[] = [];
      scene.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.userData.occluder) list.push(o as THREE.Mesh); });
      occluders.current = list;
    };
    collect();
    const id = setInterval(collect, 2000);
    return () => clearInterval(id);
  }, [scene]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam3 = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vfov = Math.min(aspect < 0.8 ? 72 : 80, Math.max(50, (2 * Math.atan(Math.tan((70 * Math.PI) / 360) / aspect) * 180) / Math.PI));
    if (Math.abs(cam3.fov - vfov) > 0.01) { cam3.fov = vfov; cam3.updateProjectionMatrix(); }

    cam.yaw += (cam.yawTarget - cam.yaw) * Math.min(1, dt * 6);
    // tall phone screens get a higher, closer, more top-down camera so the room fills the screen
    const tall = aspect < 0.8;
    const dist = tall ? 3.0 : DIST, height = tall ? 6.4 : HEIGHT, ahead = tall ? 0.6 : AHEAD;
    const want = new THREE.Vector3(player.x + Math.sin(cam.yaw) * dist, height, player.z + Math.cos(cam.yaw) * dist);
    // keep the camera over the character's own room, so the other room never blocks the view
    if (roomOf(player.z) === 1) {
      if (want.z > -6.15) { want.y += (want.z + 6.15) * 0.15; want.z = -6.15; }
      want.z = Math.max(want.z, -12 - 2.5);
    } else {
      if (want.z < -5.85) { want.y += (-5.85 - want.z) * 0.15; want.z = -5.85; }
    }
    // aim a little ahead of the character so more of the room is in view
    const lookWant = new THREE.Vector3(player.x - Math.sin(cam.yaw) * ahead, 0.7, player.z - Math.cos(cam.yaw) * ahead);
    // on tall screens, don't aim past the front of a room: that's just the dark outside
    if (tall) lookWant.z = Math.min(lookWant.z, roomOf(player.z) === 0 ? -2.0 : -8.0);
    if (reduce) { pos.current.copy(want); look.current.copy(lookWant); }
    else { pos.current.lerp(want, Math.min(1, dt * 4)); look.current.lerp(lookWant, Math.min(1, dt * 6)); }
    if (pos.current.lengthSq() === 0) pos.current.copy(want);

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
    camera.position.copy(pos.current).lerp(zoomPos.current, z);
    camera.lookAt(look.current.clone().lerp(zoomLook.current, z));

    // fade any wall standing between the camera and the character
    const head = new THREE.Vector3(player.x, 1.0, player.z);
    const dir = head.clone().sub(camera.position);
    const len = dir.length();
    ray.set(camera.position, dir.normalize()); ray.far = len;
    const hit = z > 0.5 ? new Set<THREE.Mesh>() : new Set(ray.intersectObjects(occluders.current, false).map((h) => h.object as THREE.Mesh));
    // also hide the wall behind the camera's line of sight to the floor around the character
    for (const m of occluders.current) {
      const mat = m.material as THREE.MeshStandardMaterial;
      const target = hit.has(m) ? 0.12 : 1;
      if (target < 1 || mat.opacity < 1) {
        mat.transparent = true;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, target, 10, dt);
        mat.depthWrite = mat.opacity > 0.95;
        if (target === 1 && mat.opacity > 0.995) { mat.opacity = 1; mat.transparent = false; mat.depthWrite = true; }
        mat.needsUpdate = true;
      }
    }
    faded.current = hit;
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

/** Drag anywhere on the canvas to turn the camera around the character. */
function useDragToTurn(el: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = el.current; if (!node) return;
    let down = false, lastX = 0;
    const pd = (e: PointerEvent) => { down = true; lastX = e.clientX; };
    const pm = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - lastX; lastX = e.clientX; cam.yawTarget -= dx * 0.006; };
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
        camera={{ position: [0, HEIGHT, DIST - 1.2], fov: 55, near: 0.05, far: 40 }}
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
          <Character />
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
