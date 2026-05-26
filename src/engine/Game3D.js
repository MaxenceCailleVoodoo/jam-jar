import * as THREE from 'three';
import { gameState } from '../model/GameState.js';
import { ARENA, PLAYER } from '../model/LevelConfig.js';
import { EventBus } from '../shared/EventBus.js';
import { UniverseWorld } from './UniverseWorld.js';
import { createPlayerMesh, createBulletMesh } from './MeshFactory.js';
import { GameController3D } from '../controller/GameController3D.js';
import { SpawnController3D } from '../controller/SpawnController3D.js';
import { distance } from '../shared/utils.js';

export class Game3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.bullets = [];
    this.zombies = [];
    this.boss = null;
    this.shakeTime = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    this.camera.position.set(0, 26, 18);
    this.camera.lookAt(0, 0, 0);

    this.universeWorld = new UniverseWorld(this.scene);
    this.player = createPlayerMesh();
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);

    this.gameController = new GameController3D(this);
    this.spawnController = new SpawnController3D(this);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    EventBus.on('universe-changed', ({ universe }) => {
      this.universeWorld.apply(universe);
    });
    EventBus.on('screen-shake', ({ intensity }) => {
      this.shakeTime = 0.25;
      this.shakeIntensity = intensity * 0.03;
    });

    this._menuMode = true;
    this.universeWorld.apply({
      sky: 0x1a1a2e,
      fog: 0x2a2a4e,
      floor: 0x16213e,
      floorAccent: 0x2a2a4e,
      accent: 0xff6b6b,
      light: 0xffe066,
      prop: 'stars',
    });
    requestAnimationFrame(this.loop);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this._menuMode = false;
    this.resetEntities();
    gameState.nextWave();
    this.spawnController.startWave();
  }

  resetEntities() {
    this.bullets.forEach((b) => this.scene.remove(b.mesh));
    this.bullets = [];
    this.zombies.forEach((z) => this.scene.remove(z.mesh));
    this.zombies = [];
    if (this.boss) {
      this.scene.remove(this.boss.mesh);
      this.boss = null;
    }
    this.player.position.set(0, 0, 0);
    this.player.visible = true;
  }

  spawnBullet(x, z, angle) {
    let bullet = this.bullets.find((b) => !b.active);
    if (!bullet) {
      const mesh = createBulletMesh();
      mesh.castShadow = true;
      this.scene.add(mesh);
      bullet = { mesh, active: false, life: 0 };
      this.bullets.push(bullet);
    }
    bullet.active = true;
    bullet.life = 2.5;
    bullet.mesh.visible = true;
    bullet.mesh.position.set(x, 0.8, z);
    bullet.vx = Math.cos(angle) * PLAYER.bulletSpeed;
    bullet.vz = Math.sin(angle) * PLAYER.bulletSpeed;
    EventBus.emit('player-shot', { x, y: z, angle });
  }

  addZombie(mesh, data) {
    this.scene.add(mesh);
    const zombie = { mesh, ...data, active: true };
    this.zombies.push(zombie);
    return zombie;
  }

  setBoss(mesh, data) {
    if (this.boss) this.scene.remove(this.boss.mesh);
    this.scene.add(mesh);
    this.boss = { mesh, ...data, active: true };
  }

  updateBullets(delta) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.mesh.position.x += b.vx * delta;
      b.mesh.position.z += b.vz * delta;
      b.life -= delta;
      const h = ARENA.half;
      if (
        b.life <= 0 ||
        Math.abs(b.mesh.position.x) > h ||
        Math.abs(b.mesh.position.z) > h
      ) {
        b.active = false;
        b.mesh.visible = false;
      }
    }
  }

  checkBulletHits() {
    for (const b of this.bullets) {
      if (!b.active) continue;
      const bx = b.mesh.position.x;
      const bz = b.mesh.position.z;

      if (this.boss?.active) {
        const d = distance(bx, bz, this.boss.mesh.position.x, this.boss.mesh.position.z);
        if (d < 3.5) {
          b.active = false;
          b.mesh.visible = false;
          this.damageBoss();
          continue;
        }
      }

      for (const z of this.zombies) {
        if (!z.active) continue;
        const d = distance(bx, bz, z.mesh.position.x, z.mesh.position.z);
        if (d < ZOMBIE_HIT + z.radius) {
          b.active = false;
          b.mesh.visible = false;
          this.killZombie(z);
          break;
        }
      }
    }
  }

  damageBoss() {
    if (!this.boss?.active) return;
    this.boss.hp -= 1;
    const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.06;
    this.boss.mesh.scale.set(pulse, pulse, pulse);
    if (this.boss.hp <= 0) {
      const { x, z } = this.boss.mesh.position;
      gameState.onZombieKilled(x, z, true);
      this.spawnController.onBossKilled();
      this.scene.remove(this.boss.mesh);
      this.boss = null;
    }
  }

  killZombie(z) {
    if (!z.active) return;
    z.active = false;
    const { x, z: pz } = z.mesh.position;
    gameState.onZombieKilled(x, pz, false);
    this.spawnController.onZombieKilled(z);
    this.scene.remove(z.mesh);
    const idx = this.zombies.indexOf(z);
    if (idx >= 0) this.zombies.splice(idx, 1);
  }

  checkPlayerHits() {
    if (gameState.isInvincible) return;
    const px = this.player.position.x;
    const pz = this.player.position.z;

    if (this.boss?.active) {
      const d = distance(px, pz, this.boss.mesh.position.x, this.boss.mesh.position.z);
      if (d < 4) {
        gameState.playerHit();
        if (gameState.isRunning) this.gameController.startInvincibility();
        return;
      }
    }

    for (const z of this.zombies) {
      if (!z.active) continue;
      const d = distance(px, pz, z.mesh.position.x, z.mesh.position.z);
      if (d < PLAYER.radius + z.radius) {
        gameState.playerHit();
        if (gameState.isRunning) this.gameController.startInvincibility();
        break;
      }
    }
  }

  updateCamera(delta) {
    const px = this.player.position.x;
    const pz = this.player.position.z;
    let ox = 0;
    let oz = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      ox = (Math.random() - 0.5) * this.shakeIntensity;
      oz = (Math.random() - 0.5) * this.shakeIntensity;
    }
    this.camera.position.x = px + ox;
    this.camera.position.z = pz + 18 + oz;
    this.camera.lookAt(px, 0, pz);
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this._menuMode) {
      this.universeWorld.update(delta);
      const t = performance.now() * 0.0004;
      this.camera.position.set(Math.sin(t) * 6, 24, 16 + Math.cos(t) * 4);
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (!gameState.isRunning) {
      this.updateCamera(delta);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (gameState.isRunning) {
      this.gameController.update(delta);
      this.spawnController.update(delta);
      this.updateBullets(delta);
      this.checkBulletHits();
      this.checkPlayerHits();
      this.universeWorld.update(delta);

      const t = performance.now() * 0.001;
      for (const z of this.zombies) {
        if (!z.active) continue;
        z.mesh.children.forEach((c) => {
          if (c.name === 'leg') c.rotation.z = Math.sin(t * 8 + z.wobble) * 0.4;
        });
      }
      if (this.boss?.active) {
        this.boss.mesh.rotation.y += delta * 0.3;
      }
    }

    this.updateCamera(delta);
    this.renderer.render(this.scene, this.camera);
  };

}

const ZOMBIE_HIT = 1.2;
