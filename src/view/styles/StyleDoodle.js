/**
 * Jeu 2 Confiture — Watercolor Doodle.
 * Charge dans le pot, explosion rayon / wipe, tartines pain de mie.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput,
  chasePlayer, randomEdgeSpawn,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  killEnemiesStaggered,
  QUIPS_DOODLE, QUIPS_DEATH, pickQuip,
  playJamExplosion,
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

const CHARGE_FULL_MS = 6500;
const CHARGE_MIN_RADIUS = 120;
const CHARGE_MAX_RADIUS = 520;
const CHARGE_MIN_TO_FIRE = 0.02;
const CINEMATIC_MS = 700;
const REPAIR_KILL_THRESHOLD = 20;
const JAR_SCALE = 0.5;
const JAR_W = 180;
const JAR_H = 220;

/** Cavité confiture visible à travers le pot. */
const JAR_FILL_POLY = [
  [0.22, 0.30], [0.20, 0.52], [0.26, 0.88], [0.50, 0.91],
  [0.74, 0.88], [0.80, 0.52], [0.78, 0.30],
];

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

/** crackLevel: 0 = intact, 1 = fêlure (1 PV). La confiture est dessinée via jamFill. */
function drawJarFrame(W, H, crackLevel, seed) {
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

  const cavityPts = JAR_FILL_POLY.map(([nx, ny]) => [W * nx, H * ny]);
  ctx.save();
  wobblyPath(ctx, cavityPts, 5, rand, true);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';

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

  if (crackLevel >= 1) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W * 0.4, H * 0.38);
    ctx.lineTo(W * 0.44, H * 0.55);
    ctx.lineTo(W * 0.41, H * 0.72);
    ctx.stroke();
  }

  return canvas;
}

function drawToastFromImage(scene, W, H, seed) {
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = rng(seed);
  const src = scene.textures.get('toast-slice').getSourceImage();

  ctx.fillStyle = 'rgba(40,30,20,0.14)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.9, W * 0.32, H * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  const sw = src.width || src.naturalWidth;
  const sh = src.height || src.naturalHeight;
  const pad = 4;
  const maxW = W - pad * 2;
  const maxH = H - pad * 2;
  const fit = Math.min(maxW / sw, maxH / sh) * (0.97 + (rand() - 0.5) * 0.04);
  const iw = sw * fit;
  const ih = sh * fit;
  const wobble = (rand() - 0.5) * 4;
  const tilt = (rand() - 0.5) * 0.06;

  ctx.save();
  ctx.translate(W / 2 + wobble, H / 2 + wobble * 0.4);
  ctx.rotate(tilt);
  ctx.drawImage(src, -iw / 2, -ih / 2, iw, ih);
  ctx.restore();

  return canvas;
}

function intersectAtY(a, b, y) {
  const t = (y - a.y) / (b.y - a.y);
  return { x: a.x + t * (b.x - a.x), y };
}

/** Garde la partie du polygone sous la surface (y >= surfaceY). */
function clipPolygonAtMinY(points, surfaceY) {
  const out = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const prev = points[(i + n - 1) % n];
    const currIn = curr.y >= surfaceY;
    const prevIn = prev.y >= surfaceY;
    if (currIn) {
      if (!prevIn) out.push(intersectAtY(prev, curr, surfaceY));
      out.push(curr);
    } else if (prevIn) {
      out.push(intersectAtY(prev, curr, surfaceY));
    }
  }
  return out;
}

function jarPolyWorld(player, s) {
  const hw = JAR_W * s;
  const hh = JAR_H * s;
  const left = player.x - hw / 2;
  const top = player.y - hh / 2;
  return JAR_FILL_POLY.map(([nx, ny]) => ({ x: left + nx * hw, y: top + ny * hh }));
}

