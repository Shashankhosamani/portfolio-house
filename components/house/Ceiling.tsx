"use client";
import { zFront, zBack, H } from "./Shell";

/** Flush-mount ceiling fixture for the studio (the living room has the pendant). */
export function CeilingFixtures() {
  const spots: [number, number][] = [[1, 0]];
  return (
    <group>
      {spots.map(([j, x]) => {
        const zc = (zFront(j) + zBack(j)) / 2 + 0.3;
        return (
          <group key={j} position={[x, H, zc]}>
            <mesh position={[0, -0.03, 0]}>
              <cylinderGeometry args={[0.26, 0.3, 0.06, 40]} />
              <meshStandardMaterial color="#2A2724" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.065, 0]} rotation-x={Math.PI / 2}>
              <circleGeometry args={[0.24, 40]} />
              <meshStandardMaterial color="#FFF3DD" emissive="#FFE2B8" emissiveIntensity={3} toneMapped={false} side={2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
