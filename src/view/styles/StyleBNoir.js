/**
 * Style B — Pantry Noir.
 * Palette sombre, rayon de vision limité (fog of war), pace lent et tendu,
 * bombes "pot de gelée" qui pulsent en rouge avant d'exploser en flash blanc.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn, randomInnerPos,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  QUIPS_NOIR, QUIPS_DEATH, pickQuip,
} from './sharedSurvival.js';

const KEY = 'StyleBNoir';

const PALETTE = {
  bg: '#0a0608',
  floor1: '#1a1014',
  floor2: '#140a0e',
  border: '#3a1822',
  jarLid: '#3d2230',
  jarLidLight: '#5a3344',
  jarOuter: '#5a2a3a',
  jarMid: '#7a3a52',
  jarShine: '#cc8aa0',
  jarLantern: '#ffb066',
  bread: '#3a2810',
  breadCrust: '#221808',
  breadEye: '#660022',
  breadGlow: '#aa1133',
  bombShell: '#2a0f18',
  bombPulse: '#cc1133',
  bombRim: '#ffaa66',
  uiText: '#c0a090',
  uiAccent: '#cc3344',
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

function buildTextures(scene) {
  if (scene.textures.exists(`${KEY}-jar`)) return;
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    px(ctx, 9, 3, 14, 3, PALETTE.jarLid);
    px(ctx, 10, 2, 12, 2, PALETTE.jarLidLight);
    px(ctx, 8, 6, 16, 22, PALETTE.jarOuter);
    px(ctx, 10, 8, 12, 18, PALETTE.jarMid);
    px(ctx, 13, 12, 6, 10, PALETTE.jarLantern);
    px(ctx, 14, 11, 4, 2, '#ffffff');
    px(ctx, 11, 9, 2, 2, PALETTE.jarShine);
    scene.textures.addCanvas(`${KEY}-jar`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    px(ctx, 9, 3, 14, 3, PALETTE.jarLid);
    px(ctx, 10, 2, 12, 2, PALETTE.jarLidLight);
    px(ctx, 8, 6, 16, 22, PALETTE.jarOuter);
    px(ctx, 10, 8, 12, 18, PALETTE.jarMid);
    px(ctx, 15, 8, 1, 14, '#ffffff');
    px(ctx, 11, 14, 10, 1, '#ffffff');
    px(ctx, 18, 16, 1, 10, '#ffffff');
    px(ctx, 13, 12, 6, 10, PALETTE.jarLantern);
    px(ctx, 13, 18, 3, 1, '#cc3344');
    scene.textures.addCanvas(`${KEY}-jar-hurt`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(40, 40);
    px(ctx, 6, 8, 28, 26, PALETTE.breadCrust);
    px(ctx, 8, 10, 24, 22, PALETTE.bread);
    px(ctx, 7, 11, 2, 20, '#180e08');
    px(ctx, 12, 16, 3, 4, PALETTE.breadEye);
    px(ctx, 25, 16, 3, 4, PALETTE.breadEye);
    px(ctx, 12, 24, 16, 2, PALETTE.breadEye);
    px(ctx, 14, 26, 12, 1, '#aa0022');
    scene.textures.addCanvas(`${KEY}-bread`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(36, 36);
    px(ctx, 8, 8, 20, 22, PALETTE.bombShell);
    px(ctx, 10, 10, 16, 18, PALETTE.bombPulse);
    px(ctx, 12, 12, 12, 14, '#440011');
    px(ctx, 14, 14, 8, 8, PALETTE.bombPulse);
    px(ctx, 16, 6, 4, 3, PALETTE.jarLid);
    px(ctx, 8, 8, 20, 1, PALETTE.bombRim);
    scene.textures.addCanvas(`${KEY}-bomb`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(64, 64);
    px(ctx, 0, 0, 64, 64, PALETTE.floor1);
    for (let y = 0; y < 64; y += 32) {
      for (let x = 0; x < 64; x += 32) {
        if ((x + y) % 64 === 0) px(ctx, x, y, 32, 32, PALETTE.floor2);
      }
    }
    for (let i = 0; i < 18; i++) {
      px(ctx,
        Phaser.Math.Between(0, 63), Phaser.Math.Between(0, 63), 1, 1, '#241620');
    }
    scene.textures.addCanvas(`${KEY}-floor`, canvas);
  }
}

const VISION_RADIUS = 220;

export class StyleBNoirScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildTextures(this);

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    this.add.tileSprite(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, `${KEY}-floor`)
      .setTileScale(1);

    const border = this.add.graphics();
    border.lineStyle(2, 0x3a1822, 1);
    border.strokeRect(8, 8, ARENA.width - 16, ARENA.height - 16);

    setupMovementInput(this);

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, `${KEY}-jar`);
    this.player.setScale(2);
    this.player.body.setCircle(11);
    this.player.body.setOffset(5, 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.lantern = this.add.circle(this.player.x, this.player.y, 24, 0xffb066, 0.18).setDepth(9);

    this.enemies = this.physics.add.group();
    this.bombs = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(this.player, this.bombs, (_p, b) => this.triggerBomb(b));
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());

    this.fog = this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0x000000, 0.82).setDepth(80);
    this.fogMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    const mask = this.fogMaskShape.createGeometryMask();
    mask.setInvertAlpha(true);
    this.fog.setMask(mask);
    this.redrawFog();

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs + 200,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
    this.bombSpawnEvent = this.time.addEvent({
      delay: SURVIVAL.bombSpawnMs + 800,
      loop: true,
      callback: () => this.spawnBomb(),
    });

    this.hudScore = this.add.text(20, 16, '0', {
      fontFamily: 'monospace', fontSize: '22px', color: PALETTE.uiText,
    }).setDepth(100);

    this.hudHp = this.add.text(20, 44, 'HP ████ ████', {
      fontFamily: 'monospace', fontSize: '14px', color: PALETTE.uiAccent,
    }).setDepth(100);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height - 60, '', {
      fontFamily: 'monospace', fontSize: '20px', color: PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(100);

    this.add.text(ARENA.width - 20, 16, 'ESC \u2192 menu', {
      fontFamily: 'monospace', fontSize: '12px', color: '#553344',
    }).setOrigin(1, 0).setDepth(100);

    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    for (let i = 0; i < 3; i++) this.spawnBomb();
  }

  redrawFog() {
    const g = this.fogMaskShape;
    g.clear();
    g.fillStyle(0xffffff);
    g.fillCircle(this.player.x, this.player.y, VISION_RADIUS);
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, `${KEY}-bread`);
    e.setScale(1.2);
    e.body.setCircle(14);
    this.tweens.add({
      targets: e,
      alpha: { from: 0.7, to: 1 },
      duration: 700, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = spawnIntervalFor(this.time.now - this.startTime) + 200;
  }

  spawnBomb() {
    if (!this.alive) return;
    if (this.bombs.countActive(true) >= SURVIVAL.bombMaxOnMap) return;
    const pos = randomInnerPos(140, this.player, 220);
    const b = this.bombs.create(pos.x, pos.y, `${KEY}-bomb`);
    b.setScale(1.1);
    b.body.setCircle(14);
    b.setImmovable(true);
    const glow = this.add.circle(pos.x, pos.y, 26, 0xcc1133, 0.25).setDepth(5);
    b.setData('glow', glow);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.45 },
      scale: { from: 0.9, to: 1.25 },
      duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  triggerBomb(bomb) {
    if (!bomb.active) return;
    const bx = bomb.x; const by = bomb.y;
    const glow = bomb.getData('glow');
    glow?.destroy();
    bomb.destroy();

    const flash = this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0xffffff, 0.9).setDepth(90);
    this.tweens.add({ targets: flash, alpha: 0, duration: 360, onComplete: () => flash.destroy() });

    const ring = this.add.circle(bx, by, SURVIVAL.explosionRadius + 20, 0xff3344, 0.7).setDepth(70).setScale(0.08);
    this.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    this.cameras.main.shake(300, 0.014);

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
      const pts = scoreForCombo(killed);
      this.score += pts;
      this.hudScore.setText(`${this.score}`);
      this.showCombo(killed, pts);
    }
  }

  killEnemy(e, bx, by) {
    const angle = Math.atan2(e.y - by, e.x - bx);
    const dx = Math.cos(angle) * 50;
    const dy = Math.sin(angle) * 50;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      alpha: 0,
      scale: 0.6,
      angle: Phaser.Math.Between(-90, 90),
      duration: 380,
      onComplete: () => e.destroy(),
    });
    if (e.body) e.body.enable = false;
    if (Math.random() < 0.25) this.popText(e.x, e.y - 16, pickQuip(QUIPS_NOIR));
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}   +${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setAlpha(1);
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo,
      alpha: 0,
      delay: 1100,
      duration: 600,
    });
  }

  popText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '12px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(75);
    this.tweens.add({
      targets: t, y: y - 24, alpha: 0, duration: 1100, onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(260, 0.018);
    this.cameras.main.flash(160, 200, 30, 60);
    this.player.setTexture(`${KEY}-jar-hurt`);
    this.hudHp.setText(this.hp > 0 ? 'HP ████' : 'HP ----');
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();
    this.bombSpawnEvent.remove();

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    this.lantern.setVisible(false);

    const stain = this.add.ellipse(dx0, dy0, 20, 12, 0xcc1133, 0.9).setDepth(8);
    this.tweens.add({
      targets: stain, scaleX: 6, scaleY: 4, alpha: 0.6, duration: 1200,
    });
    for (let i = 0; i < 10; i++) {
      const shard = this.add.rectangle(
        dx0, dy0,
        Phaser.Math.Between(3, 6), Phaser.Math.Between(3, 6),
        0x5a2a3a,
      ).setDepth(11);
      this.tweens.add({
        targets: shard,
        x: dx0 + Phaser.Math.Between(-120, 120),
        y: dy0 + Phaser.Math.Between(-100, 60),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
    this.cameras.main.shake(600, 0.025);
    this.time.delayedCall(1300, () => this.showGameOver());
  }

  showGameOver() {
    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0x000000, 0.9).setDepth(200);
    this.add.text(ARENA.width / 2, ARENA.height * 0.38, pickQuip(QUIPS_DEATH), {
      fontFamily: 'monospace', fontSize: '34px', color: PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.5, `${this.score}`, {
      fontFamily: 'monospace', fontSize: '54px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.62, 'R rejouer   ·   ESC menu', {
      fontFamily: 'monospace', fontSize: '16px', color: '#7a5566',
    }).setOrigin(0.5).setDepth(201);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  update() {
    if (!this.alive) return;

    const { vx, vy } = readMovementInput(this);
    const speed = 180;
    this.player.body.setVelocity(vx * speed, vy * speed);

    this.lantern.setPosition(this.player.x, this.player.y);
    this.redrawFog();

    const speedNow = enemySpeedFor(this.time.now - this.startTime) * 0.85;
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      chasePlayer(e, this.player, speedNow);
    });

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 90) % 2) ? 0.3 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
