/** Jam flavors — 3 couleurs pour le menu et le jeu. */
export const JAM_FLAVORS = [
  {
    id: 'strawberry',
    name: 'Strawberry',
    tagline: 'Berry early riser',
    jam: '#e63946',
    jamLight: '#ff8fa3',
    uiAccent: '#e63946',
  },
  {
    id: 'apricot',
    name: 'Apricot',
    tagline: 'Orange you jammy?',
    jam: '#f77f00',
    jamLight: '#ffbf69',
    uiAccent: '#e85d04',
  },
  {
    id: 'raspberry',
    name: 'Raspberry',
    tagline: 'Toast of the jam',
    jam: '#cc2244',
    jamLight: '#ff5577',
    uiAccent: '#cc2244',
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
  jam: '#cc2244',
  jamLight: '#ff5577',
  uiAccent: '#cc2244',
};

export function setActiveJamPalette(flavor) {
  activeJamPalette = {
    jam: flavor.jam,
    jamLight: flavor.jamLight,
    uiAccent: flavor.uiAccent,
  };
}
