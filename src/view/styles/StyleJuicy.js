/**
 * Style 1 — Juicy Vector (mobile arcade).
 * Couleurs pastel saturées, formes vectorielles smooth, particules juteuses.
 * Attaque : GLOBALE (SPACE) — vague de confiture qui balaie tout l'écran.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  killAllEnemies,
  QUIPS_JUICY, QUIPS_DEATH, pickQuip, playJamExplosion,
} from './sharedSurvival.js';

const KEY = 'StyleJuicy';

const PALETTE = {
  bgTop: '#ffe3b0',
  bgBot: '#ff9d7a',
  jamColor: '#ff2855',
  jamDark: '#a8113c',
  jamLight: '#ff6a8a',
  lidColor: '#3a1a22',
  lidLight: '#5a2a32',
  glassTint: '#dceaf2',
  toastInner: '#fff0c8',
  toastInnerDark: '#e8b870',
  toastCrust: '#a66832',
  toastCrustDark: '#6b3a18',
  ink: '#1a0a08',
  uiText: '#3a1a22',
  uiAccent: '#ff2855',
};

const ATTACK_COOLDOWN_MS = 6500;

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

function buildJarTexture(scene, key, cracked = false) {
  if (scene.textures.exists(key)) return;
  const W = 180; const H = 220;
  const { canvas, ctx } = makeCanvas(W, H);

  ctx.fillStyle = 'rgba(40,15,30,0.22)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.95, W * 0.32, H * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  const glassGrad = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.92);
  glassGrad.addColorStop(0, 'rgba(220, 235, 245, 0.55)');
  glassGrad.addColorStop(1, 'rgba(140, 170, 195, 0.55)');
  ctx.fillStyle = glassGrad;
  rrect(ctx, W * 0.17, H * 0.22, W * 0.66, H * 0.7, W * 0.08);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();

  const jamGrad = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.9);
  jamGrad.addColorStop(0, PALETTE.jamLight);
  jamGrad.addColorStop(0.4, PALETTE.jamColor);
  jamGrad.addColorStop(1, PALETTE.jamDark);
  ctx.fillStyle = jamGrad;
  rrect(ctx, W * 0.21, H * 0.32, W * 0.58, H * 0.58, W * 0.06);
  ctx.fill();

  ctx.fillStyle = PALETTE.jamLight;
  ctx.beginPath();
  ctx.moveTo(W * 0.21, H * 0.35);
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = W * 0.21 + t * W * 0.58;
    const y = H * 0.33 + Math.sin(t * Math.PI * 3) * H * 0.012;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W * 0.79, H * 0.42);
  ctx.lineTo(W * 0.21, H * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  rrect(ctx, W * 0.24, H * 0.4, W * 0.05, H * 0.4, W * 0.025);
  ctx.fill();

  const lidGrad = ctx.createLinearGradient(0, H * 0.07, 0, H * 0.24);
  lidGrad.addColorStop(0, PALETTE.lidLight);
  lidGrad.addColorStop(1, PALETTE.lidColor);
  ctx.fillStyle = lidGrad;
  rrect(ctx, W * 0.13, H * 0.07, W * 0.74, H * 0.17, W * 0.045);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  rrect(ctx, W * 0.17, H * 0.1, W * 0.22, H * 0.03, 4);
  ctx.fill();

  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(W * 0.4, H * 0.58, W * 0.045, 0, Math.PI * 2);
  ctx.arc(W * 0.6, H * 0.58, W * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(W * 0.415, H * 0.57, W * 0.015, 0, Math.PI * 2);
  ctx.arc(W * 0.615, H * 0.57, W * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = W * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(W * 0.5, H * 0.66, W * 0.1, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (cracked) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.36, H * 0.3);
    ctx.lineTo(W * 0.42, H * 0.5);
    ctx.lineTo(W * 0.38, H * 0.65);
    ctx.lineTo(W * 0.46, H * 0.8);
    ctx.moveTo(W * 0.5, H * 0.4);
    ctx.lineTo(W * 0.62, H * 0.55);
    ctx.lineTo(W * 0.6, H * 0.75);
    ctx.stroke();
  }

  scene.textures.addCanvas(key, canvas);
}

function buildToastTexture(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 130; const H = 130;
  const { canvas, ctx } = makeCanvas(W, H);

  ctx.fillStyle = 'rgba(40,20,10,0.25)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.93, W * 0.33, H * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PALETTE.toastCrustDark;
  rrect(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8, W * 0.18);
  ctx.fill();

  ctx.fillStyle = PALETTE.toastCrust;
  rrect(ctx, W * 0.12, H * 0.12, W * 0.76, H * 0.76, W * 0.16);
  ctx.fill();

  const grad = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.55, W * 0.45);
  grad.addColorStop(0, PALETTE.toastInner);
  grad.addColorStop(1, PALETTE.toastInnerDark);
  ctx.fillStyle = grad;
  rrect(ctx, W * 0.2, H * 0.2, W * 0.6, H * 0.6, W * 0.1);
  ctx.fill();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = W * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.3, H * 0.38);
  ctx.lineTo(W * 0.42, H * 0.46);
  ctx.moveTo(W * 0.7, H * 0.38);
  ctx.lineTo(W * 0.58, H * 0.46);
  ctx.stroke();

  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(W * 0.36, H * 0.52, W * 0.05, 0, Math.PI * 2);
  ctx.arc(W * 0.64, H * 0.52, W * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = W * 0.035;
  ctx.beginPath();
  ctx.moveTo(W * 0.32, H * 0.72);
  ctx.lineTo(W * 0.4, H * 0.68);
  ctx.lineTo(W * 0.48, H * 0.72);
  ctx.lineTo(W * 0.56, H * 0.68);
  ctx.lineTo(W * 0.64, H * 0.72);
  ctx.lineTo(W * 0.7, H * 0.7);
  ctx.stroke();

  scene.textures.addCanvas(key, canvas);
}

function buildBlobTexture(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const W = 32; const H = 32;
  const { canvas, ctx } = makeCanvas(W, H);
  const grad = ctx.createRadialGradient(W * 0.4, H * 0.4, 0, W / 2, H / 2, W / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
  ctx.fill();
  scene.textures.addCanvas(key, canvas);
}

export class StyleJuicyScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildJarTexture(this, `${KEY}-jar`, false);
    buildJarTexture(this, `${KEY}-jar-hurt`, true);
    buildToastTexture(this, `${KEY}-toast`);
    buildBlobTexture(this, `${KEY}-jam`, PALETTE.jamColor);
    buildBlobTexture(this, `${KEY}-crumb`, PALETTE.toastCrust);

    setupMovementInput(this);

    this.cameras.main.setBackgroundColor(PALETTE.bgTop);

    const bgGrad = this.add.graphics();
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(255 - (255 - 255) * t);
      const g = Math.round(227 - (227 - 157) * t);
      const b = Math.round(176 - (176 - 122) * t);
      bgGrad.fillStyle((r << 16) | (g << 8) | b, 1);
      bgGrad.fillRect(0, (ARENA.height / steps) * i, ARENA.width, ARENA.height / steps + 1);
    }

    for (let i = 0; i < 12; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(40, ARENA.width - 40),
        Phaser.Math.Between(40, ARENA.height - 40),
        Phaser.Math.Between(12, 26),
        0xffffff, 0.18,
      ).setDepth(1);
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(20, 60),
        alpha: 0.06,
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;
    this.lastAttackAt = -ATTACK_COOLDOWN_MS;

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, `${KEY}-jar`);
    this.player.setScale(0.5);
    this.player.body.setCircle(48, 42, 50);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);

    this.tweens.add({
      targets: this.player,
      scaleY: 0.52,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.enemies = this.physics.add.group();
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.onPlayerTouch(e));

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.hudPanel = this.add.rectangle(0, 0, ARENA.width, 70, 0xffffff, 0.85)
      .setOrigin(0).setDepth(100);
    this.add.rectangle(0, 68, ARENA.width, 4, 0xff2855, 0.8).setOrigin(0).setDepth(100);

    this.hudScore = this.add.text(28, 18, 'SCORE 0', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '30px',
      fontStyle: 'bold', color: PALETTE.uiText,
    }).setDepth(101);

    this.hudHp = this.add.text(28, 46, '\u2665 \u2665', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '18px',
      fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setDepth(101);

    this.attackButton = this.add.container(ARENA.width - 110, 35).setDepth(101);
    this.attackBg = this.add.circle(0, 0, 30, 0xff2855, 1);
    this.attackBg.setStrokeStyle(3, 0xffffff, 1);
    this.attackText = this.add.text(0, 0, 'JAM', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '18px',
      fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.attackCdMask = this.add.graphics();
    this.attackButton.add([this.attackBg, this.attackCdMask, this.attackText]);

    this.add.text(ARENA.width - 168, 28, 'SPACE', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '14px',
      color: PALETTE.uiText,
    }).setDepth(101);
    this.add.text(ARENA.width - 168, 48, 'globale', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '12px',
      color: PALETTE.uiText,
    }).setDepth(101);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.22, '', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '64px',
      fontStyle: 'bold', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(102).setAlpha(0);

    this.add.text(ARENA.width - 28, ARENA.height - 24, 'ESC \u2192 menu', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '14px',
      color: PALETTE.uiText,
    }).setOrigin(1, 1).setDepth(101);

    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, `${KEY}-toast`);
    e.setScale(0.45);
    e.body.setCircle(38, 28, 28);
    e.setDepth(15);
    this.tweens.add({
      targets: e,
      angle: { from: -6, to: 6 },
      duration: 280, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = spawnIntervalFor(this.time.now - this.startTime);
  }

  tryAttack() {
    if (!this.alive) return;
    const elapsed = this.time.now - this.lastAttackAt;
    if (elapsed < ATTACK_COOLDOWN_MS) return;
    this.lastAttackAt = this.time.now;
    this.doGlobalJamWipe();
  }

  doGlobalJamWipe() {
    playJamExplosion(this);

    const jx = this.player.x; const jy = this.player.y;

    this.tweens.add({
      targets: this.player,
      scale: 0.62,
      duration: 120, yoyo: true, ease: 'Cubic.easeOut',
    });

    const wave = this.add.circle(jx, jy, Math.max(ARENA.width, ARENA.height), PALETTE.jamColor, 0.85)
      .setDepth(60).setScale(0.05);
    this.tweens.add({
      targets: wave,
      scale: 1.2,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.easeOut',
      onComplete: () => wave.destroy(),
    });
    const innerWave = this.add.circle(jx, jy, Math.max(ARENA.width, ARENA.height), PALETTE.jamLight, 0.55)
      .setDepth(61).setScale(0.05);
    this.tweens.add({
      targets: innerWave,
      scale: 1.1,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => innerWave.destroy(),
    });

    const splash = this.add.particles(jx, jy, `${KEY}-jam`, {
      speed: { min: 220, max: 520 },
      angle: { min: 0, max: 360 },
      lifespan: 700,
      scale: { start: 1.6, end: 0 },
      quantity: 24,
      blendMode: 'NORMAL',
      emitting: false,
    }).setDepth(62);
    splash.explode(60);
    this.time.delayedCall(900, () => splash.destroy());

    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(120, 255, 200, 200);

    const killed = killAllEnemies(this, jx, jy);
    if (killed > 0) {
      const pts = scoreForCombo(killed);
      this.score += pts;
      this.hudScore.setText(`SCORE ${this.score}`);
      this.showCombo(killed, pts);
    }

    this.popBigText(jx, jy - 40, 'JAM!');
  }

  killEnemy(e, fromX, fromY) {
    const angle = Math.atan2(e.y - fromY, e.x - fromX);
    const dx = Math.cos(angle) * 120;
    const dy = Math.sin(angle) * 120;
    if (e.body) e.body.enable = false;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      scale: 0.1,
      alpha: 0,
      angle: Phaser.Math.Between(-180, 180),
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => e.destroy(),
    });
    const splat = this.add.particles(e.x, e.y, `${KEY}-jam`, {
      speed: { min: 80, max: 240 },
      angle: { min: 0, max: 360 },
      lifespan: 480,
      scale: { start: 0.9, end: 0 },
      quantity: 8,
      emitting: false,
    }).setDepth(58);
    splat.explode(14);
    this.time.delayedCall(700, () => splat.destroy());
    if (Math.random() < 0.4) this.popText(e.x, e.y - 24, pickQuip(QUIPS_JUICY));
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}\n+${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setAlpha(1);
    this.hudCombo.setScale(0.4);
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo,
      scale: 1.0,
      duration: 350,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: this.hudCombo,
      alpha: 0,
      delay: 1400,
      duration: 500,
    });
  }

  popBigText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '72px',
      fontStyle: 'bold', color: '#ffffff',
      stroke: PALETTE.jamDark, strokeThickness: 10,
    }).setOrigin(0.5).setDepth(70).setScale(0.2);
    this.tweens.add({
      targets: t, scale: 1.2, duration: 280, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: t, alpha: 0, y: y - 60, delay: 400, duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  popText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '20px',
      fontStyle: 'bold', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(65);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, scale: 1.3, duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  onPlayerTouch(_e) {
    this.hitPlayer();
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(220, 0.014);
    this.cameras.main.flash(120, 255, 60, 60);
    this.player.setTexture(`${KEY}-jar-hurt`);
    this.hudHp.setText(this.hp > 0 ? '\u2665' : '');
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();
    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);

    const splat = this.add.particles(dx0, dy0, `${KEY}-jam`, {
      speed: { min: 120, max: 360 },
      angle: { min: 0, max: 360 },
      lifespan: 900,
      scale: { start: 1.4, end: 0 },
      quantity: 40,
      emitting: false,
    }).setDepth(60);
    splat.explode(40);

    const puddle = this.add.ellipse(dx0, dy0 + 12, 30, 16, 0xff2855, 0.9).setDepth(15);
    this.tweens.add({
      targets: puddle, scaleX: 8, scaleY: 5, alpha: 0.7, duration: 900,
    });

    this.cameras.main.shake(520, 0.022);
    this.time.delayedCall(1000, () => this.showGameOver());
  }

  showGameOver() {
    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0x000000, 0.55).setDepth(200);
    const card = this.add.rectangle(ARENA.width / 2, ARENA.height / 2, 560, 320, 0xffffff, 0.95).setDepth(201);
    card.setStrokeStyle(6, 0xff2855, 1);
    this.add.text(ARENA.width / 2, ARENA.height * 0.38, pickQuip(QUIPS_DEATH), {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '40px',
      fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(202);
    this.add.text(ARENA.width / 2, ARENA.height * 0.5, `${this.score}`, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '64px',
      fontStyle: 'bold', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);
    this.add.text(ARENA.width / 2, ARENA.height * 0.6, 'R rejouer   \u00b7   ESC menu', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '20px',
      color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  updateCooldownRing() {
    const elapsed = this.time.now - this.lastAttackAt;
    const ratio = Math.min(1, elapsed / ATTACK_COOLDOWN_MS);
    this.attackCdMask.clear();
    if (ratio < 1) {
      this.attackCdMask.fillStyle(0x000000, 0.55);
      this.attackCdMask.slice(0, 0, 30, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + 360 * (1 - ratio)), false);
      this.attackCdMask.fillPath();
      this.attackBg.setFillStyle(0x6a1a2a, 1);
      this.attackText.setAlpha(0.7);
    } else {
      this.attackBg.setFillStyle(0xff2855, 1);
      this.attackText.setAlpha(1);
    }
  }

  update() {
    if (!this.alive) return;

    const { vx, vy } = readMovementInput(this);
    const speed = 240;
    this.player.body.setVelocity(vx * speed, vy * speed);

    if (vx !== 0) {
      this.player.setRotation(Phaser.Math.Linear(this.player.rotation, vx * 0.18, 0.18));
    } else {
      this.player.setRotation(Phaser.Math.Linear(this.player.rotation, 0, 0.18));
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.tryAttack();
    this.updateCooldownRing();

    const speedNow = enemySpeedFor(this.time.now - this.startTime);
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      chasePlayer(e, this.player, speedNow);
    });

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 70) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
