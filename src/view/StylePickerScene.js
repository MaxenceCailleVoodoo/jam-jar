/**
 * Écran de sélection — Itération 2.
 * 3 styles smooth/vectoriels avec previews vivantes (mini-animations).
 */

const STYLES = [
  {
    id: 'StyleJuicy',
    title: 'Juicy',
    subtitle: 'mobile arcade  ·  juteux  ·  bouncy',
    attack: 'JAM globale',
    bg: 0xff9d7a,
    bgSecondary: 0xffe3b0,
    accent: 0xff2855,
    textColor: '#3a1a22',
    drawPreview: drawJuicyPreview,
  },
  {
    id: 'StyleNeonLiquid',
    title: 'Neon Liquid',
    subtitle: 'glow synthwave  ·  trails  ·  rapide',
    attack: 'JAM rayon (cooldown court)',
    bg: 0x0a0420,
    bgSecondary: 0x18083a,
    accent: 0xff3ee0,
    textColor: '#00f0ff',
    drawPreview: drawNeonPreview,
  },
  {
    id: 'StyleDoodle',
    title: 'Watercolor Doodle',
    subtitle: 'hand-drawn  ·  wobble  ·  cosy',
    attack: 'JAM globale (gros splat)',
    bg: 0xf5efde,
    bgSecondary: 0xe8dcc0,
    accent: 0xcc2244,
    textColor: '#2a1810',
    drawPreview: drawDoodlePreview,
  },
];

function rrect(g, x, y, w, h, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x, y, w, h, r);
}

function drawJuicyPreview(scene, cx, cy) {
  const c = scene.add.container(cx, cy);

  const jar = scene.add.graphics();
  jar.fillStyle(0xff2855, 1);
  jar.fillRoundedRect(-22, -28, 44, 56, 8);
  jar.fillStyle(0x3a1a22, 1);
  jar.fillRoundedRect(-26, -36, 52, 14, 4);
  jar.fillStyle(0xffffff, 0.45);
  jar.fillRoundedRect(-18, -22, 5, 38, 2);
  jar.fillStyle(0x1a0a08, 1);
  jar.fillCircle(-8, -2, 4);
  jar.fillCircle(8, -2, 4);
  c.add(jar);

  for (let i = 0; i < 3; i++) {
    const ex = 60 + i * 32;
    const toast = scene.add.graphics();
    toast.fillStyle(0xa66832, 1);
    toast.fillRoundedRect(ex - 14, -16, 28, 32, 6);
    toast.fillStyle(0xf5d088, 1);
    toast.fillRoundedRect(ex - 11, -13, 22, 26, 4);
    toast.fillStyle(0x1a0a08, 1);
    toast.fillCircle(ex - 4, -2, 2.5);
    toast.fillCircle(ex + 4, -2, 2.5);
    c.add(toast);
  }

  const wave = scene.add.circle(0, 0, 90, 0xff2855, 0).setScale(0.1);
  wave.setStrokeStyle(3, 0xff2855, 1);
  c.add(wave);
  scene.tweens.add({
    targets: wave, scale: 1, alpha: { from: 1, to: 0 },
    duration: 1200, repeat: -1, ease: 'Cubic.easeOut',
  });
  return c;
}

function drawNeonPreview(scene, cx, cy) {
  const c = scene.add.container(cx, cy);

  const jar = scene.add.graphics();
  jar.fillStyle(0x1c0a2e, 1);
  jar.fillRoundedRect(-22, -28, 44, 56, 8);
  jar.fillStyle(0xff3ee0, 1);
  jar.fillRoundedRect(-18, -22, 36, 44, 6);
  jar.lineStyle(3, 0xff3ee0, 1);
  jar.strokeRoundedRect(-22, -28, 44, 56, 8);
  jar.fillStyle(0xffee44, 1);
  jar.fillRoundedRect(-26, -36, 52, 14, 4);
  c.add(jar);

  for (let i = 0; i < 3; i++) {
    const ex = 60 + i * 32;
    const toast = scene.add.graphics();
    toast.fillStyle(0x06283a, 1);
    toast.fillRoundedRect(ex - 14, -16, 28, 32, 6);
    toast.lineStyle(2, 0x00f0ff, 1);
    toast.strokeRoundedRect(ex - 14, -16, 28, 32, 6);
    toast.fillStyle(0x1de9ff, 1);
    toast.fillCircle(ex - 4, -2, 2.5);
    toast.fillCircle(ex + 4, -2, 2.5);
    c.add(toast);
  }

  const pool = scene.add.circle(0, 0, 60, 0xff3ee0, 0.35).setScale(0.1);
  c.add(pool);
  scene.tweens.add({
    targets: pool, scale: 1, alpha: 0,
    duration: 1100, repeat: -1, ease: 'Cubic.easeOut',
  });
  const ring = scene.add.circle(0, 0, 60, 0xff3ee0, 0).setScale(0.1);
  ring.setStrokeStyle(2, 0xff3ee0, 1);
  c.add(ring);
  scene.tweens.add({
    targets: ring, scale: 1, alpha: { from: 1, to: 0 },
    duration: 1100, repeat: -1, ease: 'Cubic.easeOut',
  });
  return c;
}

