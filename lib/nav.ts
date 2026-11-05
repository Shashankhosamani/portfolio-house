/**
 * Walkable floor of the house: obstacles, collision and a small A* pathfinder.
 * Coordinates are world metres. Living room z ∈ [0, -6], studio z ∈ [-6, -12], x ∈ [-3.5, 3.5].
 * Furniture boxes mirror the layout in components/house/Furniture.tsx — keep them in step.
 */
export type Box2 = { x0: number; x1: number; z0: number; z1: number };

export const RADIUS = 0.26; // character's footprint
export const BOUNDS = { x0: -3.5 + 0.1, x1: 3.5 - 0.1, z0: -12 + 0.1, z1: 0 - 0.1 };
export const DOOR = { x0: 1.4, x1: 2.4, z: -6 };

const b = (x0: number, x1: number, z0: number, z1: number): Box2 => ({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });

export const OBSTACLES: Box2[] = [
  // partition wall with its door gap, and the open door leaf
  b(-3.5, DOOR.x0, -6.09, -5.91), b(DOOR.x1, 3.5, -6.09, -5.91), b(1.2, 1.42, -7.0, -6.0),
  // living room
  b(-1.95, 0.45, -5.92, -5.48),   // media console
  b(-2.95, -2.25, -5.9, -5.2),    // plant by the console
  b(-3.5, -2.5, -4.65, -2.3),     // velvet sofa
  b(-3.5, -2.6, -5.3, -4.6),      // floor lamp
  b(-1.78, -1.12, -4.08, -2.92),  // coffee table
  b(3.1, 3.5, -1.75, -0.65),      // bookshelf, front
  b(3.1, 3.5, -5.7, -4.6),        // bookshelf, back
  b(2.25, 2.85, -3.63, -2.77),    // armchair
  b(2.52, 2.98, -2.53, -2.07),    // side table
  b(2.2, 2.9, -1.1, -0.4),        // camera tripod
  // studio
  b(-1.85, 0.65, -11.9, -11.1),   // workstation desk
  b(-1.0, -0.2, -10.85, -10.25),  // workstation chair
  b(-3.05, -2.35, -11.9, -11.1),  // plant
  b(1.65, 2.95, -11.9, -11.39),   // printer cabinet
  b(-3.46, -2.7, -10.15, -8.25),  // contact desk
  b(-2.6, -2.0, -9.63, -8.77),    // contact chair
  b(-3.3, -2.7, -7.3, -6.7),      // post box
  b(2.49, 3.45, -10.06, -7.34),   // leather sofa
];

const inside = (x: number, z: number, o: Box2, r: number) => x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r;

export function blocked(x: number, z: number, r = RADIUS) {
  if (x < BOUNDS.x0 + r || x > BOUNDS.x1 - r || z < BOUNDS.z0 + r || z > BOUNDS.z1 - r) return true;
  return OBSTACLES.some((o) => inside(x, z, o, r));
}

/** Move with wall sliding: try the full step, then each axis on its own. */
export function slide(x: number, z: number, dx: number, dz: number): [number, number] {
  if (!blocked(x + dx, z + dz)) return [x + dx, z + dz];
  if (!blocked(x + dx, z)) return [x + dx, z];
  if (!blocked(x, z + dz)) return [x, z + dz];
  return [x, z];
}

export const roomOf = (z: number) => (z < DOOR.z ? 1 : 0);

/* ───────── A* on a 0.2 m grid ───────── */
const CELL = 0.2;
const GX = Math.round(7 / CELL), GZ = Math.round(12 / CELL);
const cx = (x: number) => Math.floor((x + 3.5) / CELL);
const cz = (z: number) => Math.floor(-z / CELL);
const wx = (i: number) => -3.5 + (i + 0.5) * CELL;
const wz = (j: number) => -(j + 0.5) * CELL;
let grid: Uint8Array | null = null;
function getGrid() {
  if (grid) return grid;
  grid = new Uint8Array(GX * GZ);
  for (let j = 0; j < GZ; j++) for (let i = 0; i < GX; i++) grid[j * GX + i] = blocked(wx(i), wz(j), RADIUS + 0.04) ? 1 : 0;
  return grid;
}

function clear(ax: number, az: number, bx: number, bz: number) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.08);
  for (let k = 1; k <= n; k++) { const t = k / n; if (blocked(ax + (bx - ax) * t, az + (bz - az) * t, RADIUS + 0.02)) return false; }
  return true;
}

/** Nearest free cell to a point (for clicks on furniture or walls). */
function nearestFree(x: number, z: number): [number, number] | null {
  const g = getGrid();
  let best: [number, number] | null = null, bd = Infinity;
  const i0 = cx(x), j0 = cz(z);
  for (let r = 0; r < 12 && !best; r++)
    for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
      if (i < 0 || j < 0 || i >= GX || j >= GZ || g[j * GX + i]) continue;
      const d = Math.hypot(wx(i) - x, wz(j) - z);
      if (d < bd) { bd = d; best = [i, j]; }
    }
  return best;
}

