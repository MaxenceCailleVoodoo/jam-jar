# Confiture Ops — Task breakdown

## Agreed EventBus events

- `game-started`
- `score-changed` → payload: `score` (int)
- `wave-started` → payload: `{ wave, message }`
- `zombie-killed` → payload: `{ points, x, y, quip }`
- `player-hit` → payload: `{ livesRemaining }`
- `life-lost` → payload: `livesRemaining` (int)
- `game-over` → payload: `finalScore` (int)
- `player-shot` → payload: `{ x, y, angle }`
- `quip-shown` → payload: `quip` (string)
- `screen-shake` → payload: `{ intensity }`

## Controls (desktop)

- **WASD / Arrows** — move
- **Mouse** — aim
- **Left click / Space** — shoot (hold for auto-fire)
- **Esc** — pause (future)
- **Enter** — start / restart
- **M** — main menu from game over
