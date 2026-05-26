import { gameState } from '../model/GameState.js';
import { PLAYER, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { EventBus } from '../shared/EventBus.js';
import { angleBetween, clampToScreen } from '../shared/utils.js';

export class GameController {
  constructor(scene, player, bullets) {
    this.scene = scene;
    this.player = player;
    this.bullets = bullets;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.lastFireTime = 0;
    this.aimAngle = 0;
    this.blinkTween = null;

    scene.input.on('pointerdown', () => {
      this.tryFire();
    });

    EventBus.on('player-hit', this.onPlayerHit, this);
    EventBus.on('game-over', this.onGameOver, this);
  }

  update(time) {
    if (!gameState.isRunning) return;

    this.handleMovement();
    this.handleAim();
    this.handleFire(time);

    if (gameState.isInvincible && this.player.alpha < 1) {
      // blink handled by tween
    }
  }

  handleMovement() {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.body.setVelocity(vx * PLAYER.speed, vy * PLAYER.speed);

    const clamped = clampToScreen(
      this.player.x,
      this.player.y,
      GAME_WIDTH,
      GAME_HEIGHT,
      PLAYER.radius + 4,
    );
    this.player.setPosition(clamped.x, clamped.y);
  }

  handleAim() {
    const pointer = this.scene.input.activePointer;
    this.aimAngle = angleBetween(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    this.player.setData('aimAngle', this.aimAngle);
  }

  handleFire(time) {
    const shooting =
      this.scene.input.activePointer.isDown || this.spaceKey.isDown;

    if (shooting) {
      this.tryFire(time);
    }
  }

  tryFire(time = this.scene.time.now) {
    if (!gameState.isRunning) return;
    if (time - this.lastFireTime < PLAYER.fireRateMs) return;

    this.lastFireTime = time;

    const bullet = this.bullets.get(this.player.x, this.player.y);
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;

    const angle = this.player.getData('aimAngle') ?? 0;
    bullet.setData('angle', angle);
    bullet.body.setVelocity(
      Math.cos(angle) * PLAYER.bulletSpeed,
      Math.sin(angle) * PLAYER.bulletSpeed,
    );

    EventBus.emit('player-shot', {
      x: this.player.x,
      y: this.player.y,
      angle,
    });
  }

  onPlayerHit() {
    if (this.blinkTween) {
      this.blinkTween.stop();
    }

    this.player.setAlpha(0.3);
    this.blinkTween = this.scene.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 100,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.player.setAlpha(1);
        gameState.clearInvincibility();
      },
    });

    this.scene.time.delayedCall(PLAYER.invincibleMs, () => {
      if (this.blinkTween) {
        this.blinkTween.stop();
        this.player.setAlpha(1);
      }
      gameState.clearInvincibility();
    });
  }

  onGameOver() {
    this.player.body.setVelocity(0, 0);
  }

  destroy() {
    EventBus.off('player-hit', this.onPlayerHit, this);
    EventBus.off('game-over', this.onGameOver, this);
  }
}
