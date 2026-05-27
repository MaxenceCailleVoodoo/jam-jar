/**
 * Jam Ops — Watercolor Doodle.
 * Charge the jar, radius / wipe explosion, white-bread toast enemies.
 */
import {
  ARENA, SURVIVAL,
  setupMovementInput, readMovementInput,
  chasePlayer, randomEdgeSpawn,
  scoreForCombo, comboTier, enemySpeedFor, spawnIntervalFor,
  killEnemiesStaggered,
  QUIPS_DOODLE, QUIPS_DEATH, pickQuip,
  playJamExplosion,
  BGM_VOLUME,
} from './sharedSurvival.js';
import {
  getJamFlavor, setActiveJamPalette, activeJamPalette, DEFAULT_JAM_ID,
} from '../jamFlavors.js';
import { DOODLE_FONT, crispDoodleText } from '../doodleTheme.js';
import { loadBest, recordRun } from '../persistence.js';
import { TouchControls } from '../input/TouchControls.js';

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
const BOSS_KILL_THRESHOLD = 55;
const BOSS_SURVIVE_MS = 40000;
const ENDLESS_SPAWN_MS = 360;
const BOSS_EJECT_INTERVAL_MS = 1250;
const BOSS_BURST_EVERY = 5;
const BOSS_SPLASH_HOLD_MS = 4200;
const BOSS_SPLASH_FADE_IN_MS = 550;
const BOSS_SPLASH_FADE_OUT_MS = 700;
const BOSS_INTRO_MAX_RETRIES = 150;
const MAX_BOSS_HAZARDS = 36;
const TOASTER_W = 300;
const TOASTER_H = 260;
const JAR_SCALE = 0.5;
const JAR_W = 180;
const JAR_H = 220;

/** Jam cavity visible through the jar glass. */
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

/** Mulberry32 PRNG for deterministic per-frame wobble. */
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

