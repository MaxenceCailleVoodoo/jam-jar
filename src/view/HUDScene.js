import { EventBus } from '../shared/EventBus.js';
import { formatScore } from '../shared/utils.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene', active: false });
  }

  create() {
    const pad = 20;

    this.scoreText = this.add.text(pad, pad, 'Score: 000000', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    });

    this.waveText = this.add.text(pad, pad + 36, 'Wave: 1', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffe066',
    });

    this.livesText = this.add.text(pad, pad + 72, '♥ x 3', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ff6b6b',
    });

    this.quipText = this.add.text(this.scale.width / 2, this.scale.height - 40, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#88ff88',
      align: 'center',
    }).setOrigin(0.5);

    this.waveBanner = this.add.text(this.scale.width / 2, this.scale.height * 0.35, '', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    EventBus.on('score-changed', this.onScoreChanged, this);
    EventBus.on('wave-started', this.onWaveStarted, this);
    EventBus.on('life-lost', this.onLifeLost, this);
    EventBus.on('quip-shown', this.onQuipShown, this);
    EventBus.on('game-started', this.onGameStarted, this);
  }

  onGameStarted() {
    this.scoreText.setText('Score: 000000');
    this.waveText.setText('Wave: 1');
    this.livesText.setText('♥ x 3');
    this.quipText.setText('');
  }

  onScoreChanged(score) {
    this.scoreText.setText(`Score: ${formatScore(score)}`);
  }

  onWaveStarted({ wave, message }) {
    this.waveText.setText(`Wave: ${wave}`);
    this.waveBanner.setText(message);
    this.waveBanner.setAlpha(1);
    this.tweens.add({
      targets: this.waveBanner,
      alpha: 0,
      y: this.scale.height * 0.28,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.waveBanner.y = this.scale.height * 0.35;
      },
    });
  }

  onLifeLost(lives) {
    this.livesText.setText(`♥ x ${lives}`);
  }

  onQuipShown(quip) {
    this.quipText.setText(quip);
    this.quipText.setAlpha(1);
    this.tweens.killTweensOf(this.quipText);
    this.tweens.add({
      targets: this.quipText,
      alpha: 0,
      delay: 1500,
      duration: 500,
    });
  }

  shutdown() {
    EventBus.off('score-changed', this.onScoreChanged, this);
    EventBus.off('wave-started', this.onWaveStarted, this);
    EventBus.off('life-lost', this.onLifeLost, this);
    EventBus.off('quip-shown', this.onQuipShown, this);
    EventBus.off('game-started', this.onGameStarted, this);
  }
}
