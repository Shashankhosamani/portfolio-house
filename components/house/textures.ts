import * as THREE from "three";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTexture(w: number, h: number, draw: Draw, srgb = true) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Seeded random so the house looks the same on every visit. */
export function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/** Soft plaster: used as a bump map and a faint colour variation. */
export function plaster(seed = 1) {
  const r = rng(seed);
  const tex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 110 + r() * 40;
      ctx.fillStyle = `rgba(${v},${v},${v},${0.08 + r() * 0.12})`;
      const s = 2 + r() * 14;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, s, s * (0.4 + r()), r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, false);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export const FONT_SANS = "'Geist', 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO = "'Geist Mono', ui-monospace, Menlo, monospace";
export const FONT_SERIF = "'Instrument Serif', Georgia, serif";

/** Draw an SVG string onto a canvas texture once it has decoded. */
export function drawSvg(tex: THREE.CanvasTexture, svg: string, x: number, y: number, w: number, h: number) {
  const img = new Image();
  img.onload = () => {
    const ctx = (tex.image as HTMLCanvasElement).getContext("2d")!;
    ctx.drawImage(img, x, y, w, h);
    tex.needsUpdate = true;
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
