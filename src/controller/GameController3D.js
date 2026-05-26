import * as THREE from 'three';
import { gameState } from '../model/GameState.js';
import { PLAYER, ARENA } from '../model/LevelConfig.js';
import { clamp } from '../shared/utils.js';

export class GameController3D {
  constructor(game) {
    this.game = game;
    this.player = game.player;
    this.keys = {};
    this.mouse = new THREE.Vector2();
    this.aimAngle = 0;
    this.lastFire = 0;
    this.shooting = false;
    this.invincibleTimer = null;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    window.addEventListener('mousemove', (e) => {
      this.mouseNDC(e);
    });
    window.addEventListener('mousedown', () => {
      this.shooting = true;
      this.tryFire();
    });
    window.addEventListener('mouseup', () => {
      this.shooting = false;
    });
  }

  mouseNDC(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  update(delta) {
    if (!gameState.isRunning) return;

    let vx = 0;
    let vz = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) vz -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) vz += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) vx -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) vx += 1;

    if (vx !== 0 && vz !== 0) {
      vx *= 0.707;
      vz *= 0.707;
    }

    this.player.position.x += vx * PLAYER.speed * delta;
    this.player.position.z += vz * PLAYER.speed * delta;

    const h = ARENA.half - 1;
    this.player.position.x = clamp(this.player.position.x, -h, h);
    this.player.position.z = clamp(this.player.position.z, -h, h);

    this.updateAim();
    if (this.shooting || this.keys.Space) {
      this.tryFire();
    }

    if (gameState.isInvincible) {
      this.player.visible = Math.floor(performance.now() / 80) % 2 === 0;
    } else {
      this.player.visible = true;
    }
  }

  updateAim() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.mouse, this.game.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    if (target) {
      const dx = target.x - this.player.position.x;
      const dz = target.z - this.player.position.z;
      this.aimAngle = Math.atan2(dz, dx);
      this.player.rotation.y = -this.aimAngle + Math.PI / 2;
      const gun = this.player.userData.gun;
      if (gun) gun.rotation.y = this.aimAngle;
    }
  }

  tryFire() {
    const now = performance.now();
    if (now - this.lastFire < PLAYER.fireRateMs) return;
    this.lastFire = now;
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const gx = px + Math.cos(this.aimAngle) * 1.2;
    const gz = pz + Math.sin(this.aimAngle) * 1.2;
    this.game.spawnBullet(gx, gz, this.aimAngle);
  }

  startInvincibility() {
    gameState.isInvincible = true;
    clearTimeout(this.invincibleTimer);
    this.invincibleTimer = setTimeout(() => {
      gameState.clearInvincibility();
      this.player.visible = true;
    }, PLAYER.invincibleMs);
  }
}
