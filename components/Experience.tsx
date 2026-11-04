"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useProgress } from "@react-three/drei";
import { useHouse, walk, SEGS } from "@/lib/store";
import { ROOMS, STACK, TIMELINE, EMAIL, LINKS, CREDITS } from "@/lib/content";
import ComputerOS from "./os/Computer";

const Scene = dynamic(() => import("./house/Scene"), { ssr: false });

function useWalk() {
  // only re-render when the active room or "settled" state changes, not on every scroll pixel
  const snap = useSyncExternalStore(
    (cb) => useHouse.subscribe(cb),
    () => { const w = walk(useHouse.getState().progress); return `${w.k}|${w.active}|${w.settled ? 1 : 0}`; },
    () => "0|0|1",
  );
  const [k, active, settled] = snap.split("|").map(Number);
  return { k, active, settled: settled === 1 };
}

function goRoom(j: number) {
  const max = document.documentElement.scrollHeight - innerHeight;
  const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  scrollTo({ top: (j / SEGS) * max + 2, behavior: smooth ? "smooth" : "auto" });
}

function CopyEmail() {
  const [label, setLabel] = useState("Copy email");
  const ref = useRef<HTMLAnchorElement>(null);
  const done = (l: string) => { setLabel(l); setTimeout(() => setLabel("Copy email"), 1800); };
  return (
    <div className="mailrow">
      <a ref={ref} className="mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <button type="button" className={`btn ${label !== "Copy email" ? "ok" : ""}`} onClick={() => {
        const fallback = () => { const r = document.createRange(); if (ref.current) r.selectNodeContents(ref.current); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); done("Selected, copy it"); };
        try { navigator.clipboard.writeText(EMAIL).then(() => done("Copied ✓"), fallback); } catch { fallback(); }
      }}>{label}</button>
    </div>
  );
}

function Panel({ room }: { room: number }) {
  const sit = useHouse((s) => s.openComputer);
  if (room === 0) return (
    <>
      <span className="eyebrow">Portfolio · Bengaluru</span>
      <h1>Shashank <span className="serif">Hosamani</span></h1>
      <p>Full-stack engineer building AI-powered fintech products. Pull the cord under the lamp, then scroll to look around the house.</p>
    </>
  );
  if (room === 1) return (
    <>
      <span className="eyebrow">(01) About</span>
      <h2>Hi, I&apos;m Shashank.</h2>
      <p>Full-stack engineer at OneCap in Bengaluru. I build frontends, APIs and AI agents for finance teams, and I like software that feels like a person made it.</p>
      <ul className="tl">
        {TIMELINE.map((t) => <li key={t.what + t.when}><span>{t.when}</span><b>{t.what}</b><em>{t.where}</em></li>)}
      </ul>
      <a className="mono-link" href={LINKS.resume} target="_blank" rel="noopener">Full resume (PDF) ↗</a>
    </>
  );
  if (room === 2) return (
    <>
      <span className="eyebrow">(02) Workshop</span>
      <h2>Everything I&apos;ve <span className="serif">built</span> lives on this computer.</h2>
      <p>Click the screen to sit down. Open each project in its own window, or try the terminal.</p>
      <button type="button" className="cta" onClick={() => sit("monitor")}>Use the computer →</button>
      <div className="chips">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
    </>
  );
  return (
    <>
      <span className="eyebrow">(03) Contact</span>
      <h2>Let&apos;s make <span className="serif">something.</span></h2>
      <p>I&apos;m open to full-stack and AI product roles. If you&apos;re building in fintech, agents or developer tools, I&apos;d like to hear about it.</p>
      <CopyEmail />
      <button type="button" className="cta ghost" onClick={() => sit("laptop")}>Or write from the laptop →</button>
      <div className="links">
        <a href={LINKS.github} target="_blank" rel="noopener">GitHub ↗</a>
        <a href={LINKS.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
        <a href={LINKS.resume} target="_blank" rel="noopener">Resume ↗</a>
      </div>
      <details className="credits">
        <summary>3D model credits</summary>
        <ul>{CREDITS.map((c) => <li key={c.what}>{c.what}: {c.who}, {c.license}</li>)}</ul>
        <p>Models from the Khronos glTF Sample Assets collection.</p>
      </details>
    </>
  );
}

function Loader() {
  const { progress, active } = useProgress();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!active && progress >= 100) { const t = setTimeout(() => setGone(true), 500); return () => clearTimeout(t); }
  }, [active, progress]);
  if (gone) return null;
  return (
    <div className={`loader ${!active && progress >= 100 ? "out" : ""}`} aria-live="polite">
      <span className="eyebrow">Unlocking the front door</span>
      <div className="lbar"><i style={{ transform: `scaleX(${progress / 100})` }} /></div>
      <span className="mono">{Math.round(progress)}%</span>
    </div>
  );
}

export default function Experience() {
  const setProgress = useHouse((s) => s.setProgress);
  const lightsOn = useHouse((s) => s.lightsOn);
  const toggle = useHouse((s) => s.toggleLights);
  const { k, active, settled } = useWalk();
  const seated = useHouse((s) => s.computer !== null);
  const bar = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<"high" | "low" | null>(null);

  useEffect(() => {
    const small = matchMedia("(max-width: 820px), (pointer: coarse)").matches || new URLSearchParams(location.search).has("lite");
    setQuality(small ? "low" : "high");
    const on = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, Math.max(0, scrollY / max));
      setProgress(p);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [setProgress]);

  return (
    <>
      <div className="scroll-track" aria-hidden="true" />
      <div className="canvas-wrap">{quality && <Scene quality={quality} />}</div>
      <div className="bar" ref={bar} />
      <header className="top" hidden={seated}>
        <span className="brand"><span className="full">SHASHANK H.</span><span className="short">SH.</span></span>
        <nav aria-label="Rooms">
          {ROOMS.map((r, j) => (
            <button key={r} type="button" aria-current={j === active} onClick={() => goRoom(j)}>{r}</button>
          ))}
          <button type="button" className="lights" aria-pressed={!lightsOn} onClick={toggle}>{lightsOn ? "Lights off" : "Lights on"}</button>
        </nav>
      </header>
      <main className={`panel ${settled && !seated ? "on" : ""} ${active === 2 ? "right" : active === 3 ? "side" : ""}`} key={active} aria-live="polite">
        <Panel room={active} />
      </main>
      <div className={`hint ${settled && !seated && k < 3 ? "on" : ""}`}>scroll for {ROOMS[Math.min(3, k + 1)].toLowerCase()} ↓</div>
      <Loader />
      <ComputerOS />
    </>
  );
}
