/**
 * Écran de sélection des 3 prototypes de style.
 * Itération 1 : 3 directions très différentes du même gameplay (évitement + bombes en chaîne).
 */

const STYLES = [
  {
    id: 'StyleACartoon',
    label: 'A',
    title: 'Saturday Cartoon',
    subtitle: 'chaleureux  ·  bouncy  ·  familial',
    bg: 0xffd9a0,
    accent: 0xcc3344,
    text: '#3a1f0a',
  },
  {
    id: 'StyleBNoir',
    label: 'B',
    title: 'Pantry Noir',
    subtitle: 'sombre  ·  tendu  ·  fog of war',
    bg: 0x1a0a14,
    accent: 0xcc1133,
    text: '#c0a090',
  },
  {
    id: 'StyleCNeon',
    label: 'C',
    title: 'Neon Arcade',
    subtitle: 'synthwave  ·  dash  ·  score chase',
    bg: 0x06031a,
    accent: 0xff33ee,
    text: '#00f0ff',
  },
];

export class StylePickerScene extends Phaser.Scene {
  constructor() { super({ key: 'StylePickerScene' }); }

  create() {
    const { width, height } = this.scale;

    const bgTop = this.add.rectangle(width / 2, height / 4, width, height / 2, 0x111122);
    const bgBot = this.add.rectangle(width / 2, (height * 3) / 4, width, height / 2, 0x06030a);
    bgTop.setDepth(-10); bgBot.setDepth(-10);

    this.add.text(width / 2, 60, 'JEU 2 CONFITURE', {
      fontFamily: 'monospace', fontSize: '54px', color: '#ffee44',
      stroke: '#cc3344', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, 'Itération 1 — choisis le style à tester', {
      fontFamily: 'monospace', fontSize: '20px', color: '#cccccc',
    }).setOrigin(0.5);

    const cardW = 360;
    const cardH = 380;
    const gap = 40;
    const totalW = cardW * 3 + gap * 2;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cy = height / 2 + 30;

    STYLES.forEach((s, i) => {
      const cx = startX + i * (cardW + gap);
      this.makeCard(cx, cy, cardW, cardH, s);
    });

    this.add.text(width / 2, height - 60, 'WASD / flèches pour bouger  ·  R rejouer  ·  ESC retour menu', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 32, 'Mécanique commune : 2 PV, évite les ennemis, touche une bombe pour faire exploser tous les ennemis autour', {
      fontFamily: 'monospace', fontSize: '13px', color: '#666666',
    }).setOrigin(0.5);
  }

  makeCard(cx, cy, w, h, style) {
    const bg = this.add.rectangle(cx, cy, w, h, style.bg);
    bg.setStrokeStyle(3, style.accent, 1);

    this.add.text(cx, cy - h / 2 + 38, style.label, {
      fontFamily: 'monospace', fontSize: '52px', color: style.text,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(cx, cy - h / 2 + 100, style.title, {
      fontFamily: 'monospace', fontSize: '24px', color: style.text,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, cy - h / 2 + 132, style.subtitle, {
      fontFamily: 'monospace', fontSize: '13px', color: style.text,
    }).setOrigin(0.5);

    this.drawPreview(cx, cy + 10, style);

    const btn = this.add.rectangle(cx, cy + h / 2 - 40, w - 60, 50, style.accent, 1)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(cx, cy + h / 2 - 40, 'JOUER', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    btn.on('pointerover', () => { bg.setStrokeStyle(5, style.accent, 1); btnText.setScale(1.08); });
    btn.on('pointerout', () => { bg.setStrokeStyle(3, style.accent, 1); btnText.setScale(1); });
    btn.on('pointerdown', () => this.launch(style.id));
  }

  drawPreview(cx, cy, style) {
    const w = 280; const h = 130;
    const box = this.add.rectangle(cx, cy, w, h, 0x000000, 0.35);
    box.setStrokeStyle(1, style.accent, 0.6);

    const jar = this.add.rectangle(cx - 80, cy, 26, 32, style.accent, 1);
    jar.setStrokeStyle(2, 0xffffff, 0.8);
    this.add.rectangle(cx - 80, cy - 18, 22, 6, 0xffee44);

    for (let i = 0; i < 3; i++) {
      const ex = cx + 30 + i * 26;
      this.add.rectangle(ex, cy - 10 + (i % 2) * 18, 20, 18, 0x8b5a2b)
        .setStrokeStyle(1, style.accent, 0.8);
    }

    const bomb = this.add.circle(cx - 20, cy + 10, 9, 0xffee44);
    bomb.setStrokeStyle(2, style.accent, 1);

    const ring = this.add.circle(cx - 20, cy + 10, 50, 0xffffff, 0).setScale(0.2);
    ring.setStrokeStyle(2, 0xffffff, 0.6);
    this.tweens.add({
      targets: ring, scale: 1, alpha: { from: 1, to: 0 },
      duration: 1100, repeat: -1, ease: 'Cubic.easeOut',
    });
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