function buildWobbleAnim(scene, keyBase, drawFn, args) {
  const seeds = [11, 4242, 99821];
  const frames = [];
  seeds.forEach((s, i) => {
    const key = `${keyBase}-${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, drawFn(...args, s));
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
    this.jarAnim = buildWobbleAnim(this, `${KEY}-jar`, drawJarFrame, [JAR_W, JAR_H, 0]);
    this.jarFracturedAnim = buildWobbleAnim(this, `${KEY}-jar-fractured`, drawJarFrame, [JAR_W, JAR_H, 1]);
    this.toastAnim = buildWobbleAnim(this, `${KEY}-toast`, drawToastFromImage, [this, 130, 130]);
    buildBlobTexture(this, `${KEY}-jam`, PALETTE.jam);
    buildBlobTexture(this, `${KEY}-jam-light`, PALETTE.jamLight);

    setupMovementInput(this);
    this.bindKeyboardActions();

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
    this.charge = 0.12;
    this.isExploding = false;
    this.isCinematic = false;

    this.explosionCount = 0;
    this.totalKillsInExplosions = 0;
    this.maxKillsInOneShot = 0;

    this.jamFill = this.add.graphics().setDepth(19);
    this.jarFx = this.add.graphics().setDepth(22);
    this.jarCracks = this.add.graphics().setDepth(21).setVisible(false);

    this.player = this.physics.add.sprite(
      ARENA.width / 2, ARENA.height / 2, this.jarAnim.firstKey,
    );
    this.player.play(this.jarAnim.animKey);
    this.player.setScale(JAR_SCALE);
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

    this.hudHp = this.add.text(28, 88, 'pot intact', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '18px', color: PALETTE.uiAccent,
    }).setDepth(100);

    this.attackLabel = this.add.text(ARENA.width - 28, 22, 'SPACE = exploser', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '22px', fontStyle: 'bold', color: PALETTE.uiText,
    }).setOrigin(1, 0).setDepth(100);

    this.attackHint = this.add.text(ARENA.width - 28, 50, 'plein = wipe · 20+ kills = réparation', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '13px', color: PALETTE.uiText,
    }).setOrigin(1, 0).setDepth(100);

    this.chargeLabel = this.add.text(ARENA.width - 28, 72, 'charge 0%', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '16px', fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setOrigin(1, 0).setDepth(100);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.22, '', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '64px', fontStyle: 'bold', color: PALETTE.uiAccent,
      stroke: '#ffffff', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    this.add.text(ARENA.width - 28, ARENA.height - 24, 'R rejouer', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '14px', color: PALETTE.uiText,
    }).setOrigin(1, 1).setDepth(100);

    this.input.keyboard.once('keydown', () => this.ensureBgm());

    this.explodeBtn = this.add.text(ARENA.width / 2, ARENA.height - 48, '[ SPACE ] exploser', {
      fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
      fontSize: '20px', fontStyle: 'bold', color: PALETTE.uiAccent,
      backgroundColor: '#f5efde', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });
    this.explodeBtn.on('pointerdown', () => {
      this.ensureBgm();
      this.tryExplode();
    });
  }

  restartGame() {
    this.scene.restart();
  }

  bindKeyboardActions() {
    const canvas = this.game.canvas;
    if (canvas) {
      canvas.setAttribute('tabindex', '0');
      canvas.style.outline = 'none';
    }
    this.input.on('pointerdown', () => {
      canvas?.focus({ preventScroll: true });
      if (this.input.keyboard) this.input.keyboard.enabled = true;
    });
    this.time.delayedCall(100, () => canvas?.focus({ preventScroll: true }));

    const kb = this.input.keyboard;
    if (!kb) return;

    this._onSpaceDown = () => {
      this.ensureBgm();
      this.tryExplode();
    };
    this._onRestartDown = (event) => {
      event?.preventDefault?.();
      this.restartGame();
    };

    this.spaceKey?.off('down', this._onSpaceDown);
    this.spaceKey?.on('down', this._onSpaceDown);
    this.cursors?.space?.off('down', this._onSpaceDown);
    this.cursors?.space?.on('down', this._onSpaceDown);

    kb.off('keydown-SPACE', this._onSpaceDown);
    kb.on('keydown-SPACE', this._onSpaceDown);

    this.restartKey?.off('down', this._onRestartDown);
    this.restartKey?.on('down', this._onRestartDown);
    kb.off('keydown-R', this._onRestartDown);
    kb.on('keydown-R', this._onRestartDown);

    this._windowKeyHandler = (event) => {
      if (!event || event.repeat) return;
      if (event.code === 'KeyR' || event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        this.restartGame();
      }
    };
    window.addEventListener('keydown', this._windowKeyHandler);

    this.events.once('shutdown', () => {
      this.spaceKey?.off('down', this._onSpaceDown);
      this.cursors?.space?.off('down', this._onSpaceDown);
      kb.off('keydown-SPACE', this._onSpaceDown);
      this.restartKey?.off('down', this._onRestartDown);
      kb.off('keydown-R', this._onRestartDown);
      window.removeEventListener('keydown', this._windowKeyHandler);
    });
  }

  ensureBgm() {
    let bgm = this.sound.get('bgm');
    if (!bgm) bgm = this.sound.add('bgm', { loop: true, volume: 0.45 });
    if (!bgm.isPlaying) bgm.play();
  }

  freezeEnemies() {
    this.enemies.children.iterate((e) => {
      if (!e?.active || !e.body) return;
      e.body.setVelocity(0, 0);
      e.setData('frozen', true);
    });
  }

  unfreezeEnemies() {
    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      e.setData('frozen', false);
    });
  }

  drawJarCracks() {
    const g = this.jarCracks;
    g.clear();
    if (this.hp > 1 || !this.player.visible) return;
    const w = this.player.displayWidth;
    const h = this.player.displayHeight;
    const x = this.player.x;
    const y = this.player.y;
    g.lineStyle(3, 0x2a1810, 0.85);
    g.beginPath();
    g.moveTo(x - w * 0.08, y - h * 0.12);
    g.lineTo(x - w * 0.02, y + h * 0.05);
    g.lineTo(x - w * 0.06, y + h * 0.22);
    g.stroke();
    g.beginPath();
    g.moveTo(x + w * 0.1, y - h * 0.08);
    g.lineTo(x + w * 0.04, y + h * 0.12);
    g.stroke();
  }

  drawJamOverflow(x, y, t) {
    const g = this.jarFx;
    g.clear();
    const s = JAR_SCALE;
    const lidY = y - (JAR_H * s) / 2 + JAR_H * 0.22 * s;

    for (let i = 0; i < 5; i++) {
      const phase = t / 380 + i * 1.35;
      const dx = Math.cos(phase) * (18 + i * 4) * s;
      const dy = Math.sin(phase * 1.2) * 6 * s - 8 * s;
      g.fillStyle(0xcc2244, 0.88);
      g.fillEllipse(x + dx, lidY + dy, 7 * s, 11 * s);
      g.fillStyle(0xff5577, 0.55);
      g.fillEllipse(x + dx, lidY + dy - 3 * s, 4 * s, 5 * s);
    }

    for (let i = 0; i < 6; i++) {
      const phase = t / 520 + i * 0.95;
      const sx = x + Math.cos(phase) * 38 * s;
      const sy = lidY - 12 * s + Math.sin(phase * 1.4) * 10 * s;
      const size = (5 + (i % 3) * 2) * s;
      const alpha = 0.45 + 0.35 * Math.sin(t / 200 + i);
      g.fillStyle(0xffaac8, alpha);
      g.beginPath();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        const r = p % 2 === 0 ? size : size * 0.42;
        const px = sx + Math.cos(a) * r;
        const py = sy + Math.sin(a) * r;
        if (p === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
    }
  }

  updateJarFill() {
    if (!this.player.visible) {
      this.jamFill.clear();
      this.jarFx.clear();
      this.jarCracks.clear();
      return;
    }

    const ratio = Phaser.Math.Clamp(this.charge, 0, 1);
    const s = JAR_SCALE;
    const worldPoly = jarPolyWorld(this.player, s);
    const ys = worldPoly.map((p) => p.y);
    const bottom = Math.max(...ys);
    const top = Math.min(...ys);
    const surfaceY = bottom - (bottom - top) * ratio;

    this.jamFill.clear();
    this.jarFx.clear();
    this.drawJarCracks();

    if (ratio >= 0.01) {
      const clipped = clipPolygonAtMinY(worldPoly, surfaceY);
      if (clipped.length >= 3) {
        const jamColor = ratio >= 0.999 ? 0xff3355 : 0xcc2244;
        this.jamFill.fillStyle(jamColor, 0.94);
        this.jamFill.beginPath();
        this.jamFill.moveTo(clipped[0].x, clipped[0].y);
        for (let i = 1; i < clipped.length; i++) {
          this.jamFill.lineTo(clipped[i].x, clipped[i].y);
        }
        this.jamFill.closePath();
        this.jamFill.fillPath();

        const surfacePts = clipped.filter((p) => Math.abs(p.y - surfaceY) < 3 * s);
        const surfX = surfacePts.length
          ? surfacePts.reduce((a, p) => a + p.x, 0) / surfacePts.length
          : this.player.x;
        this.jamFill.fillStyle(0xff5577, 0.55);
        this.jamFill.fillEllipse(surfX, surfaceY + 3 * s, 34 * s, 11 * s);
      }
    }

    if (ratio >= 0.999) {
      this.chargeLabel.setText('PLEIN !');
      this.chargeLabel.setColor(PALETTE.uiAccent);
      this.player.clearTint();
      this.drawJamOverflow(this.player.x, this.player.y, this.time.now);
    } else {
      this.chargeLabel.setText(`charge ${Math.round(ratio * 100)}%`);
      this.chargeLabel.setColor(PALETTE.uiAccent);
      this.player.clearTint();
    }
  }

  refreshJarAppearance() {
    if (this.hp <= 1) {
      this.player.play(this.jarFracturedAnim.animKey);
    } else {
      this.player.play(this.jarAnim.animKey);
    }
    this.jarCracks.setVisible(this.hp <= 1);
    this.drawJarCracks();
  }

  spawnEnemy() {
    if (!this.alive || this.isCinematic) return;
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

  tryExplode() {
    if (!this.alive) return;
    if (this.isExploding || this.isCinematic) return;
    if (this.charge < CHARGE_MIN_TO_FIRE) {
      this.popText(this.player.x, this.player.y - 70, 'pas encore chargé…');
      return;
    }
    this.doChargedExplosion();
  }

  tryRepairJar(killed) {
    if (killed < REPAIR_KILL_THRESHOLD) return;
    if (this.hp >= SURVIVAL.playerHp) return;

    this.hp = SURVIVAL.playerHp;
    this.refreshJarAppearance();
    this.hudHp.setText('pot intact');
    this.player.clearTint();
    this.popBigText(this.player.x, this.player.y - 60, 'POT RÉPARÉ !');
    this.cameras.main.flash(200, 200, 255, 180);
  }

  doChargedExplosion() {
    this.isExploding = true;
    this.explosionStartAt = this.time.now;

    const finishExplosion = () => {
      this.isCinematic = false;
      this.isExploding = false;
      this.unfreezeEnemies();
    };

    try {
      playJamExplosion(this);
    } catch {
      // Audio optionnel — l'explosion visuelle continue.
    }

    const jx = this.player.x; const jy = this.player.y;
    const isFull = this.charge >= 0.999;
    const radius = isFull
      ? Math.max(ARENA.width, ARENA.height)
      : (CHARGE_MIN_RADIUS + (CHARGE_MAX_RADIUS - CHARGE_MIN_RADIUS) * this.charge);

    this.tweens.add({
      targets: this.player,
      angle: -25, duration: 120, yoyo: true,
    });

    let splat1; let splat2;
    try {
      splat1 = this.add.particles(jx, jy, `${KEY}-jam`, {
        speed: { min: 280, max: 720 },
        angle: { min: 0, max: 360 },
        lifespan: 900,
        scale: { start: 2.2, end: 0.4 },
        alpha: { start: 0.95, end: 0 },
        quantity: 36,
        emitting: false,
      }).setDepth(50);
      splat1.explode(isFull ? 90 : 70);

      splat2 = this.add.particles(jx, jy, `${KEY}-jam-light`, {
        speed: { min: 180, max: 520 },
        angle: { min: 0, max: 360 },
        lifespan: 700,
        scale: { start: 1.2, end: 0 },
        quantity: 20,
        emitting: false,
      }).setDepth(51);
      splat2.explode(isFull ? 50 : 36);
    } catch {
      splat1 = null;
      splat2 = null;
    }
    if (splat1 || splat2) {
      this.time.delayedCall(1200, () => { splat1?.destroy(); splat2?.destroy(); });
    }

    const wave = this.add.circle(jx, jy, radius, 0xcc2244, isFull ? 0.5 : 0.35)
      .setDepth(48).setScale(0.05);
    this.tweens.add({
      targets: wave, scale: 1.1, alpha: 0,
      duration: 820, ease: 'Cubic.easeOut',
      onComplete: () => wave.destroy(),
    });

    this.isCinematic = true;
    this.freezeEnemies();

    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(120, 255, 200, 200);

    const victims = [];
    if (isFull) {
      this.enemies.children.iterate((e) => { if (e?.active) victims.push(e); });
    } else {
      this.enemies.children.iterate((e) => {
        if (!e?.active) return;
        const d = Math.hypot(e.x - jx, e.y - jy);
        if (d <= radius) victims.push(e);
      });
    }
    const killed = killEnemiesStaggered(this, victims, jx, jy, 70);

    this.explosionCount += 1;
    this.totalKillsInExplosions += killed;
    if (killed > this.maxKillsInOneShot) this.maxKillsInOneShot = killed;

    if (killed > 0) {
      const pts = scoreForCombo(killed);
      this.score += pts;
      this.hudScore.setText(`${this.score}`);
      this.showCombo(killed, pts);
    }

    this.tryRepairJar(killed);

    const label = isFull ? 'BOOM!' : 'SPLAT!';
    this.popBigText(jx, jy - 50, killed > 0 ? label : 'POUF');

    this.charge = 0;
    this.updateJarFill();

    const endCinematic = Math.max(CINEMATIC_MS, victims.length * 70 + 150);
    this.time.delayedCall(endCinematic, finishExplosion, [], this);
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
    if (!this.alive || this.isCinematic) return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(240, 0.014);
    this.cameras.main.flash(120, 255, 60, 60);

    if (this.hp === 1) {
      this.refreshJarAppearance();
      this.hudHp.setText('pot fêlé…');
      this.tweens.add({
        targets: this.player,
        angle: { from: -6, to: 6 },
        duration: 80, yoyo: true, repeat: 4,
      });
    }

    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.enemySpawnEvent.remove();
    this.explodeBtn?.setVisible(false);

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    this.jamFill.clear();
    this.jarFx.clear();
    this.jarCracks.clear();

    for (let i = 0; i < 12; i++) {
      const shard = this.add.rectangle(
        dx0 + Phaser.Math.Between(-40, 40),
        dy0 + Phaser.Math.Between(-50, 30),
        Phaser.Math.Between(8, 18), Phaser.Math.Between(10, 22),
        0xcc2244,
      ).setDepth(21).setAngle(Phaser.Math.Between(-40, 40));
      this.tweens.add({
        targets: shard,
        x: dx0 + Phaser.Math.Between(-120, 120),
        y: dy0 + Phaser.Math.Between(-80, 80),
        alpha: 0,
        angle: shard.angle + Phaser.Math.Between(-180, 180),
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }

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
    const avgKills = this.explosionCount > 0
      ? (this.totalKillsInExplosions / this.explosionCount).toFixed(1)
      : '0';

    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0xf5efde, 0.92).setDepth(200);
    const card = this.add.graphics().setDepth(201);
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(ARENA.width / 2 - 300, ARENA.height / 2 - 200, 600, 400, 14);
    card.lineStyle(6, 0x1a1410, 0.9);
    card.strokeRoundedRect(ARENA.width / 2 - 300, ARENA.height / 2 - 200, 600, 400, 14);

    const font = '"Comic Sans MS", "Marker Felt", cursive';
    const cx = ARENA.width / 2;

    this.add.text(cx, ARENA.height * 0.28, pickQuip(QUIPS_DEATH), {
      fontFamily: font, fontSize: '36px', fontStyle: 'bold', color: PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(202).setAngle(Phaser.Math.Between(-3, 3));

    this.add.text(cx, ARENA.height * 0.38, 'Stats', {
      fontFamily: font, fontSize: '22px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);

    const lines = [
      `Score : ${this.score}`,
      `Max tartines en 1 coup : ${this.maxKillsInOneShot}`,
      `Moyenne par coup : ${avgKills}`,
    ];
    lines.forEach((line, i) => {
      this.add.text(cx, ARENA.height * (0.44 + i * 0.07), line, {
        fontFamily: font, fontSize: '24px', color: PALETTE.uiText,
      }).setOrigin(0.5).setDepth(202);
    });

    const restartBtn = this.add.text(cx, ARENA.height * 0.68, 'R ou clic — rejouer', {
      fontFamily: font, fontSize: '20px', fontStyle: 'bold', color: PALETTE.uiAccent,
      backgroundColor: '#ffffff', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => this.restartGame());

    this.add.zone(cx, ARENA.height / 2, ARENA.width, ARENA.height)
      .setInteractive()
      .setDepth(199)
      .on('pointerdown', () => this.restartGame());
  }

  update() {
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartGame();
      return;
    }

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.ensureBgm();
      this.tryExplode();
    }

    if (this.isExploding && this.explosionStartAt
      && this.time.now - this.explosionStartAt > 4000) {
      this.isExploding = false;
      this.isCinematic = false;
      this.unfreezeEnemies();
    }

    if (!this.alive) {
      this.updateJarFill();
      return;
    }

    if (!this.isExploding && !this.isCinematic) {
      const dt = this.game.loop.delta ?? 16.6;
      this.charge = Math.min(1, this.charge + dt / CHARGE_FULL_MS);
    }

    const { vx, vy } = readMovementInput(this);
    const speed = 230;
    this.player.body.setVelocity(vx * speed, vy * speed);

    this.updateJarFill();

    if (!this.isCinematic) {
      const speedNow = enemySpeedFor(this.time.now - this.startTime);
      this.enemies.children.iterate((e) => {
        if (!e?.active || e.getData('frozen')) return;
        chasePlayer(e, this.player, speedNow);
      });
    }

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 80) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
