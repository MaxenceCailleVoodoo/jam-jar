> 🌐 This is the **Phaser.js + AI agent** variant of the hackathon prep. Teams delegate all coding to Cursor / Claude Code. Phaser.js is chosen because JavaScript is the most represented language in AI training data, the entire game lives in plain `.js` files with no visual editor, and a working demo is a shareable browser URL — no build, no install, no APK.
> 

# 📋 Step 1 — Pre-registration form

## Form questions

**Section 1 — Your game idea**

- **Q1 — Game idea:** Describe your game idea in 1–3 sentences. One mechanic, keep it simple.
- **Q2 — Core mechanic:** What is the main player action? (tap, swipe, hold, dodge, time your release…)
- **Q3 — Visual vibe:** What style fits your idea? *(Single choice)*
    - Minimalist / geometric
    - Pixel art / retro
    - Cute / kawaii
    - Abstract / psychedelic
    - No preference

**Section 2 — Your role preference**

- **Q4 — Role:** Which role fits you best? *(Single choice)*
    - 🧭 **Product / Lead** — scope the game, drive the AI agents, own the demo
    - ⚙️ **Game mechanic** — prompt the core loop, physics, difficulty curve, game state
    - 🎨 **UI / Feel** — prompt assets, animations, sound, screen layouts, polish
    - 🤷 No preference
- **Q5 — Tech stack preference:** We'll use Phaser.js as the default. Do you have a strong preference for something else? *(Single choice)*
    - 🟢 Phaser.js — happy with the recommendation
    - 🎮 Godot 4 — I'd prefer a native game engine feel
    - 🌐 Babylon.js — I want to build something in 3D
    - 🎲 Other (specify in Q6)
    - 🤷 No preference
- **Q6 — If "Other", which stack?** *(Short text, optional)*

---

# 🛠️ Step 2 — Tech stack

## Why Phaser.js when AI agents do the coding

When humans code, language familiarity matters. When AI agents code, what matters is how deeply the framework is represented in training data. JavaScript wins that ranking decisively.

