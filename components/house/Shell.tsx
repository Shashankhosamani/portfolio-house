"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useHouse, walk } from "@/lib/store";
import { plaster } from "./textures";

export const W = 7; // room width (x)
export const D = 6; // room depth (z)
export const H = 3.2; // ceiling height
export const T = 0.16; // wall thickness
export const DOOR_W = 1.0;
export const DOOR_H = 2.15;
/** Two rooms: the living room and the studio. x position of the door in the living room's back wall. */
export const NR = 2;
export const DOORS = [1.9];

export const ROOM_LOOK = [
  { wall: "#B9AE9C", ceil: "#D8D2C6", trim: "#EDE7DB" }, // living room: warm greige
  { wall: "#45525C", ceil: "#BFC4CA", trim: "#D9DDE2" }, // studio: slate blue
];

export const zFront = (j: number) => -j * D;
export const zBack = (j: number) => -(j + 1) * D;

function useFloor() {
  const [map, bump, rough] = useTexture([
    "textures/hardwood2_diffuse.jpg",
    "textures/hardwood2_bump.jpg",
    "textures/hardwood2_roughness.jpg",
  ]);
  return useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    for (const t of [map, bump, rough]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.2, 2);
      t.anisotropy = 8;
    }
    return { map, bump, rough };
  }, [map, bump, rough]);
}

function Wall({ from, to, z, x, color, bumpMap, height = H, y0 = 0 }: {
  from: number; to: number; z?: number; x?: number; color: string; bumpMap: THREE.Texture; height?: number; y0?: number;
}) {
  // a wall segment along x (when z is given) or along z (when x is given)
  const len = Math.abs(to - from);
  const mid = (from + to) / 2;
  const alongX = z !== undefined;
  const pos: [number, number, number] = alongX ? [mid, y0 + height / 2, z!] : [x!, y0 + height / 2, mid];
  const size: [number, number, number] = alongX ? [len, height, T] : [T, height, len];
  return (
    <mesh position={pos} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.92} bumpMap={bumpMap} bumpScale={0.6} />
    </mesh>
  );
}

