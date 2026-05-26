/** Jam bottle roster — same jar base, unique face + jam color per person. */
export const CHARACTERS = [
  {
    id: 'maxence',
    name: 'Maxence',
    flavor: 'Confiture framboise',
    faceSource: '/assets/characters/maxence.png',
    jam: {
      outer: '#ff6688',
      mid: '#ff4466',
      inner: '#ff2244',
      shine: '#ff8899',
      deep: '#ff5577',
      blob: '#ff0033',
      blobLight: '#ff3355',
    },
    lid: '#cc3333',
    lidDark: '#aa2222',
  },
  {
    id: 'pauline',
    name: 'Pauline',
    flavor: 'Mûre sauvage',
    faceType: 'pauline',
    jam: {
      outer: '#9966cc',
      mid: '#7744aa',
      inner: '#552288',
      shine: '#bb88ee',
      deep: '#6633aa',
      blob: '#6600cc',
      blobLight: '#9933ff',
    },
    lid: '#442266',
    lidDark: '#331144',
  },
  {
    id: 'lucas',
    name: 'Lucas',
    flavor: 'Orange amère',
    faceType: 'lucas',
    jam: {
      outer: '#ffaa44',
      mid: '#ff8822',
      inner: '#ee6600',
      shine: '#ffcc66',
      deep: '#dd7700',
      blob: '#ff8800',
      blobLight: '#ffaa33',
    },
    lid: '#cc5500',
    lidDark: '#aa4400',
  },
  {
    id: 'sophie',
    name: 'Sophie',
    flavor: 'Citron vert',
    faceType: 'sophie',
    jam: {
      outer: '#88dd44',
      mid: '#66cc22',
      inner: '#44aa00',
      shine: '#aaee66',
      deep: '#55bb11',
      blob: '#66dd00',
      blobLight: '#99ff44',
    },
    lid: '#448811',
    lidDark: '#336600',
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
