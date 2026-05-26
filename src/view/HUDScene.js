import { EventBus } from '../shared/EventBus.js';
import { formatScore } from '../shared/utils.js';
import { jarTextureForLives, previewJarTexture } from './PixelArt.js';
import { gameState } from '../model/GameState.js';
import { PLAYER } from '../model/LevelConfig.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene', active: false });
  }

  create() {
    const pad = 20;

    this.scoreText = this.add.text(pad, pad, 'Score: 000000', {
      fontFamily: 'monospace', fontSize: '26px', color: '#ffffff',
    });

    this.waveText = this.add.text(pad, pad + 34, 'Wave: 1', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffe066',
    });

    this.jarIcon = this.add.image(pad + 16, pad + 100, previewJarTexture(gameState.selectedCharacter.id)).setScale(2);
    this.livesText = this.add.text(pad + 50, pad + 88, 'JAR OK', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff6688',
    });

    this.quipText = this.add.text(this.scale.width / 2, this.scale.height - 36, '', {
      fontFamily: 'monospace', fontSize: '20px', color: '#88ff88',
    }).setOrigin(0.5);

    this.waveBanner = this.add.text(this.scale.width / 2, this.scale.height * 0.32, '', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ff4466',
      stroke: '#000000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    EventBus.on('score-changed', (s) => this.scoreText.setText(`Score: ${formatScore(s)}`));
    EventBus.on('wave-started', ({ wave, message, isBoss }) => this.onWave(wave, message, isBoss));
    EventBus.on('jar-damaged', ({ lives }) => this.updateJar(lives));
    EventBus.on('quip-shown', (q) => this.showQuip(q));
    EventBus.on('game-started', () => {
      this.scoreText.setText('Score: 000000');
      this.waveText.setText('Wave: 1');
      this.jarIcon.setTexture(previewJarTexture(gameState.selectedCharacter.id));
      this.updateJar(PLAYER.lives);
      this.quipText.setText('');
    });
  }

  onWave(wave, message, isBoss) {
    this.waveText.setText(isBoss ? `BOSS ${wave}` : `Wave: ${wave}`);
    this.waveBanner.setText(message);
    this.waveBanner.setColor(isBoss ? '#5c3a1e' : '#ff4466');
    this.waveBanner.setAlpha(1);
    this.tweens.add({
      targets: this.waveBanner,
      alpha: 0,
      duration: 2800,
      delay: 400,
    });
  }

  updateJar(lives) {
    const charId = gameState.selectedCharacter.id;
    this.jarIcon.setTexture(jarTextureForLives(lives, charId));
    const labels = ['SHATTERED', 'CRITICAL', 'CRACKED', 'JAR OK'];
    this.livesText.setText(labels[lives] ?? 'DEAD');
    this.livesText.setColor(lives <= 1 ? '#ff2222' : '#ff6688');
    this.tweens.add({
      targets: this.jarIcon,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 80,
      yoyo: true,
    });
  }

  showQuip(q) {
    this.quipText.setText(q);
    this.quipText.setAlpha(1);
    this.tweens.killTweensOf(this.quipText);
    this.tweens.add({
      targets: this.quipText,
      alpha: 0,
      delay: 1800,
      duration: 400,
    });
  }
}
