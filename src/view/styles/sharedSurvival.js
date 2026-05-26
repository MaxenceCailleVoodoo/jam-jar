/**
 * Helpers partagés par les 3 prototypes "survival + bombes à chaîne".
 * Logique de gameplay commune; chaque style décide de son rendu.
 */

export const ARENA = {
  width: 1280,
  height: 720,
  margin: 24,
};

export const SURVIVAL = {
  playerHp: 2,
  playerRadius: 18,
  enemyRadius: 16,
  bombRadius: 18,
  explosionRadius: 130,
  invincibleMs: 1100,
  enemyBaseSpeed: 70,
  enemyMaxSpeed: 170,
  enemyHpStart: 1,
  enemySpawnStartMs: 1200,
  enemySpawnMinMs: 280,
  enemySpawnRampMs: 50000,
  bombSpawnMs: 4200,
  bombMaxOnMap: 6,
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
}

export function readMovementInput(scene) {
  const cursors = scene.cursors;
  const wasd = scene.wasd;
  let vx = 0;
  let vy = 0;
  if (cursors.left.isDown || wasd.A.isDown) vx -= 1;
  if (cursors.right.isDown || wasd.D.isDown) vx += 1;
  if (cursors.up.isDown || wasd.W.isDown) vy -= 1;
  if (cursors.down.isDown || wasd.S.isDown) vy += 1;
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
  const m = 30;
  if (side === 0) return { x: Phaser.Math.Between(m, ARENA.width - m), y: -m };
  if (side === 1) return { x: ARENA.width + m, y: Phaser.Math.Between(m, ARENA.height - m) };
  if (side === 2) return { x: Phaser.Math.Between(m, ARENA.width - m), y: ARENA.height + m };
  return { x: -m, y: Phaser.Math.Between(m, ARENA.height - m) };
}

export function randomInnerPos(pad = 80, minDistFrom = null, minDist = 160) {
  for (let i = 0; i < 20; i++) {
    const x = Phaser.Math.Between(pad, ARENA.width - pad);
    const y = Phaser.Math.Between(pad, ARENA.height - pad);
    if (!minDistFrom) return { x, y };
    const d = Math.hypot(x - minDistFrom.x, y - minDistFrom.y);
    if (d >= minDist) return { x, y };
  }
  return { x: ARENA.width / 2, y: ARENA.height / 2 };
}

/** Combo scoring: exponential reward for chained kills. */
export function scoreForCombo(n) {
  if (n <= 0) return 0;
  return Math.round(100 * n + 60 * n * n);
}

export function comboTier(n) {
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

export const QUIPS_KILL = [
  'YOU GET TOASTED',
  "C'EST LA CONFITURE",
  'MARMALADE TIME',
  'BREAD AND BURIED',
  'CRUMBED',
  'JAMMED',
  'BUTTER LUCK NEXT TIME',
  'CROISSANT KAPUT',
  'BAGUETTE BAD',
  'TOAST OF THE TOWN',
];

export const QUIPS_DEATH = [
  'POT FRACASSÉ',
  'GAME OVER, MARMALADE',
  "C'EST FINI POUR LA CONFITURE",
];

export const QUIPS_NOIR = [
  'rot in pieces',
  'stale and dead',
  'crusted away',
  'gone moldy',
  'silenced',
  'crumbed in the dark',
];

export const QUIPS_NEON = [
  'TOASTED!',
  'OVERCLOCKED',
  'BREAD.EXE STOPPED',
  'SYSTEM JAMMED',
  'GLITCHED OUT',
  'X-COMBO!',
];

export function pickQuip(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
