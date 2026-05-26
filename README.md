# Jeu 2 Confiture

2D pixel-art : **tu es un pot de confiture**, esquive les ennemis du petit-déj' et déclenche des **bombes en chaîne** pour faire péter tout le monde.

2 touches et le pot se brise. Plus d'ennemis dans une seule explosion = plus de points.

## Run

```bash
npm install
npm run dev
```

## Itération 1 — 3 styles à comparer

Au démarrage, un picker propose 3 prototypes du même gameplay :

- **A — Saturday Cartoon** : chaleureux, bouncy, familial
- **B — Pantry Noir** : sombre, tendu, fog of war
- **C — Neon Arcade** : synthwave, dash (SHIFT), score chase

## Contrôles

| Input | Action |
|-------|--------|
| WASD / flèches | Bouger |
| SHIFT | Dash (Style C uniquement) |
| R | Rejouer |
| ESC | Retour au menu de styles |

## Mécanique partagée

- 2 PV, mort = pot brisé
- Ennemis attirés par le joueur
- Bombes posées sur la map → contact déclenche une explosion AOE
- Combo exponentiel : 1 kill = +160, 4 kills = +1360, 10 kills = +7000

## Ancien shooter (legacy)

Le shooter "Jam Ops" original reste accessible via le code (scènes `MainMenuScene` + `GameScene`) mais n'est plus branché au boot.
