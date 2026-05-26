export const WAVE_MESSAGES = [
  'The pantry awakens',
  'HR sent the interns',
  'Someone opened the wrong jar',
  'Sugar rush incoming',
  'The mold strikes back',
  'Expired but angry',
  'Grandma\'s revenge',
  'Sticky situation',
  'Fruit flies with attitude',
  'Jelly earthquake',
];

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

export function waveMessage(wave) {
  const template = randomFrom(WAVE_MESSAGES);
  return `Wave ${wave}: ${template}`;
}
