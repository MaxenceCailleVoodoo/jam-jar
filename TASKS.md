# Confiture Ops 3D — Task breakdown

## Agreed EventBus events

- `game-started`
- `universe-changed` → `{ wave, universe }`
- `wave-started` → `{ wave, message, universe, isBoss }`
- `score-changed` → `score` (int)
- `zombie-killed` → `{ points, x, y, quip, isBoss }`
- `player-hit` → `{ livesRemaining }`
- `life-lost` → `livesRemaining` (int)
- `game-over` → `finalScore` (int)
- `player-shot` → `{ x, y, angle }`
- `quip-shown` → `quip` (string)
- `screen-shake` → `{ intensity }`

## Universes (one per wave)

1. Pantry Prime  
2. Neon Jellyverse  
3. Cosmic Marmalade  
4. Deep Freeze  
5. Volcano Chunky  
6. Candy Catastrophe  
7. Boss: Temple of the Mega-Jar (wave 5, 10, …)

## Controls (desktop)

- **WASD / Arrows** — move
- **Mouse** — aim
- **Left click / Space** — shoot (hold for auto-fire)
- **Enter** — start / retry from menu
