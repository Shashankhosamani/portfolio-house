"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Model } from "./Model";
import { W, H, zBack, zFront, ROOM_LOOK } from "./Shell";
import { canvasTexture, rng, FONT_MONO, FONT_SERIF, FONT_SANS } from "./textures";

const WOOD = "#7A5A40";
const WOOD_DARK = "#4E3828";

function Box({ p, s, c, rough = 0.6, metal = 0 }: { p: [number, number, number]; s: [number, number, number]; c: string; rough?: number; metal?: number }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/** Simple four-legged table. */
function Table({ x, z, w, d, h, top = WOOD, legs = WOOD_DARK }: { x: number; z: number; w: number; d: number; h: number; top?: string; legs?: string }) {
  const lx = w / 2 - 0.06, lz = d / 2 - 0.06;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} c={top} rough={0.45} />
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([a, b], i) => (
        <Box key={i} p={[a, (h - 0.05) / 2, b]} s={[0.05, h - 0.05, 0.05]} c={legs} />
      ))}
    </group>
  );
}

function Rug({ x, z, w, d, colors }: { x: number; z: number; w: number; d: number; colors: [string, string, string] }) {
  const tex = useMemo(() => canvasTexture(512, 512 * (d / w), (ctx, cw, ch) => {
    const [a, b, c] = colors;
    ctx.fillStyle = a; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = b; ctx.lineWidth = 14; ctx.strokeRect(22, 22, cw - 44, ch - 44);
    ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.strokeRect(46, 46, cw - 92, ch - 92);
    const r = rng(5);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.06})`; ctx.fillRect(r() * cw, r() * ch, 2, 2); }
  }), [w, d, colors]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[x, 0.006, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

/** Night-sky window on the left wall of the living room. */
function NightWindow({ z }: { z: number }) {
  const sky = useMemo(() => canvasTexture(256, 384, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0B1324"); g.addColorStop(1, "#1C2B45");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const r = rng(11);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(220,230,255,${0.3 + r() * 0.7})`; ctx.fillRect(r() * w, r() * h * 0.7, 1.6, 1.6); }
    ctx.fillStyle = "#EDE9D8"; ctx.beginPath(); ctx.arc(w * 0.7, h * 0.22, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0F1726";
    // distant rooftops
    ctx.beginPath(); ctx.moveTo(0, h);
    [[0, 300], [40, 300], [40, 270], [90, 270], [90, 310], [140, 310], [140, 255], [200, 255], [200, 295], [256, 295], [256, h]].forEach(([a, b]) => ctx.lineTo(a, b));
    ctx.fill();
    ctx.fillStyle = "#E8C77A";
    for (const [a, b] of [[55, 285], [160, 270], [175, 270], [220, 305]]) ctx.fillRect(a, b, 6, 8);
  }), []);
  const x = -W / 2 + 0.09;
  return (
    <group position={[x, 1.55, z]} rotation-y={Math.PI / 2}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.25, 1.75]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* frame and muntins */}
      {[
        [0, 0.9, 1.4, 0.08], [0, -0.9, 1.4, 0.08], [-0.66, 0, 0.08, 1.88], [0.66, 0, 0.08, 1.88], [0, 0.1, 1.3, 0.04], [0, 0, 0.04, 1.8],
      ].map(([a, b, w, h], i) => (
        <Box key={i} p={[a, b, 0.02]} s={[w, h, 0.06]} c="#E9E3D7" rough={0.4} />
      ))}
      <Box p={[0, -0.97, 0.08]} s={[1.5, 0.05, 0.2]} c="#E9E3D7" rough={0.4} />
    </group>
  );
}

