"use client";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";
import { PROJECTS } from "@/lib/content";
import { useHouse } from "@/lib/store";
import { zBack } from "./Shell";
import { canvasTexture, drawSvg, FONT_MONO, FONT_SANS, FONT_SERIF } from "./textures";

const CW = 0.66, CH = 0.9;

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" "); let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > max && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = t;
  }
  ctx.fillText(line, x, y);
}

function Card({ i, x, y, z, rot }: { i: number; x: number; y: number; z: number; rot: number }) {
  const p = PROJECTS[i];
  const open = useHouse((s) => s.openProject);
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const g = useRef<THREE.Group>(null);
  const tex = useMemo(() => {
    const t = canvasTexture(512, 700, (ctx, w, h) => {
      ctx.fillStyle = "#ECE5D3"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1A1A1C"; ctx.fillRect(28, 28, w - 56, 300);
      ctx.fillStyle = "#141210"; ctx.font = `800 54px ${FONT_SANS}`;
      wrap(ctx, p.title, 32, 400, w - 64, 56);
      ctx.fillStyle = "#5A5042"; ctx.font = `500 26px ${FONT_MONO}`;
      ctx.fillText(`${p.n} · ${p.tag}`, 32, h - 70);
      ctx.fillStyle = "#3A342C"; ctx.font = `italic 30px ${FONT_SERIF}`;
      ctx.fillText("open →", w - 120, h - 30);
    });
    drawSvg(t, p.thumb, 28, 28, 456, 300);
    return t;
  }, [p]);
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.position.z = THREE.MathUtils.damp(g.current.position.z, z + (hover ? 0.08 : 0), 12, dt);
    g.current.rotation.z = THREE.MathUtils.damp(g.current.rotation.z, hover ? 0 : rot, 12, dt);
  });
  return (
    <group ref={g} position={[x, y, z]} rotation-z={rot}>
      <mesh castShadow
        onClick={(e) => { e.stopPropagation(); open(i); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}>
        <boxGeometry args={[CW, CH, 0.008]} />
        <meshStandardMaterial attach="material-0" color="#DDD5C2" />
        <meshStandardMaterial attach="material-1" color="#DDD5C2" />
        <meshStandardMaterial attach="material-2" color="#DDD5C2" />
        <meshStandardMaterial attach="material-3" color="#DDD5C2" />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.85} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={hover ? 0.12 : 0} />
        <meshStandardMaterial attach="material-5" color="#DDD5C2" />
      </mesh>
      {/* push pin */}
      <mesh position={[0, CH / 2 - 0.05, 0.015]}>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshStandardMaterial color="#C8FF5A" roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Pegboard with the five project cards pinned on it, above the workbench. */
export function ProjectCards() {
  const z = zBack(2) + 0.1;
  const peg = useMemo(() => {
    const t = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#B48E62"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#3A2A1A";
      for (let yy = 16; yy < h; yy += 32) for (let xx = 16; xx < w; xx += 32) { ctx.beginPath(); ctx.arc(xx, yy, 4, 0, Math.PI * 2); ctx.fill(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5.4, 2);
    return t;
  }, []);
  const xs = [-2.85, -2.05, -1.25, -0.45, 0.35];
  const rots = [-0.04, 0.03, -0.02, 0.04, -0.03];
  return (
    <group>
      <mesh position={[-1.25, 1.75, z - 0.04]} receiveShadow>
        <boxGeometry args={[4.3, 1.5, 0.02]} />
        <meshStandardMaterial map={peg} roughness={0.8} />
      </mesh>
      {xs.map((x, i) => <Card key={i} i={i} x={x} y={1.75} z={z} rot={rots[i]} />)}
    </group>
  );
}
