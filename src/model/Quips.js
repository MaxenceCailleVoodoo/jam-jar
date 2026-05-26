export const KILL_QUIPS = [
  'RIP berry',
  'That\'s not jam!',
  'Spread elsewhere!',
  'Preserved!',
  'Too chunky!',
  'Out of season!',
  'Bon appétit... NOT',
  'Splat!',
  'Seedless defeat',
  'Pectin power!',
];

export const BOSS_QUIPS = [
  'The Mega-Jar trembles!',
  'Lid pop critical!',
  'Vacuum seal broken!',
  'That boss was THICC',
  'Condensed evil defeated',
];

export const GAME_OVER_QUIPS = [
  'You became confiture.',
  'The jar claims another.',
  'Preserved for eternity.',
  'Should\'ve read the expiry date.',
  'The pantry wins again.',
];

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function waveMessage(wave, universe) {
  if (wave % 5 === 0) {
    return `BOSS WAVE ${wave}: ${universe.name} — ${universe.tagline}`;
  }
  return `Wave ${wave}: ${universe.name} — ${universe.tagline}`;
}
