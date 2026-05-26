/**
 * Logique partagée par les 3 prototypes smooth.
 * Mécanique : esquiver les tartines + appuyer sur SPACE pour déclencher
 * une attaque "JAM" (globale ou en rayon selon le style).
 */

export const ARENA = {
  width: 1280,
  height: 720,
  margin: 24,
};

export const SURVIVAL = {
  playerHp: 2,
  invincibleMs: 1100,
  enemyBaseSpeed: 70,
  enemyMaxSpeed: 175,
  enemySpawnStartMs: 950,
  enemySpawnMinMs: 240,
  enemySpawnRampMs: 50000,
  difficultyRampMs: 60000,
};

export function setupMovementInput(scene) {
  scene.cursors = scene.input.keyboard.createCursorKeys();
  scene.wasd = scene.input.keyboard.addKeys({
    W: Phaser.Input.Keyboard.KeyCodes.W,
    A: Phaser.Input.Keyboard.KeyCodes.A,
    S: Phaser.Input.Keyboard.KeyCodes.S,
    D: Phaser.Input.Keyboard.KeyCodes.D,
  });
  scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
}

export function readMovementInput(scene) {
  const c = scene.cursors;
  const w = scene.wasd;
  let vx = 0;
  let vy = 0;
  if (c.left.isDown || w.A.isDown) vx -= 1;
  if (c.right.isDown || w.D.isDown) vx += 1;
  if (c.up.isDown || w.W.isDown) vy -= 1;
  if (c.down.isDown || w.S.isDown) vy += 1;
  if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
  return { vx, vy };
}

export function chasePlayer(enemy, player, speed) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const d = Math.hypot(dx, dy) || 1;
  enemy.body.setVelocity((dx / d) * speed, (dy / d) * speed);
}

export function randomEdgeSpawn() {
  const side = Phaser.Math.Between(0, 3);
  const m = 40;
  if (side === 0) return { x: Phaser.Math.Between(m, ARENA.width - m), y: -m };
  if (side === 1) return { x: ARENA.width + m, y: Phaser.Math.Between(m, ARENA.height - m) };
  if (side === 2) return { x: Phaser.Math.Between(m, ARENA.width - m), y: ARENA.height + m };
  return { x: -m, y: Phaser.Math.Between(m, ARENA.height - m) };
}

export function scoreForCombo(n) {
  if (n <= 0) return 0;
  return Math.round(100 * n + 60 * n * n);
}

export function comboTier(n) {
  if (n >= 15) return 'GODLIKE';
  if (n >= 10) return 'INSANE';
  if (n >= 6) return 'MASSIVE';
  if (n >= 4) return 'BIG';
  if (n >= 2) return 'COMBO';
  return 'POP';
}

export function enemySpeedFor(elapsedMs) {
  const t = Math.min(1, elapsedMs / SURVIVAL.difficultyRampMs);
  return SURVIVAL.enemyBaseSpeed + (SURVIVAL.enemyMaxSpeed - SURVIVAL.enemyBaseSpeed) * t;
}

export function spawnIntervalFor(elapsedMs) {
  const t = Math.min(1, elapsedMs / SURVIVAL.enemySpawnRampMs);
  return SURVIVAL.enemySpawnStartMs + (SURVIVAL.enemySpawnMinMs - SURVIVAL.enemySpawnStartMs) * t;
}

/**
 * Tue tous les ennemis dans un rayon. Renvoie le nombre tué.
 * `scene.killEnemy(enemy, fromX, fromY)` doit être défini par chaque style.
 */
export function killEnemiesInRadius(scene, x, y, radius) {
  let killed = 0;
  scene.enemies.children.iterate((e) => {
    if (!e?.active) return;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d <= radius) {
      killed += 1;
      scene.killEnemy(e, x, y);
    }
  });
  return killed;
}

export function killAllEnemies(scene, fromX, fromY) {
  let killed = 0;
  scene.enemies.children.iterate((e) => {
    if (!e?.active) return;
    killed += 1;
    scene.killEnemy(e, fromX, fromY);
  });
  return killed;
}

/** Tue les ennemis avec un léger décalage (effet cinématique). */
export function killEnemiesStaggered(scene, enemies, fromX, fromY, stepMs = 45) {
  let i = 0;
  let killed = 0;
  for (const e of enemies) {
    if (!e?.active) continue;
    killed += 1;
    const delay = i * stepMs;
    i += 1;
    if (delay <= 0) {
      scene.killEnemy(e, fromX, fromY);
    } else {
      scene.time.delayedCall(delay, () => {
        if (e?.active) scene.killEnemy(e, fromX, fromY);
      });
    }
  }
  return killed;
}

export const QUIPS_JUICY = [
  'YOU GET TOASTED',
  'BREAD AND BURIED',
  'CRUMBED',
  'JAMMED',
  'BUTTER LUCK NEXT TIME',
  'TOAST OF THE TOWN',
  'CRUST IN PIECES',
];

export const QUIPS_NEON = [
  'TOASTED!',
  'OVERCLOCKED',
  'BREAD.EXE STOPPED',
  'SYSTEM JAMMED',
  'GLITCHED OUT',
  'X-COMBO',
];

export const QUIPS_DOODLE = [
  'splat!',
  'oh non du pain',
  'mode confiture',
  'pof!',
  'gloup',
  'bye toast',
];

export const QUIPS_DEATH = [
  'POT FRACASSÉ',
  'GAME OVER',
  'CONFITURE RÉPANDUE',
];

export function pickQuip(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const JAM_EXPLOSION_VOLUME = 0.9;
const JAM_EXPLOSION_FALLBACK_MS = 3200;

/** Pause la BGM, joue l'explosion confiture, puis remet la BGM. */
export function playJamExplosion(scene) {
  const sm = scene.sound;
  const bgm = sm.get('bgm');

  if (bgm && bgm.getData('jamExplosionActive') !== true) {
    bgm.setData('jamExplosionActive', true);
    bgm.setData('jamExplosionSavedVolume', bgm.volume);
    bgm.setData('jamExplosionWasPlaying', bgm.isPlaying);
    if (bgm.isPlaying) bgm.pause();
  }

  let sfx = sm.get('jam-explosion');
  if (!sfx) sfx = sm.add('jam-explosion', { volume: JAM_EXPLOSION_VOLUME });
  if (sfx.isPlaying) sfx.stop();

  let restored = false;
  const restoreBgm = () => {
    if (restored) return;
    restored = true;
    if (!bgm || bgm.getData('jamExplosionActive') !== true) return;

    const vol = bgm.getData('jamExplosionSavedVolume');
    const wasPlaying = bgm.getData('jamExplosionWasPlaying');
    bgm.setData('jamExplosionActive', null);
    bgm.setData('jamExplosionSavedVolume', null);
    bgm.setData('jamExplosionWasPlaying', null);

    if (typeof vol === 'number') bgm.setVolume(vol);
    if (wasPlaying && !bgm.isPlaying) bgm.play();
  };

  sfx.once('complete', restoreBgm);
  scene.time.delayedCall(JAM_EXPLOSION_FALLBACK_MS, restoreBgm);
  sfx.play();
}
