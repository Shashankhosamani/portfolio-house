# Shashank Hosamani — portfolio house

A first-person 3D portfolio: you walk around a two-room house through Shashank's eyes and use things.

- **Living room**: pull the lamp cord (lights off turns the name into neon), play the boombox, sit in the armchair to read About.
- **Studio**: sit at the workstation to use "ShashankOS" (project windows, a terminal, Mail), print the resume on the printer, write from the laptop, post a letter at the post box (Contact).

Controls: W/S to walk, A/D to step sideways, ←/→ to turn, Shift to run, drag to look around, click or tap the floor to walk there, click a thing (or press E nearby) to use it, V (or the top button) to switch first/third person. First person shows your hands; third person shows a robot. The top buttons walk you to each spot.

## Updating your details

Everything about you (name, role, about text, plaques, timeline, skills, projects, links) is in **`lib/content.ts`**. Edit it and the panels, the name on the wall, the plaques, CV poster, skill bins, the computer and the terminal all update.

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
| First-person camera, look, prompts | `components/house/Scene.tsx` |
| Movement, collision, sitting, nearby detection | `components/house/Player.tsx` |
| First-person hands | `components/house/Hands.tsx` |
| Third-person robot | `components/house/Avatar.tsx` |
| What happens at each spot | `arrive()` in `lib/player.ts` |
| Walkable floor, obstacles, pathfinding, spots | `lib/nav.ts` (keep in step with `Furniture.tsx`) |
| Boombox music and printer sound (Web Audio) | `lib/sound.ts` |
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

- Robot character (RobotExpressive): Tomás Laulhé (Quaternius), CC0, via the three.js examples


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
