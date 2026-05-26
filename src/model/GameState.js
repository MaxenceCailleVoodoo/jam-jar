import { EventBus } from '../shared/EventBus.js';
import { PLAYER } from './LevelConfig.js';
import { randomFrom, KILL_QUIPS, BOSS_QUIPS, HIT_QUIPS, waveMessage } from './Quips.js';

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = PLAYER.lives;
    this.wave = 0;
    this.zombiesRemaining = 0;
    this.isRunning = false;
    this.isInvincible = false;
    this.isBossWave = false;
  }

  startGame() {
    this.reset();
    this.isRunning = true;
    EventBus.emit('game-started');
  }

  nextWave() {
    this.wave += 1;
    this.isBossWave = this.wave % 5 === 0;
    EventBus.emit('wave-started', {
      wave: this.wave,
      message: waveMessage(this.wave, this.isBossWave),
      isBoss: this.isBossWave,
    });
  }

  setWaveEnemyCount(count) {
    this.zombiesRemaining = count;
  }

  onEnemyKilled(x, y, isBoss = false) {
    const points = isBoss ? 3000 + this.wave * 150 : 100 + this.wave * 12;
    this.score += points;
    const quip = randomFrom(isBoss ? BOSS_QUIPS : KILL_QUIPS);
    EventBus.emit('enemy-killed', { points, x, y, quip, isBoss });
    EventBus.emit('score-changed', this.score);
    EventBus.emit('quip-shown', quip);
  }

  onWaveEnemyDefeated() {
    this.zombiesRemaining -= 1;
  }

  playerHit() {
    if (this.isInvincible || !this.isRunning) return false;

    this.lives -= 1;
    EventBus.emit('jar-damaged', { lives: this.lives, maxLives: PLAYER.lives });
    EventBus.emit('player-hit', { livesRemaining: this.lives });
    EventBus.emit('life-lost', this.lives);
    EventBus.emit('quip-shown', randomFrom(HIT_QUIPS));
    EventBus.emit('screen-shake', { intensity: 7 });

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
