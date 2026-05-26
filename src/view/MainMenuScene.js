import { gameState } from '../model/GameState.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.4);
    for (let x = 0; x < width; x += 64) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 64) {
      grid.lineBetween(0, y, width, y);
    }

    this.add.text(width / 2, height * 0.28, 'CONFITURE OPS', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ff6b6b',
      stroke: '#ffffff',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, 'Dead Ops, but stickier.', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.55, 'WASD — move   |   Mouse — aim   |   Click — shoot', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, height * 0.72, 'Press ENTER to spread chaos', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffe066',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    gameState.startGame();
    this.scene.start('GameScene');
    this.scene.launch('HUDScene');
  }
}
