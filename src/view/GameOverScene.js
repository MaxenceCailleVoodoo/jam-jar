import { gameState } from '../model/GameState.js';
import { formatScore } from '../shared/utils.js';
import { randomFrom, GAME_OVER_QUIPS } from '../model/Quips.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene', active: false });
  }

  create(data) {
    const { width, height } = this.scale;
    const score = data?.score ?? 0;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    this.add.text(width / 2, height * 0.3, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#ff6b6b',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, randomFrom(GAME_OVER_QUIPS), {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.55, `Final Score: ${formatScore(score)}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.72, 'ENTER — retry   |   M — menu', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffe066',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      gameState.startGame();
      this.scene.start('GameScene');
      this.scene.launch('HUDScene');
    });

    this.input.keyboard.once('keydown-M', () => {
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('MainMenuScene');
    });
  }
}
