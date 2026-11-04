"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTexture, rng, FONT_MONO, FONT_SERIF, FONT_SANS } from "./textures";
import { TIMELINE } from "@/lib/content";

export const WOOD = "#7A5A40";
export const WOOD_DARK = "#4E3828";
type V3 = [number, number, number];

export function Box({ p, s, c, rough = 0.6, metal = 0, r }: { p: V3; s: V3; c: string; rough?: number; metal?: number; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  );
}

export function Table({ x, z, w, d, h, top = WOOD, legs = WOOD_DARK, rot = 0 }: { x: number; z: number; w: number; d: number; h: number; top?: string; legs?: string; rot?: number }) {
  const lx = w / 2 - 0.06, lz = d / 2 - 0.06;
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <Box p={[0, h - 0.025, 0]} s={[w, 0.05, d]} c={top} rough={0.45} />
      {[[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].map(([a, b], i) => (
        <Box key={i} p={[a, (h - 0.05) / 2, b]} s={[0.045, h - 0.05, 0.045]} c={legs} />
      ))}
    </group>
  );
}

export function Rug({ x, z, w, d, colors, rot = 0 }: { x: number; z: number; w: number; d: number; colors: [string, string, string]; rot?: number }) {
  const tex = useMemo(() => canvasTexture(512, Math.round(512 * (d / w)), (ctx, cw, ch) => {
    const [a, b, c] = colors;
    ctx.fillStyle = a; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = b; ctx.lineWidth = 14; ctx.strokeRect(22, 22, cw - 44, ch - 44);
    ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.strokeRect(46, 46, cw - 92, ch - 92);
    const r = rng(5);
    for (let i = 0; i < 9000; i++) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.06})`; ctx.fillRect(r() * cw, r() * ch, 2, 2); }
  }), [w, d, colors]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, rot]} position={[x, 0.006, z]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

/** Stack of closed books lying flat. */
export function BookStack({ p, seed = 3, n = 3, r = 0 }: { p: V3; seed?: number; n?: number; r?: number }) {
  const books = useMemo(() => {
    const rr = rng(seed), pal = ["#6B3A2E", "#2F4A5A", "#C9B48A", "#3E5A3A", "#1F2328", "#8A6A3A"];
    let y = 0;
    return Array.from({ length: n }, () => {
      const h = 0.025 + rr() * 0.02, w = 0.17 + rr() * 0.06, d = 0.23 + rr() * 0.05;
      const b = { y: y + h / 2, w, h, d, c: pal[Math.floor(rr() * pal.length)], a: (rr() - 0.5) * 0.3 };
      y += h;
      return b;
    });
  }, [seed, n]);
  return (
    <group position={p} rotation-y={r}>
      {books.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation-y={b.a} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function Bookshelf({ p, rot, seed = 7, w = 1.1 }: { p: V3; rot: number; seed?: number; w?: number }) {
  const books = useMemo(() => {
    const r = rng(seed), pal = ["#6B3A2E", "#2F4A5A", "#8A6A3A", "#3E5A3A", "#5A3550", "#A08A6A", "#2A2A2A", "#7A4A2A", "#C9B48A"];
    const out: { x: number; y: number; w: number; h: number; c: string; tilt: number }[] = [];
    [0.08, 0.5, 0.92, 1.34, 1.76].forEach((y) => {
      let bx = -w / 2 + 0.05;
      while (bx < w / 2 - 0.07) {
        const bw = 0.03 + r() * 0.035, h = 0.26 + r() * 0.1;
        if (r() < 0.1) { bx += 0.09; continue; }
        out.push({ x: bx + bw / 2, y: y + h / 2, w: bw, h, c: pal[Math.floor(r() * pal.length)], tilt: r() < 0.06 ? 0.2 : 0 });
        bx += bw + 0.004;
      }
    });
    return out;
  }, [seed, w]);
  return (
    <group position={p} rotation-y={rot}>
      <Box p={[0, 1.05, -0.17]} s={[w, 2.1, 0.03]} c={WOOD_DARK} />
      {[-w / 2 + 0.015, w / 2 - 0.015].map((a) => <Box key={a} p={[a, 1.05, 0]} s={[0.03, 2.1, 0.36]} c={WOOD} />)}
      {[0.06, 0.48, 0.9, 1.32, 1.74, 2.1].map((y) => <Box key={y} p={[0, y, 0]} s={[w - 0.02, 0.025, 0.36]} c={WOOD} />)}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.02]} rotation-z={b.tilt} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, 0.24]} />
          <meshStandardMaterial color={b.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Framed print: mono label + serif title on a cream mat. */
export function Plaque({ p, r = 0, label, title, w = 0.62, h = 0.44 }: { p: V3; r?: number; label: string; title: string; w?: number; h?: number }) {
  const tex = useMemo(() => canvasTexture(512, Math.round(512 * (h / w)), (ctx, cw, ch) => {
    ctx.fillStyle = "#EFE8D6"; ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#CDBF9F"; ctx.lineWidth = 3; ctx.strokeRect(26, 26, cw - 52, ch - 52);
    ctx.textAlign = "center";
    ctx.fillStyle = "#6A5C45"; ctx.font = `500 24px ${FONT_MONO}`;
    ctx.fillText(label.split("").join(" "), cw / 2, ch * 0.4);
    ctx.fillStyle = "#1A1714"; ctx.font = `italic ${Math.round(64 * Math.min(1, 6.5 / Math.max(6.5, title.length * 0.55)))}px ${FONT_SERIF}`;
    ctx.fillText(title, cw / 2, ch * 0.68);
  }), [label, title, w, h]);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0, 0]} s={[w + 0.08, h + 0.08, 0.04]} c="#5B4632" rough={0.5} />
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Abstract print, generated so it stays the same on every visit. */
export function ArtPrint({ p, r = 0, w = 1.0, h = 0.7, seed = 2, palette }: { p: V3; r?: number; w?: number; h?: number; seed?: number; palette: string[] }) {
  const tex = useMemo(() => canvasTexture(512, Math.round(512 * (h / w)), (ctx, cw, ch) => {
    const rr = rng(seed);
    ctx.fillStyle = palette[0]; ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = palette[1 + (i % (palette.length - 1))];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      if (rr() < 0.5) ctx.arc(rr() * cw, rr() * ch, 30 + rr() * 110, 0, Math.PI * 2);
      else ctx.rect(rr() * cw * 0.8, rr() * ch * 0.8, 40 + rr() * 160, 20 + rr() * 120);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }), [w, h, seed, palette]);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0, 0]} s={[w + 0.06, h + 0.06, 0.035]} c="#1C1A18" rough={0.4} />
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[w - 0.08, h - 0.08]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A framed CV poster for the reading-corner wall. */
export function CvPoster({ p, r = 0 }: { p: V3; r?: number }) {
  const w = 0.78, h = 1.02;
  const tex = useMemo(() => canvasTexture(512, 670, (ctx, cw, ch) => {
    ctx.fillStyle = "#F2ECDD"; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#141210"; ctx.font = `800 54px ${FONT_SANS}`; ctx.fillText("Shashank", 40, 92);
    ctx.fillStyle = "#4F7A1F"; ctx.font = `italic 44px ${FONT_SERIF}`; ctx.fillText("the path so far", 40, 140);
    let y = 210;
    for (const t of TIMELINE) {
      ctx.fillStyle = "#7A6A50"; ctx.font = `500 20px ${FONT_MONO}`; ctx.fillText(t.when, 40, y);
      ctx.fillStyle = "#141210"; ctx.font = `700 26px ${FONT_SANS}`; ctx.fillText(t.what, 40, y + 34);
      ctx.fillStyle = "#5A5042"; ctx.font = `400 22px ${FONT_SANS}`; ctx.fillText(t.where, 40, y + 64);
      ctx.fillStyle = "#D7CCB4"; ctx.fillRect(40, y + 86, cw - 80, 2);
      y += 112;
    }
  }), []);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0, 0]} s={[w + 0.06, h + 0.06, 0.03]} c="#2A2622" rough={0.4} />
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Soft curtain: a plane rippled along its width. */
export function Curtain({ p, r = 0, w = 0.6, h = 2.5, color = "#C9B79A" }: { p: V3; r?: number; w?: number; h?: number; color?: string }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 48, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / w) * Math.PI * 7) * 0.035);
    g.computeVertexNormals();
    return g;
  }, [w, h]);
  return (
    <mesh geometry={geo} position={p} rotation-y={r} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Low media console under the name sign. */
export function Console({ p, w = 2.6 }: { p: V3; w?: number }) {
  return (
    <group position={p}>
      <Box p={[0, 0.26, 0]} s={[w, 0.42, 0.42]} c="#5A4230" rough={0.5} />
      {[-w / 3, 0, w / 3].map((x) => <Box key={x} p={[x, 0.27, 0.212]} s={[w / 3 - 0.04, 0.36, 0.01]} c="#4A3626" rough={0.55} />)}
      {[-w / 3, 0, w / 3].map((x) => <Box key={x + 9} p={[x, 0.3, 0.222]} s={[0.12, 0.015, 0.012]} c="#C9A86A" metal={1} rough={0.3} />)}
      {[-w / 2 + 0.08, w / 2 - 0.08].map((x) => [-0.15, 0.15].map((z) => <Box key={`${x}${z}`} p={[x, 0.025, z]} s={[0.04, 0.05, 0.04]} c="#2A1F16" />))}
    </group>
  );
}

/** Ceramic mug made from a lathe profile, with a torus handle. */
export function Mug({ p, color = "#E9E2D0" }: { p: V3; color?: string }) {
  const geo = useMemo(() => {
    const pts = [[0, 0], [0.04, 0], [0.042, 0.005], [0.042, 0.1], [0.038, 0.1], [0.038, 0.008], [0, 0.008]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return (
    <group position={p}>
      <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial color={color} roughness={0.3} /></mesh>
      <mesh position={[0.05, 0.052, 0]} castShadow><torusGeometry args={[0.025, 0.007, 10, 20]} /><meshStandardMaterial color={color} roughness={0.3} /></mesh>
      <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.037, 24]} /><meshStandardMaterial color="#3B2416" roughness={0.2} /></mesh>
    </group>
  );
}

function codeScreen(lines: [string, string][], title: string) {
  return canvasTexture(1024, 600, (ctx, w, h) => {
    ctx.fillStyle = "#0E1014"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#171A20"; ctx.fillRect(0, 0, w, 44);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(26 + i * 24, 22, 7, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#8A8F98"; ctx.font = `400 20px ${FONT_MONO}`; ctx.fillText(title, 110, 29);
    ctx.font = `400 25px ${FONT_MONO}`;
    lines.forEach(([txt, col], i) => {
      ctx.fillStyle = "#3E434C"; ctx.fillText(String(i + 1).padStart(2, " "), 22, 92 + i * 36);
      ctx.fillStyle = col; ctx.fillText(txt, 72, 92 + i * 36);
    });
    ctx.fillStyle = "#C8FF5A"; ctx.fillRect(72 + 14 * 15, 92 + (lines.length - 1) * 36 - 22, 13, 28);
  });
}

/** Desktop monitor showing a small "about me" object in TypeScript. */
export function Monitor({ p, r = 0 }: { p: V3; r?: number }) {
  const tex = useMemo(() => codeScreen([
    ["const shashank = {", "#E6E1D6"],
    ['  role: "Full-stack engineer",', "#A8D8FF"],
    ['  based: "Bengaluru, India",', "#A8D8FF"],
    ['  now: "SDE I @ OneCap",', "#A8D8FF"],
    ['  builds: ["frontends", "APIs", "AI agents"],', "#C8FF5A"],
    ['  email: "shashankhosamani1109@gmail.com",', "#FFC98A"],
    ["  openToWork: true,", "#FF9DB0"],
    ["};", "#E6E1D6"],
    ["", "#E6E1D6"],
    ["say(\"hi\");", "#E6E1D6"],
  ], "contact.ts"), []);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0.01, 0]} s={[0.26, 0.02, 0.18]} c="#1E1F22" metal={0.6} rough={0.4} />
      <Box p={[0, 0.17, -0.03]} s={[0.05, 0.32, 0.03]} c="#1E1F22" metal={0.6} rough={0.4} />
      <Box p={[0, 0.42, 0]} s={[0.86, 0.52, 0.035]} c="#141518" metal={0.4} rough={0.35} />
      <mesh position={[0, 0.425, 0.019]}>
        <planeGeometry args={[0.82, 0.48]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} toneMapped={false} roughness={0.75} />
      </mesh>
    </group>
  );
}

export function Laptop({ p, r = 0 }: { p: V3; r?: number }) {
  const tex = useMemo(() => codeScreen([
    ["$ git push origin main", "#E6E1D6"],
    ["✓ 42 tests passed", "#C8FF5A"],
    ["$ npm run deploy", "#E6E1D6"],
    ["▲ deployed in 38s", "#A8D8FF"],
    ["$ _", "#E6E1D6"],
  ], "zsh"), []);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0.009, 0]} s={[0.34, 0.018, 0.23]} c="#B9BCC2" metal={0.8} rough={0.35} />
      <Box p={[0, 0.019, 0.02]} s={[0.29, 0.002, 0.1]} c="#2A2C30" />
      <group position={[0, 0.018, -0.112]} rotation-x={-0.32}>
        <Box p={[0, 0.115, 0]} s={[0.34, 0.23, 0.01]} c="#B9BCC2" metal={0.8} rough={0.35} />
        <mesh position={[0, 0.115, 0.0055]}>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function Keyboard({ p, r = 0 }: { p: V3; r?: number }) {
  const keys = useMemo(() => {
    const out: V3[] = [];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 12; i++) out.push([-0.165 + i * 0.03, 0.017, -0.045 + row * 0.03]);
    return out;
  }, []);
  return (
    <group position={p} rotation-y={r}>
      <Box p={[0, 0.008, 0]} s={[0.38, 0.016, 0.13]} c="#2A2B2E" rough={0.5} />
      {keys.map((k, i) => <Box key={i} p={k} s={[0.025, 0.01, 0.025]} c={i === 46 ? "#C8FF5A" : "#E9E5DC"} rough={0.6} />)}
    </group>
  );
}

/** Wall shelf of storage bins, each labelled with a skill. */
export function SkillBins({ p, r = 0, skills }: { p: V3; r?: number; skills: string[] }) {
  const cols = 4, rows = Math.ceil(skills.length / cols);
  const colors = ["#C8B48E", "#A9C4D0", "#C8FF5A", "#D8B98A"];
  const labels = useMemo(() => skills.map((s) => canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = "#F3EEE3"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#141210"; ctx.font = `600 ${s.length > 9 ? 30 : 38}px ${FONT_MONO}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(s, w / 2, h / 2 + 2);
  })), [skills]);
  const bw = 0.36, bh = 0.22, gap = 0.05;
  const W = cols * (bw + gap) + gap;
  return (
    <group position={p} rotation-y={r}>
      {Array.from({ length: rows + 1 }, (_, i) => <Box key={i} p={[0, i * (bh + 0.06), 0]} s={[W, 0.03, 0.34]} c={WOOD} />)}
      {[-W / 2, W / 2].map((x) => <Box key={x} p={[x, (rows * (bh + 0.06)) / 2, 0]} s={[0.03, rows * (bh + 0.06) + 0.03, 0.34]} c={WOOD} />)}
      {skills.map((s, i) => {
        const cx = -W / 2 + gap + bw / 2 + (i % cols) * (bw + gap);
        const cy = (rows - 1 - Math.floor(i / cols)) * (bh + 0.06) + 0.015 + bh / 2;
        return (
          <group key={s} position={[cx, cy, 0.02]}>
            <Box p={[0, 0, 0]} s={[bw, bh, 0.28]} c={colors[i % colors.length]} rough={0.7} />
            <mesh position={[0, 0.01, 0.141]}>
              <planeGeometry args={[0.24, 0.09]} />
              <meshStandardMaterial map={labels[i]} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Adjustable desk lamp with a warm bulb. */
export function DeskLamp({ p, r = 0 }: { p: V3; r?: number }) {
  return (
    <group position={p} rotation-y={r}>
      <mesh position={[0, 0.012, 0]} castShadow><cylinderGeometry args={[0.07, 0.08, 0.024, 24]} /><meshStandardMaterial color="#1E1F22" metalness={0.7} roughness={0.35} /></mesh>
      <group rotation-z={-0.35}>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.008, 0.008, 0.4, 8]} /><meshStandardMaterial color="#1E1F22" metalness={0.7} roughness={0.35} /></mesh>
        <group position={[0, 0.4, 0]} rotation-z={1.6}>
          <mesh position={[0, 0.15, 0]} castShadow><cylinderGeometry args={[0.008, 0.008, 0.3, 8]} /><meshStandardMaterial color="#1E1F22" metalness={0.7} roughness={0.35} /></mesh>
          <group position={[0, 0.3, 0]} rotation-z={-0.9}>
            <mesh castShadow><coneGeometry args={[0.07, 0.12, 24, 1, true]} /><meshStandardMaterial color="#C8FF5A" roughness={0.4} side={THREE.DoubleSide} /></mesh>
            <mesh position={[0, -0.02, 0]}><sphereGeometry args={[0.025, 12, 8]} /><meshStandardMaterial color="#FFF4D6" emissive="#FFD9A0" emissiveIntensity={5} toneMapped={false} /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
