import { gameState } from '../model/GameState.js';
import { getWaveConfig } from '../model/LevelConfig.js';
import { randomEdgeArena } from '../shared/utils.js';
import { createZombieMesh, createBossMesh } from '../engine/MeshFactory.js';
import { ARENA } from '../model/LevelConfig.js';

export class SpawnController3D {
  constructor(game) {
    this.game = game;
    this.waveConfig = null;
    this.spawned = 0;
    this.alive = 0;
    this.spawnTimer = null;
    this.betweenTimer = null;
    this.isSpawning = false;
    this.bossSpawned = false;
  }

  startWave() {
    this.clearTimers();
    this.waveConfig = getWaveConfig(gameState.wave);
    this.spawned = 0;
    this.alive = 0;
    this.isSpawning = true;
    this.bossSpawned = false;

    if (this.waveConfig.isBoss) {
      gameState.setWaveZombieCount(1 + this.waveConfig.minionCount);
      this.spawnBoss();
      this.scheduleSpawn(1200);
    } else {
      gameState.setWaveZombieCount(this.waveConfig.count);
      this.scheduleSpawn(600);
    }
  }

  scheduleSpawn(delay) {
    clearTimeout(this.spawnTimer);
    this.spawnTimer = setTimeout(() => {
      if (!gameState.isRunning) return;

      if (this.waveConfig.isBoss) {
        if (this.spawned < this.waveConfig.minionCount) {
          this.spawnMinion();
          this.spawned += 1;
          this.scheduleSpawn(this.waveConfig.spawnDelayMs);
        } else {
          this.isSpawning = false;
        }
      } else if (this.spawned < this.waveConfig.count) {
        this.spawnZombie();
        this.spawned += 1;
        this.scheduleSpawn(this.waveConfig.spawnDelayMs);
      } else {
        this.isSpawning = false;
      }
    }, delay);
  }

  spawnBoss() {
    if (this.bossSpawned) return;
    const u = gameState.currentUniverse;
    const mesh = createBossMesh(u.boss);
    mesh.position.set(0, 0, -8);
    mesh.castShadow = true;
    this.game.setBoss(mesh, {
      hp: this.waveConfig.bossHp,
      speed: 3,
      radius: 3.2,
    });
    this.bossSpawned = true;
    this.alive += 1;
  }

  spawnMinion() {
    const u = gameState.currentUniverse;
    const pos = randomEdgeArena(ARENA.half);
    const mesh = createZombieMesh(u.enemy);
    mesh.position.set(pos.x, 0, pos.z);
    mesh.scale.setScalar(0.85);
    this.game.addZombie(mesh, {
      hp: 1,
      speed: this.waveConfig.speed,
      radius: 0.85,
      wobble: Math.random() * 10,
    });
    this.alive += 1;
  }

  spawnZombie() {
    const u = gameState.currentUniverse;
    const pos = randomEdgeArena(ARENA.half);
    const mesh = createZombieMesh(u.enemy);
    mesh.position.set(pos.x, 0, pos.z);
    mesh.castShadow = true;
    this.game.addZombie(mesh, {
      hp: this.waveConfig.hp,
      speed: this.waveConfig.speed,
      radius: 1,
      wobble: Math.random() * 10,
    });
    this.alive += 1;
  }

  update(delta) {
    if (!gameState.isRunning) return;

    const px = this.game.player.position.x;
    const pz = this.game.player.position.z;

    const chase = (entity) => {
      const ex = entity.mesh.position.x;
      const ez = entity.mesh.position.z;
      const angle = Math.atan2(pz - ez, px - ex);
      entity.mesh.position.x += Math.cos(angle) * entity.speed * delta;
      entity.mesh.position.z += Math.sin(angle) * entity.speed * delta;
      entity.mesh.lookAt(px, entity.mesh.position.y, pz);
    };

    for (const z of this.game.zombies) {
      if (z.active) chase(z);
    }

    if (this.game.boss?.active) {
      chase(this.game.boss);
    }

    const bossAlive = this.game.boss?.active;
    const regularDone =
      !this.waveConfig?.isBoss &&
      this.spawned >= this.waveConfig?.count &&
      this.alive <= 0;
    const bossDone =
      this.waveConfig?.isBoss &&
      !bossAlive &&
      this.alive <= 0 &&
      this.spawned >= this.waveConfig.minionCount;

    if (
      !this.isSpawning &&
      (regularDone || bossDone) &&
      !this.betweenTimer
    ) {
      this.betweenTimer = setTimeout(() => {
        this.betweenTimer = null;
        if (gameState.isRunning) {
          gameState.nextWave();
          this.startWave();
        }
      }, this.waveConfig.betweenWaveMs);
    }
  }

  onZombieKilled(zombie) {
    this.alive -= 1;
    gameState.onWaveEnemyDefeated();
  }

  onBossKilled() {
    this.alive -= 1;
    gameState.onWaveEnemyDefeated();
  }

  clearTimers() {
    clearTimeout(this.spawnTimer);
    clearTimeout(this.betweenTimer);
    this.spawnTimer = null;
    this.betweenTimer = null;
  }
}