function Trim({ z, from, to, color }: { z: number; from: number; to: number; color: string }) {
  const len = to - from;
  return (
    <group>
      <mesh position={[(from + to) / 2, 0.06, z]} receiveShadow>
        <boxGeometry args={[len, 0.12, T + 0.04]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[(from + to) / 2, H - 0.05, z]}>
        <boxGeometry args={[len, 0.1, T + 0.06]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function SideTrim({ x, z0, z1, color }: { x: number; z0: number; z1: number; color: string }) {
  const len = Math.abs(z1 - z0);
  return (
    <group>
      <mesh position={[x, 0.06, (z0 + z1) / 2]} receiveShadow>
        <boxGeometry args={[T + 0.04, 0.12, len]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[x, H - 0.05, (z0 + z1) / 2]}>
        <boxGeometry args={[T + 0.06, 0.1, len]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A partition wall with a door opening, frame and a hinged door leaf. */
function DoorWall({ j, bumpMap }: { j: number; bumpMap: THREE.Texture }) {
  const z = zBack(j);
  const dx = DOORS[j];
  const l = dx - DOOR_W / 2, r = dx + DOOR_W / 2;
  const front = ROOM_LOOK[j], back = ROOM_LOOK[j + 1];
  const leaf = useRef<THREE.Group>(null);
  useFrame(() => {
    const { k, open } = walk(useHouse.getState().progress);
    const a = k > 1 ? 1 : k === 1 ? open : 0;
    if (leaf.current) leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, a * 1.75, 10, 1 / 60);
  });
  return (
    <group>
      {/* the two faces of the partition take each room's colour */}
      {[{ c: front.wall, off: T / 4 }, { c: back.wall, off: -T / 4 }].map(({ c, off }, i) => (
        <group key={i} position={[0, 0, off]}>
          <mesh position={[(-W / 2 + l) / 2, H / 2, z]} receiveShadow castShadow>
            <boxGeometry args={[l + W / 2, H, T / 2]} />
            <meshStandardMaterial color={c} roughness={0.92} bumpMap={bumpMap} bumpScale={0.6} />
          </mesh>
          <mesh position={[(r + W / 2) / 2, H / 2, z]} receiveShadow castShadow>
            <boxGeometry args={[W / 2 - r, H, T / 2]} />
            <meshStandardMaterial color={c} roughness={0.92} bumpMap={bumpMap} bumpScale={0.6} />
          </mesh>
          <mesh position={[dx, (DOOR_H + H) / 2, z]} receiveShadow>
            <boxGeometry args={[DOOR_W, H - DOOR_H, T / 2]} />
            <meshStandardMaterial color={c} roughness={0.92} bumpMap={bumpMap} bumpScale={0.6} />
          </mesh>
        </group>
      ))}
      <Trim z={z + 0.001} from={-W / 2} to={l - 0.06} color={front.trim} />
      <Trim z={z + 0.001} from={r + 0.06} to={W / 2} color={front.trim} />
      {/* door frame (casing) */}
      {[
        { p: [l - 0.04, DOOR_H / 2, z] as const, s: [0.08, DOOR_H + 0.08, T + 0.08] as const },
        { p: [r + 0.04, DOOR_H / 2, z] as const, s: [0.08, DOOR_H + 0.08, T + 0.08] as const },
        { p: [dx, DOOR_H + 0.04, z] as const, s: [DOOR_W + 0.16, 0.08, T + 0.08] as const },
      ].map((f, i) => (
        <mesh key={i} position={f.p as unknown as [number, number, number]} castShadow>
          <boxGeometry args={f.s as unknown as [number, number, number]} />
          <meshStandardMaterial color="#F1ECE2" roughness={0.45} />
        </mesh>
      ))}
      {/* door leaf, hinged on its left edge, swings into the next room */}
      <group ref={leaf} position={[l + 0.01, 0, z]}>
        <mesh position={[(DOOR_W - 0.02) / 2, DOOR_H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[DOOR_W - 0.02, DOOR_H - 0.01, 0.045]} />
          <meshStandardMaterial color="#6B4E36" roughness={0.55} />
        </mesh>
        {[0.55, 1.45].map((y) => (
          <mesh key={y} position={[(DOOR_W - 0.02) / 2, y, 0.025]}>
            <boxGeometry args={[DOOR_W - 0.26, 0.72, 0.012]} />
            <meshStandardMaterial color="#5E432E" roughness={0.6} />
          </mesh>
        ))}
        {[0.04, -0.04].map((zz) => (
          <mesh key={zz} position={[DOOR_W - 0.12, 1.02, zz]} castShadow>
            <sphereGeometry args={[0.032, 16, 12]} />
            <meshStandardMaterial color="#C9A86A" metalness={1} roughness={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Shell() {
  const floor = useFloor();
  const bumps = useMemo(() => [1, 2].map((s) => {
    const t = plaster(s);
    t.repeat.set(2, 1);
    return t;
  }), []);
  return (
    <group>
      {[0, 1].map((j) => {
        const look = ROOM_LOOK[j];
        const zc = (zFront(j) + zBack(j)) / 2;
        return (
          <group key={j}>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0, zc]} receiveShadow>
              <planeGeometry args={[W, D]} />
              <meshStandardMaterial map={floor.map} bumpMap={floor.bump} bumpScale={0.4} roughnessMap={floor.rough} roughness={0.75} color={j === 1 ? "#b8aca2" : "#ffffff"} />
            </mesh>
            <mesh rotation-x={Math.PI / 2} position={[0, H, zc]} receiveShadow>
              <planeGeometry args={[W, D]} />
              <meshStandardMaterial color={look.ceil} roughness={0.95} />
            </mesh>
            <Wall x={-W / 2} from={zFront(j)} to={zBack(j)} color={look.wall} bumpMap={bumps[j]} />
            <Wall x={W / 2} from={zFront(j)} to={zBack(j)} color={look.wall} bumpMap={bumps[j]} />
            <SideTrim x={-W / 2 + 0.001} z0={zFront(j)} z1={zBack(j)} color={look.trim} />
            <SideTrim x={W / 2 - 0.001} z0={zFront(j)} z1={zBack(j)} color={look.trim} />
          </group>
        );
      })}
      {/* front wall behind the camera, and the solid back wall of the studio */}
      <Wall z={0.08} from={-W / 2} to={W / 2} color={ROOM_LOOK[0].wall} bumpMap={bumps[0]} />
      <Wall z={zBack(1)} from={-W / 2} to={W / 2} color={ROOM_LOOK[1].wall} bumpMap={bumps[1]} />
      <Trim z={zBack(1) + 0.001} from={-W / 2} to={W / 2} color={ROOM_LOOK[1].trim} />
      <DoorWall j={0} bumpMap={bumps[0]} />
    </group>
  );
}