| Stack | AI coding confidence | Notes |
| --- | --- | --- |
| **Phaser.js** | ⭐⭐⭐⭐⭐ | JS most trained language. Massive Phaser community & docs |
| Unity (C#) | ⭐⭐⭐⭐ | C# well-covered but complex engine surface area |
| Babylon.js | ⭐⭐⭐⭐ | Excellent for 3D, overkill for hyper-casual 2D |
| Godot (GDScript) | ⭐⭐⭐ | GDScript underrepresented, Godot 4 API is recent |

## The decisive advantages

- **Zero setup** — a Phaser project is a folder with `index.html` + `game.js`. Clone and open in a browser in 30 seconds. No account, no license, no 2GB download.
- **Everything is a file** — no visual editor, no `.tscn`, no `.unity` scenes. AI agents read and write pure `.js` files. The entire game fits in one context window.
- **Demo is a URL** — deploy to Vercel in 2 minutes. Share a link. Everyone plays on their own phone simultaneously. No build machine, no APK.
- **Best AI agent output** — Claude Code and Cursor are maximally confident with JavaScript + Phaser. Fewer corrections, faster iteration.
- **MVC maps cleanly to JS classes** — no engine abstraction in the way.

## Alternative stacks (opt-in per team)

| Stack | Best for | Watch out for |
| --- | --- | --- |
| Godot 4 | Teams wanting a native engine feel | Scene file setup, less AI coverage |
| Babylon.js | Teams pitching a specifically 3D concept | 3D design adds complexity beyond the code |
| Kaboom.js | Minimal API, game jam feel | Less AI training coverage than Phaser |

## Pre-start checklist (< 5 minutes, can be done on the day)

- [ ]  Install [Node.js LTS](https://nodejs.org)
- [ ]  Install Cursor or Claude Code and confirm it works
- [ ]  Clone or fork the shared GitHub repo template
- [ ]  Run `npx vite` in the project folder — browser tab opens automatically
- [ ]  Bookmark [Phaser 3 docs](https://newdocs.phaser.io) and [Phaser 3 examples](https://phaser.io/examples)

---

# 🏗️ Step 3 — MVC architecture

Phaser maps naturally to MVC through **plain JavaScript classes and a shared EventBus**. Each role owns a clear folder. They communicate exclusively through events — never by calling each other's code directly.

## Role → Layer → Folder

| MVC layer | Owns | Who | Folder |
| --- | --- | --- | --- |
| **Model** | Game state, rules, data — no rendering | ⚙️ Mechanic | `src/model/` |
| **Controller** | Input handling, game loop, spawning | ⚙️ Mechanic | `src/controller/` |
| **View** | Phaser Scenes, sprites, animations, audio | 🎨 UI / Feel | `src/view/`  • `assets/` |
| **Shared** | EventBus, utils, constants | 🧭 Lead | `src/shared/` |

> 💡 The Mechanic never touches `src/view/` or `assets/`. The UI person never touches `src/model/` or `src/controller/`. They communicate exclusively through **EventBus events**. This is the rule.
> 

## The interface contract — EventBus as the MVC boundary

`EventBus.js` is the only file both roles reference — in opposite directions.

```jsx
// src/shared/EventBus.js
import Phaser from 'phaser';
export const EventBus = new Phaser.Events.EventEmitter();
```

`GameState.js` is the Model singleton — the single source of truth:

```jsx
// src/model/GameState.js
import { EventBus } from '../shared/EventBus';

export class GameState {
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.isRunning = false;
  }
  // Called by Controller only
  startGame() {
    this.score = 0; this.lives = 3; this.isRunning = true;
    EventBus.emit('game-started');
  }
  addScore(points) {
    this.score += points;
    EventBus.emit('score-changed', this.score);
  }
  loseLife() {
    this.lives -= 1;
    EventBus.emit('life-lost', this.lives);
    if (this.lives <= 0) {
      this.isRunning = false;
      EventBus.emit('game-over', this.score);
    }
  }
}
export const gameState = new GameState();
```

The View subscribes passively — display only, zero game logic:

```jsx
// src/view/HUDScene.js
import { EventBus } from '../shared/EventBus';

export class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }
  create() {
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px' });
    this.livesText = this.add.text(16, 48, '♥ x 3', { fontSize: '24px' });
    // Subscribe to Model events — never call Model directly
    EventBus.on('score-changed', (score) => this.scoreText.setText('Score: ' + score));
    EventBus.on('life-lost', (lives) => this.livesText.setText('♥ x ' + lives));
  }
}
```

> ✅ The Mechanic changes scoring logic without touching a View file. The UI person reskins the HUD without touching game logic. Zero conflicts.
> 

---

# 📁 Step 4 — GitHub template repo

Repo name: `hackathon-phaser-template` (VoodooTeam org, marked as Template repository)

```
hackathon-phaser-template/
├── assets/                         # 🎨 UI / Feel owns
│   ├── sprites/                    # .png sprites and spritesheets
│   ├── audio/
│   │   ├── sfx/                    # .ogg / .mp3 sound effects
│   │   └── music/                  # .ogg background tracks
│   ├── fonts/                      # bitmap fonts or .ttf
│   └── tilemaps/                   # .json tilemaps (from Tiled)
├── src/
│   ├── model/                      # ⚙️ Mechanic owns — pure JS, no Phaser
│   │   ├── GameState.js            # Score, lives, events — single source of truth
│   │   └── LevelConfig.js          # Difficulty curve, spawn rates, timing
│   ├── controller/                 # ⚙️ Mechanic owns — game logic
│   │   ├── GameController.js       # Input → GameState methods
│   │   └── SpawnController.js      # Spawning enemies / collectibles
│   ├── view/                       # 🎨 UI / Feel owns — Phaser Scenes
│   │   ├── BootScene.js            # Preloads all assets
│   │   ├── MainMenuScene.js        # Title screen, Play button
│   │   ├── GameScene.js            # Main game scene (ready to build)
│   │   ├── HUDScene.js             # Score / lives overlay — EventBus listener
│   │   └── GameOverScene.js        # Final score + restart
│   ├── shared/
│   │   ├── EventBus.js             # 🧭 Lead owns — the MVC boundary
│   │   └── utils.js                # clampToScreen, randomEdge, formatScore
│   └── main.js                     # Phaser game config — Lead owns
├── TASKS.md                        # Per-role checklist — filled during paper prototype
├── index.html                      # Single HTML entry point
├── vite.config.js                  # Zero-config local dev server
├── package.json
├── .gitignore
└── README.md
```

## Pre-built scenes

- **BootScene.js** — loads all assets from `assets/`. Teams just add their asset filenames here.
- **MainMenuScene.js** — title label, Play button calling `gameState.startGame()`, background music.
- **GameScene.js** — empty scene with `HUDScene` launched in parallel. `GameController` instantiated and ready.
- **HUDScene.js** — score and lives labels connected to EventBus. Teams hide what they don't need.
- **GameOverScene.js** — final score from `gameState.score`, Restart and Main Menu buttons wired up.

## main.js — pre-configured

```jsx
import Phaser from 'phaser';
import { BootScene } from './view/BootScene';
import { MainMenuScene } from './view/MainMenuScene';
import { GameScene } from './view/GameScene';
import { HUDScene } from './view/HUDScene';
import { GameOverScene } from './view/GameOverScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 }, debug: false }
  },
  scene: [BootScene, MainMenuScene, GameScene, HUDScene, GameOverScene]
});
```

---

# 🌿 Step 5 — Branching & parallel workflow

```
main                ← always runnable, Lead merges here
├── feat/mechanic   ← Mechanic: src/model/ + src/controller/
└── feat/ui         ← UI person: src/view/ + assets/
```

## Parallel kickoff sequence

```
Paper prototype ends (T+60min)
│
├── Mechanic → opens Cursor immediately
│   └── starts GameState.js + GameController.js
│       (pure JS classes, zero Phaser dependency)
│
├── Lead → sets up repo + main.js config
│   ├── T+15min: commits stub scenes (empty Phaser.Scene classes)
│   └── T+30min: EventBus wired, game launches to main menu ✓
│
└── UI person → starts on assets (sprites, sounds)
    └── T+15min: Lead pushes stubs → UI person pulls and builds scenes
```

> ⚠️ The EventBus event list must be agreed on **before anyone codes**. Write the agreed events in [TASKS.md](http://TASKS.md) before opening Cursor. 10 minutes of alignment here saves hours of debugging.
> 

**Rules:**

- `main` must open in a browser without errors at all times
- Merge branches every 45–60 min
- Lead is the only one who edits `main.js` and `package.json`
- **Deploy to Vercel at T+3h** — don't discover deploy issues at demo time

---

# 🤖 Step 6 — Working with AI agents

## Context block — paste at the top of every prompt

```
Project: Phaser 3, JavaScript ES6 modules, 2D portrait mobile (720x1280)
Architecture: MVC with EventBus boundary.
- Model (src/model/): pure JS classes, no Phaser. Emits events via EventBus.
- Controller (src/controller/): reads input, calls Model methods.
- View (src/view/): Phaser Scenes only. Listens to EventBus. Never calls Model directly.
Current file: [filename]
EventBus events: [list them here]
```

## What agents do exceptionally well in Phaser

- Complete Phaser Scene classes from a description
- Arcade physics: velocity, gravity, colliders, overlap callbacks
- Tweens and juice: screen shake, bounce, fade in/out, scale pop
- Spawning systems with timers and difficulty curves
- Input: pointer down, swipe detection, keyboard
- Audio: loading and playing SFX and music with `this.sound`
- UI: text, progress bars, buttons with hover states

## What to watch for

- **Phaser 2 syntax** — agents sometimes use `game.add.sprite` instead of `this.add.sprite`. Specify `Phaser 3` in every prompt.
- **Scene cross-talk** — agents may reach across scenes directly. Remind them to use EventBus instead.
- **Asset key mismatches** — keys must match exactly between BootScene (load) and other scenes (use). Agents sometimes invent key names.
- **`this` context in callbacks** — arrow functions are required in Phaser event callbacks. Agents occasionally get this wrong.

## The golden rule

> One person prompts at a time per file. Two agents editing the same `.js` simultaneously creates merge conflicts harder to resolve than writing the code yourself.
> 

---

# 📋 [TASKS.md](http://TASKS.md) template

```markdown
# [Team Name] — Task breakdown

## Agreed EventBus events (fill BEFORE coding)
- game-started
- score-changed → payload: score (int)
- life-lost → payload: livesRemaining (int)
- game-over → payload: finalScore (int)
- [add yours here]

## 🧭 Lead
- [ ] Fork repo, invite teammates, set up branches
- [ ] Write main.js game config (resolution, scenes, physics)
- [ ] Own EventBus.js — add agreed events above
- [ ] Merge feat/mechanic and feat/ui every hour
- [ ] Deploy to Vercel at T+3h and verify on mobile
- [ ] Own demo: share URL + screen recording backup

## ⚙️ Mechanic
- [ ] Implement GameState.js with agreed events
- [ ] Implement core game loop in GameController.js
- [ ] Player movement / physics
- [ ] Win / lose condition
- [ ] Difficulty curve in LevelConfig.js
- [ ] SpawnController.js

## 🎨 UI / Feel
- [ ] BootScene.js — load all assets
- [ ] MainMenuScene.js — title, play button, music
- [ ] HUDScene.js — score + lives via EventBus
- [ ] GameOverScene.js — final score, restart
- [ ] Player sprite + animation
- [ ] SFX: jump, score, lose
- [ ] Polish: background, particles, screen shake (last hour only)
```

---

# 🗓️ Step 7 — Day-of agenda

| Time | Phase | Notes |
| --- | --- | --- |
| 0:00 – 0:30 | Kickoff | Theme reveal, rules, repo fork |
| 0:30 – 1:00 | Pitches & team formation | 30s pitches → vote → form teams |
| 1:00 – 2:00 | Paper prototype + [TASKS.md](http://TASKS.md) | Sketch the game. Agree on EventBus events. No code yet. |
| 2:00 – 6:00 | Build | AI pair programming. Mechanic and UI in parallel from T+15min. |
| 6:00 – 6:30 | Feature freeze | Hard stop. Polish + Vercel deploy only. |
| 6:30 – 7:30 | Demos | Share URL in group chat — everyone plays on their own phone |
| 7:30 – 8:00 | Vote & debrief | Peer voting, prizes, retro |

> ⚠️ At the 50% mark, each team cuts their feature list in half. Non-negotiable.
> 

> 💡 Demo tip: sharing the Vercel URL means everyone plays simultaneously on their own phone — way more fun than watching one person on a projector.
> 

---

# 🏆 Step 8 — Demo day scoring

Peer voting — each person distributes 3 points to other teams (not their own).

| Criterion | What to look for |
| --- | --- |
| 🎮 Fun | Did you actually want to play again? |
| 💡 Originality | Fresh mechanic or clever twist |
| ✨ Polish | Does it feel good? Sound, animations, UI |
| 📦 Completeness | Real game loop with win/lose state |

---

# 📦 Resources

## 🎨 Art — Sprites & Tilesets

| Library | License | Best for |
| --- | --- | --- |
| [Kenney.nl](http://Kenney.nl) | CC0 | Gold standard — characters, UI, tilemaps, space, platformers |
| [OpenGameArt.org](http://OpenGameArt.org) | CC0 / CC-BY | Community sprites, tiles, backgrounds |
| [itch.io](http://itch.io) [free assets](https://itch.io/game-assets/free) | Varies | Huge variety — check license per pack |
| [Pixel Frog (itch)](https://pixelfrog-assets.itch.io) | CC0 | Beautiful pixel art platformer & RPG packs |
| [Craftpix (free)](https://craftpix.net/freebies/) | Free with credit | High-quality 2D character & environment sets |
| [Game-icons.net](http://Game-icons.net) | CC-BY | 4000+ free SVG game icons |

## 🔊 Sound & Music

| Library | License | Best for |
| --- | --- | --- |
| [Freesound.org](http://Freesound.org) | CC0 / CC-BY | SFX: jumps, explosions, UI clicks |
| [BFXR](https://www.bfxr.net) | Free tool | Generate retro 8-bit SFX in seconds — hackathon gold |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Royalty-free | Easy search, no account needed |
| [Sonniss GDC Bundle](https://sonniss.com/gameaudiogdc) | Royalty-free | Professional SFX pack |
| [Suno](https://suno.com) / [Udio](https://udio.com) | AI-generated | Full music tracks in any style in under a minute |

## 🤖 AI Tools for Assets

| Tool | Use |
| --- | --- |
| Midjourney / DALL-E / Stable Diffusion | Custom sprites, backgrounds, concept art |
| [Pixellab.ai](http://Pixellab.ai) | Pixel art generation specifically |
| [Adobe Firefly (free tier)](https://firefly.adobe.com) | Quick sprite and texture generation |

## 📚 Phaser Learning

- [Phaser 3 official docs](https://newdocs.phaser.io) — always specify Phaser 3 to AI agents
- [Phaser 3 examples](https://phaser.io/examples) — live runnable code for every feature
- [Ourcade YouTube](https://www.youtube.com/@ourcade) — best Phaser 3 video tutorials
- [Phaser 3 + Vite starter](https://github.com/phaserjs/template-vite) — official zero-config template
- [Phaser World newsletter](https://phaser.io/community/newsletter) — community games and tutorials

---

# ⚠️ Pitfalls to avoid

- **Agree on EventBus events before coding** — the single most important 10 minutes of the day
- **Specify Phaser 3** in every AI agent prompt — agents sometimes default to Phaser 2 syntax
- **One person prompts per file** — two agents on the same `.js` creates conflicts
- **Deploy to Vercel at T+3h** — don't discover deploy issues at demo time
- **Test on an actual phone** before demo time — touch input and screen scaling can surprise you
- **Scope creep** — one mechanic, one screen, ship it
- **Record a screen capture** in the last 30 minutes as demo backup