# Shashank Hosamani — portfolio house

A walk-through 3D portfolio in two furnished rooms. Scrolling moves the camera between four stops:

- **Living room · Home**: the name sign over a media console (pull the lamp cord for neon).
- **Living room · About**: the reading-corner wall with the CV poster, plaques and bookshelves.
- **Studio · Workshop**: the workstation. Click its monitor to sit down at "ShashankOS": project windows, a terminal (`help`, `projects`, `open costiq`…), Mail and Skills.
- **Studio · Contact**: the laptop desk and post box. The laptop opens the same computer in Mail.
- **The printer** (on the cabinet under the skill bins): click it, press "Print my resume", or type `print` in the terminal. The real first page of the resume rolls out, then a card offers the PDF download.

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
| Hand-built props (monitor, laptop, bins, curtains, art…) | `components/house/Props.tsx` |
| Camera stops | `STOPS` in `components/house/Scene.tsx` |
| Name sign, lamp and pull cord | `components/house/Home.tsx` |
| Clickable monitor and laptop screens | `components/house/Computer3D.tsx` |
| The in-computer desktop (windows, terminal, mail) | `components/os/Computer.tsx` |
| Resume printer and its download card | `components/house/Printer.tsx`, `components/PrintCard.tsx` |
| Printer sound (Web Audio, no files) | `lib/sound.ts` |

If you update the resume PDF in `public/`, regenerate the printed page image:

```bash
pdftoppm -f 1 -l 1 -r 110 -jpeg -singlefile public/Shashank_Hosamani_Resume.pdf public/textures/resume-page
```
| Camera walk and post-processing | `components/house/Scene.tsx` |
| Overlay UI, popup, loader | `components/Experience.tsx` |

## 3D model credits

Models come from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) collection, with textures resized to 1024px WebP.

- Glam Velvet Sofa, Damask Chair, Barn Lamp, Potted Plant: Eric Chadwick / Wayfair, CC BY 4.0
- Floor Lamp (LightsPunctualLamp): DGG, CC BY 4.0
- Sheen Chair, Glass Vase with Flowers: Eric Chadwick, Rico Cilliers, CC0
- Antique Camera: Maximilian Kamps, CC0
- Wood & Leather Sofa, Iridescent Dish with Olives: Eric Chadwick, CC BY 4.0
- Teacup: Poly Haven, Eric Chadwick, CC0
- Toy Car: Guido Odendahl, Eric Chadwick, CC0
- BoomBox, Water Bottle: Microsoft, CC0
- Hardwood floor texture and Helvetiker font: three.js examples (MIT)

CC BY models need visible credit; the site shows it under "3D model credits" at the Contact stop.
