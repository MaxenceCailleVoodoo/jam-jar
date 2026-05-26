# Jeu 2 Confiture

**Tu es un pot de confiture.** Les tartines de pain de mie te chassent. Appuie sur **SPACE** pour libérer la confiture et les faire toutes splatter — soit partout, soit dans un rayon autour de toi (selon le style).

2 hits et le pot se brise.

## Run

```bash
npm install
npm run dev
```

## Itération 2 — 3 styles smooth/vectoriels

Au démarrage, un picker propose 3 directions visuelles très différentes, toutes vectorielles (plus de pixel art) :

- **Juicy** — mobile arcade pastel, formes rebondissantes, attaque GLOBALE (cooldown 6.5s)
- **Neon Liquid** — synthwave glow, trail, attaque RAYON 240px (cooldown court 2.4s)
- **Watercolor Doodle** — hand-drawn wobble papier, attaque GLOBALE en gros splat (cooldown 7.5s)

## Contrôles

| Input | Action |
|-------|--------|
| WASD / flèches | Bouger |
| SPACE | Déclencher la confiture |
| R | Rejouer |
| ESC | Retour au menu de styles |

## Mécanique partagée

- 2 PV, mort = pot brisé en éclats animés
- Tartines spawnent depuis les bords et chassent le joueur
- Difficulté qui ramp sur 60s (vitesse + fréquence de spawn)
- Combo exponentiel : `100·n + 60·n²` → 1 kill = +160, 4 kills = +1360, 10 kills = +7000