function drawDoodlePreview(scene, cx, cy) {
  const c = scene.add.container(cx, cy);

  const jar = scene.add.graphics();
  jar.fillStyle(0xcc2244, 0.85);
  jar.fillRoundedRect(-22, -28, 44, 56, 10);
  jar.fillStyle(0xcc2244, 1);
  jar.fillRoundedRect(-26, -36, 52, 14, 5);
  jar.lineStyle(4, 0x1a1410, 0.9);
  jar.strokeRoundedRect(-22, -28, 44, 56, 10);
  jar.strokeRoundedRect(-26, -36, 52, 14, 5);
  jar.fillStyle(0x1a1410, 1);
  jar.fillCircle(-8, -4, 3.5);
  jar.fillCircle(8, -4, 3.5);
  c.add(jar);

  scene.tweens.add({
    targets: jar, angle: { from: -3, to: 3 }, duration: 350, yoyo: true, repeat: -1,
  });

  for (let i = 0; i < 3; i++) {
    const ex = 60 + i * 32;
    const toast = scene.add.graphics();
    toast.fillStyle(0xe8b860, 1);
    toast.fillRoundedRect(ex - 14, -16, 28, 32, 8);
    toast.lineStyle(3, 0x1a1410, 0.9);
    toast.strokeRoundedRect(ex - 14, -16, 28, 32, 8);
    toast.fillStyle(0x1a1410, 1);
    toast.fillCircle(ex - 4, -2, 3);
    toast.fillCircle(ex + 4, -2, 3);
    c.add(toast);
    scene.tweens.add({
      targets: toast, angle: { from: -5, to: 5 },
      duration: 400 + i * 60, yoyo: true, repeat: -1,
    });
  }
  return c;
}

export class StylePickerScene extends Phaser.Scene {
  constructor() { super({ key: 'StylePickerScene' }); }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(10 + (24 - 10) * t);
      const g = Math.round(10 + (10 - 10) * t);
      const b = Math.round(20 + (40 - 20) * t);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }

    this.add.text(width / 2, 56, 'JEU 2 CONFITURE', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '60px',
      fontStyle: 'bold', color: '#ffee44',
      stroke: '#cc2244', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 104, 'Itération 2 — 3 styles smooth, choisis-en un', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '18px',
      color: '#cccccc',
    }).setOrigin(0.5);

    const cardW = 360;
    const cardH = 420;
    const gap = 36;
    const totalW = cardW * 3 + gap * 2;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cy = height / 2 + 40;

    STYLES.forEach((s, i) => {
      const cx = startX + i * (cardW + gap);
      this.makeCard(cx, cy, cardW, cardH, s);
    });

    this.add.text(width / 2, height - 56,
      'WASD / flèches pour bouger   ·   SPACE pour déclencher la confiture   ·   R rejouer   ·   ESC menu', {
        fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '15px', color: '#888888',
      }).setOrigin(0.5);

    this.add.text(width / 2, height - 32,
      '2 PV. Les tartines vous chassent. Déclenchez la confiture au bon moment pour faire un combo.', {
        fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '13px', color: '#666666',
      }).setOrigin(0.5);
  }

  makeCard(cx, cy, w, h, style) {
    const g = this.add.graphics();
    g.fillStyle(style.bg, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
    g.lineStyle(3, style.accent, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);

    this.add.text(cx, cy - h / 2 + 36, style.title, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '30px',
      fontStyle: 'bold', color: style.textColor,
    }).setOrigin(0.5);

    this.add.text(cx, cy - h / 2 + 70, style.subtitle, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '13px',
      color: style.textColor,
    }).setOrigin(0.5);

    style.drawPreview(this, cx - 40, cy - 4);

    this.add.text(cx, cy + h / 2 - 86, 'Attaque', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '12px',
      color: style.textColor,
    }).setOrigin(0.5).setAlpha(0.7);

    this.add.text(cx, cy + h / 2 - 68, style.attack, {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px',
      fontStyle: 'bold', color: style.textColor,
    }).setOrigin(0.5);

    const btnY = cy + h / 2 - 32;
    const btn = this.add.graphics();
    btn.fillStyle(style.accent, 1);
    btn.fillRoundedRect(cx - (w - 60) / 2, btnY - 22, w - 60, 44, 10);
    const btnText = this.add.text(cx, btnY, 'JOUER', {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '20px',
      fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    const hit = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => {
      g.clear();
      g.fillStyle(style.bg, 1);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
      g.lineStyle(5, style.accent, 1);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
      btnText.setScale(1.06);
    });
    hit.on('pointerout', () => {
      g.clear();
      g.fillStyle(style.bg, 1);
      g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
      g.lineStyle(3, style.accent, 1);
      g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 16);
      btnText.setScale(1);
    });
    hit.on('pointerdown', () => this.launch(style.id));

    void btn;
  }

  launch(sceneKey) {
    let bgm = this.sound.get('bgm');
    if (!bgm) {
      bgm = this.sound.add('bgm', { loop: true, volume: 0.45 });
    }
    if (!bgm.isPlaying) {
      bgm.play();
    }
    this.scene.start(sceneKey);
  }
}
