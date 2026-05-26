/**
 * Style 3 — Watercolor Doodle (hand-drawn).
 * Contours noirs wobble, remplissages aquarelle, fond papier.
 * Wobble réalisé via 3 frames d'animation cyclées à 9 fps.
 * Attaque : GLOBALE (SPACE) — gros splat aquarelle qui recouvre la page.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  killAllEnemies,
  QUIPS_DOODLE, QUIPS_DEATH, pickQuip,
} from './sharedSurvival.js';

const KEY = 'StyleDoodle';

const PALETTE = {
  paper: '#f5efde',
  paperDark: '#e8dcc0',
  ink: '#1a1410',
  jam: '#cc2244',
  jamLight: '#ff5577',
  jamWash: 'rgba(204, 34, 68, 0.55)',
  toast: '#e8b860',
  toastLight: '#f5d088',
  toastWash: 'rgba(232, 184, 96, 0.55)',
  crust: '#7a4818',
  uiText: '#2a1810',
  uiAccent: '#cc2244',
};

const ATTACK_COOLDOWN_MS = 7500;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { canvas: c, ctx };
}

/** Mulberry32 PRNG pour wobble déterministe par frame. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wobblyPath(ctx, points, jitter, rand, close = true) {
  ctx.beginPath();
  const jittered = points.map(([x, y]) => [
    x + (rand() - 0.5) * jitter,
    y + (rand() - 0.5) * jitter,
  ]);
  ctx.moveTo(jittered[0][0], jittered[0][1]);
  for (let i = 1; i < jittered.length; i++) {
    const [px, py] = jittered[i - 1];
    const [cx, cy] = jittered[i];
    const mx = (px + cx) / 2;
    const my = (py + cy) / 2;
    ctx.quadraticCurveTo(px, py, mx, my);
  }
  if (close) {
    const [px, py] = jittered[jittered.length - 1];
    const [fx, fy] = jittered[0];
    ctx.quadraticCurveTo(px, py, fx, fy);
    ctx.closePath();
  } else {
    const [px, py] = jittered[jittered.length - 1];
    ctx.lineTo(px, py);
  }
  return jittered;
}

function drawJarFrame(W, H, seed, cracked) {
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = rng(seed);

  ctx.fillStyle = 'rgba(40,30,20,0.18)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.94, W * 0.32, H * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyPts = [
    [W * 0.2, H * 0.26], [W * 0.18, H * 0.4], [W * 0.18, H * 0.6],
    [W * 0.2, H * 0.82], [W * 0.3, H * 0.9], [W * 0.5, H * 0.92],
    [W * 0.7, H * 0.9], [W * 0.8, H * 0.82], [W * 0.82, H * 0.6],
    [W * 0.82, H * 0.4], [W * 0.8, H * 0.26],
  ];

  ctx.save();
  wobblyPath(ctx, bodyPts, 4, rand, true);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.restore();

  ctx.save();
  wobblyPath(ctx, [
    [W * 0.24, H * 0.42], [W * 0.22, H * 0.62],
    [W * 0.3, H * 0.84], [W * 0.5, H * 0.86],
    [W * 0.7, H * 0.84], [W * 0.78, H * 0.62],
    [W * 0.76, H * 0.42],
  ], 5, rand, true);
  ctx.fillStyle = PALETTE.jamWash;
  ctx.fill();
  ctx.fillStyle = 'rgba(204, 34, 68, 0.35)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  wobblyPath(ctx, bodyPts, 4, rand, true);
  ctx.stroke();
  ctx.restore();

  const lidPts = [
    [W * 0.14, H * 0.1], [W * 0.16, H * 0.22],
    [W * 0.5, H * 0.26], [W * 0.84, H * 0.22],
    [W * 0.86, H * 0.1], [W * 0.7, H * 0.07],
    [W * 0.5, H * 0.06], [W * 0.3, H * 0.07],
  ];
  ctx.save();
  wobblyPath(ctx, lidPts, 4, rand, true);
  ctx.fillStyle = PALETTE.jam;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(W * 0.32, H * 0.12, W * 0.08, H * 0.012, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.ink;
  const eyeR = W * 0.045;
  ctx.beginPath();
  ctx.arc(W * 0.4 + (rand() - 0.5) * 2, H * 0.6 + (rand() - 0.5) * 2, eyeR, 0, Math.PI * 2);
  ctx.arc(W * 0.6 + (rand() - 0.5) * 2, H * 0.6 + (rand() - 0.5) * 2, eyeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.42, H * 0.7);
  ctx.quadraticCurveTo(W * 0.5, H * 0.78, W * 0.58, H * 0.7);
  ctx.stroke();

  if (cracked) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.36, H * 0.34);
    ctx.lineTo(W * 0.44, H * 0.5);
    ctx.lineTo(W * 0.38, H * 0.65);
    ctx.lineTo(W * 0.46, H * 0.82);
    ctx.moveTo(W * 0.54, H * 0.45);
    ctx.lineTo(W * 0.62, H * 0.6);
    ctx.lineTo(W * 0.58, H * 0.78);
    ctx.stroke();
  }

  return canvas;
}

function drawToastFrame(W, H, seed) {
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = rng(seed);

  ctx.fillStyle = 'rgba(40,30,20,0.18)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.93, W * 0.33, H * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  const pts = [
    [W * 0.16, H * 0.18], [W * 0.16, H * 0.5],
    [W * 0.18, H * 0.82], [W * 0.5, H * 0.86],
    [W * 0.82, H * 0.82], [W * 0.84, H * 0.5],
    [W * 0.84, H * 0.18], [W * 0.5, H * 0.14],
  ];

  ctx.save();
  wobblyPath(ctx, pts, 5, rand, true);
  ctx.fillStyle = PALETTE.toastWash;
  ctx.fill();
  ctx.fillStyle = PALETTE.toast;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  wobblyPath(ctx, pts, 5, rand, true);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = PALETTE.ink;
  const eyeR = W * 0.05;
  ctx.beginPath();
  ctx.arc(W * 0.38 + (rand() - 0.5) * 3, H * 0.46 + (rand() - 0.5) * 3, eyeR, 0, Math.PI * 2);
  ctx.arc(W * 0.62 + (rand() - 0.5) * 3, H * 0.46 + (rand() - 0.5) * 3, eyeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const my = H * 0.68;
  ctx.moveTo(W * 0.34, my);
  for (let i = 0; i <= 6; i++) {
    const x = W * 0.34 + (W * 0.32) * (i / 6);
    const y = my + ((i % 2 === 0) ? -W * 0.025 : W * 0.025);
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  return canvas;
}

function buildWobbleAnim(scene, keyBase, drawFn, args) {
  const seeds = [11, 4242, 99821];
  const frames = [];
  seeds.forEach((s, i) => {
    const key = `${keyBase}-${i}`;
    if (!scene.textures.exists(key)) {
      scene.textures.addCanvas(key, drawFn(...args, s));
    }
    frames.push({ key });
  });
  const animKey = `${keyBase}-anim`;
  if (!scene.anims.exists(animKey)) {
    scene.anims.create({
      key: animKey,
      frames,
      frameRate: 9,
      repeat: -1,
    });
  }
  return { firstKey: `${keyBase}-0`, animKey };
}

function buildBlobTexture(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const W = 36; const H = 36;
  const { canvas, ctx } = makeCanvas(W, H);
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
  ctx.fill();
  scene.textures.addCanvas(key, canvas);
}

function buildPaperTexture(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 256; const H = 256;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(150, 120, 80, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    const x1 = Math.random() * W;
    const y1 = Math.random() * H;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (Math.random() - 0.5) * 30, y1 + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120, 90, 60, 0.06)';
  for (let i = 0; i < 120; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  scene.textures.addCanvas(key, canvas);
}

export class StyleDoodleScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildPaperTexture(this, `${KEY}-paper`);
    this.jarAnim = buildWobbleAnim(this, `${KEY}-jar`, drawJarFrame, [180, 220, false]);
    this.jarHurtAnim = buildWobbleAnim(this, `${KEY}-jar-hurt`, drawJarFrame, [180, 220, true]);
    this.toastAnim = buildWobbleAnim(this, `${KEY}-toast`, drawToastFrame, [130, 130]);
    buildBlobTexture(this, `${KEY}-jam`, PALETTE.jam);
    buildBlobTexture(this, `${KEY}-jam-light`, PALETTE.jamLight);

    setupMovementInput(this);

    this.cameras.main.setBackgroundColor(PALETTE.paper);
    this.add.tileSprite(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, `${KEY}-paper`)
      .setDepth(-10);

    const borderInk = this.add.graphics().setDepth(-5);
    borderInk.lineStyle(6, 0x2a1810, 0.85);
    borderInk.beginPath();
    const m = 18;
    borderInk.moveTo(m, m);
    borderInk.lineTo(ARENA.width - m, m + 4);
    borderInk.lineTo(ARENA.width - m - 4, ARENA.height - m);
    borderInk.lineTo(m + 2, ARENA.height - m - 2);
    borderInk.lineTo(m, m + 2);
    borderInk.strokePath();

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;
    this.lastAttackAt = -ATTACK_COOLDOWN_MS;

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, this.jarAnim.firstKey);
    this.player.play(this.jarAnim.animKey);
    this.player.setScale(0.5);
    this.player.body.setCircle(50, 40, 50);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);

    this.tweens.add({
      targets: this.player,
      angle: { from: -2, to: 2 },
      duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.enemies = this.physics.add.group();
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.add.text(28, 18, 'score', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '18px', color: PALETTE.uiText,
    }).setDepth(100);

    this.hudScore = this.add.text(28, 36, '0', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '40px', fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setDepth(100);

    this.hudHp = this.add.text(28, 88, '\u2665 \u2665', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '28px', color: PALETTE.uiAccent,
    }).setDepth(100);

    this.attackLabel = this.add.text(ARENA.width - 28, 22, 'SPACE = JAM!', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '22px', fontStyle: 'bold', color: PALETTE.uiText,
    }).setOrigin(1, 0).setDepth(100);

    this.attackHint = this.add.text(ARENA.width - 28, 50, 'globale', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '14px', color: PALETTE.uiText,
    }).setOrigin(1, 0).setDepth(100);

    this.cdBar = this.add.graphics().setDepth(100);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.22, '', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '64px', fontStyle: 'bold', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    this.add.text(ARENA.width - 28, ARENA.height - 24, 'ESC \u2192 menu', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '14px', color: PALETTE.uiText,
    }).setOrigin(1, 1).setDepth(100);

    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, this.toastAnim.firstKey);
    e.play(this.toastAnim.animKey);
    e.setScale(0.42);
    e.body.setCircle(38, 28, 28);
    e.setDepth(15);
    this.tweens.add({
      targets: e,
      angle: { from: -8, to: 8 },
      duration: 320, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = spawnIntervalFor(this.time.now - this.startTime);
  }

  tryAttack() {
    if (!this.alive) return;
    const elapsed = this.time.now - this.lastAttackAt;
    if (elapsed < ATTACK_COOLDOWN_MS) return;
    this.lastAttackAt = this.time.now;
    this.doGlobalSplat();
  }

  doGlobalSplat() {
    const jx = this.player.x; const jy = this.player.y;

    this.tweens.add({
      targets: this.player,
      angle: -25, duration: 120, yoyo: true,
    });

    const splat1 = this.add.particles(jx, jy, `${KEY}-jam`, {
      speed: { min: 280, max: 720 },
      angle: { min: 0, max: 360 },
      lifespan: 900,
      scale: { start: 2.2, end: 0.4 },
      alpha: { start: 0.95, end: 0 },
      quantity: 36,
      emitting: false,
    }).setDepth(50);
    splat1.explode(70);

    const splat2 = this.add.particles(jx, jy, `${KEY}-jam-light`, {
      speed: { min: 180, max: 520 },
      angle: { min: 0, max: 360 },
      lifespan: 700,
      scale: { start: 1.2, end: 0 },
      quantity: 20,
      emitting: false,
    }).setDepth(51);
    splat2.explode(36);

    this.time.delayedCall(1200, () => { splat1.destroy(); splat2.destroy(); });

    const wave = this.add.circle(jx, jy, Math.max(ARENA.width, ARENA.height), 0xcc2244, 0.45)
      .setDepth(48).setScale(0.05);
    this.tweens.add({
      targets: wave, scale: 1.1, alpha: 0,
      duration: 820, ease: 'Cubic.easeOut',
      onComplete: () => wave.destroy(),
    });

    this.cameras.main.shake(280, 0.014);
    this.cameras.main.flash(120, 255, 200, 200);

    const killed = killAllEnemies(this, jx, jy);
    if (killed > 0) {
      const pts = scoreForCombo(killed);
      this.score += pts;
      this.hudScore.setText(`${this.score}`);
      this.showCombo(killed, pts);
    }
    this.popBigText(jx, jy - 50, killed > 0 ? 'SPLAT!' : 'POUF');
  }

  killEnemy(e, fromX, fromY) {
    const angle = Math.atan2(e.y - fromY, e.x - fromX);
    const dx = Math.cos(angle) * 100;
    const dy = Math.sin(angle) * 100;
    if (e.body) e.body.enable = false;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      scale: 0.15,
      alpha: 0,
      angle: Phaser.Math.Between(-360, 360),
      duration: 480,
      ease: 'Cubic.easeOut',
      onComplete: () => e.destroy(),
    });
    if (Math.random() < 0.5) this.popText(e.x, e.y - 18, pickQuip(QUIPS_DOODLE));
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}\n+${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setAlpha(1);
    this.hudCombo.setScale(0.4);
    this.hudCombo.setAngle(Phaser.Math.Between(-6, 6));
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo, scale: 1.0, duration: 320, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: this.hudCombo, alpha: 0, delay: 1400, duration: 500,
    });
  }

  popBigText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '64px', fontStyle: 'bold', color: '#ffffff',
      stroke: PALETTE.ink, strokeThickness: 8,
    }).setOrigin(0.5).setDepth(60).setScale(0.2).setAngle(Phaser.Math.Between(-10, 10));
    this.tweens.add({
      targets: t, scale: 1.3, duration: 320, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: t, alpha: 0, y: y - 50, delay: 450, duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  popText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '20px', fontStyle: 'bold', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(55).setAngle(Phaser.Math.Between(-12, 12));
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, scale: 1.2, duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(240, 0.014);
    this.cameras.main.flash(120, 255, 60, 60);
    this.player.play(this.jarHurtAnim.animKey);
    this.hudHp.setText(this.hp > 0 ? '\u2665' : '');
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);

    const splat = this.add.particles(dx0, dy0, `${KEY}-jam`, {
      speed: { min: 140, max: 460 },
      angle: { min: 0, max: 360 },
      lifespan: 1100,
      scale: { start: 2, end: 0.5 },
      quantity: 60,
      emitting: false,
    }).setDepth(50);
    splat.explode(50);

    this.popBigText(dx0, dy0 - 40, 'POUF');
    this.cameras.main.shake(600, 0.022);
    this.time.delayedCall(1100, () => this.showGameOver());
  }

  showGameOver() {
    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0xf5efde, 0.92).setDepth(200);
    const card = this.add.graphics().setDepth(201);
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(ARENA.width / 2 - 280, ARENA.height / 2 - 160, 560, 320, 14);
    card.lineStyle(6, 0x1a1410, 0.9);
    card.strokeRoundedRect(ARENA.width / 2 - 280, ARENA.height / 2 - 160, 560, 320, 14);

    this.add.text(ARENA.width / 2, ARENA.height * 0.38, pickQuip(QUIPS_DEATH), {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '40px', fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(202).setAngle(Phaser.Math.Between(-4, 4));
    this.add.text(ARENA.width / 2, ARENA.height * 0.5, `${this.score}`, {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '72px', fontStyle: 'bold', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);
    this.add.text(ARENA.width / 2, ARENA.height * 0.6, 'R rejouer   \u00b7   ESC menu', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '20px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  updateCooldown() {
    const elapsed = this.time.now - this.lastAttackAt;
    const ratio = Math.min(1, elapsed / ATTACK_COOLDOWN_MS);
    this.cdBar.clear();
    const x = ARENA.width - 28 - 180;
    const y = 78;
    const w = 180;
    const h = 12;
    this.cdBar.fillStyle(0xe8dcc0, 1);
    this.cdBar.fillRoundedRect(x, y, w, h, 4);
    this.cdBar.fillStyle(0xcc2244, 1);
    this.cdBar.fillRoundedRect(x, y, w * ratio, h, 4);
    this.cdBar.lineStyle(2, 0x1a1410, 0.8);
    this.cdBar.strokeRoundedRect(x, y, w, h, 4);
  }

  update() {
    if (!this.alive) return;

    const { vx, vy } = readMovementInput(this);
    const speed = 230;
    this.player.body.setVelocity(vx * speed, vy * speed);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.tryAttack();
    this.updateCooldown();

    const speedNow = enemySpeedFor(this.time.now - this.startTime);
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      chasePlayer(e, this.player, speedNow);
    });

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 80) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
