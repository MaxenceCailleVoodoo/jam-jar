export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PLAYER = {
  speed: 240,
  radius: 22,
  lives: 3,
  invincibleMs: 1200,
  fireRateMs: 180,
  bulletSpeed: 520,
  bulletRadius: 8,
};

export const BREAD = {
  baseRadius: 18,
  baseSpeed: 85,
  baseHp: 1,
  scoreValue: 100,
};

export const NUTELLA = {
  radius: 48,
  baseHp: 28,
  hpPerWave: 12,
  speed: 55,
  scoreValue: 3000,
};

export const WAVE = {
  baseCount: 6,
  countPerWave: 2,
  speedPerWave: 6,
  spawnDelayMs: 550,
  betweenWaveMs: 2800,
  maxActive: 40,
  bossEvery: 5,
};

export function isBossWave(wave) {
  return wave > 0 && wave % WAVE.bossEvery === 0;
}

export function getWaveConfig(waveNumber) {
  const w = Math.max(1, waveNumber);

  if (isBossWave(w)) {
    return {
      wave: w,
      isBoss: true,
      count: 0,
      minions: 4 + Math.floor(w / 5) * 2,
      bossHp: NUTELLA.baseHp + Math.floor(w / 5) * NUTELLA.hpPerWave,
      speed: BREAD.baseSpeed + w * 4,
      hp: 1,
      spawnDelayMs: 700,
      betweenWaveMs: WAVE.betweenWaveMs + 800,
    };
  }

  return {
    wave: w,
    isBoss: false,
    count: WAVE.baseCount + (w - 1) * WAVE.countPerWave,
    speed: BREAD.baseSpeed + (w - 1) * WAVE.speedPerWave,
    hp: BREAD.baseHp + Math.floor((w - 1) / 4),
    spawnDelayMs: Math.max(220, WAVE.spawnDelayMs - (w - 1) * 22),
    betweenWaveMs: WAVE.betweenWaveMs,
  };
}
