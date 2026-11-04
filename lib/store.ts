import { create } from "zustand";

type State = {
  /** 0..1 scroll progress through the house */
  progress: number;
  lightsOn: boolean;
  /** neon flicker level 0..1 while the lights are off */
  glow: number;
  modal: number | null;
  setProgress: (p: number) => void;
  toggleLights: () => void;
  openProject: (i: number | null) => void;
};

let timers: ReturnType<typeof setTimeout>[] = [];

export const useHouse = create<State>((set, get) => ({
  progress: 0,
  lightsOn: true,
  glow: 0,
  modal: null,
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
