import { gameState } from '../model/GameState.js';
import { PLAYER, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { EventBus } from '../shared/EventBus.js';
import { angleBetween, clampToScreen } from '../shared/utils.js';
import { jarTextureForLives } from '../view/PixelArt.js';

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

    EventBus.on('jar-damaged', ({ lives }) => {
      const charId = gameState.selectedCharacter.id;
      player.setTexture(jarTextureForLives(lives, charId));
      scene.tweens.add({
        targets: player,
        angle: { from: -8, to: 8 },
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    });
  }

  update(time) {
    if (!gameState.isRunning) return;

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx && vy) { vx *= 0.707; vy *= 0.707; }

    this.player.body.setVelocity(vx * PLAYER.speed, vy * PLAYER.speed);
    const c = clampToScreen(this.player.x, this.player.y, GAME_WIDTH, GAME_HEIGHT, PLAYER.radius);
    this.player.setPosition(c.x, c.y);

    const pointer = this.scene.input.activePointer;
    this.aimAngle = angleBetween(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    this.player.setRotation(this.aimAngle + Math.PI / 2);

    if (pointer.isDown || this.spaceKey.isDown) this.tryFire(time);

    if (gameState.isInvincible) {
      this.player.alpha = Math.floor(time / 80) % 2 ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }
  }

  tryFire(time = this.scene.time.now) {
    if (!gameState.isRunning || time - this.lastFireTime < PLAYER.fireRateMs) return;
    this.lastFireTime = time;

    const bullet = this.bullets.get(this.player.x, this.player.y);
    if (!bullet) return;

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setRotation(this.aimAngle);
    bullet.body.setVelocity(
      Math.cos(this.aimAngle) * PLAYER.bulletSpeed,
      Math.sin(this.aimAngle) * PLAYER.bulletSpeed,
    );
    EventBus.emit('player-shot', { x: this.player.x, y: this.player.y, angle: this.aimAngle });
  }

  startInvincibility() {
    gameState.isInvincible = true;
    this.scene.time.delayedCall(PLAYER.invincibleMs, () => {
      gameState.clearInvincibility();
      this.player.alpha = 1;
    });
  }
}
