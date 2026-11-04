import type * as THREE from "three";
import type { Computer } from "@/lib/store";

/** Screen meshes the camera can zoom into, keyed by computer. Filled in by Computer3D. */
export const screens: Partial<Record<Computer, THREE.Mesh>> = {};

/** Other things the camera can walk up to. */
export const spots: { printer?: THREE.Object3D } = {};
