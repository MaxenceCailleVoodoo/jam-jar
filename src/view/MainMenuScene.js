import { gameState } from '../model/GameState.js';
import { CHARACTERS } from '../model/CharacterConfig.js';
import { previewJarTexture } from './PixelArt.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.selectedIndex = CHARACTERS.findIndex((c) => c.id === gameState.selectedCharacter.id);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    this.add.tileSprite(width / 2, height / 2, width, height, 'floor-tile').setTileScale(4);

    this.add.text(width / 2, height * 0.1, 'JAM OPS', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ff4466',
      stroke: '#ffe066',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.2, 'Choisis ta confiture', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#f5deb3',
    }).setOrigin(0.5);

    this.previewJar = this.add.image(width / 2, height * 0.46, previewJarTexture(CHARACTERS[0].id))
      .setScale(5);

    this.charName = this.add.text(width / 2, height * 0.62, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.flavorText = this.add.text(width / 2, height * 0.68, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffe066',
    }).setOrigin(0.5);

    this.arrowLeft = this.add.text(width / 2 - 140, height * 0.46, '◀', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffe066',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.arrowRight = this.add.text(width / 2 + 140, height * 0.46, '▶', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffe066',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.dotsText = this.add.text(width / 2, height * 0.74, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    this.prompt = this.add.text(width / 2, height * 0.86, 'ENTER — lancer le chaos', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffe066',
    }).setOrigin(0.5);

    this.tweens.add({ targets: this.prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.93, '← → changer  ·  WASD en jeu  ·  Click tirer', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);

    this.arrowLeft.on('pointerdown', () => this.cycle(-1));
    this.arrowRight.on('pointerdown', () => this.cycle(1));

    this.input.keyboard.on('keydown-LEFT', () => this.cycle(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.cycle(1));
    this.input.keyboard.on('keydown-A', () => this.cycle(-1));
    this.input.keyboard.on('keydown-D', () => this.cycle(1));
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    this.updateSelection(false);
  }

  cycle(dir) {
    this.selectedIndex = (this.selectedIndex + dir + CHARACTERS.length) % CHARACTERS.length;
    this.updateSelection(true);
  }

  updateSelection(animate) {
    const char = CHARACTERS[this.selectedIndex];
    gameState.selectCharacter(char);

    this.previewJar.setTexture(previewJarTexture(char.id));
    this.charName.setText(char.name);
    this.flavorText.setText(char.flavor);
    this.dotsText.setText(
      CHARACTERS.map((_, i) => (i === this.selectedIndex ? '●' : '○')).join(' '),
    );

    if (animate) {
      this.previewJar.setScale(4.2);
      this.tweens.add({
        targets: this.previewJar,
        scaleX: 5,
        scaleY: 5,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }

  startGame() {
    gameState.startGame();
    this.scene.start('GameScene');
    this.scene.launch('HUDScene');
  }
}
