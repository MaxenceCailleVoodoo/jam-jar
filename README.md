# Confiture Ops 3D

Dead Ops–style **3D** top-down arcade shooter. Funny jam theme, **a full universe per wave**, and a **boss every 5 waves**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL in a **desktop browser** (Chrome/Firefox).

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrows | Move |
| Mouse | Aim |
| Click / Space | Shoot (hold for auto-fire) |
| Enter | Start (main menu) |

## Features

- **3D arcade** — Three.js, top-down camera, stick-figure hero vs blob zombies
- **6 universes** — Pantry, Neon Jellyverse, Cosmic Marmalade, Deep Freeze, Volcano, Candy (cycles each wave)
- **Boss waves** — Every 5 waves: Mega-Jar boss + minions in the Temple universe
- **MVC + EventBus** — see `guidelines_skill.md` and `TASKS.md`

## Build

```bash
npm run build
```

Deploy `dist/` to Vercel or any static host.
