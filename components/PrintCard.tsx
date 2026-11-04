"use client";
import { useEffect, useRef } from "react";
import { useHouse } from "@/lib/store";
import { LINKS } from "@/lib/content";

/** Status while the printer runs, then the "take it with you" card once the page is in the tray. */
export default function PrintCard() {
  const state = useHouse((s) => s.printState);
  const dismiss = useHouse((s) => s.dismissPrint);
  const first = useRef<HTMLAnchorElement>(null);

  // the camera is standing at the printer: hold the page still until the visitor steps back
  useEffect(() => {
    if (state === "idle") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && useHouse.getState().printState === "done") dismiss(); };
    addEventListener("keydown", onKey);
    return () => { html.style.overflow = prev; removeEventListener("keydown", onKey); };
  }, [state, dismiss]);

  useEffect(() => { if (state === "done") first.current?.focus(); }, [state]);
  // if the 3D scene isn't running (no WebGL), finish the print anyway
  useEffect(() => {
    if (state !== "printing") return;
    const t = setTimeout(() => useHouse.getState().finishPrint(), 7000);
    return () => clearTimeout(t);
  }, [state]);

  if (state === "idle") return null;
  if (state === "printing") return (
    <div className="print-status" role="status"><i /> Printing Shashank_Hosamani_Resume.pdf · 1 page</div>
  );
  return (
    <div className="print-card" role="dialog" aria-modal="false" aria-labelledby="print-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="textures/resume-page.jpg" alt="First page of Shashank's resume" width={910} height={1287} />
      <div className="pc-text">
        <span className="eyebrow">Printed ✓</span>
        <h2 id="print-title">Take a copy with you.</h2>
        <p>One page: experience at OneCap, projects, the IEEE paper and skills.</p>
        <div className="pc-actions">
          <a ref={first} className="cta" href={LINKS.resume} download="Shashank_Hosamani_Resume.pdf">Download PDF ↓</a>
          <a className="cta ghost" href={LINKS.resume} target="_blank" rel="noopener">Open in new tab ↗</a>
        </div>
        <button type="button" className="pc-back" onClick={dismiss}>← Back to the room</button>
      </div>
    </div>
  );
}
