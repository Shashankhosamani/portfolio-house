# Shashank Hosamani — portfolio house

A walk-through 3D portfolio. Scrolling opens each door and walks the camera through four rooms:
Home (pull the lamp cord for the neon sign), About, Workshop (click a project card on the board) and Post room.

Built with Next.js (static export), React Three Fiber, drei and postprocessing.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/, deploy anywhere
```

Add `?lite` to the URL to force the lighter rendering mode that phones get (no ambient occlusion, basic shadows).

## Deploy

- **Vercel**: import the repo, no settings needed.
- **GitHub Pages / Netlify / any static host**: run `npm run build` and upload `out/`. Asset paths are relative, so a sub-folder works too.
- `npm run build:preview` makes a copy for hosts that refuse `.glb` files or paths starting with `_` (it packs the models as JSON and renames `_next`). You only need this for those hosts.

## Where things live

| What | File |
| --- | --- |
| All text: projects, timeline, skills, links, credits | `lib/content.ts` |
| Room size, colours, doors, walls | `components/house/Shell.tsx` |
| Furniture placement | `components/house/Furniture.tsx` |
| Name sign, lamp and pull cord | `components/house/Home.tsx` |
| Project cards on the pegboard | `components/house/ProjectCards.tsx` |
| Camera walk and post-processing | `components/house/Scene.tsx` |
| Overlay UI, popup, loader | `components/Experience.tsx` |

## 3D model credits

Models come from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) collection, with textures resized to 1024px WebP.

- Glam Velvet Sofa, Damask Chair, Barn Lamp, Potted Plant: Eric Chadwick / Wayfair, CC BY 4.0
- Floor Lamp (LightsPunctualLamp): DGG, CC BY 4.0
- Sheen Chair, Glass Vase with Flowers: Eric Chadwick, Rico Cilliers, CC0
- Antique Camera: Maximilian Kamps, CC0
- BoomBox, Water Bottle: Microsoft, CC0
- Hardwood floor texture and Helvetiker font: three.js examples (MIT)

CC BY models need visible credit; the site shows it under "3D model credits" in the Post room.
