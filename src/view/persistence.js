/**
 * Best-score persistence (localStorage).
 * Safe in private mode / SSR: falls back to a transient in-memory record.
 */

const KEY = 'appetite-jam-best-v1';

const memoryFallback = {
  bestScore: 0,
  bestKills: 0,
  bestMaxCombo: 0,
  wins: 0,
};

function safeStorage() {
  try {
    const probeKey = '__aj_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadBest() {
  const store = safeStorage();
  if (!store) return { ...memoryFallback };
  try {
    const raw = store.getItem(KEY);
    if (!raw) return { ...memoryFallback };
    const parsed = JSON.parse(raw);
    return {
      bestScore: Number(parsed.bestScore) || 0,
      bestKills: Number(parsed.bestKills) || 0,
      bestMaxCombo: Number(parsed.bestMaxCombo) || 0,
      wins: Number(parsed.wins) || 0,
    };
  } catch {
    return { ...memoryFallback };
  }
}

/**
 * Merge a finished run's stats into the best record.
 * Returns { record, isNewBestScore, isNewBestKills, isNewBestMaxCombo }.
 */
export function recordRun({
  score = 0, kills = 0, maxCombo = 0, won = false,
} = {}) {
  const current = loadBest();
  const next = {
    bestScore: Math.max(current.bestScore, score),
    bestKills: Math.max(current.bestKills, kills),
    bestMaxCombo: Math.max(current.bestMaxCombo, maxCombo),
    wins: current.wins + (won ? 1 : 0),
  };
  const result = {
    record: next,
    isNewBestScore: score > current.bestScore && score > 0,
    isNewBestKills: kills > current.bestKills && kills > 0,
    isNewBestMaxCombo: maxCombo > current.bestMaxCombo && maxCombo > 0,
  };

  const store = safeStorage();
  if (store) {
    try {
      store.setItem(KEY, JSON.stringify(next));
    } catch {
      Object.assign(memoryFallback, next);
    }
  } else {
    Object.assign(memoryFallback, next);
  }
  return result;
}