/** crackLevel: 0 = intact, 1 = cracked (1 HP). Jam fill is drawn via jamFill. */
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
  ctx.fillStyle = activeJamPalette.jam;
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
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.28, H * 0.78);
    ctx.lineTo(W * 0.40, H * 0.80);
    ctx.lineTo(W * 0.52, H * 0.78);
    ctx.lineTo(W * 0.66, H * 0.81);
    ctx.lineTo(W * 0.74, H * 0.79);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.34, H * 0.84);
    ctx.lineTo(W * 0.48, H * 0.85);
    ctx.lineTo(W * 0.60, H * 0.83);
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

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/** Toaster boss — doodle chrome + jam accents. */
function drawToasterFrame(W, H, seed) {
  const { canvas, ctx } = makeCanvas(W, H);
  const rand = rng(seed);
  const ink = PALETTE.ink;
  const rage = activeJamPalette.uiAccent;
  const rageFill = activeJamPalette.jam;

  ctx.fillStyle = 'rgba(40,30,20,0.22)';
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.95, W * 0.48, H * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  const bx = W * 0.07;
  const by = H * 0.15;
  const bw = W * 0.76;
  const bh = H * 0.71;

  const bodyPts = [
    [bx, by + bh * 0.1], [bx, by + bh * 0.9], [bx + bw * 0.07, by + bh],
    [bx + bw * 0.93, by + bh], [bx + bw, by + bh * 0.9],
    [bx + bw, by + bh * 0.1], [bx + bw * 0.93, by - H * 0.01], [bx + bw * 0.07, by - H * 0.01],
  ];
  const bodyGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  bodyGrad.addColorStop(0, '#fffef8');
  bodyGrad.addColorStop(0.2, '#f2f0ec');
  bodyGrad.addColorStop(0.5, '#d8d6e4');
  bodyGrad.addColorStop(1, '#9e9eb0');
  ctx.save();
  wobblyPath(ctx, bodyPts, 6, rand, true);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  wobblyPath(ctx, bodyPts, 4, rand, true);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  wobblyPath(ctx, bodyPts, 8, rand, true);
  ctx.strokeStyle = 'rgba(42,24,16,0.12)';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();

  const stripeY = by + bh * 0.38;
  ctx.save();
  ctx.strokeStyle = rage;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.1, stripeY);
  ctx.lineTo(bx + bw * 0.9, stripeY + (rand() - 0.5) * 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  for (const side of [0.04, 0.96]) {
    const px = bx + bw * side;
    ctx.fillStyle = '#b8b8c8';
    roundRectPath(ctx, px - (side < 0.5 ? bw * 0.05 : 0), by + bh * 0.15, bw * 0.05, bh * 0.7, 4);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let r = 0; r < 3; r++) {
      const ry = by + bh * (0.28 + r * 0.22);
      ctx.fillStyle = '#888898';
      ctx.beginPath();
      ctx.arc(px + bw * (side < 0.5 ? 0.025 : -0.025), ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  const crownPts = [
    [bx + bw * 0.06, by + H * 0.02], [bx + bw * 0.94, by + H * 0.02],
    [bx + bw * 0.9, by - H * 0.02], [bx + bw * 0.5, by - H * 0.06],
    [bx + bw * 0.1, by - H * 0.02],
  ];
  ctx.save();
  wobblyPath(ctx, crownPts, 3, rand, true);
  ctx.fillStyle = '#e8e8f2';
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < 5; i++) {
    const sx = bx + bw * (0.18 + i * 0.16) + (rand() - 0.5) * 8;
    const sy = by - H * 0.06 - i * 5;
    ctx.fillStyle = `rgba(255,200,140,${0.15 + rand() * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6, 8 + rand() * 6, 12 + rand() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,100,40,${0.3 + rand() * 0.25})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy + 10);
    ctx.quadraticCurveTo(sx + (rand() - 0.5) * 10, sy - 6, sx + (rand() - 0.5) * 12, sy - 22 - rand() * 12);
    ctx.stroke();
  }

  const slotW = bw * 0.36;
  const slotH = H * 0.19;
  const slotY = by + H * 0.04;
  const slotGap = bw * 0.05;
  const slotXs = [
    bx + bw * 0.5 - slotGap / 2 - slotW,
    bx + bw * 0.5 + slotGap / 2,
  ];

  slotXs.forEach((sx, i) => {
    ctx.fillStyle = '#0a0808';
    roundRectPath(ctx, sx, slotY, slotW, slotH, 6);
    ctx.fill();
    const glow = ctx.createLinearGradient(sx, slotY, sx, slotY + slotH);
    glow.addColorStop(0, '#fff4a8');
    glow.addColorStop(0.35, '#ff9933');
    glow.addColorStop(0.7, '#ff4400');
    glow.addColorStop(1, '#aa2200');
    roundRectPath(ctx, sx + 6, slotY + 6, slotW - 12, slotH - 12, 4);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    roundRectPath(ctx, sx, slotY, slotW, slotH, 6);
    ctx.stroke();

    const peek = [
      [sx + slotW * 0.18, slotY - H * 0.03],
      [sx + slotW * 0.12, slotY + slotH * 0.4],
      [sx + slotW * 0.88, slotY + slotH * 0.42],
      [sx + slotW * 0.82, slotY - H * 0.02],
    ];
    ctx.save();
    wobblyPath(ctx, peek, 4, rand, true);
    ctx.fillStyle = PALETTE.toast;
    ctx.fill();
    ctx.fillStyle = PALETTE.crust;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  });

  ctx.fillStyle = 'rgba(60,50,40,0.35)';
  roundRectPath(ctx, bx + bw * 0.06, by + bh * 0.88, bw * 0.88, H * 0.07, 4);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();

  const leverX = bx + bw + 2;
  const leverY = by + bh * 0.28;
  ctx.fillStyle = '#6a6a78';
  roundRectPath(ctx, leverX, leverY, W * 0.08, bh * 0.42, 5);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = rageFill;
  roundRectPath(ctx, leverX - 4, leverY + bh * 0.05, W * 0.11, bh * 0.22, 6);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.4;
  roundRectPath(ctx, leverX - 2, leverY + bh * 0.07, W * 0.05, bh * 0.08, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = rageFill;
    ctx.globalAlpha = 0.5 - d * 0.12;
    ctx.beginPath();
    ctx.ellipse(leverX + W * 0.02, leverY + bh * 0.28 + d * 9, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#4a4a58';
  roundRectPath(ctx, bx + bw * 0.12, by + bh * 0.72, W * 0.11, H * 0.055, 4);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#ff6622';
  ctx.beginPath();
  ctx.arc(bx + bw * 0.175, by + bh * 0.747, W * 0.028, 0, Math.PI * 2);
  ctx.fill();

  const eyeY = by + bh * 0.58;
  const eyeRX = bx + bw * 0.34;
  const eyeLX = bx + bw * 0.66;
  const eyeR = W * 0.048;

  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(eyeLX - eyeR * 1.4, eyeY - eyeR * 2.2);
  ctx.lineTo(eyeLX - eyeR * 0.3, eyeY - eyeR * 1.5);
  ctx.moveTo(eyeRX + eyeR * 1.4, eyeY - eyeR * 2.2);
  ctx.lineTo(eyeRX + eyeR * 0.3, eyeY - eyeR * 1.5);
  ctx.stroke();

  for (const ex of [eyeRX, eyeLX]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR * 1.1, eyeR * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rage;
    ctx.beginPath();
    ctx.arc(ex + (ex < W / 2 ? 2 : -2), eyeY + 1, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(ex + (ex < W / 2 ? 4 : -4), eyeY - 2, eyeR * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  ctx.strokeStyle = ink;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.36, by + bh * 0.78);
  ctx.quadraticCurveTo(bx + bw * 0.5, by + bh * 0.92, bx + bw * 0.64, by + bh * 0.78);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.42, by + bh * 0.8);
  ctx.lineTo(bx + bw * 0.46, by + bh * 0.86);
  ctx.moveTo(bx + bw * 0.54, by + bh * 0.8);
  ctx.lineTo(bx + bw * 0.58, by + bh * 0.86);
  ctx.stroke();

  const labelY = by + bh * 0.5;
  const labelX = bx + bw * 0.5;
  ctx.font = `bold ${Math.round(W * 0.07)}px "Comic Sans MS", "Marker Felt", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  ctx.strokeText('TOASTER', labelX, labelY);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillText('TOASTER', labelX, labelY);
  ctx.fillStyle = rage;
  ctx.globalAlpha = 0.25;
  ctx.fillText('TOASTER', labelX + 1, labelY + 1);
  ctx.globalAlpha = 1;

  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = `rgba(232,184,96,${0.2 + rand() * 0.25})`;
    ctx.beginPath();
    ctx.arc(
      bx + bw * (0.15 + rand() * 0.7),
      by + bh * (0.2 + rand() * 0.65),
      1.5 + rand() * 2,
      0, Math.PI * 2,
    );
    ctx.fill();
  }

  return canvas;
}

function intersectAtY(a, b, y) {
  const t = (y - a.y) / (b.y - a.y);
  return { x: a.x + t * (b.x - a.x), y };
}

/** Keep the polygon part below the fill surface (y >= surfaceY). */
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

  init(data) {
    const id = data?.flavorId ?? this.registry.get('jamFlavor') ?? DEFAULT_JAM_ID;
    this.flavor = getJamFlavor(id);
    this.registry.set('jamFlavor', this.flavor.id);
    setActiveJamPalette(this.flavor);
    this._restarting = false;
    this.uiJamHex = this.flavor.jam;
    this.jamColor = Phaser.Display.Color.HexStringToColor(this.flavor.jam).color;
    this.jamLightColor = Phaser.Display.Color.HexStringToColor(this.flavor.jamLight).color;
    const shaded = Phaser.Display.Color.IntegerToColor(this.jamColor);
    shaded.darken(10);
    this.jamDeepColor = shaded.color;
    this.jamAccent = this.flavor.uiAccent;
  }

  create() {
    buildPaperTexture(this, `${KEY}-paper`);
    this.jarAnim = buildWobbleAnim(this, `${KEY}-jar`, drawJarFrame, [JAR_W, JAR_H, 0]);
    this.jarFracturedAnim = buildWobbleAnim(this, `${KEY}-jar-fractured`, drawJarFrame, [JAR_W, JAR_H, 1]);
    this.toastAnim = buildWobbleAnim(this, `${KEY}-toast`, drawToastFromImage, [this, 130, 130]);
    this.toasterAnim = buildWobbleAnim(this, `${KEY}-toaster`, drawToasterFrame, [TOASTER_W, TOASTER_H]);
    if (this.textures.exists(`${KEY}-jam`)) this.textures.remove(`${KEY}-jam`);
    if (this.textures.exists(`${KEY}-jam-light`)) this.textures.remove(`${KEY}-jam-light`);
    buildBlobTexture(this, `${KEY}-jam`, this.flavor.jam);
    buildBlobTexture(this, `${KEY}-jam-light`, this.flavor.jamLight);

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
    this.totalToastKills = 0;
    this.bossTriggered = false;
    this.bossDefeated = false;
    this.bossPhase = null;
    this.boss = null;
    this.bossEjectEvent = null;
    this.bossPhaseEndsAt = 0;
    this.bossEjectSlot = 0;
    this._bossTimerKey = '';

    this.jamFill = this.add.graphics().setDepth(19);
    this.jarCracks = this.add.graphics().setDepth(21).setVisible(false);
    this._lastFillKey = null;
    this._lastCrackKey = null;

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
    this.bossHazards = this.physics.add.group();
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());
    this.physics.add.overlap(this.player, this.bossHazards, () => this.hitPlayer());

    this.enemySpawnEvent = this.time.addEvent({
      delay: SURVIVAL.enemySpawnStartMs,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.add.text(28, 18, 'score', {
      fontFamily: DOODLE_FONT,
      fontSize: '18px', color: PALETTE.uiText,
    }).setDepth(100);

    this.hudScore = this.add.text(28, 36, '0', {
      fontFamily: DOODLE_FONT,
      fontSize: '40px', fontStyle: 'bold', color: this.uiJamHex,
    }).setDepth(100);

    this.hudHp = this.add.text(28, 84, 'jar intact', {
      fontFamily: DOODLE_FONT,
      fontSize: '18px', color: this.uiJamHex,
    }).setDepth(100);

    const toastHudY = 118;
    this.hudKillsLabel = crispDoodleText(
      this, 28, toastHudY,
      `${BOSS_KILL_THRESHOLD} toasts until boss`,
      { fontSize: '14px', color: PALETTE.uiText },
    ).setOrigin(0, 0).setDepth(100);

    const toastRowY = toastHudY + 30;
    this.hudKillsIcon = this.add.image(28, toastRowY, 'toast-slice')
      .setOrigin(0, 0.5).setDepth(100)
      .setDisplaySize(26, 26);
    this.hudKillsCount = crispDoodleText(
      this, 60, toastRowY, `0 / ${BOSS_KILL_THRESHOLD}`,
      { fontSize: '20px', fontStyle: 'bold', color: this.uiJamHex },
    ).setOrigin(0, 0.5).setDepth(100);

    this.hudBossTimer = this.add.text(ARENA.width / 2, 28, '', {
      fontFamily: DOODLE_FONT,
      fontSize: '28px', fontStyle: 'bold', color: this.uiJamHex,
      stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(102).setAlpha(0);

    this.hudCombo = this.add.text(ARENA.width / 2, ARENA.height * 0.22, '', {
      fontFamily: DOODLE_FONT,
      fontSize: '64px', fontStyle: 'bold', color: this.uiJamHex,
      stroke: '#ffffff', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(101).setAlpha(0);

    this.add.text(ARENA.width - 28, ARENA.height - 24, 'R to replay', {
      fontFamily: DOODLE_FONT,
      fontSize: '14px', color: PALETTE.uiText,
    }).setOrigin(1, 1).setDepth(100);

    this.input.keyboard.once('keydown', () => this.ensureBgm());

    this.explodeBtn = this.add.text(ARENA.width / 2, ARENA.height - 48, '[ SPACE ] explode', {
      fontFamily: DOODLE_FONT,
      fontSize: '20px', fontStyle: 'bold', color: this.uiJamHex,
      backgroundColor: '#f5efde', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });
    this.explodeBtn.on('pointerdown', () => {
      this.ensureBgm();
      this.tryExplode();
    });

    this.chargeMeter = this.add.graphics().setDepth(100);
    this.chargeMeterRect = {
      x: ARENA.width / 2 - 120, y: ARENA.height - 22, w: 240, h: 10,
    };
    this._lastChargeDrawn = -1;
    this.drawChargeMeter(this.charge);

    this.best = loadBest();
    this.hudBest = crispDoodleText(
      this,
      ARENA.width - 24,
      16,
      this.formatBestHudText(),
      {
        fontSize: '17px',
        color: PALETTE.uiText,
        align: 'right',
        lineSpacing: 4,
      },
    ).setOrigin(1, 0).setDepth(100);

    this.touchControls = new TouchControls();
    this.touchControls.attach(this, {
      onExplode: () => {
        this.ensureBgm();
        this.tryExplode();
      },
    });
  }

  getBestDisplayStats() {
    const saved = this.best ?? loadBest();
    return {
      score: Math.max(saved.bestScore, this.score ?? 0),
      kills: Math.max(saved.bestKills, this.totalToastKills ?? 0),
      maxCombo: Math.max(saved.bestMaxCombo, this.maxKillsInOneShot ?? 0),
      wins: saved.wins,
    };
  }

  formatBestHudText() {
    const d = this.getBestDisplayStats();
    return [
      'BEST',
      `Score  ${d.score.toLocaleString()}`,
      `Toasts  ${d.kills}`,
      `Wins  ${d.wins}`,
    ].join('\n');
  }

  refreshBestHud() {
    this.hudBest?.setText(this.formatBestHudText());
  }

  drawChargeMeter(ratio) {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    if (Math.abs(clamped - this._lastChargeDrawn) < 0.01) return;
    this._lastChargeDrawn = clamped;

    const { x, y, w, h } = this.chargeMeterRect;
    const g = this.chargeMeter;
    g.clear();
    g.fillStyle(0xffffff, 0.85);
    g.fillRoundedRect(x, y, w, h, 5);
    g.lineStyle(2, 0x2a1810, 0.7);
    g.strokeRoundedRect(x, y, w, h, 5);

    const fillW = Math.max(0, (w - 4) * clamped);
    const isFull = clamped >= 0.999;
    g.fillStyle(isFull ? this.jamLightColor : this.jamColor, 1);
    g.fillRoundedRect(x + 2, y + 2, fillW, h - 4, 4);

    if (isFull) {
      g.lineStyle(2, this.jamLightColor, 0.85);
      g.strokeRoundedRect(x - 1, y - 1, w + 2, h + 2, 6);
    }
  }

  restartGame() {
    if (this._restarting) return;
    this._restarting = true;
    this.tweens.killAll();
    this.time.removeAllEvents();
    const flavorId = this.flavor?.id ?? this.registry.get('jamFlavor') ?? DEFAULT_JAM_ID;
    this.scene.restart({ flavorId });
  }

  bindEndScreenRestart(cx, y) {
    this.input.enabled = true;
    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.game.canvas?.focus({ preventScroll: true });
    const restartBtn = this.add.text(cx, y, 'R or click — replay', {
      fontFamily: DOODLE_FONT,
      fontSize: '20px',
      fontStyle: 'bold',
      color: this.uiJamHex ?? this.jamAccent,
      backgroundColor: '#ffffff',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(203).setInteractive({ useHandCursor: true });
    restartBtn.once('pointerdown', () => this.restartGame());
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

    this._onWindowRestartKey = (event) => {
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        this.restartGame();
      }
    };
    window.addEventListener('keydown', this._onWindowRestartKey);

    this.events.once('shutdown', () => {
      this.enemySpawnEvent?.remove();
      this.bossEjectEvent?.remove();
      this.spaceKey?.off('down', this._onSpaceDown);
      this.cursors?.space?.off('down', this._onSpaceDown);
      kb.off('keydown-SPACE', this._onSpaceDown);
      this.restartKey?.off('down', this._onRestartDown);
      kb.off('keydown-R', this._onRestartDown);
      window.removeEventListener('keydown', this._onWindowRestartKey);
      this.touchControls?.detach();
    });
  }

  ensureBgm() {
    const ctx = this.sound.context;
    if (ctx?.state === 'suspended') ctx.resume();
    let bgm = this.sound.get('bgm');
    if (!bgm) bgm = this.sound.add('bgm', { loop: true, volume: BGM_VOLUME });
    if (!bgm.isPlaying) bgm.play();
  }

  freezeEnemies() {
    const freeze = (obj) => {
      if (!obj?.active || !obj.body) return;
      obj.body.setVelocity(0, 0);
      obj.setData('frozen', true);
    };
    this.enemies.children.iterate(freeze);
    this.bossHazards.children.iterate(freeze);
    if (this.boss?.active && this.boss.body) {
      this.boss.body.setVelocity(0, 0);
      this.boss.setData('frozen', true);
    }
  }

  unfreezeEnemies() {
    const thaw = (obj) => {
      if (!obj?.active) return;
      obj.setData('frozen', false);
    };
    this.enemies.children.iterate(thaw);
    this.bossHazards.children.iterate(thaw);
    if (this.boss?.active) this.boss.setData('frozen', false);
  }

  drawJarCracks(force = false) {
    const g = this.jarCracks;
    if (this.hp > 1 || !this.player.visible) {
      if (this._lastCrackKey !== 'off') {
        g.clear();
        this._lastCrackKey = 'off';
      }
      return;
    }
    const x = this.player.x | 0;
    const y = this.player.y | 0;
    const key = `${x}|${y}`;
    if (!force && key === this._lastCrackKey) return;
    this._lastCrackKey = key;

    const w = this.player.displayWidth;
    const h = this.player.displayHeight;
    g.clear();
    g.lineStyle(3, 0x2a1810, 0.85);
    g.lineCap = 'round';
    const bellyY = y + h * 0.28;
    g.beginPath();
    g.moveTo(x - w * 0.22, bellyY);
    g.lineTo(x - w * 0.08, bellyY + h * 0.02);
    g.lineTo(x + w * 0.04, bellyY - h * 0.01);
    g.lineTo(x + w * 0.18, bellyY + h * 0.02);
    g.lineTo(x + w * 0.26, bellyY);
    g.stroke();
    g.beginPath();
    g.moveTo(x - w * 0.14, bellyY + h * 0.06);
    g.lineTo(x + w * 0.02, bellyY + h * 0.07);
    g.lineTo(x + w * 0.16, bellyY + h * 0.05);
    g.stroke();
  }

  fillJamShape(g, points) {
    if (!points || points.length < 3) return;
    g.fillStyle(this.jamColor, 1);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.closePath();
    g.fillPath();
  }

  drawFullMeniscus(worldPoly) {
    const left = worldPoly[0];
    const right = worldPoly[worldPoly.length - 1];
    if (!left || !right) return;
    const midX = (left.x + right.x) / 2;
    const neckY = (left.y + right.y) / 2;
    const neckW = right.x - left.x;
    this.jamFill.fillStyle(this.jamLightColor, 0.32);
    this.jamFill.fillEllipse(midX, neckY - 1, neckW * 0.4, 5);
  }

  updateJarFill() {
    if (!this.player.visible) {
      if (this._lastFillKey !== 'hidden') {
        this.jamFill.clear();
        this.jarCracks.clear();
        this._lastFillKey = 'hidden';
        this._lastCrackKey = null;
      }
      return;
    }

    const ratio = Phaser.Math.Clamp(this.charge, 0, 1);
    const isFull = ratio >= 0.999;
    const px = this.player.x | 0;
    const py = this.player.y | 0;
    const ratioBucket = Math.round(ratio * 200);
    const fillKey = `${px}|${py}|${ratioBucket}`;

    this.drawJarCracks();

    if (fillKey === this._lastFillKey) return;
    this._lastFillKey = fillKey;

    const s = JAR_SCALE;
    const worldPoly = jarPolyWorld(this.player, s);
    const ys = worldPoly.map((p) => p.y);
    const bottom = Math.max(...ys);
    const top = Math.min(...ys);
    const surfaceY = isFull ? top : bottom - (bottom - top) * ratio;

    this.jamFill.clear();

    if (ratio < 0.01) {
      this.player.clearTint();
      return;
    }

    if (isFull) {
      this.fillJamShape(this.jamFill, worldPoly);
      this.drawFullMeniscus(worldPoly);
    } else {
      const clipped = clipPolygonAtMinY(worldPoly, surfaceY);
      if (clipped.length >= 3) {
        this.fillJamShape(this.jamFill, clipped);
        const surfPts = clipped.filter((p) => Math.abs(p.y - surfaceY) < 3 * s);
        if (surfPts.length) {
          const surfX = surfPts.reduce((a, p) => a + p.x, 0) / surfPts.length;
          this.jamFill.fillStyle(this.jamLightColor, 0.25);
          this.jamFill.fillEllipse(surfX, surfaceY + 2 * s, JAR_W * s * 0.36, 6 * s);
        }
      }
    }

    this.player.clearTint();
  }

  refreshJarAppearance() {
    if (this.hp <= 1) {
      this.player.play(this.jarFracturedAnim.animKey);
    } else {
      this.player.play(this.jarAnim.animKey);
    }
    this.jarCracks.setVisible(this.hp <= 1);
    this._lastCrackKey = null;
    this.drawJarCracks(true);
  }

  spawnEnemy() {
    if (!this.alive || this.isCinematic || this.bossPhase) return;
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

  setToastKillHudVisible(visible) {
    this.hudKillsLabel?.setVisible(visible);
    this.hudKillsIcon?.setVisible(visible);
    this.hudKillsCount?.setVisible(visible);
  }

  registerToastKill() {
    this.totalToastKills += 1;
    this.hudKillsCount?.setText(this.formatKillsCountText());
    this.refreshBestHud();
    if (!this.bossTriggered && this.totalToastKills >= BOSS_KILL_THRESHOLD) {
      this.bossTriggered = true;
      this.scheduleBossIntro();
    }
  }

  formatKillsCountText() {
    if (this.bossDefeated) return `${this.totalToastKills}`;
    return `${this.totalToastKills} / ${BOSS_KILL_THRESHOLD}`;
  }

  scheduleBossIntro() {
    let retries = 0;
    const tryStart = () => {
      if (!this.alive || this.bossPhase) return;
      if (this.isCinematic || this.isExploding) {
        if (retries++ >= BOSS_INTRO_MAX_RETRIES) return;
        this.time.delayedCall(200, tryStart);
        return;
      }
      this.startBossIntro();
    };
    tryStart();
  }

  startBossIntro() {
    this.bossPhase = 'intro';
    this.setToastKillHudVisible(false);
    this.isCinematic = true;
    this.enemySpawnEvent.paused = true;
    this.freezeEnemies();

    const victims = [];
    this.enemies.children.iterate((e) => { if (e?.active) victims.push(e); });
    killEnemiesStaggered(this, victims, ARENA.width / 2, ARENA.height / 2, 40);

    this.showSplashText('BOSS INCOMING', {
      holdMs: BOSS_SPLASH_HOLD_MS,
      fadeInMs: BOSS_SPLASH_FADE_IN_MS,
      fadeOutMs: BOSS_SPLASH_FADE_OUT_MS,
      fontSize: 84,
      onComplete: () => {
        if (!this.alive) return;
        this.popBigText(ARENA.width / 2, ARENA.height * 0.32, 'THE TOASTER!');
        this.time.delayedCall(1100, () => {
          if (!this.alive) return;
          this.isCinematic = false;
          this.unfreezeEnemies();
          this.spawnBoss();
        });
      },
    });
  }

  spawnBoss() {
    this.bossPhase = 'active';
    const cx = ARENA.width / 2;
    const cy = ARENA.height * 0.38;

    this.boss = this.physics.add.sprite(cx, cy - 140, this.toasterAnim.firstKey);
    this.boss.play(this.toasterAnim.animKey);
    this.boss.body.setSize(TOASTER_W * 0.68, TOASTER_H * 0.62);
    this.boss.body.setOffset(TOASTER_W * 0.16, TOASTER_H * 0.2);
    this.bossEjectSlot = 0;
    this.bossEjectCount = 0;
    this.boss.setDepth(25);
    this.boss.setData('isBoss', true);
    this.boss.setScale(0.95);

    this.bossAura = this.add.graphics().setDepth(24);
    this.bossHeat = this.add.graphics().setDepth(26);

    this.tweens.add({
      targets: this.boss,
      y: cy,
      duration: 700,
      ease: 'Bounce.easeOut',
    });

    this.physics.add.overlap(this.player, this.boss, () => this.hitPlayer());

    this.tweens.add({
      targets: this.boss,
      scaleX: 0.97,
      scaleY: 0.93,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.bossPhaseEndsAt = this.time.now + BOSS_SURVIVE_MS;
    const surviveSec = Math.round(BOSS_SURVIVE_MS / 1000);
    const sm = Math.floor(surviveSec / 60);
    const ss = surviveSec % 60;
    const surviveLabel = sm > 0
      ? `${sm}:${ss < 10 ? '0' : ''}${ss}`
      : `0:${ss < 10 ? '0' : ''}${ss}`;
    this.hudBossTimer.setAlpha(1);
    this.hudBossTimer.setText(`Survive: ${surviveLabel}`);

    this.popBigText(cx, cy - 80, `SURVIVE ${surviveSec}S!`);

    this.bossEjectEvent = this.time.addEvent({
      delay: BOSS_EJECT_INTERVAL_MS,
      loop: true,
      callback: () => {
        this.bossEjectCount += 1;
        const burst = this.bossEjectCount % BOSS_BURST_EVERY === 0;
        this.bossEjectToast(burst);
      },
    });
    this.time.delayedCall(600, () => this.bossEjectToast(false));
  }

  drawBossAura() {
    if (!this.bossAura || !this.boss?.active) return;
    const g = this.bossAura;
    g.clear();
    const bx = this.boss.x;
    const by = this.boss.y + this.boss.displayHeight * 0.42;
    const rw = this.boss.displayWidth * 0.42;
    const rh = this.boss.displayHeight * 0.09;
    g.fillStyle(0x1a1410, 0.28);
    g.fillEllipse(bx, by, rw * 2, rh * 2);
  }

  ejectToastFromSlot(slotIdx, rageT) {
    if (this.bossHazards.countActive(true) >= MAX_BOSS_HAZARDS) return;

    const s = this.boss.scaleX;
    const slotOffsetX = slotIdx === 0 ? -52 * s : 52 * s;
    const mouthY = this.boss.y - this.boss.displayHeight * 0.36;
    const spawnX = this.boss.x + slotOffsetX;
    const spawnY = mouthY - 32;

    const toast = this.bossHazards.create(spawnX, spawnY, this.toastAnim.firstKey);
    toast.play(this.toastAnim.animKey);
    toast.setScale(0.46 + rageT * 0.06);
    toast.body.setCircle(36, 22, 22);
    toast.setDepth(16);
    toast.setData('isProjectile', true);

    const spread = Phaser.Math.DegToRad(Phaser.Math.Between(-7, 7));
    const angle = Phaser.Math.Angle.Between(spawnX, mouthY, this.player.x, this.player.y) + spread;
    const spd = Phaser.Math.Between(215, 250) + rageT * 50;

    toast.setAngle(Phaser.Math.RadToDeg(angle) + 90);
    toast.body.setVelocity(0, 0);
    this.tweens.add({
      targets: toast,
      y: mouthY,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!toast?.active) return;
        toast.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      },
    });

    this.time.delayedCall(4200, () => { if (toast?.active) toast.destroy(); });
  }

  bossEjectToast(burst = false) {
    if (this.bossPhase !== 'active' || !this.boss?.active) return;

    const elapsed = this.time.now - (this.bossPhaseEndsAt - BOSS_SURVIVE_MS);
    const rageT = Phaser.Math.Clamp(elapsed / BOSS_SURVIVE_MS, 0, 1);

    this.tweens.add({
      targets: this.boss,
      scaleY: 0.92,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    if (this.bossHeat) {
      this.bossHeat.clear();
      this.bossHeat.fillStyle(0xff6622, 0.35 + rageT * 0.25);
      this.bossHeat.fillEllipse(
        this.boss.x, this.boss.y - this.boss.displayHeight * 0.32,
        this.boss.displayWidth * 0.7, 28,
      );
      this.time.delayedCall(140, () => this.bossHeat?.clear());
    }

    if (burst) {
      this.ejectToastFromSlot(0, rageT);
      this.time.delayedCall(130, () => this.ejectToastFromSlot(1, rageT));
      this.cameras.main.shake(100, 0.006);
    } else {
      const slotIdx = this.bossEjectSlot ?? 0;
      this.bossEjectSlot = 1 - slotIdx;
      this.ejectToastFromSlot(slotIdx, rageT);
      this.cameras.main.shake(70, 0.004);
    }
  }

  updateBoss() {
    if (this.bossPhase !== 'active' || !this.boss?.active) return;
    if (this.boss.getData('frozen')) return;

    const elapsed = this.time.now - (this.bossPhaseEndsAt - BOSS_SURVIVE_MS);
    const t = Phaser.Math.Clamp(elapsed / BOSS_SURVIVE_MS, 0, 1);
    const bossSpeed = 72 + t * 105;
    chasePlayer(this.boss, this.player, bossSpeed);
    this.drawBossAura();

    const leftMs = Math.max(0, this.bossPhaseEndsAt - this.time.now);
    const sec = Math.ceil(leftMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const timerKey = `${m}:${s}`;
    if (timerKey !== this._bossTimerKey) {
      this._bossTimerKey = timerKey;
      this.hudBossTimer.setText(`Survive: ${m}:${s < 10 ? '0' : ''}${s}`);
    }

    if (leftMs <= 0) this.finishBossVictory();
  }

  finishBossVictory() {
    if (this.bossPhase !== 'active') return;
    this.bossPhase = 'collapse';
    this.bossDefeated = true;
    this.bossEjectEvent?.remove();
    this.bossEjectEvent = null;

    const briefInvincibility = 1800;
    this.invincibleUntil = this.time.now + briefInvincibility;

    this.popBigText(ARENA.width / 2, ARENA.height * 0.4, 'BREAKFAST SAVED!');
    this.cameras.main.shake(500, 0.025);
    this.cameras.main.flash(220, 255, 240, 200);

    this.bossHazards.children.iterate((c) => { if (c?.active) c.destroy(); });

    this.bossAura?.destroy();
    this.bossHeat?.destroy();
    this.bossAura = null;
    this.bossHeat = null;

    if (this.boss?.active) {
      this.tweens.add({
        targets: this.boss,
        y: -300,
        angle: 180,
        alpha: 0,
        duration: 1400,
        ease: 'Cubic.easeIn',
        onComplete: () => this.boss?.destroy(),
      });
    }

    this.hudBossTimer?.setAlpha(0);

    this.time.delayedCall(1400, () => this.startEndlessMode());
  }

  startEndlessMode() {
    if (!this.alive) return;
    this.bossPhase = null;

    this.hudKillsLabel?.setText('toasts toasted');
    this.hudKillsCount?.setText(this.formatKillsCountText());
    this.setToastKillHudVisible(true);

    this.popBigText(ARENA.width / 2, ARENA.height * 0.32, 'ENDLESS TOAST!');

    if (this.enemySpawnEvent) {
      this.enemySpawnEvent.paused = false;
      this.enemySpawnEvent.delay = ENDLESS_SPAWN_MS;
    }
  }

  tryExplode() {
    if (!this.alive) return;
    if (this.isExploding || this.isCinematic) return;
    if (this.charge < CHARGE_MIN_TO_FIRE) {
      this.popText(this.player.x, this.player.y - 70, 'not charged yet…');
      return;
    }
    this.doChargedExplosion();
  }

  tryRepairJar(killed) {
    if (killed < REPAIR_KILL_THRESHOLD) return;
    if (this.hp >= SURVIVAL.playerHp) return;

    this.hp = SURVIVAL.playerHp;
    this.refreshJarAppearance();
    this.hudHp.setText('jar intact');
    this.player.clearTint();
    this.popBigText(this.player.x, this.player.y - 60, 'JAR REPAIRED!');
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
      // Optional audio — visual explosion still runs.
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
      this.refreshBestHud();
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
    if (e.getData('isBoss')) return;
    this.registerToastKill();
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

  showSplashText(text, {
    holdMs = BOSS_SPLASH_HOLD_MS,
    fadeInMs = BOSS_SPLASH_FADE_IN_MS,
    fadeOutMs = BOSS_SPLASH_FADE_OUT_MS,
    fontSize = 76,
    onComplete,
  } = {}) {
    const cx = ARENA.width / 2;
    const cy = ARENA.height / 2;

    const overlay = this.add.rectangle(cx, cy, ARENA.width, ARENA.height, 0x1a1410)
      .setDepth(150).setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 0.68, duration: fadeInMs * 0.5 });

    const splash = this.add.text(cx, cy, text, {
      fontFamily: DOODLE_FONT,
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: this.uiJamHex,
      strokeThickness: 12,
      align: 'center',
    }).setOrigin(0.5).setDepth(151).setScale(2.6).setAlpha(0);

    this.cameras.main.shake(320, 0.02);
    this.cameras.main.flash(180, 255, 120, 90);

    this.tweens.add({
      targets: splash,
      alpha: 1,
      scale: 1,
      duration: fadeInMs,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(fadeInMs + holdMs, () => {
      this.tweens.add({
        targets: [splash, overlay],
        alpha: 0,
        duration: fadeOutMs,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          splash.destroy();
          overlay.destroy();
          onComplete?.();
        },
      });
    });
  }

  popBigText(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: DOODLE_FONT,
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
      fontFamily: DOODLE_FONT,
      fontSize: '20px', fontStyle: 'bold', color: this.uiJamHex,
      stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(55).setAngle(Phaser.Math.Between(-12, 12));
    this.tweens.add({
      targets: t, y: y - 40, alpha: 0, scale: 1.2, duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  hitPlayer() {
    if (!this.alive || this.isCinematic || this.bossPhase === 'collapse') return;
    if (this.time.now < this.invincibleUntil) return;
    this.hp -= 1;
    this.invincibleUntil = this.time.now + SURVIVAL.invincibleMs;
    this.cameras.main.shake(240, 0.014);
    this.cameras.main.flash(120, 255, 60, 60);

    if (this.hp === 1) {
      this.refreshJarAppearance();
      this.hudHp.setText('jar cracked…');
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
    this.bossEjectEvent?.remove();
    this.explodeBtn?.setVisible(false);

    const dx0 = this.player.x; const dy0 = this.player.y;
    this.player.setVisible(false);
    this.jamFill.clear();
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

    const persisted = recordRun({
      score: this.score,
      kills: this.totalToastKills,
      maxCombo: this.maxKillsInOneShot,
      won: this.bossDefeated,
    });
    this.best = persisted.record;
    this.refreshBestHud();

    this.add.rectangle(ARENA.width / 2, ARENA.height / 2, ARENA.width, ARENA.height, 0xf5efde, 0.92).setDepth(200);
    const card = this.add.graphics().setDepth(201);
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(ARENA.width / 2 - 300, ARENA.height / 2 - 200, 600, 400, 14);
    card.lineStyle(6, 0x1a1410, 0.9);
    card.strokeRoundedRect(ARENA.width / 2 - 300, ARENA.height / 2 - 200, 600, 400, 14);

    const cx = ARENA.width / 2;

    const heading = this.bossDefeated ? 'BREAKFAST SAVED!' : pickQuip(QUIPS_DEATH);
    this.add.text(cx, ARENA.height * 0.28, heading, {
      fontFamily: DOODLE_FONT, fontSize: '36px', fontStyle: 'bold', color: this.uiJamHex,
    }).setOrigin(0.5).setDepth(202).setAngle(Phaser.Math.Between(-3, 3));

    this.add.text(cx, ARENA.height * 0.38, 'Stats', {
      fontFamily: DOODLE_FONT, fontSize: '22px', color: PALETTE.uiText,
    }).setOrigin(0.5).setDepth(202);

    const lines = [
      `Score: ${this.score}${persisted.isNewBestScore ? '  (NEW BEST!)' : ''}`,
      `Toasts toasted: ${this.totalToastKills}${persisted.isNewBestKills ? '  (NEW BEST!)' : ''}`,
      `Max toasts in one shot: ${this.maxKillsInOneShot}${persisted.isNewBestMaxCombo ? '  (NEW BEST!)' : ''}`,
      `Average per shot: ${avgKills}`,
      `Best: ${this.best.bestScore}  ·  Toasts ${this.best.bestKills}  ·  Wins ${this.best.wins}`,
    ];
    lines.forEach((line, i) => {
      this.add.text(cx, ARENA.height * (0.44 + i * 0.065), line, {
        fontFamily: DOODLE_FONT, fontSize: '22px', color: PALETTE.uiText,
      }).setOrigin(0.5).setDepth(202);
    });

    this.bindEndScreenRestart(cx, ARENA.height * 0.72);
  }

  update() {
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartGame();
      return;
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

    const kb = readMovementInput(this);
    const touch = this.touchControls?.getMovement?.() ?? { vx: 0, vy: 0 };
    const vx = Math.abs(touch.vx) + Math.abs(touch.vy) > 0 ? touch.vx : kb.vx;
    const vy = Math.abs(touch.vx) + Math.abs(touch.vy) > 0 ? touch.vy : kb.vy;
    const speed = 230;
    this.player.body.setVelocity(vx * speed, vy * speed);

    this.updateJarFill();
    this.drawChargeMeter(this.charge);

    if (!this.isCinematic) {
      const speedNow = enemySpeedFor(this.time.now - this.startTime);
      this.enemies.children.iterate((e) => {
        if (!e?.active || e.getData('frozen')) return;
        chasePlayer(e, this.player, speedNow);
      });
    }

    if (this.bossPhase === 'active') this.updateBoss();

    if (this.time.now < this.invincibleUntil) {
      this.player.alpha = (Math.floor(this.time.now / 80) % 2) ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }
}
