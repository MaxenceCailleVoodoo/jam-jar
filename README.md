# Confiture Ops

Dead Ops–style top-down zombie arcade shooter. Stick figures, dot zombies, funny quips.

## Run locally

```bash
npm install
npm run dev
```

Open in a desktop browser. **WASD** to move, **mouse** to aim, **click** or **Space** to shoot.

## Build

```bash
npm run build
```

Output in `dist/` — deploy to Vercel or any static host.

## Architecture

Phaser 3 + Vite, MVC with EventBus. See `guidelines_skill.md` and `TASKS.md`.
