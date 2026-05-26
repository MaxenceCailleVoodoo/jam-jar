import { gameState } from '../model/GameState.js';
import { getWaveConfig, WAVE, BREAD, GAME_WIDTH, GAME_HEIGHT } from '../model/LevelConfig.js';
import { randomEdge } from '../shared/utils.js';

export class SpawnController {
  constructor(scene, enemies, player) {
    this.scene = scene;
    this.enemies = enemies;
    this.player = player;
    this.waveConfig = null;
    this.spawned = 0;
    this.alive = 0;
    this.spawnTimer = null;
    this.betweenTimer = null;
    this.isSpawning = false;
    this.boss = null;
  }

  startWave() {
    this.clearTimers();
    this.waveConfig = getWaveConfig(gameState.wave);
    this.spawned = 0;
    this.alive = 0;
    this.isSpawning = true;

    if (this.waveConfig.isBoss) {
      gameState.setWaveEnemyCount(1 + this.waveConfig.minions);
      this.spawnBoss();
      this.scheduleSpawn(900);
    } else {
      gameState.setWaveEnemyCount(this.waveConfig.count);
      this.scheduleSpawn(500);
    }
  }

  scheduleSpawn(delay) {
    if (this.spawnTimer) this.spawnTimer.remove(false);
    this.spawnTimer = this.scene.time.delayedCall(delay, () => {
      if (!gameState.isRunning) return;

      if (this.waveConfig.isBoss) {
        if (this.spawned < this.waveConfig.minions) {
          this.spawnBread(true);
          this.spawned += 1;
          this.scheduleSpawn(this.waveConfig.spawnDelayMs);
        } else {
          this.isSpawning = false;
        }
      } else if (this.spawned < this.waveConfig.count) {
        this.spawnBread(false);
        this.spawned += 1;
        this.scheduleSpawn(this.waveConfig.spawnDelayMs);
      } else {
        this.isSpawning = false;
      }
    });
  }

  spawnBoss() {
    if (this.boss) return;
    const boss = this.enemies.create(GAME_WIDTH / 2, -60, 'nutella-boss');
    boss.setScale(1.2);
    boss.body.setCircle(44);
    boss.setData('hp', this.waveConfig.bossHp);
    boss.setData('speed', 55);
    boss.setData('isBoss', true);
    boss.setData('radius', 44);
    this.boss = boss;
    this.alive += 1;

    this.scene.tweens.add({
      targets: boss,
      y: GAME_HEIGHT / 2 - 80,
      duration: 1200,
      ease: 'Bounce.easeOut',
    });
  }

  spawnBread(isMinion) {
    if (this.enemies.countActive(true) >= WAVE.maxActive) return;

    const pos = randomEdge(GAME_WIDTH, GAME_HEIGHT, 30);
    const key = `bread-${Math.floor(Math.random() * 3)}`;
    const bread = this.enemies.create(pos.x, pos.y, key);
    bread.setScale(isMinion ? 1.4 : 1.8);
    bread.body.setCircle(isMinion ? 14 : 18);
    bread.setData('hp', this.waveConfig.hp);
    bread.setData('speed', isMinion ? this.waveConfig.speed * 1.1 : this.waveConfig.speed);
    bread.setData('isBoss', false);
    bread.setData('radius', isMinion ? 14 : 18);
    this.alive += 1;
  }

  update() {
    if (!gameState.isRunning) return;

    const px = this.player.x;
    const py = this.player.y;

    this.enemies.children.iterate((e) => {
      if (!e?.active) return;
      const speed = e.getData('speed') ?? BREAD.baseSpeed;
      const angle = Phaser.Math.Angle.Between(e.x, e.y, px, py);
      e.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      e.setRotation(angle + Math.PI / 2);
    });

    const bossAlive = this.boss?.active;
    const done = this.waveConfig?.isBoss
      ? !bossAlive && this.alive <= 0 && this.spawned >= this.waveConfig.minions
      : !this.isSpawning && this.spawned >= this.waveConfig?.count && this.alive <= 0;

    if (done && !this.betweenTimer) {
      this.betweenTimer = this.scene.time.delayedCall(this.waveConfig.betweenWaveMs, () => {
        this.betweenTimer = null;
        if (gameState.isRunning) {
          gameState.nextWave();
          this.boss = null;
          this.startWave();
        }
      });
    }
  }

  onEnemyKilled(enemy) {
    this.alive -= 1;
    if (enemy === this.boss) this.boss = null;
    gameState.onWaveEnemyDefeated();
    enemy.setActive(false).setVisible(false);
    enemy.body.enable = false;
    enemy.body.setVelocity(0, 0);
  }

  clearTimers() {
    if (this.spawnTimer) this.spawnTimer.remove(false);
    if (this.betweenTimer) this.betweenTimer.remove(false);
    this.spawnTimer = null;
    this.betweenTimer = null;
  }
}
