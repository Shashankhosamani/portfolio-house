"use client";
import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { PackedGLTFLoader, MODEL_EXT } from "@/lib/packedGltf";

type Props = {
  name: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

const url = (name: string) => `models/${name}${MODEL_EXT}`;

/** Loads a glTF model from /public/models, strips its built-in lights and turns on shadows. */
export function Model({ name, position, rotation, scale = 1 }: Props) {
  const { scene } = useLoader(PackedGLTFLoader, url(name));
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const lights: THREE.Object3D[] = [];
    c.traverse((o) => {
      if ((o as THREE.Light).isLight) lights.push(o);
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    lights.forEach((l) => l.removeFromParent());
    return c;
  }, [scene]);
  return <primitive object={obj} position={position} rotation={rotation} scale={scale} />;
}

export const MODELS = [
  "GlamVelvetSofa", "LightsPunctualLamp", "DiffuseTransmissionPlant", "GlassVaseFlowers",
  "SheenChair", "AnisotropyBarnLamp", "AntiqueCamera", "BoomBox", "WaterBottle", "ChairDamaskPurplegold",
];
MODELS.forEach((m) => useLoader.preload(PackedGLTFLoader, url(m)));
