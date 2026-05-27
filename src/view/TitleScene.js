import { ARENA, BGM_VOLUME } from './styles/sharedSurvival.js';
import { JAM_FLAVORS, DEFAULT_JAM_ID, pickBreakfastQuip } from './jamFlavors.js';
import {
  DOODLE_PALETTE, buildPaperTexture, drawInkFrame, crispDoodleText,
} from './doodleTheme.js';
import { loadBest } from './persistence.js';

const KEY = 'TitleScene';
const PAPER_KEY = 'title-paper';
const W = ARENA.width;
const H = ARENA.height;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: KEY });
  }

  init() {
    const saved = this.registry.get('jamFlavor');
    const idx = JAM_FLAVORS.findIndex((f) => f.id === saved);
    this.selectedIndex = idx >= 0 ? idx : JAM_FLAVORS.findIndex((f) => f.id === DEFAULT_JAM_ID);
  }

  create() {
    this.cameras.main.setBackgroundColor(DOODLE_PALETTE.paper);
    buildPaperTexture(this, PAPER_KEY);
    this.add.tileSprite(W / 2, H / 2, W, H, PAPER_KEY).setDepth(-10);
    drawInkFrame(this.add.graphics().setDepth(-5), W, H);

    this.buildTitle();
    this.buildFlavorPicker();
    this.buildStartPrompt();
    this.setupInput();
  }

  buildTitle() {
    this.titleTxt = crispDoodleText(this, W / 2, 72, 'Appetite for Jam', {
      fontSize: '52px',
      fontStyle: 'bold',
      color: DOODLE_PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: this.titleTxt,
      y: 74,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    crispDoodleText(this, W / 2, 138, 'watercolor breakfast brawl', {
      fontSize: '20px',
      fontStyle: 'italic',
      color: DOODLE_PALETTE.uiText,
    }).setOrigin(0.5).setDepth(10);

    crispDoodleText(this, W / 2, 172, 'dodge toast · charge the jar · spread justice', {
      fontSize: '15px',
      color: DOODLE_PALETTE.uiText,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.85);

    this.sideQuip = crispDoodleText(this, W / 2, 202, pickBreakfastQuip(), {
      fontSize: '16px',
      fontStyle: 'bold',
      color: DOODLE_PALETTE.crust,
    }).setOrigin(0.5).setDepth(10);
  }

  buildFlavorPicker() {
    crispDoodleText(this, W / 2, 248, 'Pick your jam', {
      fontSize: '32px',
      fontStyle: 'bold',
      color: DOODLE_PALETTE.uiText,
    }).setOrigin(0.5).setDepth(20);

    this.flavorCards = [];
    const cardW = 260;
    const cardH = 150;
    const gap = 48;
    const totalW = JAM_FLAVORS.length * cardW + (JAM_FLAVORS.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + cardW / 2;
    const cy = 390;

    JAM_FLAVORS.forEach((flavor, i) => {
      const x = startX + i * (cardW + gap);
      const container = this.add.container(x, cy).setDepth(20);
      const bg = this.add.graphics();
      const jar = this.add.graphics();
      const name = crispDoodleText(this, x, cy + 52, flavor.name, {
        fontSize: '22px',
        fontStyle: 'bold',
        color: DOODLE_PALETTE.uiText,
      }).setOrigin(0.5).setDepth(21);

      container.add([bg, jar]);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains,
      );

      Object.assign(container, {
        flavor, bg, jarGfx: jar, nameText: name, cardW, cardH,
      });

      container.on('pointerover', () => this.selectFlavor(i));
      container.on('pointerdown', () => {
        this.selectFlavor(i);
        this.launchGame();
      });

      this.flavorCards.push(container);
    });

    this.refreshFlavorCards();
  }

  drawCardFrame(bg, selected, jamHex, cardW, cardH) {
    bg.clear();
    const hw = cardW / 2;
    const hh = cardH / 2;
    bg.fillStyle(0xffffff, selected ? 1 : 0.94);
    bg.fillRoundedRect(-hw, -hh, cardW, cardH, 14);
    const jam = Phaser.Display.Color.HexStringToColor(jamHex).color;
    bg.lineStyle(selected ? 4 : 2, jam, 1);
    bg.strokeRoundedRect(-hw, -hh, cardW, cardH, 14);
  }

  drawMiniJar(g, jamHex) {
    g.clear();
    const jam = Phaser.Display.Color.HexStringToColor(jamHex).color;
    const ink = Phaser.Display.Color.HexStringToColor(DOODLE_PALETTE.ink).color;
    g.fillStyle(0xf5efde, 1);
    g.fillRoundedRect(-32, -28, 64, 68, 10);
    g.fillStyle(jam, 1);
    g.fillRoundedRect(-26, -14, 52, 38, 6);
    g.fillStyle(jam, 1);
    g.fillRoundedRect(-36, -38, 72, 20, 6);
    g.fillStyle(ink, 1);
    g.fillCircle(-12, 12, 4);
    g.fillCircle(12, 12, 4);
    g.lineStyle(2.5, ink, 1);
    g.strokeRoundedRect(-32, -28, 64, 68, 10);
  }

  refreshFlavorCards() {
    this.flavorCards.forEach((card, i) => {
      const selected = i === this.selectedIndex;
      const { flavor, cardW, cardH } = card;
      this.drawCardFrame(card.bg, selected, flavor.jam, cardW, cardH);
      this.drawMiniJar(card.jarGfx, flavor.jam);
      card.nameText.setColor(selected ? flavor.jam : DOODLE_PALETTE.uiText);
      card.nameText.setFontStyle(selected ? 'bold' : 'normal');
    });

    const f = JAM_FLAVORS[this.selectedIndex];
    this.registry.set('jamFlavor', f.id);
    if (this.flavorQuip) {
      this.flavorQuip.setText(`"${f.tagline}" — ready to spread`);
      this.flavorQuip.setColor(f.jam);
    }
  }

  selectFlavor(index) {
    this.selectedIndex = Phaser.Math.Wrap(index, 0, JAM_FLAVORS.length);
    this.refreshFlavorCards();
  }

  buildStartPrompt() {
    const f = JAM_FLAVORS[this.selectedIndex];
    this.flavorQuip = crispDoodleText(this, W / 2, 508, `"${f.tagline}" — ready to spread`, {
      fontSize: '19px',
      fontStyle: 'bold',
      color: f.jam,
    }).setOrigin(0.5).setDepth(30);

    this.prompt = crispDoodleText(this, W / 2, 548, 'Space or Enter — breakfast is served', {
      fontSize: '24px',
      fontStyle: 'bold',
      color: DOODLE_PALETTE.uiAccent,
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: this.prompt,
      alpha: { from: 1, to: 0.45 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    crispDoodleText(this, W / 2, 588, '← → pick a jar  ·  click to play  ·  R restarts in-game', {
      fontSize: '14px',
      color: DOODLE_PALETTE.uiText,
    }).setOrigin(0.5).setDepth(30).setAlpha(0.8);

    const best = loadBest();
    if (best.bestScore > 0 || best.wins > 0) {
      crispDoodleText(
        this, W / 2, 622,
        `best  ${best.bestScore}  ·  toasts ${best.bestKills}  ·  wins ${best.wins}`,
        { fontSize: '14px', fontStyle: 'bold', color: DOODLE_PALETTE.uiAccent },
      ).setOrigin(0.5).setDepth(30).setAlpha(0.9);
    }

    crispDoodleText(this, W / 2, H - 32, 'no waffles were harmed (many toasts were)', {
      fontSize: '13px',
      fontStyle: 'italic',
      color: DOODLE_PALETTE.crust,
    }).setOrigin(0.5).setDepth(30);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
    this._leftHeld = false;
    this._rightHeld = false;
    this._startHeld = false;
    this.input.once('pointerdown', () => this.startBgm());
    this.input.keyboard?.once('keydown', () => this.startBgm());
  }

  startBgm() {
    if (!this.cache.audio.exists('bgm')) return;
    const ctx = this.sound.context;
    if (ctx?.state === 'suspended') ctx.resume();
    let bgm = this.sound.get('bgm');
    if (!bgm) bgm = this.sound.add('bgm', { loop: true, volume: BGM_VOLUME });
    if (!bgm.isPlaying) bgm.play();
  }

  launchGame() {
    this.startBgm();
    const flavor = JAM_FLAVORS[this.selectedIndex];
    this.registry.set('jamFlavor', flavor.id);
    this.cameras.main.fadeOut(300, 245, 239, 222);
    this.time.delayedCall(320, () => {
      this.scene.start('StyleDoodle', { flavorId: flavor.id });
    });
  }

  update() {
    if (this.consumeEdge(this.cursors.left, '_leftHeld')) this.selectFlavor(this.selectedIndex - 1);
    if (this.consumeEdge(this.cursors.right, '_rightHeld')) this.selectFlavor(this.selectedIndex + 1);

    const startDown = this.keys.ENTER.isDown || this.keys.SPACE.isDown;
    if (startDown && !this._startHeld) this.launchGame();
    this._startHeld = startDown;
  }

  consumeEdge(key, flag) {
    const down = key?.isDown ?? false;
    const edge = down && !this[flag];
    this[flag] = down;
    return edge;
  }
}
