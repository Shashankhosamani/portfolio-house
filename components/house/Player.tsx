"use client";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { player, use, standUp, arrive } from "@/lib/player";
import { slide, HOTSPOTS, roomOf, hotspot } from "@/lib/nav";
import { useHouse } from "@/lib/store";

const WALK = 1.6, RUN = 3.2, TURN = 1.9;

/** Signed shortest difference between two angles. */
export const angDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/** First-person view direction. Looking along (-sin yaw, -cos yaw); yaw 0 faces the name wall. */
export const look = { yaw: 0, yawTarget: 0, pitch: -0.05, pitchTarget: -0.05 };

/** Turn the head toward a hotspot-style facing angle (0 = facing +z). */
export function face(angle: number, pitch = -0.12) {
  const want = angle + Math.PI;
  look.yawTarget = look.yaw + angDiff(look.yaw, want);
  look.pitchTarget = pitch;
}

/** Invisible first-person body: keyboard and path movement, collision, sitting, nearby detection. */
export function Player() {
  const prev = useRef({ computer: null as string | null, panel: null as string | null, print: "idle", room: 0, nearby: null as string | null, mode: "free" });

  // keyboard: W/S forward-back, A/D step sideways, arrow keys walk and turn, Shift to run, E to use
  useEffect(() => {
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); };
    const down = (e: KeyboardEvent) => {
      const st = useHouse.getState();
      if (typing(e) || st.computer || st.printState !== "idle") return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) { player.keys.add(k); e.preventDefault(); }
      if (k === "shift") player.run = true;
      if (k === "e" && st.nearby) use(st.nearby as never);
    };
    const up = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); player.keys.delete(k); if (k === "shift") player.run = false; };
    const blur = () => { player.keys.clear(); player.run = false; };
    addEventListener("keydown", down); addEventListener("keyup", up); addEventListener("blur", blur);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); removeEventListener("blur", blur); };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useHouse.getState();
    const k = player.keys;

    // react to the outside world: leaving the computer, closing the About sheet, finishing a print
    if (prev.current.computer && !st.computer && player.mode === "seated") standUp();
    if (prev.current.panel === "about" && st.panel !== "about" && player.seat === hotspot("armchair").seat) standUp();
    if (st.printState === "idle" && player.mode === "busy") player.mode = "free";
    if (!st.music && player.mode === "dancing") player.mode = "free";
    prev.current.computer = st.computer; prev.current.panel = st.panel; prev.current.print = st.printState;

    // turning with the arrow keys
    if (k.has("arrowleft")) look.yawTarget += TURN * dt;
    if (k.has("arrowright")) look.yawTarget -= TURN * dt;

    let ix = 0, iz = 0;
    if (k.has("w") || k.has("arrowup")) iz -= 1;
    if (k.has("s") || k.has("arrowdown")) iz += 1;
    if (k.has("a")) ix -= 1;
    if (k.has("d")) ix += 1;
    let vx = 0, vz = 0;
    if (ix || iz) {
      if (player.mode === "seated") standUp();
      if (player.mode !== "free") player.mode = "free";
      player.path = []; player.pending = null;
      const len = Math.hypot(ix, iz), speed = player.run ? RUN : WALK;
      const s = Math.sin(look.yaw), c = Math.cos(look.yaw);
      const fx = -s, fz = -c, rx = c, rz = -s;
      vx = ((-iz) * fx + ix * rx) / len * speed;
      vz = ((-iz) * fz + ix * rz) / len * speed;
      st.setMoved();
    } else if (player.path.length && player.mode !== "seated") {
      const [tx, tz] = player.path[0];
      const dx = tx - player.x, dz = tz - player.z, d = Math.hypot(dx, dz);
      let remaining = d, px = tx, pz = tz;
      for (const [qx, qz] of player.path.slice(1)) { remaining += Math.hypot(qx - px, qz - pz); px = qx; pz = qz; }
      const speed = remaining > 3.5 ? RUN : WALK;
      if (d < 0.06) player.path.shift();
      else {
        vx = (dx / d) * speed; vz = (dz / d) * speed;
        // look where we're going
        const want = Math.atan2(-vx, -vz);
        look.yawTarget = look.yaw + angDiff(look.yaw, want);
        look.pitchTarget += (-0.05 - look.pitchTarget) * Math.min(1, dt * 3);
      }
      st.setMoved();
    }
    if (!player.path.length && player.faceOnArrive !== null && !player.pending) {
      face(player.faceOnArrive, -0.08);
      player.faceOnArrive = null;
    }
    if (ix || iz) player.faceOnArrive = null;
    if (!player.path.length && player.pending && !(ix || iz)) {
      const id = player.pending; player.pending = null;
      const h = hotspot(id);
      face(h.seat ? h.seat[3] : h.face, id === "lamp" ? 0.45 : id === "boombox" ? -0.35 : id === "printer" ? -0.4 : -0.12);
      arrive(id);
    }

    if (vx || vz) {
      const [nx, nz] = slide(player.x, player.z, vx * dt, vz * dt);
      player.speed = Math.hypot(nx - player.x, nz - player.z) / dt;
      player.x = nx; player.z = nz;
      if (player.speed < 0.1 && player.path.length) player.path.shift();
    } else player.speed = 0;

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

  return null;
}
