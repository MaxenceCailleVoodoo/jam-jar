/**
 * Style A — Saturday Morning Cartoon.
 * Couleurs pastel, gros pixels, mouvement bouncy, bombes "gaufre" rebondissantes.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput, chasePlayer, randomEdgeSpawn, randomInnerPos,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  QUIPS_KILL, QUIPS_DEATH, pickQuip,
} from './sharedSurvival.js';

const KEY = 'StyleACartoon';

const PALETTE = {
  skyTop: '#ffe9b0',
  skyBot: '#ffc78a',
  tile1: '#ffd9a0',
  tile2: '#ffb878',
  jarLid: '#cc3344',
  jarLidDark: '#992233',
  jarOuter: '#ff7799',
  jarMid: '#ff4477',
  jarInner: '#cc1144',
  jarShine: '#ffcce0',
  jarEye: '#222222',
  jarMouth: '#552222',
  bread: '#e3a85a',
  breadCrust: '#a8682a',
  breadEye: '#221100',
  bombShell: '#fff2c2',
  bombGrid: '#d4a850',
  bombFuse: '#664422',
  bombSpark: '#ffee44',
  uiText: '#3a1f0a',
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
    const { canvas, ctx } = makeCanvas(64, 64);
    px(ctx, 16, 4, 32, 6, PALETTE.jarLid);
    px(ctx, 18, 0, 28, 6, PALETTE.jarLidDark);
    px(ctx, 14, 10, 36, 44, PALETTE.jarOuter);
    px(ctx, 16, 14, 32, 36, PALETTE.jarMid);
    px(ctx, 20, 18, 24, 28, PALETTE.jarInner);
    px(ctx, 22, 20, 6, 6, PALETTE.jarShine);
    px(ctx, 22, 28, 4, 6, PALETTE.jarEye);
    px(ctx, 36, 28, 4, 6, PALETTE.jarEye);
    px(ctx, 23, 30, 2, 2, '#ffffff');
    px(ctx, 37, 30, 2, 2, '#ffffff');
    px(ctx, 24, 40, 12, 4, PALETTE.jarMouth);
    px(ctx, 28, 42, 4, 2, '#ffaaaa');
    scene.textures.addCanvas(`${KEY}-jar`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(64, 64);
    px(ctx, 16, 4, 32, 6, PALETTE.jarLid);
    px(ctx, 18, 0, 28, 6, PALETTE.jarLidDark);
    px(ctx, 14, 10, 36, 44, PALETTE.jarOuter);
    px(ctx, 16, 14, 32, 36, PALETTE.jarMid);
    px(ctx, 20, 18, 24, 28, PALETTE.jarInner);
    px(ctx, 28, 12, 2, 18, '#ffffff');
    px(ctx, 22, 28, 16, 2, '#ffffff');
    px(ctx, 34, 30, 2, 14, '#ffffff');
    px(ctx, 22, 36, 8, 2, '#ffffff');
    px(ctx, 22, 20, 6, 6, PALETTE.jarShine);
    px(ctx, 22, 28, 4, 6, PALETTE.jarEye);
    px(ctx, 36, 28, 4, 6, PALETTE.jarEye);
    px(ctx, 22, 42, 14, 2, PALETTE.jarMouth);
    scene.textures.addCanvas(`${KEY}-jar-hurt`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(48, 48);
    px(ctx, 6, 10, 36, 30, PALETTE.breadCrust);
    px(ctx, 10, 14, 28, 22, PALETTE.bread);
    px(ctx, 8, 12, 4, 26, '#8b5a2b');
    px(ctx, 14, 18, 4, 6, PALETTE.breadEye);
    px(ctx, 28, 18, 4, 6, PALETTE.breadEye);
    px(ctx, 15, 19, 2, 2, '#ffffff');
    px(ctx, 29, 19, 2, 2, '#ffffff');
    px(ctx, 14, 28, 16, 3, PALETTE.breadEye);
    px(ctx, 16, 30, 12, 2, '#ffffff');
    scene.textures.addCanvas(`${KEY}-bread`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(48, 48);
    px(ctx, 8, 8, 32, 32, PALETTE.bombShell);
    for (let y = 8; y <= 36; y += 6) px(ctx, 8, y, 32, 1, PALETTE.bombGrid);
    for (let x = 8; x <= 36; x += 6) px(ctx, x, 8, 1, 32, PALETTE.bombGrid);
    px(ctx, 22, 2, 4, 8, PALETTE.bombFuse);
    px(ctx, 20, 0, 8, 4, PALETTE.bombSpark);
    px(ctx, 14, 14, 4, 4, '#ffffff');
    scene.textures.addCanvas(`${KEY}-bomb`, canvas);
  }
  {
    const { canvas, ctx } = makeCanvas(64, 64);
    px(ctx, 0, 0, 64, 64, PALETTE.tile1);
    for (let y = 0; y < 64; y += 16) {
      for (let x = 0; x < 64; x += 16) {
        if ((x + y) % 32 === 0) px(ctx, x + 1, y + 1, 14, 14, PALETTE.tile2);
        px(ctx, x + 3, y + 3, 2, 2, '#ffffff');
      }
    }
    scene.textures.addCanvas(`${KEY}-floor`, canvas);
  }
}

export class StyleACartoonScene extends Phaser.Scene {
  constructor() { super({ key: KEY }); }

  create() {
    buildTextures(this);

    this.cameras.main.setBackgroundColor(PALETTE.skyTop);
    this.add.tileSprite(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, `${KEY}-floor`)
      .setTileScale(2);

    const border = this.add.graphics();
    border.lineStyle(8, 0xcc3344, 1);
    border.strokeRoundedRect(8, 8, ARENA.width - 16, ARENA.height - 16, 24);

    setupMovementInput(this);

    this.score = 0;
    this.hp = SURVIVAL.playerHp;
    this.invincibleUntil = 0;
    this.alive = true;
    this.startTime = this.time.now;
    this.combo = 0;

    this.player = this.physics.add.sprite(ARENA.width / 2, ARENA.height / 2, `${KEY}-jar`);
    this.player.setScale(2);
    this.player.body.setCircle(20);
    this.player.setCollideWorldBounds(true);

    this.bobTween = this.tweens.add({
      targets: this.player,
      scaleY: { from: 2, to: 2.15 },
      scaleX: { from: 2, to: 1.88 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.enemies = this.physics.add.group();
    this.bombs = this.physics.add.group({ allowGravity: false, immovable: false });

    this.physics.add.overlap(this.player, this.bombs, (_p, b) => this.triggerBomb(b));
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs,
      loop: true,
      callback: () => this.spawnEnemy(),
    });
    this.bombSpawnEvent = this.time.addEvent({
      delay: SURVIVAL.bombSpawnMs,
      loop: true,
      callback: () => this.spawnBomb(),
    });

    this.hudScore = this.add.text(24, 18, 'SCORE 0', {
      fontFamily: 'monospace', fontSize: '28px', color: PALETTE.uiText,
      stroke: '#ffffff', strokeThickness: 3,
    }).setDepth(100);

    this.hudHp = this.add.text(24, 50, '❤❤', {
      fontFamily: 'monospace', fontSize: '32px', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 3,
    }).setDepth(100);

    this.hudCombo = this.add.text(ARENA.width / 2, 60, '', {
      fontFamily: 'monospace', fontSize: '44px', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100);

    this.hudHint = this.add.text(ARENA.width - 24, 24, 'ESC → menu', {
      fontFamily: 'monospace', fontSize: '16px', color: '#3a1f0a',
    }).setOrigin(1, 0).setDepth(100);

    this.input.keyboard.on('keydown-ESC', () => this.backToPicker());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());

    for (let i = 0; i < 3; i++) this.spawnBomb();
  }

  spawnEnemy() {
    if (!this.alive) return;
    const pos = randomEdgeSpawn();
    const e = this.enemies.create(pos.x, pos.y, `${KEY}-bread`);
    e.setScale(1.4);
    e.body.setCircle(16);
    e.setData('hp', SURVIVAL.enemyHpStart);
    this.tweens.add({
      targets: e,
      angle: { from: -8, to: 8 },
      duration: 240, yoyo: true, repeat: -1,
    });
    this.enemySpawnEvent.delay = spawnIntervalFor(this.time.now - this.startTime);
  }

  spawnBomb() {
    if (!this.alive) return;
    if (this.bombs.countActive(true) >= SURVIVAL.bombMaxOnMap) return;
    const pos = randomInnerPos(120, this.player, 200);
    const b = this.bombs.create(pos.x, pos.y, `${KEY}-bomb`);
    b.setScale(1.2);
    b.body.setCircle(18);
    b.setImmovable(true);
    this.tweens.add({
      targets: b,
      scale: 1.35,
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  triggerBomb(bomb) {
    if (!bomb.active) return;
    const bx = bomb.x; const by = bomb.y;
    bomb.destroy();

    const ring = this.add.circle(bx, by, SURVIVAL.explosionRadius, 0xffee44, 0.85).setDepth(50).setScale(0.1);
    this.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
    const flash = this.add.circle(bx, by, SURVIVAL.explosionRadius * 0.6, 0xffffff, 0.7).setDepth(51);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.4, duration: 220, onComplete: () => flash.destroy() });

    this.cameras.main.shake(160, 0.008);

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
      this.hudScore.setText(`SCORE ${this.score}`);
      this.showCombo(killed, pts);
    } else {
      this.popText(bx, by, 'POP', '#ff6688');
    }
  }

  killEnemy(e, bx, by) {
    const angle = Math.atan2(e.y - by, e.x - bx);
    const dx = Math.cos(angle) * 80;
    const dy = Math.sin(angle) * 80;
    this.tweens.add({
      targets: e,
      x: e.x + dx,
      y: e.y + dy,
      scale: 0.2,
      alpha: 0,
      angle: Phaser.Math.Between(-180, 180),
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => e.destroy(),
    });
    if (e.body) e.body.enable = false;
    if (Math.random() < 0.35) this.popText(e.x, e.y - 18, pickQuip(QUIPS_KILL), '#cc1144');
  }

  showCombo(n, pts) {
    const txt = `${comboTier(n)} x${n}  +${pts}`;
    this.hudCombo.setText(txt);
    this.hudCombo.setScale(0.6);
    this.tweens.killTweensOf(this.hudCombo);
    this.tweens.add({
      targets: this.hudCombo,
      scale: 1.1,
      duration: 200,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(900, () => {
          if (this.hudCombo?.text === txt) this.hudCombo.setText('');
        });
      },
    });
  }

  popText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '20px', color,
      stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(80);
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      scale: 1.3,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(120, 255, 80, 80);
    this.player.setTexture(`${KEY}-jar-hurt`);
    this.hudHp.setText(this.hp > 0 ? '❤' : '');
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.bobTween?.stop();
    this.enemySpawnEvent.remove();
    this.bombSpawnEvent.remove();

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    for (let i = 0; i < 14; i++) {
      const shard = this.add.rectangle(
        dx0, dy0,
        Phaser.Math.Between(6, 14), Phaser.Math.Between(6, 14),
        Phaser.Display.Color.RandomRGB(120, 240).color,
      ).setDepth(60);
      this.tweens.add({
        targets: shard,
        x: dx0 + Phaser.Math.Between(-260, 260),
        y: dy0 + Phaser.Math.Between(-240, 80),
        angle: Phaser.Math.Between(-360, 360),
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
    this.cameras.main.shake(420, 0.02);
    this.time.delayedCall(900, () => this.showGameOver());
  }

  showGameOver() {
    const o = this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0xffe9b0, 0.85).setDepth(200);
    this.add.text(ARENA.width / 2, ARENA.height * 0.36, pickQuip(QUIPS_DEATH), {
      fontFamily: 'monospace', fontSize: '52px', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.5, `Score: ${this.score}`, {
      fontFamily: 'monospace', fontSize: '36px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(201);
    this.add.text(ARENA.width / 2, ARENA.height * 0.62, 'R rejouer  ·  ESC menu', {
      fontFamily: 'monospace', fontSize: '22px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(201);
  }

  backToPicker() {
    this.scene.start('StylePickerScene');
  }

  update() {
    if (!this.alive) return;

    const { vx, vy } = readMovementInput(this);
    const speed = 230;
    this.player.body.setVelocity(vx * speed, vy * speed);

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
