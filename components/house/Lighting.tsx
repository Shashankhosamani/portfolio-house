"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useHouse, walk } from "@/lib/store";
import { zFront, zBack, H } from "./Shell";

/** One warm ceiling light per room. Shadows are only cast in the room you're in and the next one. */
function RoomLight({ j, x = 0, y = H - 0.3, intensity = 34, color = "#FFD9A8", dimmable = false }: { j: number; x?: number; y?: number; intensity?: number; color?: string; dimmable?: boolean }) {
  const spot = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const zc = (zFront(j) + zBack(j)) / 2;
  const { scene } = useThree();
  useFrame((_, dt) => {
    const { progress, lightsOn } = useHouse.getState();
    const { k } = walk(progress);
    const on = dimmable && !lightsOn ? 0.015 : 1;
    if (spot.current) {
      spot.current.intensity = THREE.MathUtils.damp(spot.current.intensity, intensity * on, 14, dt);
      spot.current.castShadow = j === k || j === k + 1;
      if (spot.current.target.parent !== scene) scene.add(spot.current.target);
    }
    if (fill.current) fill.current.intensity = THREE.MathUtils.damp(fill.current.intensity, intensity * 0.35 * on, 14, dt);
  });
  return (
    <group>
      <spotLight ref={spot} position={[x, y, zc + 0.3]} target-position={[x * 0.5, 0, zc]} angle={1.05} penumbra={0.9} decay={1.6} distance={14}
        color={color} intensity={intensity} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} />
      <pointLight ref={fill} position={[x, y - 0.4, zc + 0.6]} color={color} intensity={intensity * 0.35} decay={1.8} distance={9} />
    </group>
  );
}

function FloorLampGlow() {
  const l = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    if (l.current) l.current.intensity = THREE.MathUtils.damp(l.current.intensity, useHouse.getState().lightsOn ? 3.5 : 0, 14, dt);
  });
  return <pointLight ref={l} position={[-2.75, 1.6, zFront(0) - 5.05]} color="#FFC98A" intensity={3.5} decay={2} distance={5} />;
}

/** Blue moonlight through the living room window, only noticeable with the lights off. */
function Moonlight() {
  const l = useRef<THREE.SpotLight>(null);
  const { scene } = useThree();
  useFrame((_, dt) => {
    if (!l.current) return;
    if (l.current.target.parent !== scene) scene.add(l.current.target);
    l.current.intensity = THREE.MathUtils.damp(l.current.intensity, useHouse.getState().lightsOn ? 2 : 9, 6, dt);
  });
  return <spotLight ref={l} position={[-5.5, 2.6, -1.9]} target-position={[1, 0, -2.6]} angle={0.5} penumbra={0.7} color="#9FB6E8" intensity={2} decay={1.2} distance={16} />;
}

function Ambient() {
  const h = useRef<THREE.HemisphereLight>(null);
  const { scene } = useThree();
  useFrame((_, dt) => {
    const { lightsOn, progress } = useHouse.getState();
    const inHome = walk(progress).k === 0;
    const dark = !lightsOn && inHome;
    if (h.current) h.current.intensity = THREE.MathUtils.damp(h.current.intensity, dark ? 0.04 : 0.45, 10, dt);
    scene.environmentIntensity = THREE.MathUtils.damp(scene.environmentIntensity ?? 1, dark ? 0.05 : 0.55, 10, dt);
  });
  return <hemisphereLight ref={h} args={["#FFF1DE", "#3A2E24", 0.45]} />;
}

export function Lighting() {
  return (
    <>
      <Ambient />
      {/* local, file-free reflections: a soft studio made of light panels */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#FFE6C4" position={[0, 5, -6]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#C9D6FF" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#FFD4A0" position={[4, 3, 2]} scale={2} />
        <Lightformer form="rect" intensity={0.5} color="#ffffff" position={[0, 1, 8]} scale={[12, 3, 1]} />
      </Environment>
      <RoomLight j={0} y={2.38} intensity={40} dimmable />
      <FloorLampGlow />
      <Moonlight />
      <RoomLight j={1} x={0.6} intensity={30} />
      <RoomLight j={2} x={-1.0} intensity={34} color="#FFE7C8" />
      <RoomLight j={3} intensity={30} color="#FFD3A0" />
    </>
  );
}
