/** Jam flavors — three colors for the menu and in-game jam. */
export const JAM_FLAVORS = [
  {
    id: 'blueberry',
    name: 'Blueberry',
    tagline: 'Blue mood, sweet attitude',
    jam: '#3d2a7a',
    jamLight: '#6c52c4',
    uiAccent: '#3d2a7a',
  },
  {
    id: 'apricot',
    name: 'Apricot',
    tagline: 'Orange you jammy?',
    jam: '#e8862a',
    jamLight: '#ffc070',
    uiAccent: '#c25800',
  },
  {
    id: 'raspberry',
    name: 'Raspberry',
    tagline: 'Toast of the jam',
    jam: '#c91f4a',
    jamLight: '#ff7099',
    uiAccent: '#c91f4a',
  },
];

export const DEFAULT_JAM_ID = 'raspberry';

const BREAKFAST_QUIPS = [
  'Rise and spread!',
  'The early bird gets the jam.',
  'Brunch mode: ON',
  'Syrup? No — jam.',
];

export function pickBreakfastQuip() {
  return BREAKFAST_QUIPS[Math.floor(Math.random() * BREAKFAST_QUIPS.length)];
}

export function getJamFlavor(id) {
  return JAM_FLAVORS.find((f) => f.id === id) ?? JAM_FLAVORS.find((f) => f.id === DEFAULT_JAM_ID);
}

export let activeJamPalette = {
  jam: '#c91f4a',
  jamLight: '#ff7099',
  uiAccent: '#c91f4a',
};

export function setActiveJamPalette(flavor) {
  activeJamPalette = {
    jam: flavor.jam,
    jamLight: flavor.jamLight,
    uiAccent: flavor.uiAccent,
  };
}
