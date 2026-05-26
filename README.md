# Jeu 2 Confiture

**Tu es un pot de confiture** (style aquarelle doodle). Les tartines de pain de mie te chassent. Le pot se **charge** progressivement — quand tu appuies sur **SPACE**, la confiture explose (rayon selon la charge, ou toutes les tartines si plein).

2 impacts et le pot se fissure puis se brise.

## Run

```bash
npm install
npm run dev
```

## Contrôles

| Input | Action |
|-------|--------|
| WASD / flèches | Bouger |
| SPACE | Exploser (selon charge) |
| R | Rejouer |

## Mécanique

- **Charge** : le pot se remplit visuellement de confiture (0 → 100 %)
- **Explosion partielle** : rayon proportionnel à la charge
- **Explosion pleine** : toutes les tartines du plateau
- **2 PV** : 1ère touche = pot fêlé, 2ème = pot cassé + game over
- **Fin de partie** : score, max tartines en 1 coup, moyenne par coup
