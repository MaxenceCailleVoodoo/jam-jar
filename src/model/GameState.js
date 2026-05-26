import { EventBus } from '../shared/EventBus.js';
import { PLAYER } from './LevelConfig.js';
import { randomFrom, KILL_QUIPS, waveMessage } from './Quips.js';

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = PLAYER.lives;
    this.wave = 0;
    this.zombiesRemaining = 0;
    this.zombiesKilledThisWave = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isInvincible = false;
  }

  startGame() {
    this.reset();
    this.isRunning = true;
    EventBus.emit('game-started');
  }

  nextWave() {
    this.wave += 1;
    EventBus.emit('wave-started', {
      wave: this.wave,
      message: waveMessage(this.wave),
    });
  }

  setWaveZombieCount(count) {
    this.zombiesRemaining = count;
    this.zombiesKilledThisWave = 0;
  }

  onZombieSpawned() {
    // tracked by spawn controller
  }

  onZombieKilled(x, y) {
    const points = 100 + this.wave * 10;
    this.score += points;
    this.zombiesKilledThisWave += 1;
    const quip = randomFrom(KILL_QUIPS);
    EventBus.emit('zombie-killed', { points, x, y, quip });
    EventBus.emit('score-changed', this.score);
    EventBus.emit('quip-shown', quip);
  }

  onWaveZombieDefeated() {
    this.zombiesRemaining -= 1;
  }

  playerHit() {
    if (this.isInvincible || !this.isRunning) return false;

    this.lives -= 1;
    EventBus.emit('player-hit', { livesRemaining: this.lives });
    EventBus.emit('life-lost', this.lives);
    EventBus.emit('screen-shake', { intensity: 6 });

    if (this.lives <= 0) {
      this.endGame();
      return true;
    }

    this.isInvincible = true;
    return true;
  }

  clearInvincibility() {
    this.isInvincible = false;
  }

  endGame() {
    this.isRunning = false;
    EventBus.emit('game-over', this.score);
  }
}

export const gameState = new GameState();
