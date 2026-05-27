/**
 * Touch controls overlay: virtual joystick (left half) + tap-to-explode (right half).
 * Reads input via pointer events and exposes the result as a unit-vector each frame.
 *
 * Designed for one scene at a time: call `attach(scene, { onExplode })` in create,
 * `getMovement()` from update, and `detach()` in shutdown.
 */
import { ARENA } from '../styles/sharedSurvival.js';

const STICK_RADIUS = 70;
const KNOB_RADIUS = 32;
const DEAD_ZONE = 0.12;
const EXPLODE_BTN_RADIUS = 60;

function isLikelyTouchDevice() {
  if (typeof window === 'undefined') return false;
  const hasTouch = 'ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  return hasTouch || coarse;
}

export class TouchControls {
  constructor() {
    this.scene = null;
    this.enabled = false;
    this.stickPointerId = null;
    this.stickOrigin = { x: 0, y: 0 };
    this.stickCurrent = { x: 0, y: 0 };
    this.movement = { vx: 0, vy: 0 };
    this.onExplode = null;
    this._handlers = null;
    this._gfx = null;
    this._explodeBtn = null;
  }

  attach(scene, { onExplode, force = false } = {}) {
    this.scene = scene;
    this.onExplode = onExplode;
    this.enabled = force || isLikelyTouchDevice();
    if (!this.enabled) return;

    this._gfx = scene.add.graphics().setDepth(150).setScrollFactor(0);
    this._explodeBtn = scene.add.graphics().setDepth(150).setScrollFactor(0);
    this._explodeBtn.fillStyle(0xcc2244, 0.22);
    this._explodeBtn.fillCircle(
      ARENA.width - 110, ARENA.height - 110, EXPLODE_BTN_RADIUS,
    );
    this._explodeBtn.lineStyle(4, 0x2a1810, 0.55);
    this._explodeBtn.strokeCircle(
      ARENA.width - 110, ARENA.height - 110, EXPLODE_BTN_RADIUS,
    );
    this._explodeLabel = scene.add.text(
      ARENA.width - 110, ARENA.height - 110, 'BOOM',
      {
        fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#2a1810',
      },
    ).setOrigin(0.5).setDepth(151).setScrollFactor(0);

    const input = scene.input;
    const onPointerDown = (pointer) => {
      if (this._handleExplodeTap(pointer)) return;
      if (this.stickPointerId !== null) return;
      if (pointer.x > ARENA.width / 2) return;
      this.stickPointerId = pointer.id;
      this.stickOrigin = { x: pointer.x, y: pointer.y };
      this.stickCurrent = { x: pointer.x, y: pointer.y };
    };
    const onPointerMove = (pointer) => {
      if (pointer.id !== this.stickPointerId) return;
      this.stickCurrent = { x: pointer.x, y: pointer.y };
    };
    const onPointerUp = (pointer) => {
      if (pointer.id !== this.stickPointerId) return;
      this.stickPointerId = null;
      this.movement = { vx: 0, vy: 0 };
    };

    input.on('pointerdown', onPointerDown);
    input.on('pointermove', onPointerMove);
    input.on('pointerup', onPointerUp);
    input.on('pointerupoutside', onPointerUp);
    this._handlers = {
      onPointerDown, onPointerMove, onPointerUp,
    };
  }

  _handleExplodeTap(pointer) {
    const dx = pointer.x - (ARENA.width - 110);
    const dy = pointer.y - (ARENA.height - 110);
    if (dx * dx + dy * dy > EXPLODE_BTN_RADIUS * EXPLODE_BTN_RADIUS) return false;
    if (typeof this.onExplode === 'function') this.onExplode();
    this._flashExplode();
    return true;
  }

  _flashExplode() {
    if (!this._explodeBtn || !this.scene) return;
    this.scene.tweens.killTweensOf(this._explodeBtn);
    this._explodeBtn.setScale(0.9);
    this.scene.tweens.add({
      targets: this._explodeBtn, scale: 1, duration: 180, ease: 'Back.easeOut',
    });
  }

  getMovement() {
    if (!this.enabled || this.stickPointerId === null) {
      this.movement = { vx: 0, vy: 0 };
      if (this._gfx) this._gfx.clear();
      return this.movement;
    }
    const dx = this.stickCurrent.x - this.stickOrigin.x;
    const dy = this.stickCurrent.y - this.stickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, STICK_RADIUS);
    const nx = dist > 0 ? (dx / dist) * (clamped / STICK_RADIUS) : 0;
    const ny = dist > 0 ? (dy / dist) * (clamped / STICK_RADIUS) : 0;
    const mag = Math.hypot(nx, ny);
    this.movement = mag < DEAD_ZONE ? { vx: 0, vy: 0 } : { vx: nx, vy: ny };
    this._drawStick(clamped);
    return this.movement;
  }

  _drawStick(clamped) {
    const g = this._gfx;
    if (!g) return;
    g.clear();
    const ox = this.stickOrigin.x;
    const oy = this.stickOrigin.y;
    g.lineStyle(4, 0x2a1810, 0.45);
    g.strokeCircle(ox, oy, STICK_RADIUS);
    g.fillStyle(0xffffff, 0.18);
    g.fillCircle(ox, oy, STICK_RADIUS);

    const angle = Math.atan2(
      this.stickCurrent.y - oy, this.stickCurrent.x - ox,
    );
    const kx = ox + Math.cos(angle) * clamped;
    const ky = oy + Math.sin(angle) * clamped;
    g.fillStyle(0xcc2244, 0.7);
    g.fillCircle(kx, ky, KNOB_RADIUS);
    g.lineStyle(3, 0x2a1810, 0.7);
    g.strokeCircle(kx, ky, KNOB_RADIUS);
  }

  detach() {
    const scene = this.scene;
    if (!scene || !this._handlers) return;
    const input = scene.input;
    input.off('pointerdown', this._handlers.onPointerDown);
    input.off('pointermove', this._handlers.onPointerMove);
    input.off('pointerup', this._handlers.onPointerUp);
    input.off('pointerupoutside', this._handlers.onPointerUp);
    this._handlers = null;
    this._gfx?.destroy();
    this._explodeBtn?.destroy();
    this._explodeLabel?.destroy();
    this._gfx = null;
    this._explodeBtn = null;
    this._explodeLabel = null;
    this.scene = null;
    this.enabled = false;
  }
}
