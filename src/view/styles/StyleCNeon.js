/**
 * Style C — Neon Arcade.
 * Néon synthwave (cyan/magenta/jaune sur noir), grille Tron, dash dispo (SHIFT),
 * explosions à screen shake + flash, multiplicateur de combo bien visible.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn, randomInnerPos,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  QUIPS_NEON, QUIPS_DEATH, pickQuip,
} from './sharedSurvival.js';

const KEY = 'StyleCNeon';

const PALETTE = {
  bg: '#06031a',
  grid: '#3a1a66',
  gridGlow: '#9933ff',
  jarOutline: '#ff33ee',
  jarFill: '#1a0033',
  jarCore: '#ff66ff',
  jarLid: '#ffee44',
  bread: '#00f0ff',
  breadFill: '#003344',
  breadEye: '#ffee44',
  bomb: '#ffee44',
  bombCore: '#ffffff',
  bombGlow: '#ffaa00',
  uiCyan: '#00f0ff',
  uiMagenta: '#ff33ee',
  uiYellow: '#ffee44',
};

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx };
}

function outlineRect(ctx, x, y, w, h, color) {
  px(ctx, x, y, w, 1, color);
  px(ctx, x, y + h - 1, w, 1, color);
  px(ctx, x, y, 1, h, color);
  px(ctx, x + w - 1, y, 1, h, color);
}

function buildTextures(scene) {
  if (scene.textures.exists(`${KEY}-jar`)) return;
  {
    const { canvas, ctx } = makeCanvas(48, 48);
    px(ctx, 14, 4, 20, 4, PALETTE.jarLid);
    px(ctx, 14, 3, 20, 1, '#ffffff');
    outlineRect(ctx, 10, 8, 28, 34, PALETTE.jarOutline);
    px(ctx, 11, 9, 26, 32, PALETTE.jarFill);
    px(ctx, 18, 18, 12, 14, PALETTE.jarCore);
    px(ctx, 20, 20, 8, 10, '#ffffff');
    outlineRect(ctx, 16, 14, 16, 22, '#ffffff');
    scene.textures.addCanvas(`${KEY}-jar`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(48, 48);
    px(ctx, 14, 4, 20, 4, PALETTE.jarLid);
    outlineRect(ctx, 10, 8, 28, 34, PALETTE.jarOutline);
    px(ctx, 11, 9, 26, 32, PALETTE.jarFill);
    px(ctx, 18, 14, 1, 24, '#ffffff');
    px(ctx, 12, 22, 24, 1, '#ffffff');
    px(ctx, 26, 16, 1, 22, '#ffffff');
    px(ctx, 12, 30, 18, 1, '#ffffff');
    px(ctx, 18, 18, 12, 14, PALETTE.jarCore);
    scene.textures.addCanvas(`${KEY}-jar-hurt`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(40, 40);
    outlineRect(ctx, 6, 8, 28, 24, PALETTE.bread);
    px(ctx, 7, 9, 26, 22, PALETTE.breadFill);
    px(ctx, 12, 14, 4, 4, PALETTE.breadEye);
    px(ctx, 24, 14, 4, 4, PALETTE.breadEye);
    px(ctx, 12, 24, 16, 2, PALETTE.bread);
    scene.textures.addCanvas(`${KEY}-bread`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    px(ctx, 12, 12, 8, 8, PALETTE.bombCore);
    outlineRect(ctx, 10, 10, 12, 12, PALETTE.bomb);
    outlineRect(ctx, 7, 7, 18, 18, PALETTE.bombGlow);
    px(ctx, 14, 14, 4, 4, '#ffffff');
    scene.textures.addCanvas(`${KEY}-bomb`, canvas);
  }
  {
    const size = 128;
    const { canvas, ctx } = makeCanvas(size, size);
    px(ctx, 0, 0, size, size, PALETTE.bg);
    for (let y = 0; y < size; y += 32) px(ctx, 0, y, size, 1, PALETTE.grid);
    for (let x = 0; x < size; x += 32) px(ctx, x, 0, 1, size, PALETTE.grid);
    scene.textures.addCanvas(`${KEY}-floor`, canvas);
  }
}

const DASH_SPEED = 720;
const DASH_DURATION_MS = 160;
const DASH_COOLDOWN_MS = 850;

export class StyleCNeonScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildTextures(this);

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.floor = this.add.tileSprite(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, `${KEY}-floor`);

    const border = this.add.graphics();
    border.lineStyle(2, 0xff33ee, 1);
    border.strokeRect(8, 8, ARENA.width - 16, ARENA.height - 16);
    border.lineStyle(1, 0x00f0ff, 0.6);
    border.strokeRect(4, 4, ARENA.width - 8, ARENA.height - 8);

    setupMovementInput(this);

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;
    this.lastDashAt = -10000;
    this.dashUntil = 0;
    this.dashDirX = 0;
    this.dashDirY = 0;
    this.multiplier = 1;
    this.multiplierExpires = 0;

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, `${KEY}-jar`);
    this.player.setScale(1.4);
    this.player.body.setCircle(14);
    this.player.body.setOffset(10, 12);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.enemies = this.physics.add.group();
    this.bombs = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.player, this.bombs, (_p, b) => this.triggerBomb(b));
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
    this.bombSpawnEvent = this.time.addEvent({
      delay: SURVIVAL.bombSpawnMs - 600,
      loop: true,
      callback: () => this.spawnBomb(),
    });

    this.hudScore = this.add.text(20, 16, 'SCORE 0', {
      fontFamily: 'monospace', fontSize: '22px', color: PALETTE.uiCyan,
    }).setDepth(100);

    this.hudMult = this.add.text(20, 44, 'x1', {
      fontFamily: 'monospace', fontSize: '20px', color: PALETTE.uiYellow,
    }).setDepth(100);

    this.hudHp = this.add.text(20, 72, 'HP ████ ████', {
      fontFamily: 'monospace', fontSize: '14px', color: PALETTE.uiMagenta,
    }).setDepth(100);

    this.hudDash = this.add.text(20, ARENA.height - 36, 'DASH [SHIFT]  READY', {
      fontFamily: 'monospace', fontSize: '14px', color: PALETTE.uiCyan,
    }).setDepth(100);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.18, '', {
      fontFamily: 'monospace', fontSize: '48px', color: PALETTE.uiMagenta,
      stroke: PALETTE.uiYellow, strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.add.text(ARENA.width - 20, 16, 'ESC \u2192 menu', {
      fontFamily: 'monospace', fontSize: '12px', color: '#5577aa',
    }).setOrigin(1, 0).setDepth(100);

    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    for (let i = 0; i < 3; i++) this.spawnBomb();
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, `${KEY}-bread`);
    e.setScale(1.1);
    e.body.setCircle(14);
    this.tweens.add({
      targets: e,
      alpha: { from: 0.7, to: 1 },
      duration: 320, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = Math.max(220, spawnIntervalFor(this.time.now - this.startTime) - 100);
  }

  spawnBomb() {
    if (!this.alive) return;
    if (this.bombs.countActive(true) >= SURVIVAL.bombMaxOnMap) return;
    const pos = randomInnerPos(120, this.player, 180);
    const b = this.bombs.create(pos.x, pos.y, `${KEY}-bomb`);
    b.setScale(1.5);
    b.body.setCircle(14);
    b.setImmovable(true);
    this.tweens.add({
      targets: b,
      angle: 360,
      duration: 1800, repeat: -1,
    });
    this.tweens.add({
      targets: b,
      scale: 1.75,
      duration: 360, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  triggerBomb(bomb) {
    if (!bomb.active) return;
    const bx = bomb.x; const by = bomb.y;
    bomb.destroy();

    const ring1 = this.add.circle(bx, by, SURVIVAL.explosionRadius + 30, 0xffee44, 0).setDepth(50).setScale(0.05);
    ring1.setStrokeStyle(4, 0xffee44, 1);
    this.tweens.add({
      targets: ring1, scale: 1, alpha: { from: 1, to: 0 },
      duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring1.destroy(),
    });
    const ring2 = this.add.circle(bx + 6, by - 4, SURVIVAL.explosionRadius + 14, 0xff33ee, 0).setDepth(51).setScale(0.05);
    ring2.setStrokeStyle(3, 0xff33ee, 0.85);
    this.tweens.add({
      targets: ring2, scale: 1, alpha: { from: 0.85, to: 0 },
      duration: 540, ease: 'Cubic.easeOut', onComplete: () => ring2.destroy(),
    });
    const ring3 = this.add.circle(bx - 6, by + 4, SURVIVAL.explosionRadius + 24, 0x00f0ff, 0).setDepth(52).setScale(0.05);
    ring3.setStrokeStyle(3, 0x00f0ff, 0.85);
    this.tweens.add({
      targets: ring3, scale: 1, alpha: { from: 0.85, to: 0 },
      duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring3.destroy(),
    });

    this.cameras.main.shake(220, 0.014);
    this.cameras.main.flash(80, 255, 240, 80);

    let killed = 0;
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      const d = Math.hypot(e.x - bx, e.y - by);
      if (d <= SURVIVAL.explosionRadius) {
        killed += 1;
        this.killEnemy(e, bx, by);
      }
    });

    if (killed > 0) {
      const basePts = scoreForCombo(killed);
      const pts = Math.round(basePts * this.multiplier);
      this.score += pts;
      this.hudScore.setText(`SCORE ${this.score}`);
      this.showCombo(killed, pts);
      this.bumpMultiplier(killed);
    }
  }

  bumpMultiplier(n) {
    this.multiplier = Math.min(9, this.multiplier + Math.max(1, Math.floor(n / 2)));
    this.multiplierExpires = this.time.now + 3500;
    this.hudMult.setText(`x${this.multiplier}`);
    this.hudMult.setScale(1.4);
    this.tweens.killTweensOf(this.hudMult);
    this.tweens.add({ targets: this.hudMult, scale: 1, duration: 240, ease: 'Cubic.easeOut' });
  }

  killEnemy(e, bx, by) {
    const angle = Math.atan2(e.y - by, e.x - bx);
    const dx = Math.cos(angle) * 120;
    const dy = Math.sin(angle) * 120;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      alpha: 0,
      scaleX: 0,
      scaleY: 2,
      angle: Phaser.Math.Between(-180, 180),
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => e.destroy(),
    });
    if (e.body) e.body.enable = false;
    if (Math.random() < 0.4) this.popText(e.x, e.y - 14, pickQuip(QUIPS_NEON));
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}  +${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setScale(0.7);
    this.hudCombo.setAlpha(1);
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo,
      scale: 1.05,
      duration: 200, yoyo: true,
    });
    this.tweens.add({
      targets: this.hudCombo,
      alpha: 0,
      delay: 900,
      duration: 400,
    });
  }

  popText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '16px', color: PALETTE.uiYellow,
      stroke: PALETTE.uiMagenta, strokeThickness: 2,
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    if (this.time.now < this.dashUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(260, 0.018);
    this.cameras.main.flash(120, 255, 60, 200);
    this.player.setTexture(`${KEY}-jar-hurt`);
    this.hudHp.setText(this.hp > 0 ? 'HP ████' : 'HP ----');
    this.multiplier = 1;
    this.hudMult.setText('x1');
    if (this.hp <= 0) this.die();
  }

  tryDash(vx, vy) {
    if (this.time.now - this.lastDashAt < DASH_COOLDOWN_MS) return false;
    if (vx === 0 && vy === 0) return false;
    this.lastDashAt = this.time.now;
    this.dashUntil = this.time.now + DASH_DURATION_MS;
    this.dashDirX = vx;
    this.dashDirY = vy;

    const ghost = this.add.image(this.player.x, this.player.y, `${KEY}-jar`)
      .setScale(1.4)
      .setAlpha(0.7)
      .setTint(0x00f0ff)
      .setDepth(9);
    this.tweens.add({
      targets: ghost, alpha: 0, scale: 2, duration: 260, onComplete: () => ghost.destroy(),
    });
    return true;
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();
    this.bombSpawnEvent.remove();

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    for (let i = 0; i < 16; i++) {
      const colorPool = [0xff33ee, 0x00f0ff, 0xffee44, 0xffffff];
      const shard = this.add.rectangle(
        dx0, dy0,
        Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10),
        colorPool[i % colorPool.length],
      ).setDepth(60);
      this.tweens.add({
        targets: shard,
        x: dx0 + Phaser.Math.Between(-280, 280),
        y: dy0 + Phaser.Math.Between(-260, 100),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: 900,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
    this.cameras.main.shake(500, 0.022);
    this.cameras.main.flash(220, 255, 60, 200);
    this.time.delayedCall(900, () => this.showGameOver());
  }

  showGameOver() {
    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0x06031a, 0.92).setDepth(200);
    this.add.text(ARENA.width / 2, ARENA.height * 0.34, 'GAME  OVER', {
      fontFamily: 'monospace', fontSize: '60px', color: PALETTE.uiMagenta,
      stroke: PALETTE.uiYellow, strokeThickness: 3,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.48, pickQuip(QUIPS_DEATH), {
      fontFamily: 'monospace', fontSize: '22px', color: PALETTE.uiCyan,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.58, `SCORE  ${this.score}`, {
      fontFamily: 'monospace', fontSize: '36px', color: PALETTE.uiYellow,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.7, 'R rejouer   ·   ESC menu', {
      fontFamily: 'monospace', fontSize: '16px', color: PALETTE.uiCyan,
    }).setOrigin(0.5).setDepth(201);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  update() {
    if (!this.alive) return;

    this.floor.tilePositionX += 0.4;
    this.floor.tilePositionY += 0.2;

    const { vx, vy } = readMovementInput(this);

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) this.tryDash(vx, vy);

    let speed = 270;
    let useVx = vx; let useVy = vy;
    if (this.time.now < this.dashUntil) {
      speed = DASH_SPEED;
      useVx = this.dashDirX;
      useVy = this.dashDirY;
    }
    this.player.body.setVelocity(useVx * speed, useVy * speed);

    const dashReady = this.time.now - this.lastDashAt >= DASH_COOLDOWN_MS;
    this.hudDash.setText(dashReady ? 'DASH [SHIFT]  READY' : 'DASH [SHIFT]  ...');
    this.hudDash.setColor(dashReady ? PALETTE.uiCyan : '#445577');

    if (this.time.now > this.multiplierExpires && this.multiplier > 1) {
      this.multiplier = 1;
      this.hudMult.setText('x1');
    }

    const speedNow = enemySpeedFor(this.time.now - this.startTime) * 1.05;
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      chasePlayer(e, this.player, speedNow);
    });

    if (this.time.now < this.invincibleUntil || this.time.now < this.dashUntil) {
      this.player.alpha = (Math.floor(this.time.now / 60) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
