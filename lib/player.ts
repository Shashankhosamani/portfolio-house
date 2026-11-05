import { findPath, hotspot, HOTSPOTS, roomOf, type HotspotId } from "./nav";
import { useHouse } from "./store";

/**
 * The character's per-frame state lives here (not in React state), so moving
 * doesn't re-render the page. The UI reads the slower-changing bits from the store.
 */
export const player = {
  x: 0, z: -1.2, yaw: Math.PI,
  speed: 0,
  path: [] as [number, number][],
  /** interaction to run once the path is walked */
  pending: null as HotspotId | null,
  /** what the character is doing right now */
  mode: "free" as "free" | "walking-to-use" | "seated" | "busy" | "dancing",
  seat: null as null | [number, number, number, number],
  keys: new Set<string>(),
  run: false,
  /** one-shot gesture request for the animator */
  gesture: null as null | "Wave" | "ThumbsUp" | "Jump" | "Yes" | "No",
  /** the latest gesture, broadcast to the robot and the hands: id increments each time */
  lastGesture: { name: "", id: 0 },
  /** turn to face this way (0 = +z) when a walk ends */
  faceOnArrive: null as number | null,
};

export function walkTo(x: number, z: number, faceAngle: number | null = null) {
  player.faceOnArrive = faceAngle;
  if (player.mode === "seated") standUp();
  if (player.mode === "dancing" || player.mode === "busy") player.mode = "free";
  player.pending = null;
  player.path = findPath(player.x, player.z, x, z);
}

/** Walk to a hotspot and use it. */
export function use(id: HotspotId) {
  const h = hotspot(id);
  if (player.mode === "seated") standUp();
  player.mode = "walking-to-use";
  player.pending = id;
  player.path = findPath(player.x, player.z, h.stand[0], h.stand[1]);
  if (!player.path.length && Math.hypot(player.x - h.stand[0], player.z - h.stand[1]) > 0.4) {
    // unreachable for some reason: just do it from here
    player.path = [];
  }
}

export function standUp() {
  const s = player.seat;
  player.seat = null;
  player.mode = "free";
  if (s) {
    const h = HOTSPOTS.find((q) => q.seat === s);
    if (h) { player.x = h.stand[0]; player.z = h.stand[1]; }
  }
  useHouse.getState().setActivity(null);
}

/** Runs when the character arrives at a hotspot. */
export function arrive(id: HotspotId) {
  const h = hotspot(id);
  const st = useHouse.getState();
  player.yaw = h.face;
  player.mode = "free";
  switch (id) {
    case "lamp":
      player.gesture = "Jump";
      setTimeout(() => st.toggleLights(), 450);
      break;
    case "boombox":
      if (st.music) { st.setMusic(false); player.gesture = "Yes"; }
      else { st.setMusic(true); player.mode = "dancing"; }
      break;
    case "armchair":
      sit(h.seat!);
      st.setActivity("Reading");
      st.setPanel("about");
      break;
    case "computer":
      sit(h.seat!);
      st.setActivity("At the computer");
      setTimeout(() => useHouse.getState().openComputer("monitor"), 650);
      break;
    case "laptop":
      sit(h.seat!);
      st.setActivity("Writing");
      setTimeout(() => useHouse.getState().openComputer("laptop"), 650);
      break;
    case "printer":
      player.mode = "busy";
      st.startPrint();
      break;
    case "postbox":
      player.gesture = "Yes";
      st.setPanel("contact");
      break;
  }
}

function sit(seat: [number, number, number, number]) {
  player.seat = seat;
  player.mode = "seated";
  player.path = [];
}

export const room = () => roomOf(player.z);
