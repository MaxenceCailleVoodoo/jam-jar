import { gameState } from '../model/GameState.js';
import { getWaveConfig, WAVE, ZOMBIE, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { randomEdge } from '../shared/utils.js';
import { drawZombieStick } from '../shared/StickGraphics.js';

export class SpawnController {
  constructor(scene, zombies, player) {
    this.scene = scene;
    this.zombies = zombies;
    this.player = player;

    this.waveConfig = null;
    this.spawnedThisWave = 0;
    this.aliveThisWave = 0;
    this.spawnTimer = null;
    this.betweenWaveTimer = null;
    this.isSpawning = false;
    this.wobbleTime = 0;
  }

  startWave() {
    this.clearTimers();
    this.waveConfig = getWaveConfig(gameState.wave);
    this.spawnedThisWave = 0;
    this.aliveThisWave = 0;
    this.isSpawning = true;

    gameState.setWaveZombieCount(this.waveConfig.count);
    this.scheduleNextSpawn(500);
  }

  scheduleNextSpawn(delay) {
    if (this.spawnTimer) this.spawnTimer.remove(false);

    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      if (!gameState.isRunning) return;

      if (this.spawnedThisWave < this.waveConfig.count) {
        this.spawnZombie();
        this.spawnedThisWave += 1;
        this.scheduleNextSpawn(this.waveConfig.spawnDelayMs);
      } else {
        this.isSpawning = false;
      }
    });
  }

  spawnZombie() {
    const activeCount = this.zombies.countActive(true);
    if (activeCount >= WAVE.maxActive) return;

    const pos = randomEdge(GAME_WIDTH, GAME_HEIGHT, 30);
    let zombie = this.zombies.getFirstDead(false);

    if (!zombie) {
      zombie = this.scene.add.container(pos.x, pos.y);
      this.scene.physics.add.existing(zombie);
      zombie.body.setCircle(ZOMBIE.baseRadius);
      this.zombies.add(zombie);
      this.attachZombieGfx(zombie);
    } else {
      zombie.setPosition(pos.x, pos.y);
    }

    zombie.setActive(true).setVisible(true);
    zombie.body.enable = true;
    zombie.setScale(1);
    zombie.setAlpha(1);
    zombie.setData('hp', this.waveConfig.hp);
    zombie.setData('speed', this.waveConfig.speed);
    zombie.setData('wobble', Math.random() * Math.PI * 2);

    const gfx = zombie.getData('graphics');
    if (gfx) drawZombieStick(gfx, 0);

    this.aliveThisWave += 1;
  }

  attachZombieGfx(zombie) {
    const gfx = this.scene.add.graphics();
    drawZombieStick(gfx, 0);
    zombie.add(gfx);
    zombie.setData('graphics', gfx);
  }

  update(time, delta) {
    if (!gameState.isRunning) return;

    this.wobbleTime += delta * 0.005;

    this.zombies.children.iterate((zombie) => {
      if (!zombie?.active) return;

      const speed = zombie.getData('speed') ?? ZOMBIE.baseSpeed;
      const angle = Phaser.Math.Angle.Between(
        zombie.x,
        zombie.y,
        this.player.x,
        this.player.y,
      );

      zombie.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
      );

      const wobble = zombie.getData('wobble') + this.wobbleTime;
      const gfx = zombie.getData('graphics');
      if (gfx) drawZombieStick(gfx, wobble);
    });

    if (
      !this.isSpawning &&
      this.waveConfig &&
      this.spawnedThisWave >= this.waveConfig.count &&
      this.aliveThisWave <= 0 &&
      !this.betweenWaveTimer
    ) {
      this.betweenWaveTimer = this.scene.time.delayedCall(
        this.waveConfig.betweenWaveMs,
        () => {
          this.betweenWaveTimer = null;
          if (gameState.isRunning) {
            gameState.nextWave();
            this.startWave();
          }
        },
      );
    }
  }

  onZombieKilled(zombie) {
    this.aliveThisWave -= 1;
    gameState.onWaveZombieDefeated();

    zombie.setActive(false).setVisible(false);
    zombie.body.enable = false;
    zombie.body.setVelocity(0, 0);
  }

  clearTimers() {
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
    if (this.betweenWaveTimer) {
      this.betweenWaveTimer.remove(false);
      this.betweenWaveTimer = null;
    }
  }

  destroy() {
    this.clearTimers();
  }
}
