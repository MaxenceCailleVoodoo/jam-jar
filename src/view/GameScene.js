import { gameState } from '../model/GameState.js';
import { PLAYER, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { EventBus } from '../shared/EventBus.js';
import { GameController } from '../controller/GameController.js';
import { SpawnController } from '../controller/SpawnController.js';
import { jarTextureForLives } from './PixelArt.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 'floor-tile')
      .setTileScale(4)
      .setDepth(0);

    const border = this.add.graphics();
    border.lineStyle(4, 0xff4466, 0.5);
    border.strokeRect(12, 12, GAME_WIDTH - 24, GAME_HEIGHT - 24);

    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'jar-3');
    this.player.setScale(2.2);
    this.player.body.setCircle(20);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.bullets = this.physics.add.group({
      defaultKey: 'jam-blob',
      maxSize: 60,
      runChildUpdate: false,
    });
    for (let i = 0; i < 30; i++) {
      const b = this.bullets.create(0, 0, 'jam-blob');
      b.setScale(1.5);
      b.body.setCircle(8);
      b.setActive(false).setVisible(false);
      b.body.enable = false;
    }

    this.enemies = this.physics.add.group();

    this.gameController = new GameController(this, this.player, this.bullets);
    this.spawnController = new SpawnController(this, this.enemies, this.player);

    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => this.onBulletHit(b, e));
    this.physics.add.overlap(this.player, this.enemies, () => this.onPlayerHit(), () => !gameState.isInvincible);

    EventBus.on('game-over', (score) => {
      this.time.delayedCall(700, () => {
        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', { score });
      });
    });
    EventBus.on('enemy-killed', ({ x, y, quip }) => this.popQuip(x, y, quip));
    EventBus.on('screen-shake', () => this.cameras.main.shake(180, 0.004));

    gameState.nextWave();
    this.spawnController.startWave();
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;

    let hp = enemy.getData('hp') ?? 1;
    hp -= 1;
    enemy.setData('hp', hp);

    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    bullet.body.setVelocity(0, 0);

    if (hp <= 0) {
      const isBoss = enemy.getData('isBoss');
      gameState.onEnemyKilled(enemy.x, enemy.y, isBoss);
      this.spawnController.onEnemyKilled(enemy);
      this.tweens.add({
        targets: enemy,
        scaleX: enemy.scaleX * 1.5,
        scaleY: enemy.scaleY * 1.5,
        alpha: 0,
        duration: 120,
      });
    } else {
      enemy.setTint(0xffffff);
      this.time.delayedCall(60, () => enemy.clearTint());
    }
  }

  onPlayerHit() {
    if (gameState.isInvincible) return;
    gameState.playerHit();
    if (gameState.isRunning) {
      this.player.setTexture(jarTextureForLives(gameState.lives));
      this.gameController.startInvincibility();
    }
  }

  popQuip(x, y, quip) {
    const t = this.add.text(x, y - 24, quip, {
      fontFamily: 'monospace', fontSize: '14px', color: '#88ff88',
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(time) {
    if (!gameState.isRunning) return;
    this.gameController.update(time);
    this.spawnController.update();

    this.bullets.children.iterate((b) => {
      if (!b?.active) return;
      if (b.x < -20 || b.x > GAME_WIDTH + 20 || b.y < -20 || b.y > GAME_HEIGHT + 20) {
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });
  }
}
