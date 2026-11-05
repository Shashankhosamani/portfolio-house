"use client";
import { useEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { player } from "@/lib/player";
import { useHouse } from "@/lib/store";

const SKIN = "#C38D68";
const SLEEVE = "#2C2F35";
const CUFF = "#C8FF5A";

/** Always drawn on top, so the hands never clip into a wall you're standing next to. */
function useOverlayMaterial(color: string, rough = 0.6) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
    m.depthTest = false;
    return m;
  }, [color, rough]);
}

type HandRig = { root: THREE.Group; fingers: THREE.Group[]; thumb: THREE.Group };

function Hand({ side, rig }: { side: 1 | -1; rig: React.MutableRefObject<HandRig | null> }) {
  const skin = useOverlayMaterial(SKIN, 0.55);
  const sleeve = useOverlayMaterial(SLEEVE, 0.85);
  const cuff = useOverlayMaterial(CUFF, 0.5);
  const root = useRef<THREE.Group>(null);
  const fingers = useRef<THREE.Group[]>([]);
  const thumb = useRef<THREE.Group>(null);
  useEffect(() => {
    if (root.current && thumb.current) rig.current = { root: root.current, fingers: fingers.current, thumb: thumb.current };
  }, [rig]);
  const ro = 1000;
  return (
    <group ref={root}>
      {/* forearm in a hoodie sleeve, running back out of view */}
      <mesh material={sleeve} position={[0, -0.012, 0.2]} rotation-x={Math.PI / 2} renderOrder={ro}>
        <cylinderGeometry args={[0.05, 0.058, 0.32, 18]} />
      </mesh>
      <mesh material={cuff} position={[0, -0.012, 0.045]} rotation-x={Math.PI / 2} renderOrder={ro + 1}>
        <cylinderGeometry args={[0.051, 0.051, 0.016, 18]} />
      </mesh>
      {/* palm */}
      <RoundedBox args={[0.082, 0.03, 0.095]} radius={0.012} smoothness={3} material={skin} position={[0, 0, -0.012]} renderOrder={ro + 2} />
      {/* four fingers, each pivoting at the knuckle so they can curl */}
      {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
        <group key={i} ref={(g) => { if (g) fingers.current[i] = g; }} position={[x * side, 0.002, -0.058]}>
          <mesh material={skin} position={[0, 0, -0.024]} rotation-x={Math.PI / 2} renderOrder={ro + 3}>
            <capsuleGeometry args={[0.0105, [0.04, 0.046, 0.044, 0.034][i], 4, 8]} />
          </mesh>
        </group>
      ))}
      {/* thumb, on the inner side */}
      <group ref={thumb} position={[-0.045 * side, -0.004, -0.02]} rotation={[0, 0.7 * side, 0]}>
        <mesh material={skin} position={[0, 0, -0.022]} rotation-x={Math.PI / 2} renderOrder={ro + 3}>
          <capsuleGeometry args={[0.012, 0.034, 4, 8]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * First-person hands. They sway as you walk, reach for the lamp cord, push the
 * post box flap, give a thumbs-up when the resume prints, type when you sit at a
 * desk, and wave about while the music plays. Hidden in third person and while
 * the camera is inside a screen.
 */
export function Hands({ visible }: { visible: boolean }) {
  const { camera, scene } = useThree();
  const right = useRef<HandRig | null>(null);
  const left = useRef<HandRig | null>(null);
  const holder = useRef<THREE.Group>(null);
  const t = useRef({ walk: 0, gestureId: 0, gestureName: "", gestureT: 99, show: 1, lastYaw: 0, lag: 0 });

  useEffect(() => {
    if (!camera.parent) scene.add(camera);
    t.current.gestureId = player.lastGesture.id;
  }, [camera, scene]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = t.current;
    const st = useHouse.getState();
    const clock = state.clock.elapsedTime;

    // fade the hands down out of view when they shouldn't be there
    const hide = !visible || !!st.computer || st.printState !== "idle";
    s.show += ((hide ? 0 : 1) - s.show) * Math.min(1, dt * 8);
    if (holder.current) holder.current.visible = s.show > 0.02;

    if (player.lastGesture.id !== s.gestureId) { s.gestureId = player.lastGesture.id; s.gestureName = player.lastGesture.name; s.gestureT = 0; }
    s.gestureT += dt;
    if (player.speed > 0.1) s.walk += dt * (player.speed > 2.4 ? 11 : 7.5);

    // hands trail a little behind fast turns
    const cam3 = camera as THREE.PerspectiveCamera;
    const e = new THREE.Euler().setFromQuaternion(cam3.quaternion, "YXZ");
    const dyaw = Math.atan2(Math.sin(e.y - s.lastYaw), Math.cos(e.y - s.lastYaw));
    s.lastYaw = e.y;
    s.lag += (THREE.MathUtils.clamp(dyaw / Math.max(dt, 1e-3) * 0.012, -0.05, 0.05) - s.lag) * Math.min(1, dt * 10);

    const seated = player.mode === "seated";
    const typing = seated && player.seat && Math.abs(player.seat[1]) < 1; // at a desk or in the armchair
    const atDesk = typing && (player.seat![2] < -6); // studio seats are desks
    const dancing = player.mode === "dancing";
    const g = s.gestureT, gname = s.gestureName;
    const pulse = (dur: number) => (g < dur ? Math.sin((g / dur) * Math.PI) : 0);

    // the left hand is the right hand mirrored, so poses are written once; "side" only offsets timing
    for (const [rig, side] of [[right.current, 1], [left.current, -1]] as const) {
      if (!rig) continue;
      const r = rig.root;
      const phase = s.walk + (side > 0 ? 0 : Math.PI);
      const walkAmt = Math.min(1, player.speed / 1.6);
      // resting pose: low at the edges of the view, angled inward
      let x = 0.2, y = -0.16, z = -0.42;
      let rx = -0.18, ry = 0.28, rz = 0.1;
      // breathing + footsteps
      y += Math.sin(clock * 1.6 + side) * 0.004 + Math.sin(phase) * 0.012 * walkAmt;
      x += Math.cos(phase) * 0.006 * walkAmt - s.lag * side;
      let curl = 0.25, thumbCurl = 0.3;

      if (atDesk) {
        // hands forward and down onto the keyboard
        x = 0.11; y = -0.19; z = -0.46; rx = -0.5; ry = 0.12; rz = 0.04;
        curl = 0.5;
      } else if (typing) {
        // in the armchair: hands rest lower, relaxed
        x = 0.19; y = -0.2; z = -0.42; rx = -0.4; curl = 0.45;
      }
      if (dancing) {
        y += 0.1 + Math.sin(clock * 4.2 + (side > 0 ? 0 : Math.PI)) * 0.06;
        x += Math.sin(clock * 2.1) * 0.03; rz += Math.sin(clock * 4.2) * 0.3; curl = 0.1;
      }
      // one-shot gestures, right hand leads
      if (side > 0) {
        if (gname === "Jump") { const p = pulse(0.9); y += p * 0.26; z -= p * 0.12; x -= p * 0.12; rx += p * 1.1; curl = 0.25 + p * 0.9; }
        if (gname === "Yes") { const p = pulse(0.7); z -= p * 0.18; y += p * 0.05; rx += p * 0.6; curl = 0.1; }
        if (gname === "ThumbsUp") { const p = pulse(1.6); x -= p * 0.1; y += p * 0.13; z += p * 0.05; rx += p * 1.35; rz -= p * 0.4; curl = 0.25 + p * 1.25; thumbCurl = 0.3 - p * 0.9; }
        if (gname === "Wave") { const p = pulse(1.8); y += p * 0.16; x -= p * 0.04; rx += p * 1.2; rz += p * Math.sin(g * 12) * 0.35; curl = 0.05; }
      }
      // tuck away
      y -= (1 - s.show) * 0.3;

      r.position.set(x, y, z);
      r.rotation.set(rx, ry, rz);
      rig.fingers.forEach((f, i) => {
        const tap = atDesk ? Math.max(0, Math.sin(clock * 14 + i * 1.7 + (side > 0 ? 0 : 2.2))) * 0.35 : 0;
        f.rotation.x = -(curl + tap + i * 0.05);
      });
      rig.thumb.rotation.x = -thumbCurl;
    }
    // occasional key clicks while typing at a desk, before the screen takes over
    if (atDesk && !st.computer && visible && Math.random() < dt * 9) import("@/lib/sound").then((m) => m.keyClick("key")).catch(() => {});
  });

  return createPortal(
    <group ref={holder} scale={0.8}>
      <ambientLight intensity={0} />
      <Hand side={1} rig={right} />
      <group scale={[-1, 1, 1]}><Hand side={1} rig={left} /></group>
    </group>,
    camera,
  );
}
