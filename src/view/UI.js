import { EventBus } from '../shared/EventBus.js';
import { gameState } from '../model/GameState.js';
import { formatScore } from '../shared/utils.js';
import { randomFrom, GAME_OVER_QUIPS } from '../model/Quips.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.menu = document.getElementById('menu');
    this.hud = document.getElementById('hud');
    this.gameover = document.getElementById('gameover');
    this.waveBanner = document.getElementById('wave-banner');
    this.universeTag = document.getElementById('universe-tag');
    this.scoreEl = document.getElementById('score');
    this.waveEl = document.getElementById('wave');
    this.livesEl = document.getElementById('lives');
    this.quipEl = document.getElementById('quip');
    this.finalScoreEl = document.getElementById('final-score');
    this.goQuipEl = document.getElementById('go-quip');

    this.showMenu();

    document.getElementById('btn-play').addEventListener('click', () => this.startGame());
    document.getElementById('btn-retry').addEventListener('click', () => this.startGame());
    document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && !this.menu.classList.contains('hidden')) this.startGame();
    });

    EventBus.on('score-changed', (s) => {
      this.scoreEl.textContent = formatScore(s);
    });
    EventBus.on('wave-started', ({ wave, message, universe, isBoss }) => {
      this.waveEl.textContent = isBoss ? `BOSS ${wave}` : `Wave ${wave}`;
      this.universeTag.textContent = universe.name;
      const hex = `#${(universe.accent >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
      this.universeTag.style.borderColor = hex;
      this.universeTag.style.color = hex;
      this.waveBanner.textContent = message;
      this.waveBanner.classList.remove('hidden');
      this.waveBanner.classList.toggle('boss', isBoss);
      clearTimeout(this._bannerTimer);
      this._bannerTimer = setTimeout(() => this.waveBanner.classList.add('hidden'), 3200);
    });
    EventBus.on('life-lost', (lives) => {
      this.livesEl.textContent = '♥'.repeat(Math.max(0, lives)) || '💀';
    });
    EventBus.on('quip-shown', (q) => {
      this.quipEl.textContent = q;
      this.quipEl.classList.add('pop');
      clearTimeout(this._quipTimer);
      this._quipTimer = setTimeout(() => this.quipEl.classList.remove('pop'), 400);
    });
    EventBus.on('game-over', (score) => this.showGameOver(score));
    EventBus.on('game-started', () => this.showHud());
  }

  startGame() {
    this.menu.classList.add('hidden');
    this.gameover.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.livesEl.textContent = '♥♥♥';
    this.scoreEl.textContent = '000000';
    this.quipEl.textContent = '';
    gameState.startGame();
    this.game._menuMode = false;
    this.game.resetEntities();
    this.game.start();
  }

  showHud() {
    this.hud.classList.remove('hidden');
    this.menu.classList.add('hidden');
    this.gameover.classList.add('hidden');
  }

  showMenu() {
    this.hud.classList.add('hidden');
    this.gameover.classList.add('hidden');
    this.menu.classList.remove('hidden');
    gameState.reset();
    this.game._menuMode = true;
    this.game.resetEntities();
    this.game.universeWorld.apply({
      sky: 0x1a1a2e,
      fog: 0x2a2a4e,
      floor: 0x16213e,
      floorAccent: 0x2a2a4e,
      accent: 0xff6b6b,
      light: 0xffe066,
      prop: 'stars',
    });
  }

  showGameOver(score) {
    this.hud.classList.add('hidden');
    this.gameover.classList.remove('hidden');
    this.finalScoreEl.textContent = formatScore(score);
    this.goQuipEl.textContent = randomFrom(GAME_OVER_QUIPS);
  }
}
