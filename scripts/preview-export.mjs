// Post-processes `out/` for hosts with stricter rules than Vercel/GitHub Pages:
//  1. wraps every models/*.glb as models/*.glb.json ({ glb: base64 }) for hosts that refuse .glb files;
//  2. renames the `_next` folder to `next-assets` for hosts that reserve paths starting with "_".
// Used by `npm run build:preview`. A normal `npm run build` needs none of this.
import { readdirSync, readFileSync, writeFileSync, rmSync, renameSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const out = join(process.cwd(), "out");

const models = join(out, "models");
for (const f of readdirSync(models).filter((f) => f.endsWith(".glb"))) {
  writeFileSync(join(models, f + ".json"), JSON.stringify({ glb: readFileSync(join(models, f)).toString("base64") }));
  rmSync(join(models, f));
}

for (const f of readdirSync(out)) {
  if (f.endsWith(".txt") || f === "404.html" || f.startsWith("_not-found")) rmSync(join(out, f), { recursive: true });
}
renameSync(join(out, "_next"), join(out, "next-assets"));
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const p of walk(out)) {
  if (![".html", ".js", ".css"].includes(extname(p))) continue;
  const s = readFileSync(p, "utf8");
  // some hosts reject a literal U+FFFD; inside JS string literals the escape means the same thing
  const t = s.replaceAll("_next/", "next-assets/").replaceAll("\uFFFD", extname(p) === ".js" ? "\\uFFFD" : "\uFFFD");
  if (t !== s) writeFileSync(p, t);
}
console.log("preview export ready in out/");
