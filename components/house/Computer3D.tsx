"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";
import { PROJECTS } from "@/lib/content";
import { useHouse, type Computer } from "@/lib/store";
import { canvasTexture, drawSvg, FONT_MONO, FONT_SANS } from "./textures";
import { Box } from "./Props";
import { screens } from "./screens";

/** The desktop the monitor shows before you sit down: same wallpaper and icons as the real one. */
function desktopTexture() {
  const tex = canvasTexture(1280, 720, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.7, h * 0.2, 40, w * 0.5, h * 0.6, w * 0.8);
    g.addColorStop(0, "#2B3A1A"); g.addColorStop(0.45, "#141A14"); g.addColorStop(1, "#08090A");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(10,10,10,.75)"; ctx.fillRect(0, 0, w, 38);
    ctx.fillStyle = "#ECE9E2"; ctx.font = `600 20px ${FONT_SANS}`; ctx.fillText("ShashankOS", 22, 26);
    ctx.fillStyle = "#A9A49B"; ctx.font = `400 18px ${FONT_MONO}`; ctx.fillText("Projects", 170, 26);
    ctx.textAlign = "center";
    PROJECTS.forEach((p, i) => {
      const x = 90 + i * 150, y = 110;
      ctx.fillStyle = "#1A1A1C"; ctx.fillRect(x - 52, y, 104, 70);
      ctx.fillStyle = "#ECE9E2"; ctx.font = `600 17px ${FONT_SANS}`;
      const words = p.title.split(" ");
      ctx.fillText(words.slice(0, 2).join(" "), x, y + 100);
      if (words.length > 2) ctx.fillText(words.slice(2).join(" "), x, y + 122);
    });
    [["Terminal", ">_"], ["Mail", "@"], ["Skills", "{ }"], ["Resume.pdf", "PDF"]].forEach(([label, glyph], i) => {
      const x = 90 + i * 150, y = 290;
      ctx.fillStyle = "#ECE5D3"; ctx.beginPath(); ctx.roundRect(x - 36, y, 72, 72, 16); ctx.fill();
      ctx.fillStyle = "#141210"; ctx.font = `700 24px ${FONT_MONO}`; ctx.fillText(glyph, x, y + 45);
      ctx.fillStyle = "#ECE9E2"; ctx.font = `600 17px ${FONT_SANS}`; ctx.fillText(label, x, y + 100);
    });
    // big "click to open" pill
    ctx.fillStyle = "#C8FF5A"; ctx.beginPath(); ctx.roundRect(w / 2 - 170, h - 150, 340, 64, 32); ctx.fill();
    ctx.fillStyle = "#0A0A0A"; ctx.font = `700 26px ${FONT_SANS}`; ctx.fillText("Click to sit down  →", w / 2, h - 108);
    ctx.fillStyle = "rgba(236,233,226,.12)"; ctx.beginPath(); ctx.roundRect(w / 2 - 220, h - 64, 440, 50, 14); ctx.fill();
  });
  PROJECTS.forEach((p, i) => drawSvg(tex, p.thumb, 90 + i * 150 - 52, 110, 104, 70));
  return tex;
}

function terminalTexture() {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = "#0E1014"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#171A20"; ctx.fillRect(0, 0, w, 48);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(28 + i * 26, 24, 8, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#8A8F98"; ctx.font = `400 22px ${FONT_MONO}`; ctx.fillText("mail — shashank", 120, 32);
    ctx.font = `400 30px ${FONT_MONO}`;
    [["$ contact --me", "#E6E1D6"], ["shashankhosamani1109@gmail.com", "#C8FF5A"], ["github.com/Shashankhosamani", "#A8D8FF"], ["linkedin.com/in/shashank-l-h", "#A8D8FF"], ["", ""], ["Click to say hi →", "#FFC98A"]].forEach(([t, c], i) => {
      ctx.fillStyle = c; ctx.fillText(t, 40, 110 + i * 54);
    });
  });
}

/** A screen you can click to sit down at. Registers itself so the camera can zoom into it. */
function Screen({ kind, w, h, tex }: { kind: Computer; w: number; h: number; tex: THREE.Texture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const open = useHouse((s) => s.openComputer);
  useEffect(() => {
    if (mesh.current) screens[kind] = mesh.current;
    return () => { delete screens[kind]; };
  }, [kind]);
  useFrame((state, dt) => {
    if (!mat.current) return;
    const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, hover ? 1.15 : pulse, 10, dt);
  });
  return (
    <mesh ref={mesh}
      onClick={(e) => { e.stopPropagation(); open(kind); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
      onPointerOut={() => setHover(false)}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial ref={mat} map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.8} toneMapped={false} roughness={0.75} />
    </mesh>
  );
}

/** Big monitor on the studio workstation. Its screen holds the projects. */
export function Workstation({ p, r = 0 }: { p: [number, number, number]; r?: number }) {
  const tex = useMemo(desktopTexture, []);
  const W = 1.12, H = 0.63;
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0.012, 0]} s={[0.34, 0.024, 0.22]} c="#1E1F22" metal={0.6} rough={0.4} />
      <Box p={[0, 0.2, -0.05]} s={[0.06, 0.38, 0.035]} c="#1E1F22" metal={0.6} rough={0.4} />
      <Box p={[0, 0.5, -0.02]} s={[W + 0.04, H + 0.04, 0.04]} c="#141518" metal={0.4} rough={0.35} />
      <group position={[0, 0.5, 0.0015]}>
        <Screen kind="monitor" w={W} h={H} tex={tex} />
      </group>
    </group>
  );
}

/** Laptop on the contact desk. Its screen opens the same computer, starting in Mail. */
export function OpenLaptop({ p, r = 0, scale = 1 }: { p: [number, number, number]; r?: number; scale?: number }) {
  const tex = useMemo(terminalTexture, []);
  return (
    <group position={p} rotation-y={r} scale={scale}>
      <Box p={[0, 0.009, 0]} s={[0.34, 0.018, 0.23]} c="#B9BCC2" metal={0.8} rough={0.35} />
      <Box p={[0, 0.019, 0.02]} s={[0.29, 0.002, 0.1]} c="#2A2C30" />
      <group position={[0, 0.018, -0.112]} rotation-x={-0.3}>
        <Box p={[0, 0.115, 0]} s={[0.34, 0.23, 0.01]} c="#B9BCC2" metal={0.8} rough={0.35} />
        <group position={[0, 0.115, 0.0056]}>
          <Screen kind="laptop" w={0.32} h={0.2} tex={tex} />
        </group>
      </group>
    </group>
  );
}
