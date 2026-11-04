import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Model file extension. Normal hosting serves plain .glb files.
 * Hosts that refuse .glb (some sandboxed previews) can use a build with
 * NEXT_PUBLIC_MODEL_FORMAT=json, where scripts/pack-models.mjs has wrapped
 * each .glb as JSON: { glb: "<base64>" }.
 */
export const MODEL_EXT = process.env.NEXT_PUBLIC_MODEL_FORMAT === "json" ? ".glb.json" : ".glb";

function b64ToBuffer(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export class PackedGLTFLoader extends GLTFLoader {
  load(url: string, onLoad: (g: import("three/examples/jsm/loaders/GLTFLoader.js").GLTF) => void, onProgress?: (e: ProgressEvent) => void, onError?: (e: unknown) => void) {
    if (!url.endsWith(".json")) return super.load(url, onLoad, onProgress, onError);
    const manager = this.manager ?? THREE.DefaultLoadingManager;
    manager.itemStart(url);
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); })
      .then((j: { glb: string }) => {
        const base = url.slice(0, url.lastIndexOf("/") + 1);
        this.parse(b64ToBuffer(j.glb), base, (g) => { onLoad(g); manager.itemEnd(url); }, (e) => { onError?.(e); manager.itemError(url); manager.itemEnd(url); });
      })
      .catch((e) => { onError?.(e); manager.itemError(url); manager.itemEnd(url); });
  }
}
