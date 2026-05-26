import { gameState } from '../model/GameState.js';
import { PLAYER, WAVE, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { EventBus } from '../shared/EventBus.js';
import { GameController } from '../controller/GameController.js';
import { SpawnController } from '../controller/SpawnController.js';
import { drawPlayerStick } from '../shared/StickGraphics.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.drawArena();

    this.player = this.createPlayer();
    this.bullets = this.createBulletGroup();
    this.zombies = this.createZombieGroup();

    this.gameController = new GameController(this, this.player, this.bullets);
    this.spawnController = new SpawnController(this, this.zombies, this.player);

    this.setupCollisions();

    EventBus.on('game-over', this.onGameOver, this);
    EventBus.on('zombie-killed', this.onZombieKilledFx, this);
    EventBus.on('screen-shake', this.onScreenShake, this);

    if (gameState.isRunning) {
      gameState.nextWave();
      this.spawnController.startWave();
    }
  }

  drawArena() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x16213e);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.5);
    for (let x = 0; x <= GAME_WIDTH; x += 64) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += 64) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    const border = this.add.graphics();
    border.lineStyle(4, 0xff6b6b, 0.6);
    border.strokeRect(8, 8, GAME_WIDTH - 16, GAME_HEIGHT - 16);
  }

  createPlayer() {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const gfx = this.add.graphics();
    drawPlayerStick(gfx, 0);
    container.add(gfx);

    this.physics.add.existing(container);
    container.body.setCircle(PLAYER.radius);
    container.body.setCollideWorldBounds(true);
    container.setData('graphics', gfx);
    container.setData('aimAngle', 0);
    container.setDepth(10);

    return container;
  }

  createBulletGroup() {
    const group = this.physics.add.group({
      maxSize: 80,
      runChildUpdate: false,
    });

    for (let i = 0; i < 40; i++) {
      const bullet = this.add.circle(0, 0, PLAYER.bulletRadius, 0xffe066);
      this.physics.add.existing(bullet);
      bullet.body.setCircle(PLAYER.bulletRadius);
      group.add(bullet);
      bullet.setActive(false).setVisible(false);
      bullet.body.enable = false;
    }

    return group;
  }

  createZombieGroup() {
    return this.physics.add.group({
      maxSize: WAVE.maxActive,
      runChildUpdate: false,
    });
  }

  setupCollisions() {
    this.physics.add.overlap(
      this.bullets,
      this.zombies,
      (bullet, zombie) => this.onBulletHitZombie(bullet, zombie),
      null,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.zombies,
      (_player, zombie) => this.onZombieTouchPlayer(zombie),
      () => !gameState.isInvincible,
      this,
    );
  }

  onBulletHitZombie(bullet, zombie) {
    if (!bullet.active || !zombie.active) return;

    let hp = zombie.getData('hp') ?? 1;
    hp -= 1;
    zombie.setData('hp', hp);

    this.deactivateBullet(bullet);

    if (hp <= 0) {
      gameState.onZombieKilled(zombie.x, zombie.y);
      this.spawnController.onZombieKilled(zombie);

      this.tweens.add({
        targets: zombie,
        scaleX: 1.6,
        scaleY: 1.6,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          zombie.setScale(1);
          zombie.setAlpha(1);
        },
      });
    }
  }

  onZombieTouchPlayer(zombie) {
    if (!zombie.active || gameState.isInvincible) return;

    gameState.playerHit();
    this.spawnController.onZombieKilled(zombie);
  }

  deactivateBullet(bullet) {
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    bullet.body.setVelocity(0, 0);
  }

  onZombieKilledFx({ x, y, quip }) {
    const pop = this.add.text(x, y - 20, quip, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#88ff88',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pop,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => pop.destroy(),
    });
  }

  onScreenShake({ intensity }) {
    this.cameras.main.shake(200, intensity * 0.002);
  }

  onGameOver(score) {
    this.gameController.destroy();
    this.spawnController.destroy();

    this.time.delayedCall(800, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { score });
    });
  }

  update(time, delta) {
    if (!gameState.isRunning) return;

    this.gameController.update(time);
    this.spawnController.update(time, delta);

    this.bullets.children.iterate((bullet) => {
      if (!bullet?.active) return;
      if (
        bullet.x < -50 ||
        bullet.x > GAME_WIDTH + 50 ||
        bullet.y < -50 ||
        bullet.y > GAME_HEIGHT + 50
      ) {
        this.deactivateBullet(bullet);
      }
    });

    const gfx = this.player.getData('graphics');
    const angle = this.player.getData('aimAngle') ?? 0;
    if (gfx) drawPlayerStick(gfx, angle);
  }

  shutdown() {
    EventBus.off('game-over', this.onGameOver, this);
    EventBus.off('zombie-killed', this.onZombieKilledFx, this);
    EventBus.off('screen-shake', this.onScreenShake, this);

    if (this.gameController) this.gameController.destroy();
    if (this.spawnController) this.spawnController.destroy();
  }
}
