"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useHouse } from "@/lib/store";
import { use } from "@/lib/player";
import { Box } from "./Props";
import { canvasTexture, FONT_MONO } from "./textures";
import { spots } from "./screens";

const WARMUP = 0.8, FEED = 2.4; // seconds
const BODY = { w: 0.46, h: 0.2, d: 0.38 };
const PAPER = { w: 0.21, h: 0.297 }; // A4, metres

function lcd(text: string, color: string) {
  return canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#0B0F0A"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color; ctx.font = `600 30px ${FONT_MONO}`; ctx.textBaseline = "middle";
    ctx.fillText(text, 16, h / 2 + 2);
  });
}

/** Desktop laser printer. Click it to print the resume: the real first page rolls out into the tray. */
export function Printer({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const paper = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const screen = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const page = useTexture("textures/resume-page.jpg");
  page.colorSpace = THREE.SRGBColorSpace;
  page.anisotropy = 8;
  const screens = useMemo(() => ({ idle: lcd("READY", "#C8FF5A"), printing: lcd("PRINTING…", "#FFC98A"), done: lcd("DONE ✓", "#C8FF5A") }), []);

  useEffect(() => {
    if (group.current) spots.printer = group.current;
    return () => { delete spots.printer; };
  }, []);

  useFrame((state) => {
    const { printState, printAt, finishPrint } = useHouse.getState();
    const t = printState === "printing" ? (performance.now() - printAt) / 1000 : 0;
    // paper position: hidden inside the body, then out onto the tray in small line-by-line steps
    let e = printState === "done" ? 1 : 0;
    if (printState === "printing") {
      const f = Math.min(1, Math.max(0, (t - WARMUP) / FEED));
      e = f + Math.sin(f * Math.PI * 28) * 0.006 * (1 - f);
      if (t > WARMUP + FEED + 0.15) finishPrint();
    }
    if (paper.current) {
      paper.current.visible = printState !== "idle";
      paper.current.position.z = THREE.MathUtils.lerp(-0.12, BODY.d / 2 + 0.07, e);
      paper.current.position.y = BODY.h * 0.62 - e * 0.008;
      paper.current.rotation.x = -e * 0.12;
    }
    if (body.current) body.current.position.y = printState === "printing" && t > WARMUP ? Math.sin(state.clock.elapsedTime * 90) * 0.0012 : 0;
    if (led.current) {
      const on = printState === "printing" ? (Math.sin(state.clock.elapsedTime * 10) > 0 ? 1 : 0.2) : 1;
      led.current.emissiveIntensity = (hover ? 3 : 2) * on;
    }
    if (screen.current) {
      const want = screens[printState];
      if (screen.current.map !== want) { screen.current.map = want; screen.current.needsUpdate = true; }
    }
  });

  const shell = "#E4E1DA", dark = "#2A2B2E";
  return (
    <group ref={group} position={p} rotation-y={r}>
      <group ref={body}
        onClick={(e) => { e.stopPropagation(); use("printer"); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}>
        {/* main body: lower chassis, darker top lid */}
        <Box p={[0, BODY.h * 0.4, 0]} s={[BODY.w, BODY.h * 0.8, BODY.d]} c={shell} rough={0.45} />
        <Box p={[0, BODY.h * 0.9, -0.02]} s={[BODY.w, BODY.h * 0.2, BODY.d - 0.04]} c={dark} rough={0.35} />
        {/* output slot and tray */}
        <Box p={[0, BODY.h * 0.62, BODY.d / 2 + 0.001]} s={[0.26, 0.012, 0.004]} c="#111" />
        <Box p={[0, BODY.h * 0.5, BODY.d / 2 + 0.11]} s={[0.25, 0.008, 0.22]} r={[-0.12, 0, 0]} c={shell} rough={0.5} />
        {/* paper input tray at the back with a stack of blank sheets */}
        <group position={[0, BODY.h, -BODY.d / 2 + 0.02]} rotation-x={-0.55}>
          <Box p={[0, 0.11, -0.01]} s={[0.25, 0.22, 0.008]} c={shell} rough={0.5} />
          <Box p={[0, 0.12, 0.006]} s={[0.215, 0.2, 0.012]} c="#FAFAF7" rough={0.95} />
        </group>
        {/* control panel: LCD + status light + button */}
        <group position={[BODY.w / 2 - 0.09, BODY.h * 0.8 + 0.001, BODY.d / 2 - 0.05]} rotation-x={-Math.PI / 2 + 0.35}>
          <Box p={[0, 0, 0]} s={[0.15, 0.07, 0.01]} c={dark} />
          <mesh position={[-0.015, 0, 0.0055]}>
            <planeGeometry args={[0.09, 0.024]} />
            <meshBasicMaterial ref={screen} map={screens.idle} toneMapped={false} />
          </mesh>
          <mesh position={[0.05, 0.012, 0.007]}>
            <sphereGeometry args={[0.006, 12, 8]} />
            <meshStandardMaterial ref={led} color="#C8FF5A" emissive="#C8FF5A" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh position={[0.05, -0.014, 0.006]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.008, 0.008, 0.004, 16]} />
            <meshStandardMaterial color="#C8FF5A" roughness={0.4} />
          </mesh>
        </group>
        {/* brand plate */}
        <Box p={[-BODY.w / 2 + 0.07, BODY.h * 0.3, BODY.d / 2 + 0.001]} s={[0.08, 0.012, 0.002]} c="#9A968E" metal={0.6} rough={0.3} />
      </group>

      {/* the printed page: lies flat, top edge leaves the printer first */}
      <group ref={paper} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI]} castShadow receiveShadow>
          <planeGeometry args={[PAPER.w, PAPER.h]} />
          <meshStandardMaterial map={page} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** Low cabinet the printer sits on, with a ream of paper. */
export function PrinterCabinet({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      <Box p={[0, 0.27, 0]} s={[1.3, 0.54, 0.5]} c="#3B3F45" rough={0.55} />
      {[-0.325, 0.325].map((x) => <Box key={x} p={[x, 0.27, 0.251]} s={[0.62, 0.48, 0.008]} c="#454A51" rough={0.5} />)}
      {[-0.06, 0.06].map((x) => <Box key={x} p={[x, 0.36, 0.26]} s={[0.012, 0.1, 0.014]} c="#C9A86A" metal={1} rough={0.3} />)}
      <Box p={[0.44, 0.54 + 0.03, -0.02]} s={[0.3, 0.06, 0.21]} c="#F3F0E8" rough={0.9} />
      <Box p={[0.44, 0.54 + 0.061, -0.02]} s={[0.3, 0.002, 0.08]} c="#3E6FA8" rough={0.6} />
    </group>
  );
}
