export const KILL_QUIPS = [
  'Toasted!',
  'That\'s not butter!',
  'Crumb deleted',
  'Jam > carbs',
  'Soggy defeat',
  'Crunch cancelled',
  'No more crust',
  'Spread the news: you lost',
  'Burnt to a crisp',
  'Gluten-free ghost',
];

export const BOSS_QUIPS = [
  'Nutella has fallen!',
  'Hazelnut humiliation',
  'The jar lid popped!',
  'Choco-boss melted',
  'Spreadsheet says: dead',
];

export const HIT_QUIPS = [
  'Ouch! Jar cracked!',
  'Bread fought back!',
  'That hurt the preserve!',
  'Crack goes the jar...',
];

export const GAME_OVER_QUIPS = [
  'You became marmalade.',
  'The jar is empty.',
  'Preserved... in shame.',
  'Nutella wins. Humanity loses.',
  'Should\'ve stayed in the pantry.',
];

export const WAVE_INTROS = [
  'Bread army rising',
  'Toast incoming',
  'The bakery awakens',
  'Crusty revenge',
  'Sourdough strike force',
  'Baguette battalion',
];

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function waveMessage(wave, isBoss) {
  if (isBoss) return `BOSS WAVE ${wave}: NUTELLA OVERLORD descends!`;
  return `Wave ${wave}: ${randomFrom(WAVE_INTROS)}`;
}
