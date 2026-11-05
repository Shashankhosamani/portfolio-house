"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useHouse, type Panel } from "@/lib/store";
import { use, walkTo, standUp, player } from "@/lib/player";
import { STACK, TIMELINE, EMAIL, LINKS, CREDITS } from "@/lib/content";
import ComputerOS from "./os/Computer";
import PrintCard from "./PrintCard";

const Scene = dynamic(() => import("./house/Scene"), { ssr: false });

const NAV: { id: Panel; label: string; go: () => void }[] = [
  { id: "home", label: "Home", go: () => { walkTo(0, -1.2); useHouse.getState().setPanel("home"); } },
  { id: "about", label: "About", go: () => use("armchair") },
  { id: "workshop", label: "Workshop", go: () => { walkTo(-0.6, -9.95); useHouse.getState().setPanel("workshop"); } },
  { id: "contact", label: "Contact", go: () => use("postbox") },
];

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

function PanelBody({ id, touch }: { id: Panel; touch: boolean }) {
  if (id === "home") return (
    <>
      <span className="eyebrow">Portfolio · Bengaluru</span>
      <h1>Shashank <span className="serif">Hosamani</span></h1>
      <p>Full-stack engineer building AI-powered fintech products. That&apos;s me, the robot. Walk around and use things: the computer holds my projects, the printer prints my resume.</p>
      <ul className="keys">
        {touch ? (
          <>
            <li><b>Tap the floor</b> to walk there</li>
            <li><b>Tap a glowing marker</b> to use something</li>
            <li><b>Drag</b> to look around</li>
          </>
        ) : (
          <>
            <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows to walk, <kbd>Shift</kbd> to run</li>
            <li><b>Click the floor</b> to walk there, <b>click a thing</b> to use it</li>
            <li><kbd>E</kbd> to use what&apos;s nearby, <b>drag</b> to look around</li>
          </>
        )}
      </ul>
    </>
  );
  if (id === "about") return (
    <>
      <span className="eyebrow">(01) About</span>
      <h2>Hi, I&apos;m Shashank.</h2>
      <p>Full-stack engineer at OneCap in Bengaluru. I build frontends, APIs and AI agents for finance teams, and I like software that feels like a person made it.</p>
      <ul className="tl">
        {TIMELINE.map((t) => <li key={t.what + t.when}><span>{t.when}</span><b>{t.what}</b><em>{t.where}</em></li>)}
      </ul>
      <button type="button" className="cta ghost" onClick={() => use("printer")}>Print my resume</button>
    </>
  );
  if (id === "workshop") return (
    <>
      <span className="eyebrow">(02) Workshop</span>
      <h2>Everything I&apos;ve <span className="serif">built</span> lives on this computer.</h2>
      <p>Sit down at the desk to open each project in its own window, or try the terminal.</p>
      <div className="cta-row">
        <button type="button" className="cta" onClick={() => use("computer")}>Use the computer →</button>
        <button type="button" className="cta ghost" onClick={() => use("printer")}>Print my resume</button>
      </div>
      <div className="chips">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
    </>
  );
  return (
    <>
      <span className="eyebrow">(03) Contact</span>
      <h2>Let&apos;s make <span className="serif">something.</span></h2>
      <p>I&apos;m open to full-stack and AI product roles. If you&apos;re building in fintech, agents or developer tools, I&apos;d like to hear about it.</p>
      <CopyEmail />
      <div className="cta-row">
        <button type="button" className="cta ghost" onClick={() => use("laptop")}>Write from the laptop →</button>
        <button type="button" className="cta ghost" onClick={() => use("printer")}>Print my resume</button>
      </div>
      <div className="links">
        <a href={LINKS.github} target="_blank" rel="noopener">GitHub ↗</a>
        <a href={LINKS.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
        <a href={LINKS.resume} target="_blank" rel="noopener">Resume ↗</a>
      </div>
      <details className="credits">
        <summary>3D model credits</summary>
        <ul>{CREDITS.map((c) => <li key={c.what}>{c.what}: {c.who}, {c.license}</li>)}</ul>
        <p>Robot character by Tomás Laulhé (Quaternius), CC0, via the three.js examples. Furniture from the Khronos glTF Sample Assets collection.</p>
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
  const lightsOn = useHouse((s) => s.lightsOn);
  const toggle = useHouse((s) => s.toggleLights);
  const panel = useHouse((s) => s.panel);
  const setPanel = useHouse((s) => s.setPanel);
  const room = useHouse((s) => s.room);
  const music = useHouse((s) => s.music);
  const setMusic = useHouse((s) => s.setMusic);
  const activity = useHouse((s) => s.activity);
  const moved = useHouse((s) => s.moved);
  const seated = useHouse((s) => s.computer !== null || s.printState !== "idle");
  const [quality, setQuality] = useState<"high" | "low" | null>(null);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const coarse = matchMedia("(pointer: coarse)").matches;
    setTouch(coarse);
    const small = matchMedia("(max-width: 820px)").matches || coarse || new URLSearchParams(location.search).has("lite");
    setQuality(small ? "low" : "high");
    document.documentElement.classList.add("app");
    const onKey = (e: KeyboardEvent) => {
      const st = useHouse.getState();
      if (e.key === "Escape" && !st.computer && st.printState === "idle") {
        if (st.panel) st.setPanel(null);
        if (player.mode === "seated") standUp();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // which nav item is "here": the open sheet, otherwise the room
  const here = panel ?? (room === 0 ? "home" : "workshop");

  return (
    <>
      <div className="canvas-wrap">{quality && <Scene quality={quality} />}</div>
      <header className="top" hidden={seated}>
        <span className="brand"><span className="full">SHASHANK H.</span><span className="short">SH.</span></span>
        <nav aria-label="Go to">
          {NAV.map((n) => (
            <button key={n.id} type="button" aria-current={n.id === here} onClick={n.go}>{n.label}</button>
          ))}
          <button type="button" className="lights" aria-pressed={!lightsOn} onClick={toggle}>{lightsOn ? "Lights off" : "Lights on"}</button>
          {music && <button type="button" className="lights" aria-pressed onClick={() => setMusic(false)}>Music off</button>}
        </nav>
      </header>

      {panel && !seated && (
        <aside className="sheet-panel" key={panel} aria-label={NAV.find((n) => n.id === panel)?.label}>
          <button type="button" className="sheet-close" onClick={() => { setPanel(null); if (player.mode === "seated") standUp(); }} aria-label="Close">✕</button>
          <PanelBody id={panel} touch={touch} />
        </aside>
      )}

      {!seated && activity && <div className="activity">{activity} · {touch ? "tap ✕ or walk" : "Esc or move"} to get up</div>}
      {!seated && !panel && !moved && (
        <div className="hint on">{touch ? "Tap the floor to walk · tap the glowing markers" : "WASD or click the floor to walk · E to use things"}</div>
      )}
      <Loader />
      <ComputerOS />
      <PrintCard />
    </>
  );
}
