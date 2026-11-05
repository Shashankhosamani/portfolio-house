"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { PackedGLTFLoader, MODEL_EXT } from "@/lib/packedGltf";
import { player } from "@/lib/player";
import { angDiff } from "./Player";

const URL = `models/RobotExpressive${MODEL_EXT}`;
const SCALE = 0.3; // ~1.3 m tall
const ONE_SHOT = ["Wave", "ThumbsUp", "Jump", "Yes", "No", "Sitting", "Standing"];

/**
 * The robot you see in third person. It only shows what the player is doing:
 * walking/running/idle from speed, sitting when seated, dancing at the boombox,
 * and one-shot gestures. Sitting plays once and holds the pose (looping it made
 * the robot look like it was hopping on the chair).
 */
export function Avatar({ visible }: { visible: boolean }) {
  const gltf = useLoader(PackedGLTFLoader, URL);
  const model = useMemo(() => {
    const m = cloneSkinned(gltf.scene) as THREE.Group;
    m.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
    return m;
  }, [gltf]);
  const root = useRef<THREE.Group>(null);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const actions = useMemo(() => {
    const out: Record<string, THREE.AnimationAction> = {};
    gltf.animations.forEach((clip) => { out[clip.name] = mixer.clipAction(clip); });
    for (const g of ONE_SHOT) { const a = out[g]; if (a) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } }
    return out;
  }, [gltf, mixer]);
  const state = useRef<string>("Idle");
  const gesture = useRef<THREE.AnimationAction | null>(null);
  const seen = useRef(0);

  const go = (name: string, fade = 0.25) => {
    if (state.current === name || !actions[name]) return;
    const from = actions[state.current];
    const to = actions[name];
    to.reset().setEffectiveWeight(1).fadeIn(fade).play();
    from?.fadeOut(fade);
    state.current = name;
  };

  useEffect(() => {
    actions.Idle?.play();
    const onDone = (e: { action: THREE.AnimationAction }) => {
      if (e.action === gesture.current) {
        e.action.fadeOut(0.25);
        actions[state.current]?.reset().fadeIn(0.25).play();
        gesture.current = null;
      }
      // after standing up, settle into idle
      if (e.action === actions.Standing && state.current === "Standing") go("Idle", 0.2);
    };
    mixer.addEventListener("finished", onDone as never);
    const t = setTimeout(() => { player.gesture = "Wave"; }, 1400);
    seen.current = player.lastGesture.id;
    return () => { mixer.removeEventListener("finished", onDone as never); clearTimeout(t); mixer.stopAllAction(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, mixer]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = root.current;
    if (!g) return;
    const seated = player.mode === "seated" && player.seat;
    if (seated) {
      const [sx, , sz, syaw] = player.seat!;
      // stand in front of the seat and sit back into it; the clip lowers the hips onto the seat
      const back = 0.12;
      g.position.lerp(new THREE.Vector3(sx - Math.sin(syaw) * back, 0, sz - Math.cos(syaw) * back), Math.min(1, dt * 8));
      g.rotation.y += angDiff(g.rotation.y, syaw) * Math.min(1, dt * 10);
    } else {
      g.position.set(player.x, 0, player.z);
      g.rotation.y += angDiff(g.rotation.y, player.yaw) * Math.min(1, dt * 14);
    }

    let want: string;
    if (seated) want = "Sitting";
    else if (state.current === "Sitting") want = "Standing";
    else if (state.current === "Standing" && actions.Standing?.isRunning() && player.speed < 0.1) want = "Standing";
    else want = player.mode === "dancing" ? "Dance" : player.speed > 2.4 ? "Running" : player.speed > 0.1 ? "Walking" : "Idle";
    go(want);

    if (player.lastGesture.id !== seen.current) {
      seen.current = player.lastGesture.id;
      const a = actions[player.lastGesture.name];
      if (a && visible)
      if (!seated && (want === "Idle" || want === "Dance")) {
        actions[state.current]?.fadeOut(0.2);
        gesture.current?.fadeOut(0.1);
        a.reset().fadeIn(0.2).play();
        gesture.current = a;
      }
    }
    if (gesture.current && want !== "Idle" && want !== "Dance") {
      gesture.current.fadeOut(0.15); gesture.current = null; actions[state.current]?.reset().fadeIn(0.15).play();
    }
    mixer.update(dt);
  });

  return (
    <group ref={root} visible={visible} position={[player.x, 0, player.z]} rotation-y={player.yaw}>
      <primitive object={model} scale={SCALE} />
    </group>
  );
}

useLoader.preload(PackedGLTFLoader, URL);
