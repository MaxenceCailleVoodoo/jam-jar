/**
 * Style 2 — Neon Liquid (glowing synthwave).
 * Fond sombre, formes vectorielles avec glow postFX, traînées de particules.
 * Attaque : RAYON (SPACE) — flaque de confiture grandit sous le pot
 * et tue les ennemis dans son périmètre. Cooldown court → usage fréquent.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  killEnemiesInRadius,
  QUIPS_NEON, QUIPS_DEATH, pickQuip, playJamExplosion,
} from './sharedSurvival.js';

const KEY = 'StyleNeonLiquid';

const PALETTE = {
  bgTop: 0x0a0420,
  bgBot: 0x18083a,
  jarOutline: '#ff3ee0',
  jarFill: '#1c0a2e',
  jamColor: '#ff3ee0',
  jamLight: '#ffa8f4',
  lidColor: '#ffee44',
  toastOutline: '#00f0ff',
  toastFill: '#06283a',
  toastInner: '#1de9ff',
  uiCyan: '#00f0ff',
  uiMagenta: '#ff3ee0',
  uiYellow: '#ffee44',
};

const ATTACK_COOLDOWN_MS = 2400;
const ATTACK_RADIUS = 240;

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { canvas: c, ctx };
}

function buildJarTexture(scene, key, cracked) {
  if (scene.textures.exists(key)) return;
  const W = 180; const H = 220;
  const { canvas, ctx } = makeCanvas(W, H);

  ctx.fillStyle = PALETTE.jarFill;
  rrect(ctx, W * 0.17, H * 0.22, W * 0.66, H * 0.7, W * 0.08);
  ctx.fill();

  const jamGrad = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.9);
  jamGrad.addColorStop(0, PALETTE.jamLight);
  jamGrad.addColorStop(1, PALETTE.jamColor);
  ctx.fillStyle = jamGrad;
  rrect(ctx, W * 0.22, H * 0.34, W * 0.56, H * 0.55, W * 0.06);
  ctx.fill();

  ctx.strokeStyle = PALETTE.jarOutline;
  ctx.lineWidth = 5;
  rrect(ctx, W * 0.17, H * 0.22, W * 0.66, H * 0.7, W * 0.08);
  ctx.stroke();

  ctx.fillStyle = PALETTE.lidColor;
  rrect(ctx, W * 0.13, H * 0.07, W * 0.74, H * 0.17, W * 0.045);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  rrect(ctx, W * 0.13, H * 0.07, W * 0.74, H * 0.17, W * 0.045);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  rrect(ctx, W * 0.26, H * 0.4, W * 0.045, H * 0.36, W * 0.022);
  ctx.fill();

  if (cracked) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.36, H * 0.3);
    ctx.lineTo(W * 0.42, H * 0.52);
    ctx.lineTo(W * 0.38, H * 0.7);
    ctx.lineTo(W * 0.46, H * 0.82);
    ctx.moveTo(W * 0.52, H * 0.4);
    ctx.lineTo(W * 0.6, H * 0.55);
    ctx.lineTo(W * 0.58, H * 0.78);
    ctx.stroke();
  }

  scene.textures.addCanvas(key, canvas);
}

function buildToastTexture(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 130; const H = 130;
  const { canvas, ctx } = makeCanvas(W, H);

  ctx.fillStyle = PALETTE.toastFill;
  rrect(ctx, W * 0.12, H * 0.12, W * 0.76, H * 0.76, W * 0.16);
  ctx.fill();

  ctx.strokeStyle = PALETTE.toastOutline;
  ctx.lineWidth = 5;
  rrect(ctx, W * 0.12, H * 0.12, W * 0.76, H * 0.76, W * 0.16);
  ctx.stroke();

  ctx.fillStyle = PALETTE.toastInner;
  ctx.globalAlpha = 0.35;
  rrect(ctx, W * 0.22, H * 0.22, W * 0.56, H * 0.56, W * 0.1);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = PALETTE.toastInner;
  ctx.beginPath();
  ctx.arc(W * 0.36, H * 0.46, W * 0.06, 0, Math.PI * 2);
  ctx.arc(W * 0.64, H * 0.46, W * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.toastOutline;
  ctx.lineWidth = W * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.36, H * 0.7);
  ctx.lineTo(W * 0.5, H * 0.62);
  ctx.lineTo(W * 0.64, H * 0.7);
  ctx.stroke();

  scene.textures.addCanvas(key, canvas);
}

function buildBlobTexture(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const W = 32; const H = 32;
  const { canvas, ctx } = makeCanvas(W, H);
  const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
  ctx.fill();
  scene.textures.addCanvas(key, canvas);
}

function buildGridTexture(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 128; const H = 128;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = '#0a0420';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120, 60, 220, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= W; i += 32) {
    ctx.moveTo(i + 0.5, 0);
    ctx.lineTo(i + 0.5, H);
  }
  for (let i = 0; i <= H; i += 32) {
    ctx.moveTo(0, i + 0.5);
    ctx.lineTo(W, i + 0.5);
  }
  ctx.stroke();
  scene.textures.addCanvas(key, canvas);
}

function tryAddGlow(obj, color, outer = 2, inner = 1, quality = 0.1) {
  try {
    if (obj.postFX) obj.postFX.addGlow(color, outer, inner, false, quality, 4);
  } catch (_e) {
    // pas de WebGL ou pas supporté — on ignore silencieusement
  }
}

export class StyleNeonLiquidScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildJarTexture(this, `${KEY}-jar`, false);
    buildJarTexture(this, `${KEY}-jar-hurt`, true);
    buildToastTexture(this, `${KEY}-toast`);
    buildBlobTexture(this, `${KEY}-jam`, PALETTE.jamColor);
    buildBlobTexture(this, `${KEY}-spark`, PALETTE.uiCyan);
    buildBlobTexture(this, `${KEY}-trail`, PALETTE.jamLight);
    buildGridTexture(this, `${KEY}-grid`);

    setupMovementInput(this);

    this.cameras.main.setBackgroundColor('#06031a');

    const bgGrad = this.add.graphics().setDepth(-10);
    const steps = 36;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(10 + (24 - 10) * t);
      const g = Math.round(4 + (8 - 4) * t);
      const b = Math.round(32 + (58 - 32) * t);
      bgGrad.fillStyle((r << 16) | (g << 8) | b, 1);
      bgGrad.fillRect(0, (ARENA.height / steps) * i, ARENA.width, ARENA.height / steps + 1);
    }

    this.grid = this.add.tileSprite(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, `${KEY}-grid`)
      .setAlpha(0.5).setDepth(-5);

    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, ARENA.width),
        Phaser.Math.Between(0, ARENA.height),
        Phaser.Math.Between(1, 2),
        0xffffff, Phaser.Math.FloatBetween(0.2, 0.6),
      ).setDepth(-4);
      this.tweens.add({
        targets: star,
        alpha: 0.05,
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
      });
    }

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;
    this.lastAttackAt = -ATTACK_COOLDOWN_MS;

    this.cdRing = this.add.graphics().setDepth(18);

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, `${KEY}-jar`);
    this.player.setScale(0.42);
    this.player.body.setCircle(48, 42, 50);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    tryAddGlow(this.player, 0xff3ee0, 4, 0.6);

    this.trail = this.add.particles(0, 0, `${KEY}-trail`, {
      follow: this.player,
      followOffset: { x: 0, y: 6 },
      speed: { min: 8, max: 30 },
      lifespan: 420,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 50,
      blendMode: 'ADD',
    }).setDepth(18);

    this.enemies = this.physics.add.group();
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs - 100,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.hudScore = this.add.text(28, 24, 'SCORE 0', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '26px',
      fontStyle: 'bold', color: PALETTE.uiCyan,
    }).setDepth(100);
    tryAddGlow(this.hudScore, 0x00f0ff, 2, 0.4);

    this.hudHp = this.add.text(28, 60, 'HP \u2588\u2588 \u2588\u2588', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px',
      color: PALETTE.uiMagenta,
    }).setDepth(100);

    this.hudAttack = this.add.text(ARENA.width - 28, 24, 'SPACE \u2192 JAM (rayon)', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px',
      color: PALETTE.uiYellow,
    }).setOrigin(1, 0).setDepth(100);
    tryAddGlow(this.hudAttack, 0xffee44, 2, 0.4);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.18, '', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '52px',
      fontStyle: 'bold', color: PALETTE.uiMagenta,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);
    tryAddGlow(this.hudCombo, 0xff3ee0, 3, 0.6);

    this.add.text(ARENA.width - 28, ARENA.height - 24, 'ESC \u2192 menu', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '14px',
      color: '#5566aa',
    }).setOrigin(1, 1).setDepth(100);

    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, `${KEY}-toast`);
    e.setScale(0.38);
    e.body.setCircle(38, 28, 28);
    e.setDepth(15);
    tryAddGlow(e, 0x00f0ff, 2, 0.4);
    this.tweens.add({
      targets: e,
      alpha: { from: 0.7, to: 1 },
      duration: 380, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = Math.max(220, spawnIntervalFor(this.time.now - this.startTime) - 80);
  }

  tryAttack() {
    if (!this.alive) return;
    const elapsed = this.time.now - this.lastAttackAt;
    if (elapsed < ATTACK_COOLDOWN_MS) return;
    this.lastAttackAt = this.time.now;
    this.doRadiusJam();
  }

  doRadiusJam() {
    playJamExplosion(this);

    const jx = this.player.x; const jy = this.player.y;

    this.tweens.add({
      targets: this.player,
      scaleY: 0.5, scaleX: 0.36,
      duration: 90, yoyo: true,
    });

    const pool = this.add.circle(jx, jy, ATTACK_RADIUS, 0xff3ee0, 0.35)
      .setDepth(8).setScale(0.1);
    this.tweens.add({
      targets: pool, scale: 1, duration: 280, ease: 'Cubic.easeOut',
    });
    this.tweens.add({
      targets: pool, alpha: 0, delay: 280, duration: 380,
      onComplete: () => pool.destroy(),
    });

    const ring = this.add.circle(jx, jy, ATTACK_RADIUS, 0xff3ee0, 0).setDepth(9).setScale(0.05);
    ring.setStrokeStyle(6, 0xff3ee0, 1);
    tryAddGlow(ring, 0xff3ee0, 4, 0.6);
    this.tweens.add({
      targets: ring, scale: 1.05, alpha: { from: 1, to: 0 },
      duration: 540, ease: 'Cubic.easeOut', onComplete: () => ring.destroy(),
    });

    const ring2 = this.add.circle(jx, jy, ATTACK_RADIUS, 0xffee44, 0).setDepth(10).setScale(0.05);
    ring2.setStrokeStyle(3, 0xffee44, 0.9);
    tryAddGlow(ring2, 0xffee44, 3, 0.4);
    this.tweens.add({
      targets: ring2, scale: 1.1, alpha: { from: 0.9, to: 0 },
      duration: 580, ease: 'Cubic.easeOut', onComplete: () => ring2.destroy(),
    });

    const splash = this.add.particles(jx, jy, `${KEY}-jam`, {
      speed: { min: 80, max: 280 },
      angle: { min: 0, max: 360 },
      lifespan: 500,
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      quantity: 20,
      emitting: false,
    }).setDepth(12);
    splash.explode(28);
    this.time.delayedCall(700, () => splash.destroy());

    this.cameras.main.shake(160, 0.008);
    this.cameras.main.flash(80, 255, 100, 220);

    const killed = killEnemiesInRadius(this, jx, jy, ATTACK_RADIUS);
    if (killed > 0) {
      const pts = scoreForCombo(killed);
      this.score += pts;
      this.hudScore.setText(`SCORE ${this.score}`);
      this.showCombo(killed, pts);
    }
  }

  killEnemy(e, fromX, fromY) {
    const angle = Math.atan2(e.y - fromY, e.x - fromX);
    const dx = Math.cos(angle) * 150;
    const dy = Math.sin(angle) * 150;
    if (e.body) e.body.enable = false;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      scaleX: 0, scaleY: 0.7,
      alpha: 0,
      angle: Phaser.Math.Between(-180, 180),
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => e.destroy(),
    });
    const sparks = this.add.particles(e.x, e.y, `${KEY}-spark`, {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      lifespan: 380,
      scale: { start: 0.7, end: 0 },
      blendMode: 'ADD',
      quantity: 8,
      emitting: false,
    }).setDepth(14);
    sparks.explode(12);
    this.time.delayedCall(600, () => sparks.destroy());
    if (Math.random() < 0.4) this.popText(e.x, e.y - 20, pickQuip(QUIPS_NEON));
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}  +${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setAlpha(1);
    this.hudCombo.setScale(0.6);
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo, scale: 1.0, duration: 260, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: this.hudCombo, alpha: 0, delay: 1000, duration: 460,
    });
  }

  popText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px',
      fontStyle: 'bold', color: PALETTE.uiYellow,
    }).setOrigin(0.5).setDepth(60);
    tryAddGlow(t, 0xffee44, 2, 0.5);
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(240, 0.016);
    this.cameras.main.flash(140, 255, 60, 60);
    this.player.setTexture(`${KEY}-jar-hurt`);
    this.hudHp.setText(this.hp > 0 ? 'HP \u2588\u2588' : 'HP ----');
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();
    this.trail.stop();

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    const burst = this.add.particles(dx0, dy0, `${KEY}-jam`, {
      speed: { min: 100, max: 360 },
      angle: { min: 0, max: 360 },
      lifespan: 900,
      scale: { start: 1.2, end: 0 },
      blendMode: 'ADD',
      quantity: 40,
      emitting: false,
    }).setDepth(40);
    burst.explode(40);

    this.cameras.main.shake(520, 0.022);
    this.cameras.main.flash(220, 255, 60, 200);
    this.time.delayedCall(900, () => this.showGameOver());
  }

  showGameOver() {
    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0x06031a, 0.85).setDepth(200);
    const t = this.add.text(ARENA.width / 2, ARENA.height * 0.34, 'GAME OVER', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '64px',
      fontStyle: 'bold', color: PALETTE.uiMagenta,
    }).setOrigin(0.5).setDepth(201);
    tryAddGlow(t, 0xff3ee0, 4, 0.7);
    this.add.text(ARENA.width / 2, ARENA.height * 0.46, pickQuip(QUIPS_DEATH), {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '22px',
      color: PALETTE.uiCyan,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.58, `SCORE  ${this.score}`, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '40px',
      fontStyle: 'bold', color: PALETTE.uiYellow,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.7, 'R rejouer   \u00b7   ESC menu', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px',
      color: PALETTE.uiCyan,
    }).setOrigin(0.5).setDepth(201);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  updateCooldownRing() {
    const elapsed = this.time.now - this.lastAttackAt;
    const ratio = Math.min(1, elapsed / ATTACK_COOLDOWN_MS);
    this.cdRing.clear();
    if (ratio < 1) {
      this.cdRing.lineStyle(4, 0xff3ee0, 0.9);
      this.cdRing.beginPath();
      this.cdRing.arc(
        this.player.x, this.player.y, 52,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * ratio),
        false,
      );
      this.cdRing.strokePath();
    } else {
      this.cdRing.lineStyle(3, 0xffee44, 0.9);
      this.cdRing.strokeCircle(this.player.x, this.player.y, 52);
    }
  }

  update() {
    if (!this.alive) return;

    this.grid.tilePositionX += 0.3;
    this.grid.tilePositionY += 0.15;

    const { vx, vy } = readMovementInput(this);
    const speed = 260;
    this.player.body.setVelocity(vx * speed, vy * speed);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.tryAttack();
    this.updateCooldownRing();

    const speedNow = enemySpeedFor(this.time.now - this.startTime) * 1.05;
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      chasePlayer(e, this.player, speedNow);
    });

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 60) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
