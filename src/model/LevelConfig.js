export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PLAYER = {
  speed: 220,
  radius: 16,
  lives: 3,
  invincibleMs: 1000,
  fireRateMs: 200,
  bulletSpeed: 500,
  bulletRadius: 5,
};

export const ZOMBIE = {
  baseRadius: 14,
  baseSpeed: 80,
  baseHp: 1,
  contactDamage: 1,
  scoreValue: 100,
};

export const WAVE = {
  baseCount: 5,
  countPerWave: 3,
  speedPerWave: 8,
  hpPerWave: 0,
  spawnDelayMs: 600,
  betweenWaveMs: 2500,
  maxActive: 40,
};

export function getWaveConfig(waveNumber) {
  const w = Math.max(1, waveNumber);
  return {
    wave: w,
    count: WAVE.baseCount + (w - 1) * WAVE.countPerWave,
    speed: ZOMBIE.baseSpeed + (w - 1) * WAVE.speedPerWave,
    hp: ZOMBIE.baseHp + Math.floor((w - 1) / 3) * (WAVE.hpPerWave + 1),
    spawnDelayMs: Math.max(200, WAVE.spawnDelayMs - (w - 1) * 30),
    betweenWaveMs: WAVE.betweenWaveMs,
  };
}