/** Shortest walkable route from (ax,az) to (bx,bz), as a list of waypoints (excluding the start). */
export function findPath(ax: number, az: number, bx: number, bz: number): [number, number][] {
  if (!blocked(bx, bz) && clear(ax, az, bx, bz)) return [[bx, bz]];
  const g = getGrid();
  const s = nearestFree(ax, az), t = nearestFree(bx, bz);
  if (!s || !t) return [];
  const key = (i: number, j: number) => j * GX + i;
  const goal = key(t[0], t[1]);
  const gScore = new Float32Array(GX * GZ).fill(Infinity);
  const came = new Int32Array(GX * GZ).fill(-1);
  const open: { k: number; f: number }[] = [];
  const h = (i: number, j: number) => Math.hypot(i - t[0], j - t[1]);
  gScore[key(s[0], s[1])] = 0;
  open.push({ k: key(s[0], s[1]), f: h(s[0], s[1]) });
  const closed = new Uint8Array(GX * GZ);
  while (open.length) {
    let bi = 0; for (let q = 1; q < open.length; q++) if (open[q].f < open[bi].f) bi = q;
    const { k } = open.splice(bi, 1)[0];
    if (k === goal) break;
    if (closed[k]) continue; closed[k] = 1;
    const i = k % GX, j = (k / GX) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= GX || nj >= GZ) continue;
      const nk = key(ni, nj);
      if (g[nk] || closed[nk]) continue;
      if (di && dj && (g[key(i + di, j)] || g[key(i, j + dj)])) continue; // no corner cutting
      const ng = gScore[k] + (di && dj ? Math.SQRT2 : 1);
      if (ng < gScore[nk]) { gScore[nk] = ng; came[nk] = k; open.push({ k: nk, f: ng + h(ni, nj) }); }
    }
  }
  if (came[goal] === -1 && goal !== key(s[0], s[1])) return [];
  const cells: [number, number][] = [];
  for (let k = goal; k !== -1; k = came[k]) cells.unshift([wx(k % GX), wz((k / GX) | 0)]);
  // string-pull: skip waypoints we can see past
  const out: [number, number][] = [];
  let px = ax, pz = az, idx = 0;
  while (idx < cells.length) {
    let far = idx;
    for (let q = cells.length - 1; q > idx; q--) if (clear(px, pz, cells[q][0], cells[q][1])) { far = q; break; }
    out.push(cells[far]); [px, pz] = cells[far]; idx = far + 1;
  }
  if (!blocked(bx, bz)) out.push([bx, bz]);
  return out;
}

/* ───────── things the character can use ───────── */
export type HotspotId = "lamp" | "boombox" | "armchair" | "computer" | "printer" | "laptop" | "postbox";
export type Hotspot = {
  id: HotspotId; label: string;
  /** where the prompt floats */ at: [number, number, number];
  /** where to stand to use it, and which way to face (radians, 0 = facing +z) */ stand: [number, number]; face: number;
  /** optional seat: where the character sits and which way it faces */ seat?: [number, number, number, number];
  radius: number;
};
const S = -12;
export const HOTSPOTS: Hotspot[] = [
  { id: "lamp", label: "Pull the lamp cord", at: [0.22, 2.0, -3.0], stand: [0.22, -2.45], face: Math.PI, radius: 1.0 },
  { id: "boombox", label: "Play some music", at: [-1.6, 1.15, -5.7], stand: [-1.6, -4.9], face: Math.PI, radius: 1.1 },
  { id: "armchair", label: "Sit and read about me", at: [2.55, 1.3, -3.2], stand: [1.85, -3.2], face: Math.PI / 2, seat: [2.5, 0.12, -3.2, -Math.PI / 2], radius: 1.2 },
  { id: "computer", label: "Use the computer", at: [-0.6, 1.6, S + 0.35], stand: [-0.6, -9.95], face: Math.PI, seat: [-0.6, 0.12, -10.5, Math.PI], radius: 1.2 },
  { id: "printer", label: "Print my resume", at: [2.05, 1.05, S + 0.36], stand: [2.05, -10.85], face: Math.PI, radius: 1.1 },
  { id: "laptop", label: "Write me a message", at: [-3.0, 1.35, -9.2], stand: [-1.55, -9.2], face: -Math.PI / 2, seat: [-2.35, 0.12, -9.2, -Math.PI / 2], radius: 1.2 },
  { id: "postbox", label: "Post a letter", at: [-3.0, 1.7, -7.0], stand: [-2.35, -7.0], face: -Math.PI / 2, radius: 1.1 },
];
export const hotspot = (id: HotspotId) => HOTSPOTS.find((h) => h.id === id)!;
