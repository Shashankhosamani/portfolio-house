import { create } from "zustand";

type State = {
  /** 0..1 scroll progress through the house */
  progress: number;
  lightsOn: boolean;
  /** neon flicker level 0..1 while the lights are off */
  glow: number;
  modal: number | null;
  /** which computer the visitor is sitting at, if any */
  computer: Computer | null;
  /** true while the desktop covers the screen, so the 3D scene can stop rendering */
  osOpen: boolean;
  setOsOpen: (v: boolean) => void;
  /** the resume printer: idle → printing → done (paper in the tray) */
  printState: "idle" | "printing" | "done";
  /** info sheet shown over the scene */
  panel: Panel | null;
  setPanel: (p: Panel | null) => void;
  /** nearest thing the character can use, for the on-screen prompt */
  nearby: string | null;
  setNearby: (id: string | null) => void;
  /** which room the character is in: 0 living room, 1 studio */
  room: number;
  setRoom: (r: number) => void;
  /** short status, e.g. "Reading" while seated */
  activity: string | null;
  setActivity: (a: string | null) => void;
  music: boolean;
  setMusic: (on: boolean) => void;
  /** the controls hint stays until the visitor first moves */
  moved: boolean;
  setMoved: () => void;
  /** first person (your eyes, with hands) or third person (follow the robot) */
  view: "first" | "third";
  toggleView: () => void;
  printAt: number;
  startPrint: () => void;
  finishPrint: () => void;
  dismissPrint: () => void;
  setProgress: (p: number) => void;
  toggleLights: () => void;
  openProject: (i: number | null) => void;
  openComputer: (c: Computer) => void;
  closeComputer: () => void;
};

export type Computer = "monitor" | "laptop";
export type Panel = "home" | "about" | "workshop" | "contact";

let timers: ReturnType<typeof setTimeout>[] = [];

export const useHouse = create<State>((set, get) => ({
  progress: 0,
  lightsOn: true,
  glow: 0,
  modal: null,
  computer: null,
  osOpen: false,
  setOsOpen: (osOpen) => set({ osOpen }),
  panel: "home",
  setPanel: (panel) => set({ panel }),
  nearby: null,
  setNearby: (nearby) => set({ nearby }),
  room: 0,
  setRoom: (room) => set({ room }),
  activity: null,
  setActivity: (activity) => set({ activity }),
  music: false,
  setMusic: (music) => {
    set({ music });
    import("./sound").then((m) => (music ? m.startMusic() : m.stopMusic())).catch(() => {});
  },
  view: (() => { try { return localStorage.getItem("house-view") === "third" ? "third" : "first"; } catch { return "first"; } })(),
  toggleView: () => {
    const view = get().view === "first" ? "third" : "first";
    set({ view });
    try { localStorage.setItem("house-view", view); } catch {}
  },
  moved: false,
  setMoved: () => { if (!get().moved) set({ moved: true }); },
  printState: "idle",
  printAt: 0,
  startPrint: () => {
    if (get().printState === "printing") return;
    set({ computer: null, osOpen: false, printState: "printing", printAt: performance.now() });
    import("./sound").then((m) => m.printerSound()).catch(() => {});
  },
  finishPrint: () => set({ printState: "done" }),
  dismissPrint: () => set({ printState: "idle" }),
  openComputer: (computer) => set({ computer }),
  closeComputer: () => set({ computer: null }),
  setProgress: (progress) => set({ progress }),
  toggleLights: () => {
    timers.forEach(clearTimeout);
    const lightsOn = !get().lightsOn;
    set({ lightsOn, glow: 0 });
    if (!lightsOn) {
      // the neon sign stutters before it catches
      timers = ([[240, 0.9], [320, 0.1], [400, 0.7], [470, 0], [660, 1]] as const).map(([t, g]) =>
        setTimeout(() => set({ glow: g }), t),
      );
    }
  },
  openProject: (modal) => set({ modal }),
}));

/** Scroll choreography shared by the camera and the interface.
 *  Four stops: Home and About in the living room, Workshop and Contact in the studio.
 *  Only the walk from stop 1 to stop 2 goes through a door. */
export const SEGS = 3.3;
export const ROOM_OF = [0, 0, 1, 1];
export const DOOR_SEGMENT = 1;
export function walk(progress: number) {
  const c = (v: number) => Math.min(1, Math.max(0, v));
  const seg = Math.min(3, progress * SEGS);
  const k = Math.min(3, Math.floor(seg));
  const t = k === 3 ? 0 : seg - k;
  const door = k === DOOR_SEGMENT;
  const open = door ? c((t - 0.3) / 0.2) : 0;
  const move = door ? c((t - 0.5) / 0.5) : c((t - 0.3) / 0.7);
  const active = move > 0.5 ? k + 1 : k;
  const settled = k === 3 || t < 0.32;
  const room = ROOM_OF[active];
  return { k, t, open, move, active, settled, room, door };
}
