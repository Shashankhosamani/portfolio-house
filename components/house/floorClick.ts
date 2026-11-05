import type { ThreeEvent } from "@react-three/fiber";
import { useHouse } from "@/lib/store";
import { walkTo } from "@/lib/player";

/** Only clicks on the floor walk you somewhere; clicks on walls and furniture do nothing (or use the thing). */
export function onFloorClick(e: ThreeEvent<MouseEvent>) {
  e.stopPropagation();
  if (e.delta > 6) return; // that was a drag to look around
  const st = useHouse.getState();
  if (st.computer || st.printState !== "idle") return;
  walkTo(e.point.x, e.point.z);
  dispatchEvent(new CustomEvent("house:walk", { detail: { x: e.point.x, z: e.point.z } }));
}

