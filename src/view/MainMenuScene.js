import { gameState } from '../model/GameState.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.tileSprite(width / 2, height / 2, width, height, 'floor-tile').setTileScale(4);

    this.add.text(width / 2, height * 0.18, 'JAM OPS', {
      fontFamily: 'monospace',
      fontSize: '80px',
      color: '#ff4466',
      stroke: '#ffe066',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.32, 'Spread jam. Destroy bread. Fear Nutella.', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f5deb3',
    }).setOrigin(0.5);

    this.add.image(width / 2, height * 0.48, 'jar-3').setScale(3);

    this.add.text(width / 2, height * 0.62, 'WASD move  ·  Mouse aim  ·  Click shoot jam', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height * 0.78, 'ENTER — open the jar', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffe066',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    gameState.startGame();
    this.scene.start('GameScene');
    this.scene.launch('HUDScene');
  }
}