function Bookshelf({ x, z, rot }: { x: number; z: number; rot: number }) {
  const books = useMemo(() => {
    const r = rng(7), pal = ["#6B3A2E", "#2F4A5A", "#8A6A3A", "#3E5A3A", "#5A3550", "#A08A6A", "#2A2A2A", "#7A4A2A", "#C9B48A"];
    const out: { x: number; y: number; w: number; h: number; c: string; tilt: number }[] = [];
    [0.08, 0.5, 0.92, 1.34, 1.76].forEach((y) => {
      let bx = -0.5;
      while (bx < 0.48) {
        const w = 0.03 + r() * 0.035, h = 0.26 + r() * 0.1;
        if (r() < 0.1) { bx += 0.08; continue; }
        out.push({ x: bx + w / 2, y: y + h / 2, w, h, c: pal[Math.floor(r() * pal.length)], tilt: r() < 0.06 ? 0.2 : 0 });
        bx += w + 0.004;
      }
    });
    return out;
  }, []);
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <Box p={[0, 1.05, -0.17]} s={[1.1, 2.1, 0.03]} c={WOOD_DARK} />
      {[-0.54, 0.54].map((a) => <Box key={a} p={[a, 1.05, 0]} s={[0.03, 2.1, 0.36]} c={WOOD} />)}
      {[0.06, 0.48, 0.9, 1.32, 1.74, 2.1].map((y) => <Box key={y} p={[0, y, 0]} s={[1.08, 0.025, 0.36]} c={WOOD} />)}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.02]} rotation-z={b.tilt} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, 0.24]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** A framed print on a wall: mono label + serif title, cream mat. */
function Plaque({ p, label, title, w = 0.62, h = 0.44 }: { p: [number, number, number]; label: string; title: string; w?: number; h?: number }) {
  const tex = useMemo(() => canvasTexture(512, Math.round(512 * (h / w)), (ctx, cw, ch) => {
    ctx.fillStyle = "#EFE8D6"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#CDBF9F"; ctx.lineWidth = 3; ctx.strokeRect(26, 26, cw - 52, ch - 52);
    ctx.textAlign = "center";
    ctx.fillStyle = "#6A5C45"; ctx.font = `500 24px ${FONT_MONO}`;
    ctx.fillText(label.split("").join(" "), cw / 2, ch * 0.4);
    ctx.fillStyle = "#1A1714"; ctx.font = `italic 64px ${FONT_SERIF}`;
    ctx.fillText(title, cw / 2, ch * 0.66);
  }), [label, title, w, h]);
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[w + 0.08, h + 0.08, 0.04]} c="#5B4632" rough={0.5} />
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
    </group>
  );
}

function PostBox({ x, z }: { x: number; z: number }) {
  const red = "#A3271D";
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.06, 0]} s={[0.56, 0.12, 0.56]} c="#2A1A16" />
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.25, 1.2, 40]} />
        <meshStandardMaterial color={red} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.32, 0]} castShadow>
        <sphereGeometry args={[0.26, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={red} roughness={0.35} metalness={0.2} />
      </mesh>
      <Box p={[0, 1.36, 0]} s={[0.56, 0.05, 0.56]} c="#7E1E16" rough={0.4} />
      <Box p={[0, 1.06, 0.235]} s={[0.24, 0.035, 0.04]} c="#1A0E0B" />
      <Box p={[0, 0.82, 0.24]} s={[0.16, 0.1, 0.02]} c="#E9E2D0" rough={0.7} />
    </group>
  );
}

