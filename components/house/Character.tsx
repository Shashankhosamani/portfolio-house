"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { PackedGLTFLoader, MODEL_EXT } from "@/lib/packedGltf";
import { player, use, standUp, arrive } from "@/lib/player";
import { slide, HOTSPOTS, roomOf, hotspot } from "@/lib/nav";
import { useHouse } from "@/lib/store";

const URL = `models/RobotExpressive${MODEL_EXT}`;
const SCALE = 0.3; // model is ~4.4 units tall → ~1.3 m
const WALK = 1.7, RUN = 3.4;
const BASE = ["Idle", "Walking", "Running", "Sitting", "Dance"] as const;
type Base = (typeof BASE)[number];

/** Signed shortest difference between two angles. */
const angDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

export const cam = { yaw: 0, yawTarget: 0 };

export function Character() {
  const gltf = useLoader(PackedGLTFLoader, URL);
  const model = useMemo(() => {
    const m = cloneSkinned(gltf.scene) as THREE.Group;
    m.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
    return m;
  }, [gltf]);
  const root = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const out: Record<string, THREE.AnimationAction> = {};
    gltf.animations.forEach((clip) => { out[clip.name] = mixer.clipAction(clip); });
    for (const g of ["Wave", "ThumbsUp", "Jump", "Yes", "No"]) {
      const a = out[g]; if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    }
    return out;
  }, [gltf, mixer]);
  const base = useRef<Base>("Idle");
  const gesture = useRef<THREE.AnimationAction | null>(null);
  const prev = useRef({ computer: null as string | null, panel: null as string | null, print: "idle", room: 0, nearby: null as string | null });

  useEffect(() => {
    actions.Idle?.play();
    const onDone = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== gesture.current) return;
      e.action.fadeOut(0.25);
      actions[base.current]?.reset().fadeIn(0.25).play();
      gesture.current = null;
    };
    mixer.addEventListener("finished", onDone as never);
    const t = setTimeout(() => { player.gesture = "Wave"; }, 1400);
    return () => { mixer.removeEventListener("finished", onDone as never); clearTimeout(t); mixer.stopAllAction(); };
  }, [actions, mixer]);

  // keyboard: arrows/WASD to walk, Shift to run, E to use, Space to jump
  useEffect(() => {
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); };
    const down = (e: KeyboardEvent) => {
      const st = useHouse.getState();
      if (typing(e) || st.computer || st.printState !== "idle") return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) { player.keys.add(k); e.preventDefault(); }
      if (k === "shift") player.run = true;
      if (k === "e" && st.nearby) use(st.nearby as never);
      if (k === " " && player.mode !== "seated") { player.gesture = "Jump"; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); player.keys.delete(k); if (k === "shift") player.run = false; };
    const blur = () => { player.keys.clear(); player.run = false; };
    addEventListener("keydown", down); addEventListener("keyup", up); addEventListener("blur", blur);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); removeEventListener("blur", blur); };
  }, []);

  const setBase = (next: Base) => {
    if (base.current === next) return;
    const from = actions[base.current], to = actions[next];
    if (!to) return;
    if (!gesture.current) { to.reset().play(); from?.crossFadeTo(to, 0.25, false); }
    base.current = next;
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useHouse.getState();
    const k = player.keys;

    // react to the outside world: leaving the computer, closing the About sheet, finishing a print
    if (prev.current.computer && !st.computer && player.mode === "seated") standUp();
    if (prev.current.panel === "about" && st.panel !== "about" && player.seat === hotspot("armchair").seat) standUp();
    if (prev.current.print === "printing" && st.printState === "done") { player.gesture = "ThumbsUp"; player.mode = "free"; }
    if (st.printState === "idle" && player.mode === "busy") player.mode = "free";
    if (!st.music && player.mode === "dancing") player.mode = "free";
    prev.current.computer = st.computer; prev.current.panel = st.panel; prev.current.print = st.printState;

    // input: keys move relative to the camera
    let ix = 0, iz = 0;
    if (k.has("w") || k.has("arrowup")) iz -= 1;
    if (k.has("s") || k.has("arrowdown")) iz += 1;
    if (k.has("a") || k.has("arrowleft")) ix -= 1;
    if (k.has("d") || k.has("arrowright")) ix += 1;
    let vx = 0, vz = 0, speed = 0;
    if (ix || iz) {
      if (player.mode === "seated") standUp();
      if (player.mode !== "free") player.mode = "free";
      player.path = []; player.pending = null;
      const len = Math.hypot(ix, iz);
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      // camera looks along (-sin yaw, -cos yaw)
      const fx = -s, fz = -c, rx = c, rz = -s;
      speed = player.run ? RUN : WALK;
      vx = ((-iz) * fx + ix * rx) / len * speed;
      vz = ((-iz) * fz + ix * rz) / len * speed;
      st.setMoved();
    } else if (player.path.length) {
      const [tx, tz] = player.path[0];
      const dx = tx - player.x, dz = tz - player.z, d = Math.hypot(dx, dz);
      const remaining = d + player.path.slice(1).reduce((acc, p, i, arr) => acc + Math.hypot(p[0] - (i ? arr[i - 1][0] : tx), p[1] - (i ? arr[i - 1][1] : tz)), 0);
      speed = remaining > 3.5 ? RUN : WALK;
      if (d < 0.06) player.path.shift();
      else { vx = (dx / d) * speed; vz = (dz / d) * speed; }
      st.setMoved();
    }
    if (!player.path.length && player.pending && !(ix || iz)) {
      const id = player.pending; player.pending = null;
      arrive(id);
    }

    // move with collision
    if (vx || vz) {
      const [nx, nz] = slide(player.x, player.z, vx * dt, vz * dt);
      const moved = Math.hypot(nx - player.x, nz - player.z) / dt;
      player.x = nx; player.z = nz; player.speed = moved;
      if (moved > 0.05) player.yaw += angDiff(player.yaw, Math.atan2(vx, vz)) * Math.min(1, dt * 12);
      // stuck against something while following a path: drop that waypoint
      if (moved < 0.1 && player.path.length) player.path.shift();
    } else player.speed = 0;

    // pose
    const g = root.current;
    if (g) {
      if (player.mode === "seated" && player.seat) {
        const [sx, sy, sz, syaw] = player.seat;
        g.position.lerp(new THREE.Vector3(sx, sy, sz), Math.min(1, dt * 8));
        g.rotation.y += angDiff(g.rotation.y, syaw) * Math.min(1, dt * 10);
        player.yaw = syaw;
      } else {
        g.position.set(player.x, 0, player.z);
        g.rotation.y += angDiff(g.rotation.y, player.yaw) * Math.min(1, dt * 14);
      }
    }

    // animation
    const want: Base = player.mode === "seated" ? "Sitting" : player.mode === "dancing" ? "Dance" : player.speed > 2.4 ? "Running" : player.speed > 0.1 ? "Walking" : "Idle";
    setBase(want);
    if (player.gesture && actions[player.gesture]) {
      const a = actions[player.gesture];
      player.gesture = null;
      if (want === "Idle" || want === "Dance") {
        actions[base.current]?.fadeOut(0.2);
        gesture.current?.fadeOut(0.1);
        a.reset().fadeIn(0.2).play();
        gesture.current = a;
      }
    }
    if (gesture.current && want !== "Idle" && want !== "Dance") {
      gesture.current.fadeOut(0.15); gesture.current = null; actions[base.current]?.reset().fadeIn(0.15).play();
    }
    mixer.update(dt);

    // what's nearby, and which room we're in (only push to React when it changes)
    let near: string | null = null, best = Infinity;
    if (player.mode === "free" || player.mode === "dancing") for (const h of HOTSPOTS) {
      const d = Math.hypot(player.x - h.stand[0], player.z - h.stand[1]);
      if (d < h.radius && d < best) { best = d; near = h.id; }
    }
    if (near !== prev.current.nearby) { prev.current.nearby = near; st.setNearby(near); }
    const r = roomOf(player.z);
    if (r !== prev.current.room) { prev.current.room = r; st.setRoom(r); }
  });

  return (
    <group ref={root} position={[player.x, 0, player.z]} rotation-y={player.yaw}>
      <primitive object={model} scale={SCALE} />
    </group>
  );
}

useLoader.preload(PackedGLTFLoader, URL);
