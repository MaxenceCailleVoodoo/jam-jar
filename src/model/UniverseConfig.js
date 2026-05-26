/** Each wave = one full themed universe (sky, floor, props, fog, enemy palette). */
export const UNIVERSES = [
  {
    id: 'pantry',
    name: 'Pantry Prime',
    tagline: 'Where jars go to judge you',
    sky: 0x2d1f0f,
    fog: 0x3d2814,
    floor: 0x5c3d1e,
    floorAccent: 0x8b5a2b,
    accent: 0xffc857,
    enemy: 0xff5544,
    boss: 0xff8800,
    light: 0xffe8c8,
    prop: 'jars',
  },
  {
    id: 'neon',
    name: 'Neon Jellyverse',
    tagline: 'Sugar at lightspeed',
    sky: 0x0a0028,
    fog: 0x1a0048,
    floor: 0x220044,
    floorAccent: 0x440088,
    accent: 0xff44ff,
    enemy: 0x44ffff,
    boss: 0xff00aa,
    light: 0xaa66ff,
    prop: 'grid',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Marmalade',
    tagline: 'Orbits made of pulp',
    sky: 0x020818,
    fog: 0x081830,
    floor: 0x0c2040,
    floorAccent: 0x183060,
    accent: 0xffaa44,
    enemy: 0xff6622,
    boss: 0xffcc00,
    light: 0x88ccff,
    prop: 'stars',
  },
  {
    id: 'frost',
    name: 'Deep Freeze',
    tagline: 'Brain freeze: the DLC',
    sky: 0x0a1828,
    fog: 0x1a3050,
    floor: 0x2a4868,
    floorAccent: 0x4a78a8,
    accent: 0xaaddff,
    enemy: 0x66bbff,
    boss: 0xffffff,
    light: 0xcceeff,
    prop: 'crystals',
  },
  {
    id: 'volcano',
    name: 'Volcano Chunky',
    tagline: 'Lava with seeds',
    sky: 0x1a0800,
    fog: 0x3a1000,
    floor: 0x4a1808,
    floorAccent: 0x8a2808,
    accent: 0xff4400,
    enemy: 0xff2200,
    boss: 0xffaa00,
    light: 0xff8844,
    prop: 'rocks',
  },
  {
    id: 'candy',
    name: 'Candy Catastrophe',
    tagline: 'Diabetes speedrun',
    sky: 0x280818,
    fog: 0x401028,
    floor: 0x602040,
    floorAccent: 0x903060,
    accent: 0xff88cc,
    enemy: 0xff44aa,
    boss: 0xffff44,
    light: 0xffccee,
    prop: 'lollipops',
  },
];

export const BOSS_UNIVERSE = {
  id: 'boss_temple',
  name: 'Temple of the Mega-Jar',
  tagline: 'HR finally promoted someone',
  sky: 0x120808,
  fog: 0x301010,
  floor: 0x401818,
  floorAccent: 0x802020,
  accent: 0xffdd00,
  enemy: 0xff4444,
  boss: 0xff0000,
  light: 0xffaa66,
  prop: 'temple',
};

export const BOSS_EVERY_N_WAVES = 5;

export function isBossWave(wave) {
  return wave > 0 && wave % BOSS_EVERY_N_WAVES === 0;
}

export function getUniverseForWave(wave) {
  if (isBossWave(wave)) return BOSS_UNIVERSE;
  return UNIVERSES[(wave - 1) % UNIVERSES.length];
}
