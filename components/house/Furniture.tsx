"use client";
import { useMemo } from "react";
import { Model } from "./Model";
import { W, zBack, zFront } from "./Shell";
import { canvasTexture, rng, FONT_SERIF, FONT_SANS } from "./textures";
import { Box, Table, Rug, BookStack, Bookshelf, Plaque, ArtPrint, CvPoster, Curtain, Console, Mug, Monitor, Laptop, Keyboard, SkillBins, DeskLamp } from "./Props";
import { STACK } from "@/lib/content";

const R = Math.PI / 2;

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

/** "Let's make something." painted above the studio desk. */
function Mural({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  const tex = useMemo(() => canvasTexture(1024, 400, (ctx, w) => {
    ctx.clearRect(0, 0, w, 400);
    ctx.fillStyle = "#F3E9DD"; ctx.font = `800 150px ${FONT_SANS}`;
    ctx.fillText("Let's make", 30, 160);
    ctx.fillStyle = "#C8F25A"; ctx.font = `italic 170px ${FONT_SERIF}`;
    ctx.fillText("something.", 40, 340);
  }), []);
  return (
    <mesh position={p} rotation-y={r}>
      <planeGeometry args={[2.5, 0.98]} />
      <meshStandardMaterial map={tex} transparent roughness={0.9} />
    </mesh>
  );
}

export function Furniture() {
  const L0 = zFront(0), S = zBack(1);
  return (
    <group>
      {/* ───── LIVING ROOM ───── */}
      {/* back wall: name sign (Home.tsx) over a media console */}
      <Console p={[-0.75, 0, zBack(0) + 0.3]} w={2.4} />
      <Model name="BoomBox" position={[-1.6, 0.47 + 0.22, zBack(0) + 0.3]} rotation={[0, 0.25, 0]} scale={22} />
      <BookStack p={[-0.55, 0.47, zBack(0) + 0.3]} seed={4} n={4} r={0.3} />
      <Model name="ToyCar" position={[0.1, 0.47 + 0.04, zBack(0) + 0.3]} rotation={[0, -0.6, 0]} scale={2.4} />
      <Model name="DiffuseTransmissionPlant" position={[-2.6, 0, zBack(0) + 0.45]} scale={1.3} />

      {/* left wall: window with curtains, sofa, art, floor lamp */}
      <NightWindow z={L0 - 1.6} />
      <Curtain p={[-W / 2 + 0.14, 1.6, L0 - 0.72]} r={R} w={0.5} h={2.7} />
      <Curtain p={[-W / 2 + 0.14, 1.6, L0 - 2.48]} r={R} w={0.5} h={2.7} />
      <Box p={[-W / 2 + 0.16, 2.98, L0 - 1.6]} s={[0.03, 0.03, 2.3]} c="#2A2622" metal={0.8} rough={0.3} />
      <Model name="GlamVelvetSofa" position={[-2.95, 0, L0 - 3.5]} rotation={[0, R, 0]} scale={1.05} />
      <ArtPrint p={[-W / 2 + 0.1, 1.85, L0 - 3.5]} r={R} w={1.3} h={0.8} seed={9} palette={["#E9E1CF", "#B5684D", "#2F4A5A", "#C9A27A", "#1F2328"]} />
      <Model name="LightsPunctualLamp" position={[-3.0, 0, L0 - 4.9]} rotation={[0, R, 0]} scale={0.95} />

      {/* middle: rug and coffee table */}
      <Rug x={-1.2} z={L0 - 3.5} w={3.2} d={2.6} colors={["#7C3F2F", "#C9A27A", "#3B231B"]} />
      <Table x={-1.45} z={L0 - 3.5} w={0.65} d={1.15} h={0.42} />
      <Model name="GlassVaseFlowers" position={[-1.47, 0.42, L0 - 3.05]} scale={1.4} />
      <BookStack p={[-1.45, 0.42, L0 - 3.5]} seed={8} n={3} />
      <Model name="IridescentDishWithOlives" position={[-1.45, 0.42, L0 - 3.92]} scale={0.55} />

      {/* right wall: reading corner — the About stop looks here */}
      <Bookshelf p={[W / 2 - 0.2, 0, L0 - 1.2]} rot={-R} seed={7} />
      <Bookshelf p={[W / 2 - 0.2, 0, L0 - 5.15]} rot={-R} seed={13} />
      <CvPoster p={[W / 2 - 0.09, 1.62, L0 - 3.2]} r={-R} />
      <Plaque p={[W / 2 - 0.1, 2.0, L0 - 2.25]} r={-R} label="FRAMED" title="IEEE paper" w={0.56} h={0.4} />
      <Plaque p={[W / 2 - 0.1, 1.38, L0 - 2.25]} r={-R} label="B.TECH CSE" title="PES · 8.27" w={0.56} h={0.4} />
      <Plaque p={[W / 2 - 0.1, 2.0, L0 - 4.15]} r={-R} label="SHIPPED" title="Costiq v1" w={0.56} h={0.4} />
      <Plaque p={[W / 2 - 0.1, 1.38, L0 - 4.15]} r={-R} label="SINCE 2025" title="SDE I, OneCap" w={0.56} h={0.4} />
      <Model name="AnisotropyBarnLamp" position={[W / 2 - 0.08, 2.55, L0 - 3.2]} rotation={[0, -R, 0]} scale={1.6} />
      <Model name="SheenChair" position={[2.55, 0, L0 - 3.2]} rotation={[0, -R, 0]} scale={1.05} />
      <Table x={2.75} z={L0 - 2.3} w={0.45} d={0.45} h={0.55} />
      <Model name="DiffuseTransmissionTeacup" position={[2.72, 0.55, L0 - 2.25]} scale={1} />
      <BookStack p={[2.8, 0.55, L0 - 2.42]} seed={21} n={2} />
      <Rug x={2.2} z={L0 - 3.2} w={1.6} d={2.2} colors={["#3F4A3A", "#B9B08A", "#262E24"]} />
      <Model name="AntiqueCamera" position={[2.55, 0, L0 - 0.75]} rotation={[0, -2.3, 0]} scale={0.2} />

      {/* ───── STUDIO ───── */}
      {/* back wall: project pegboard (ProjectCards.tsx) over a workbench, skill bins to the right */}
      <Table x={-1.1} z={S + 0.45} w={3.6} d={0.7} h={0.92} top="#8A6A48" legs="#33302C" />
      <Box p={[-1.1, 0.25, S + 0.45]} s={[3.4, 0.03, 0.6]} c="#5E4A36" />
      <DeskLamp p={[-2.6, 0.92, S + 0.4]} r={0.4} />
      <Model name="WaterBottle" position={[0.3, 0.92 + 0.13, S + 0.4]} scale={1} />
      <BookStack p={[-0.4, 0.92, S + 0.42]} seed={30} n={3} r={-0.2} />
      <Box p={[-1.6, 0.98, S + 0.42]} s={[0.42, 0.12, 0.22]} c="#A3271D" rough={0.4} metal={0.3} />
      <Box p={[-1.6, 1.05, S + 0.42]} s={[0.2, 0.02, 0.04]} c="#1A1A1A" />
      <BookStack p={[-1.1, 0.25, S + 0.45]} seed={31} n={4} />
      <Model name="ChairDamaskPurplegold" position={[-0.9, 0, S + 1.55]} rotation={[0, Math.PI + 0.25, 0]} scale={1.05} />
      <SkillBins p={[2.3, 0.95, S + 0.2]} skills={STACK} />

      {/* left wall: the contact desk */}
      <Mural p={[-W / 2 + 0.09, 2.3, zFront(1) - 3.2]} r={R} />
      <Table x={-3.08} z={zFront(1) - 3.2} w={0.75} d={1.9} h={0.76} />
      <Monitor p={[-3.22, 0.76, zFront(1) - 3.25]} r={R} />
      <Keyboard p={[-2.92, 0.76, zFront(1) - 3.25]} r={R} />
      <Laptop p={[-3.05, 0.76, zFront(1) - 2.55]} r={R + 0.35} />
      <Mug p={[-2.9, 0.76, zFront(1) - 3.8]} color="#C8FF5A" />
      <DeskLamp p={[-3.25, 0.76, zFront(1) - 3.95]} r={-R} />
      <Model name="SheenChair" position={[-2.3, 0, zFront(1) - 3.2]} rotation={[0, -R, 0]} scale={1.05} />
      <PostBox x={-3.0} z={zFront(1) - 1.0} />
      <Model name="DiffuseTransmissionPlant" position={[-3.0, 0, S + 0.6]} scale={1.15} />
      <Rug x={-2.3} z={zFront(1) - 3.2} w={2.0} d={2.4} colors={["#2F3A4A", "#D9B98A", "#1E2530"]} />

      {/* right wall: leather sofa for visitors */}
      <Model name="SheenWoodLeatherSofa" position={[2.95, 0, zFront(1) - 2.7]} rotation={[0, -R, 0]} scale={1} />
      <ArtPrint p={[W / 2 - 0.1, 1.95, zFront(1) - 2.7]} r={-R} w={1.5} h={0.9} seed={17} palette={["#1F2328", "#C8FF5A", "#A9C4D0", "#E9E1CF", "#5A3550"]} />
    </group>
  );
}
