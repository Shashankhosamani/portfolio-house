"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useHouse } from "@/lib/store";
import { PROJECTS, STACK, TIMELINE, EMAIL, LINKS } from "@/lib/content";

type App = "projects" | "terminal" | "mail" | "skills" | `project:${number}`;
type Win = { id: number; app: App; x: number; y: number; z: number };

const TITLES: Record<string, string> = { projects: "Projects", terminal: "Terminal", mail: "Mail", skills: "Skills" };
const title = (a: App) => a.startsWith("project:") ? PROJECTS[+a.split(":")[1]].title : TITLES[a];

function Glyph({ app }: { app: App | "resume" }) {
  if (typeof app === "string" && app.startsWith("project:")) {
    const p = PROJECTS[+app.split(":")[1]];
    return <span className="os-thumb" dangerouslySetInnerHTML={{ __html: p.thumb }} />;
  }
  const g: Record<string, string> = { projects: "▦", terminal: ">_", mail: "@", skills: "{ }", resume: "PDF" };
  return <span className={`os-glyph g-${app}`}>{g[app as string]}</span>;
}

/* ───────── apps ───────── */

function ProjectsApp({ open }: { open: (a: App) => void }) {
  return (
    <div className="os-projects">
      <p className="os-muted">{PROJECTS.length} items · double-click or tap to open</p>
      <div className="os-grid">
        {PROJECTS.map((p, i) => (
          <button key={p.id} type="button" className="os-file" onClick={() => open(`project:${i}`)}>
            <Glyph app={`project:${i}`} />
            <b>{p.title}</b>
            <small>{p.tag}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectApp({ i }: { i: number }) {
  const p = PROJECTS[i];
  return (
    <div className="os-project">
      <div className="os-art" dangerouslySetInnerHTML={{ __html: p.art }} />
      <div className="os-ptext">
        <span className="os-muted mono">{p.n} · {p.tag}</span>
        <h3>{p.title}</h3>
        <p>{p.line}</p>
        <ul>{p.points.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="os-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </div>
  );
}

function SkillsApp() {
  return (
    <div className="os-skills">
      <p className="os-muted">What I reach for, and where I've used it.</p>
      <div className="chips">{STACK.map((s) => <span key={s}>{s}</span>)}</div>
      <ul className="tl">
        {TIMELINE.map((t) => <li key={t.what + t.when}><span>{t.when}</span><b>{t.what}</b><em>{t.where}</em></li>)}
      </ul>
    </div>
  );
}

function MailApp() {
  const [label, setLabel] = useState("Copy address");
  const ref = useRef<HTMLSpanElement>(null);
  const copy = () => {
    const done = (l: string) => { setLabel(l); setTimeout(() => setLabel("Copy address"), 1800); };
    const fallback = () => { const r = document.createRange(); if (ref.current) r.selectNodeContents(ref.current); const s = getSelection(); s?.removeAllRanges(); s?.addRange(r); done("Selected, copy it"); };
    try { navigator.clipboard.writeText(EMAIL).then(() => done("Copied ✓"), fallback); } catch { fallback(); }
  };
  return (
    <div className="os-mail">
      <div className="os-mailhead">
        <span className="os-muted">To</span><span ref={ref} className="os-addr">{EMAIL}</span>
        <span className="os-muted">Subject</span><span>Let&apos;s make something</span>
      </div>
      <p>Hi Shashank,<br /><br />I came across your portfolio and wanted to talk about…</p>
      <div className="os-actions">
        <a className="os-btn primary" href={`mailto:${EMAIL}?subject=${encodeURIComponent("Let's make something")}`}>Open in my mail app</a>
        <button type="button" className="os-btn" onClick={copy}>{label}</button>
      </div>
      <p className="os-muted small">If your mail app doesn&apos;t open, copy the address above.</p>
      <div className="os-links">
        <a href={LINKS.github} target="_blank" rel="noopener">GitHub ↗</a>
        <a href={LINKS.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
        <a href={LINKS.resume} target="_blank" rel="noopener">Resume ↗</a>
      </div>
    </div>
  );
}

function TerminalApp({ open, leave }: { open: (a: App) => void; leave: () => void }) {
  const print = useHouse((s) => s.startPrint);
  const [lines, setLines] = useState<ReactNode[]>([
    <span key="w">ShashankOS terminal. Type <b>help</b> to see what you can do.</span>,
  ]);
  const [value, setValue] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [lines]);
  useEffect(() => { input.current?.focus(); }, []);

  const run = (raw: string) => {
    const cmd = raw.trim();
    const [c, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    const out: ReactNode[] = [<span key="p" className="t-prompt">shashank@studio ~ % <span className="t-cmd">{cmd}</span></span>];
    const find = (q: string) => {
      const n = parseInt(q, 10);
      if (!isNaN(n) && PROJECTS[n - 1]) return n - 1;
      return PROJECTS.findIndex((p) => p.title.toLowerCase().includes(q) || p.id === q);
    };
    switch ((c || "").toLowerCase()) {
      case "": break;
      case "help":
        out.push(<pre key="h">{`help            this list
projects, ls    list my projects
open <n|name>   open a project, e.g. open 4 or open costiq
whoami          who I am
skills          what I work with
contact         how to reach me
print           print my resume on the studio printer
resume          link to the PDF
clear           clear the screen
exit            leave the computer`}</pre>);
        break;
      case "ls": case "projects":
        out.push(<pre key="l">{PROJECTS.map((p, i) => `${String(i + 1).padStart(2)}  ${p.title.padEnd(24)}${p.tag}`).join("\n")}</pre>);
        out.push(<span key="t" className="os-muted">Type <b>open 1</b> to open the first one.</span>);
        break;
      case "open": {
        const i = find(arg);
        if (i >= 0) { open(`project:${i}`); out.push(<span key="o">Opening {PROJECTS[i].title}…</span>); }
        else if (["mail", "skills", "projects"].includes(arg)) { open(arg as App); out.push(<span key="o">Opening {arg}…</span>); }
        else out.push(<span key="e" className="t-err">No project called &quot;{arg}&quot;. Type <b>projects</b> to see them.</span>);
        break;
      }
      case "whoami":
        out.push(<span key="w">Shashank Hosamani · full-stack engineer at OneCap, Bengaluru. Frontends, APIs and AI agents for finance teams.</span>);
        break;
      case "skills":
        out.push(<span key="s">{STACK.join(" · ")}</span>);
        break;
      case "contact": case "mail":
        out.push(<span key="c">{EMAIL} · <a href={LINKS.github} target="_blank" rel="noopener">GitHub</a> · <a href={LINKS.linkedin} target="_blank" rel="noopener">LinkedIn</a></span>);
        break;
      case "print": case "lpr":
        out.push(<span key="p" className="t-ok">Sending Shashank_Hosamani_Resume.pdf to the printer…</span>);
        setLines((l) => [...l, ...out]);
        setTimeout(print, 600);
        setValue("");
        return;
      case "resume": case "cv":
        out.push(<a key="r" href={LINKS.resume} target="_blank" rel="noopener">Shashank_Hosamani_Resume.pdf ↗</a>);
        break;
      case "sudo":
        out.push(arg.includes("hire") ? <span key="s" className="t-ok">Permission granted. Next step: {EMAIL}</span> : <span key="s" className="t-err">Nice try.</span>);
        break;
      case "clear": setLines([]); setValue(""); return;
      case "exit": case "logout": leave(); return;
      default:
        out.push(<span key="u" className="t-err">command not found: {c}. Type <b>help</b>.</span>);
    }
    setLines((l) => [...l, ...out]);
    if (cmd) setHist((h) => [cmd, ...h].slice(0, 30));
    setHi(-1);
    setValue("");
  };

  return (
    <div className="os-term" onClick={() => input.current?.focus()}>
      {lines.map((l, i) => <div key={i} className="t-line">{l}</div>)}
      <form className="t-line t-input" onSubmit={(e) => { e.preventDefault(); run(value); }}>
        <span className="t-prompt">shashank@studio ~ %</span>
        <input id="os-terminal-input" ref={input} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Terminal command"
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(hist.length - 1, hi + 1); if (hist[n]) { setHi(n); setValue(hist[n]); } }
            if (e.key === "ArrowDown") { e.preventDefault(); const n = hi - 1; setHi(n); setValue(n >= 0 ? hist[n] : ""); }
          }} />
      </form>
      <div ref={end} />
    </div>
  );
}

/* ───────── window manager ───────── */

let nextId = 1;

export default function ComputerOS() {
  const computer = useHouse((s) => s.computer);
  const close = useHouse((s) => s.closeComputer);
  const [visible, setVisible] = useState(false);
  const setOsOpen = useHouse((s) => s.setOsOpen);
  useEffect(() => { setOsOpen(visible); }, [visible, setOsOpen]);
  useEffect(() => { if (!computer) setVisible(false); }, [computer]);
  const print = useHouse((s) => s.startPrint);
  const [wins, setWins] = useState<Win[]>([]);
  const [clock, setClock] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const small = typeof window !== "undefined" && window.innerWidth < 760;

  const open = useCallback((app: App) => {
    setWins((ws) => {
      const found = ws.find((w) => w.app === app);
      const z = Math.max(10, ...ws.map((w) => w.z)) + 1;
      if (found) return ws.map((w) => w === found ? { ...w, z } : w);
      const n = ws.length;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const big = app.startsWith("project:");
      const ww = Math.min(big ? 880 : 620, vw - 32);
      const x = Math.max(16, Math.min(vw - ww - 16, (vw - ww) / 2 + n * 28));
      return [...ws, { id: nextId++, app, x, y: 70 + n * 28, z }];
    });
  }, []);
  const shut = (id: number) => setWins((ws) => ws.filter((w) => w.id !== id));
  const focus = (id: number) => setWins((ws) => {
    const z = Math.max(10, ...ws.map((w) => w.z));
    const w = ws.find((v) => v.id === id);
    if (!w || w.z === z) return ws;
    return ws.map((v) => v.id === id ? { ...v, z: z + 1 } : v);
  });

  const leave = useCallback(() => {
    setVisible(false);
    setTimeout(() => { close(); setWins([]); }, 260);
  }, [close]);

  // sit down: lock the page scroll, wait for the camera to arrive, then show the desktop
  useEffect(() => {
    if (!computer) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    setWins([]);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => { setVisible(true); open(computer === "laptop" ? "mail" : "projects"); }, reduce ? 0 : 900);
    return () => { clearTimeout(t); html.style.overflow = prev; };
  }, [computer, open]);

  useEffect(() => {
    if (!visible) return;
    root.current?.focus();
    const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }));
    tick(); const id = setInterval(tick, 15000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setWins((ws) => {
        if (!ws.length) { leave(); return ws; }
        const topWin = ws.reduce((a, b) => (a.z > b.z ? a : b));
        return ws.filter((w) => w !== topWin);
      });
    };
    addEventListener("keydown", onKey);
    return () => { clearInterval(id); removeEventListener("keydown", onKey); };
  }, [visible, leave]);

  const drag = (id: number) => (e: React.PointerEvent) => {
    if (small || (e.target as HTMLElement).closest("button")) return;
    focus(id);
    const w = wins.find((x) => x.id === id); if (!w) return;
    const sx = e.clientX - w.x, sy = e.clientY - w.y;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const x = Math.min(innerWidth - 120, Math.max(-200, ev.clientX - sx));
      const y = Math.min(innerHeight - 60, Math.max(36, ev.clientY - sy));
      setWins((ws) => ws.map((v) => v.id === id ? { ...v, x, y } : v));
    };
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  if (!computer) return null;
  const desktopIcons: (App | "resume")[] = ["projects", ...PROJECTS.map((_, i) => `project:${i}` as App), "terminal", "mail", "skills", "resume"];
  const dock: (App | "resume")[] = ["projects", "terminal", "mail", "skills", "resume"];
  const activeTop = wins.length ? wins.reduce((a, b) => (a.z > b.z ? a : b)) : null;

  const launch = (a: App | "resume") => (a === "resume" ? print() : open(a));
  const IconButton = ({ a, className }: { a: App | "resume"; className: string }) => {
    const label = a === "resume" ? "Print resume" : title(a);
    return <button type="button" className={className} onClick={() => launch(a)} title={label}><Glyph app={a} /><span>{label}</span></button>;
  };

  return (
    <div ref={root} tabIndex={-1} className={`os ${visible ? "on" : ""}`} role="dialog" aria-modal="true" aria-label="Shashank's computer">
      <header className="os-bar">
        <span className="os-logo">ShashankOS</span>
        <span className="os-app">{activeTop ? title(activeTop.app) : "Desktop"}</span>
        <span className="os-spacer" />
        <span className="os-clock mono">{clock} IST</span>
        <button type="button" className="os-leave" onClick={leave}>Leave computer ✕</button>
      </header>

      <div className="os-desk">
        {desktopIcons.map((a) => <IconButton key={a} a={a} className="os-icon" />)}
      </div>

      {wins.map((w) => {
        const isProject = w.app.startsWith("project:");
        return (
          <section key={w.id} className={`os-win ${isProject ? "wide" : ""} ${activeTop?.id === w.id ? "front" : ""}`}
            style={small ? { zIndex: w.z } : { left: w.x, top: w.y, zIndex: w.z }}
            onPointerDown={() => focus(w.id)} aria-label={title(w.app)}>
            <div className="os-title" onPointerDown={drag(w.id)}>
              <span className="os-lights">
                <button type="button" aria-label={`Close ${title(w.app)}`} className="l-close" onClick={() => shut(w.id)} />
                <i /><i />
              </span>
              <b>{title(w.app)}</b>
              {small && <button type="button" className="os-back" onClick={() => shut(w.id)}>Close</button>}
            </div>
            <div className="os-body">
              {w.app === "projects" && <ProjectsApp open={open} />}
              {w.app === "terminal" && <TerminalApp open={open} leave={leave} />}
              {w.app === "mail" && <MailApp />}
              {w.app === "skills" && <SkillsApp />}
              {isProject && <ProjectApp i={+w.app.split(":")[1]} />}
            </div>
          </section>
        );
      })}

      <nav className="os-dock" aria-label="Dock">
        {dock.map((a) => <IconButton key={a} a={a} className="os-dockitem" />)}
      </nav>
    </div>
  );
}
