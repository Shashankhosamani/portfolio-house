"use client";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text3D, Center, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { useHouse } from "@/lib/store";
import { zBack } from "./Shell";
import { canvasTexture, FONT_MONO } from "./textures";

const LIME = new THREE.Color("#C8FF5A");

/** The big extruded name on the living room wall. It turns into a neon sign when the lights go off. */
export function NameSign() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const sub = useRef<THREE.MeshStandardMaterial>(null);
  const subTex = useMemo(() => canvasTexture(1024, 80, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff"; ctx.font = `500 34px ${FONT_MONO}`; ctx.textAlign = "center";
    ctx.fillText("F U L L - S T A C K   E N G I N E E R   ·   B E N G A L U R U", w / 2, 52);
  }), []);
  useFrame((_, dt) => {
    const { lightsOn, glow } = useHouse.getState();
    const m = mat.current, s = sub.current;
    if (!m || !s) return;
    const target = lightsOn ? 0 : glow * 4.5;
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, target, 30, dt);
    m.color.lerp(lightsOn ? new THREE.Color("#E9E1CF") : new THREE.Color("#20231A"), 0.3);
    s.emissiveIntensity = THREE.MathUtils.damp(s.emissiveIntensity, lightsOn ? 0 : glow * 2.5, 30, dt);
    s.color.lerp(lightsOn ? new THREE.Color("#5E554A") : new THREE.Color("#1A1C16"), 0.3);
  });
  const z = zBack(0) + 0.1;
  return (
    <group position={[-0.95, 1.62, z]}>
      <Center>
        <Text3D font="fonts/helvetiker_bold.typeface.json" size={0.5} height={0.11} bevelEnabled bevelSize={0.012} bevelThickness={0.02} bevelSegments={4} curveSegments={8} letterSpacing={-0.01} castShadow receiveShadow>
          SHASHANK
          <meshStandardMaterial ref={mat} color="#E9E1CF" roughness={0.35} metalness={0.05} emissive={LIME} emissiveIntensity={0} toneMapped={false} />
        </Text3D>
      </Center>
      <mesh position={[0, -0.55, -0.04]}>
        <planeGeometry args={[3.6, 0.28]} />
        <meshStandardMaterial ref={sub} map={subTex} transparent color="#5E554A" emissive={LIME} emissiveMap={subTex} emissiveIntensity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Pendant lamp with a pull cord you can click. */
export function Pendant({ z }: { z: number }) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const cord = useRef<THREE.Group>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  const toggle = useHouse((s) => s.toggleLights);
  const tug = useRef(0);
  useFrame((_, dt) => {
    tug.current = Math.max(0, tug.current - dt * 5);
    if (cord.current) cord.current.position.y = -Math.sin(tug.current * Math.PI) * 0.08;
    const on = useHouse.getState().lightsOn;
    if (bulb.current) bulb.current.emissiveIntensity = THREE.MathUtils.damp(bulb.current.emissiveIntensity, on ? 6 : 0.05, 12, dt);
  });
  const shade = useMemo(() => {
    const pts = [] as THREE.Vector2[];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * 0.32 + 0.01, Math.cos(a) * 0.2)); }
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  const y = 2.45;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, (3.2 + y) / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 3.2 - y - 0.2, 6]} />
        <meshStandardMaterial color="#1A1815" />
      </mesh>
      <mesh position={[0, y, 0]} geometry={shade} castShadow>
        <meshStandardMaterial color="#2B2824" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, y + 0.02, 0]}>
        <sphereGeometry args={[0.06, 24, 16]} />
        <meshStandardMaterial ref={bulb} color="#FFF4D6" emissive="#FFD9A0" emissiveIntensity={6} toneMapped={false} />
      </mesh>
      {/* pull cord + handle; a wide invisible box makes it easy to hit */}
      <group ref={cord} position={[0.22, 0, 0]}>
        <mesh position={[0, y - 0.32, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.5, 4]} />
          <meshStandardMaterial color="#8E8A82" />
        </mesh>
        <mesh position={[0, y - 0.6, 0]}>
          <capsuleGeometry args={[0.018, 0.05, 4, 12]} />
          <meshStandardMaterial color="#C8FF5A" emissive="#C8FF5A" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, y - 0.45, 0]} visible={false}
          onClick={(e) => { e.stopPropagation(); tug.current = 1; toggle(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
          onPointerOut={() => setHover(false)}>
          <boxGeometry args={[0.25, 0.5, 0.25]} />
        </mesh>
      </group>
    </group>
  );
}
