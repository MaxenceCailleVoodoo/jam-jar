export const ARENA = { half: 22, y: 0 };

export const PLAYER = {
  speed: 14,
  radius: 1.2,
  lives: 3,
  invincibleMs: 1200,
  fireRateMs: 180,
  bulletSpeed: 38,
  bulletRadius: 0.35,
};

export const ZOMBIE = {
  baseRadius: 1,
  baseSpeed: 5.5,
  baseHp: 1,
};

export const BOSS = {
  radius: 3.2,
  baseHp: 30,
  hpPerBossWave: 15,
  speed: 3.2,
  contactDamage: 1,
  scoreValue: 2500,
};

export const WAVE = {
  baseCount: 6,
  countPerWave: 2,
  speedPerWave: 0.4,
  spawnDelayMs: 550,
  betweenWaveMs: 3200,
  maxActive: 45,
};

export function getWaveConfig(waveNumber) {
  const w = Math.max(1, waveNumber);
  const isBoss = w % 5 === 0;

  if (isBoss) {
    return {
      wave: w,
      isBoss: true,
      count: 0,
      bossHp: BOSS.baseHp + Math.floor(w / 5) * BOSS.hpPerBossWave,
      minionCount: 4 + Math.floor(w / 5) * 2,
      speed: ZOMBIE.baseSpeed + w * 0.15,
      hp: 1,
      spawnDelayMs: 800,
      betweenWaveMs: WAVE.betweenWaveMs + 1000,
    };
  }

  return {
    wave: w,
    isBoss: false,
    count: WAVE.baseCount + (w - 1) * WAVE.countPerWave,
    speed: ZOMBIE.baseSpeed + (w - 1) * WAVE.speedPerWave,
    hp: ZOMBIE.baseHp + Math.floor((w - 1) / 4),
    spawnDelayMs: Math.max(220, WAVE.spawnDelayMs - (w - 1) * 25),
    betweenWaveMs: WAVE.betweenWaveMs,
  };
}