function Envelopes({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      {[[0, 0, 0.1], [0.04, 0.012, -0.2], [-0.03, 0.024, 0.35]].map(([a, b, r], i) => (
        <mesh key={i} position={[a, b + 0.004, 0]} rotation={[-Math.PI / 2, 0, r]} castShadow>
          <boxGeometry args={[0.24, 0.16, 0.008]} />
          <meshStandardMaterial color={i === 1 ? "#D8CDB4" : "#EFE8D6"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** "Let's make something." painted on the post room wall. */
function Mural({ z }: { z: number }) {
  const tex = useMemo(() => canvasTexture(1024, 400, (ctx, w) => {
    ctx.clearRect(0, 0, w, 400);
    ctx.fillStyle = "#F3E9DD"; ctx.font = `800 150px ${FONT_SANS}`;
    ctx.fillText("Let's make", 30, 160);
    ctx.fillStyle = "#C8F25A"; ctx.font = `italic 170px ${FONT_SERIF}`;
    ctx.fillText("something.", 40, 340);
  }), []);
  return (
    <mesh position={[-0.9, 1.95, z + 0.09]}>
      <planeGeometry args={[3.3, 1.29]} />
      <meshStandardMaterial map={tex} transparent roughness={0.9} />
    </mesh>
  );
}

export function Furniture() {
  const z0 = zFront(0), z1 = zFront(1), z2 = zFront(2), z3 = zFront(3);
  return (
    <group>
      {/* ROOM 0 · living room */}
      <Rug x={-0.9} z={z0 - 3.4} w={3.4} d={2.4} colors={["#7C3F2F", "#C9A27A", "#3B231B"]} />
      <Model name="GlamVelvetSofa" position={[-2.95, 0, z0 - 3.4]} rotation={[0, Math.PI / 2, 0]} scale={1.05} />
      <Table x={-1.4} z={z0 - 3.4} w={0.6} d={1.1} h={0.42} />
      <Model name="GlassVaseFlowers" position={[-1.42, 0.42, z0 - 3.2]} scale={1.4} />
      <Model name="LightsPunctualLamp" position={[-2.95, 0, z0 - 5.05]} rotation={[0, Math.PI / 2, 0]} scale={0.95} />
      <Model name="DiffuseTransmissionPlant" position={[2.85, 0, z0 - 1.4]} scale={1.25} />
      <Bookshelf x={W / 2 - 0.2} z={z0 - 3.9} rot={-Math.PI / 2} />
      <NightWindow z={z0 - 1.9} />

      {/* ROOM 1 · about / study */}
      <Rug x={0.9} z={z1 - 3.6} w={3} d={2.2} colors={["#3F4A3A", "#B9B08A", "#262E24"]} />
      <Plaque p={[0.15, 1.62, zBack(1) + 0.1]} label="FRAMED" title="IEEE paper" />
      <Plaque p={[1.05, 1.62, zBack(1) + 0.1]} label="SHIPPED" title="Costiq v1" />
      <Plaque p={[2.3, 1.75, zBack(1) + 0.1]} label="SINCE 2025" title="SDE I, OneCap" w={0.9} h={0.6} />
      <Table x={1.1} z={zBack(1) + 0.55} w={1.7} d={0.7} h={0.76} />
      <Model name="WaterBottle" position={[0.45, 0.76 + 0.13, zBack(1) + 0.5]} scale={1} />
      <Model name="SheenChair" position={[1.1, 0, zBack(1) + 1.35]} rotation={[0, Math.PI, 0]} scale={1.05} />
      <Model name="AnisotropyBarnLamp" position={[1.1, 2.55, zBack(1) + 0.08]} scale={1.8} />
      <Model name="AntiqueCamera" position={[-2.7, 0, z1 - 1.6]} rotation={[0, 0.9, 0]} scale={0.2} />
      <Model name="DiffuseTransmissionPlant" position={[2.9, 0, z1 - 1.3]} scale={1.1} />

      {/* ROOM 2 · workshop */}
      <Table x={-1.1} z={zBack(2) + 0.45} w={3.6} d={0.7} h={0.92} top="#8A6A48" legs="#33302C" />
      <Box p={[-1.1, 0.25, zBack(2) + 0.45]} s={[3.4, 0.03, 0.6]} c="#5E4A36" />
      <Model name="BoomBox" position={[-2.4, 0.92 + 0.22, zBack(2) + 0.45]} rotation={[0, 0.3, 0]} scale={22} />
      <Model name="WaterBottle" position={[0.3, 0.92 + 0.13, zBack(2) + 0.4]} scale={1} />
      <Model name="ChairDamaskPurplegold" position={[-0.9, 0, zBack(2) + 1.55]} rotation={[0, Math.PI + 0.25, 0]} scale={1.05} />
      <Model name="DiffuseTransmissionPlant" position={[-2.95, 0, z2 - 1.2]} scale={1} />

      {/* ROOM 3 · post room */}
      <Mural z={zBack(3)} />
      <PostBox x={-2.55} z={zBack(3) + 1.0} />
      <Table x={1.7} z={zBack(3) + 0.6} w={1.4} d={0.65} h={0.76} />
      <Envelopes x={1.6} y={0.76} z={zBack(3) + 0.6} />
      <Model name="SheenChair" position={[1.7, 0, zBack(3) + 1.4]} rotation={[0, Math.PI - 0.2, 0]} scale={1.05} />
      <Model name="AnisotropyBarnLamp" position={[1.7, 2.55, zBack(3) + 0.08]} scale={1.8} />
      <Model name="DiffuseTransmissionPlant" position={[2.9, 0, z3 - 1.3]} scale={1.2} />
      <Rug x={0} z={z3 - 3.4} w={3.2} d={2.2} colors={["#2F3A4A", "#D9B98A", "#1E2530"]} />
    </group>
  );
}

export { ROOM_LOOK, H };
