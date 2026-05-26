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

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82);
    this.add.image(width / 2, height * 0.22, 'jar-0').setScale(4).setAlpha(0.9);

    this.add.text(width / 2, height * 0.42, 'JAR EMPTY', {
      fontFamily: 'monospace', fontSize: '64px', color: '#ff4466',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.52, randomFrom(GAME_OVER_QUIPS), {
      fontFamily: 'monospace', fontSize: '22px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.62, `Score: ${formatScore(score)}`, {
      fontFamily: 'monospace', fontSize: '34px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.76, 'ENTER retry  ·  M menu', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffe066',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => this.retry());
    this.input.keyboard.once('keydown-M', () => this.toMenu());
  }

  retry() {
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    gameState.startGame();
    this.scene.start('GameScene');
    this.scene.launch('HUDScene');
  }

  toMenu() {
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('MainMenuScene');
  }
}
