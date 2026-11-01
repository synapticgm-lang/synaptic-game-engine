// Payoff plan for Umbra: which hub pages should react to which earlier choices.
// node -> { flag: [values] }. One text insert per (node, flag, value).
export const TRACKS = {
  w: {
    label: 'WITH SABLE track: Sable (a young climber-thief) is your ally and moves beside you across the rooftops. She wants her brother freed from gaol.',
    witness: 'the Archbishop\'s almoner',
    cover: { tailor: "the disgraced tailor's debt coat", livery: 'a porter\'s rough livery', usher: 'an opera usher\'s uniform' },
  },
  l: {
    label: 'ALONE track: you left Sable behind and fled alone in the murdered Archbishop\'s cloak. Nobody is beside you.',
    witness: 'the deacon who dressed the Archbishop',
    cover: { cloak: "the Archbishop's own cloak, kept on", tailor: "the disgraced tailor's debt coat", livery: "a porter's rough livery" },
  },
  r: {
    label: 'RIVAL track: you bolted the hatch on Sable and the Guard took her. She has since got out and hunts you from the rooftops, reading your every move. She is not your ally.',
    witness: 'the turnkey who booked Sable into gaol',
    cover: { bare: 'no disguise at all, bare-faced over the roofs', tailor: "the disgraced tailor's debt coat", livery: "a porter's rough livery" },
  },
};

export const FLAG_MEANING = {
  cover: (t) => `COVER: what the player chose to wear to hide from the Guard. Values: ${Object.entries(TRACKS[t].cover).map(([k, v]) => `${k} = ${v}`).join('; ')}.`,
  witness: (t) => `WITNESS: early in the night ${TRACKS[t].witness} recognised the player. bought = the player silenced them with a whispered promise (a debt that may be called in); let-go = the player let them run, so they went to the Guard; dropped = the player pushed them to their death off a roof (a killing, a secret).`,
  faceKnown: () => 'FACEKNOWN: yes = a witness got away alive and can describe the player\'s face to the Guard and the two great houses.',
  vault: () => 'VAULT: breached = the player forced the grandmaster\'s lock on the sealed undervault beneath the Exchange (by shim or flash-powder), so the vault now stands open and its breaking can be traced.',
  cabal: () => 'CABAL: known = the player read the vault\'s counter-ledgers and knows the two great houses (Lord Valerius\'s silk houses and Matron Rigg\'s iron syndicate) are secretly ONE cabal in one handwriting, pretending to be at war.',
  valerius: () => 'VALERIUS: allied = the player sat with Lord Valerius (silk, wine, polite menace) and took his protection; betrayed = the player refused him / sided with his enemy Rigg, so Valerius\'s runners now count the player an enemy.',
  rigg: () => 'RIGG: allied = the player sat with Matron Rigg (iron foundry, warrants, the gaol books) and took her protection; betrayed = the player refused her / sided with Valerius, so Rigg\'s men now count the player an enemy.',
  sable: () => 'SABLE: with = Sable is the player\'s ally; rival = the player betrayed her and she hunts the player; left = the player abandoned her and went alone.',
};

const W = {
  'up-w-alley-regroup': { witness: ['bought', 'let-go', 'dropped'], cover: ['tailor', 'livery', 'usher'] },
  'up-w-drone-loft': { faceKnown: ['yes'], witness: ['dropped'] },
  'up-w-beggar-corner': { cover: ['tailor', 'livery', 'usher'], faceKnown: ['yes'] },
  'up-w-portrait-map': { witness: ['bought', 'dropped'], cover: ['tailor', 'livery', 'usher'] },
  'up-w-exchange-roofs': { faceKnown: ['yes'], vault: ['breached'], witness: ['let-go'] },
  'up-w-undervault-stair': { witness: ['dropped'], cover: ['livery'] },
  'up-w-ledger-room': { vault: ['breached'], cabal: ['known'] },
  'up-w-faction-summons': { cabal: ['known'], faceKnown: ['yes'], witness: ['bought', 'let-go', 'dropped'] },
  'up-w-silk-hall': { valerius: ['allied'], cabal: ['known'], faceKnown: ['yes'] },
  'up-w-foundry-gate': { rigg: ['allied'], cabal: ['known'], faceKnown: ['yes'] },
  'up-w-eclipse-approach': { valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], vault: ['breached'] },
  'up-w-eclipse-roofs': { valerius: ['betrayed'], rigg: ['betrayed'], cover: ['tailor', 'livery', 'usher'] },
  'up-w-final-choice': { cabal: ['known'], witness: ['bought', 'let-go', 'dropped'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'] },
  'up-w-press-run': { cabal: ['known'], valerius: ['allied'], rigg: ['allied'], witness: ['bought'] },
  'up-w-brazier': { cabal: ['known'], valerius: ['betrayed'], rigg: ['betrayed'] },
  'up-w-harbor-crown': { witness: ['bought', 'let-go', 'dropped'], valerius: ['betrayed'], rigg: ['betrayed'], cover: ['tailor', 'livery', 'usher'] },
};
const L = {
  'up-l-empty-garret': { witness: ['bought', 'let-go', 'dropped'], cover: ['cloak', 'tailor', 'livery'] },
  'up-l-pigeon-cage': { faceKnown: ['yes'], witness: ['dropped'] },
  'up-l-portraitist': { cover: ['cloak', 'tailor', 'livery'], witness: ['bought'] },
  'up-l-exchange-ridge': { faceKnown: ['yes'], vault: ['breached'], witness: ['let-go'] },
  'up-l-tunnel-mouth': { cover: ['livery'], witness: ['dropped'] },
  'up-l-vault-antechamber': { vault: ['breached'], faceKnown: ['yes'] },
  'up-l-faction-letters': { cabal: ['known'], faceKnown: ['yes'], witness: ['bought', 'let-go', 'dropped'] },
  'up-l-silk-annex': { valerius: ['allied'], cabal: ['known'], faceKnown: ['yes'] },
  'up-l-iron-foundry': { rigg: ['allied'], cabal: ['known'], faceKnown: ['yes'] },
  'up-l-eclipse-rise': { valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], vault: ['breached'] },
  'up-l-eclipse-ridgeline': { valerius: ['betrayed'], rigg: ['betrayed'], cover: ['cloak', 'tailor', 'livery'] },
  'up-l-solo-final': { cabal: ['known'], witness: ['bought', 'let-go', 'dropped'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'] },
  'up-l-press-yard': { cabal: ['known'], valerius: ['allied'], rigg: ['allied'], witness: ['bought'] },
  'up-l-forger-desk': { cabal: ['known'], cover: ['cloak', 'tailor', 'livery'], witness: ['dropped'] },
  'up-l-buyer-room': { cabal: ['known'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], witness: ['let-go'] },
  'up-l-harbor-statue': { witness: ['bought', 'let-go', 'dropped'], cover: ['cloak', 'tailor', 'livery'], valerius: ['betrayed'], rigg: ['betrayed'] },
};
const R = {
  'up-r-rival-first-sign': { witness: ['bought', 'let-go', 'dropped'], cover: ['bare', 'tailor', 'livery'] },
  'up-r-exchange-parapet': { faceKnown: ['yes'], witness: ['let-go'], vault: ['breached'], cabal: ['known'] },
  'up-r-faction-bid': { cabal: ['known'], faceKnown: ['yes'], witness: ['bought', 'let-go', 'dropped'] },
  'up-r-silk-balcony': { valerius: ['allied'], cabal: ['known'], faceKnown: ['yes'], witness: ['bought'] },
  'up-r-foundry-gallery': { rigg: ['allied'], cabal: ['known'], faceKnown: ['yes'], witness: ['dropped'] },
  'up-r-eclipse-begins': { valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], vault: ['breached'], cover: ['bare', 'tailor', 'livery'] },
  'up-r-her-perch': { cabal: ['known'], witness: ['bought', 'let-go', 'dropped'], valerius: ['allied'], rigg: ['allied'] },
  'up-r-rival-final': { cabal: ['known'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], witness: ['bought', 'dropped'] },
  'up-r-press-cellar': { cabal: ['known'], witness: ['let-go'], valerius: ['allied'], rigg: ['allied'] },
  'up-r-bid-room': { cabal: ['known'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], witness: ['bought'] },
};

// Endings: flags that can still be unset/true at that ending (from the exhaustive search of the base book).
const END_COMMON = { witness: ['bought', 'let-go', 'dropped'], faceKnown: ['yes'], cabal: ['known'], valerius: ['allied', 'betrayed'], rigg: ['allied', 'betrayed'], vault: ['breached'] };
const E = {
  'up-end-parliament-dawn': { track: 'w', ...END_COMMON, sable: ['with'], cover: ['tailor', 'livery', 'usher'] },
  'up-end-shadow-truce': { track: 'w', ...END_COMMON, sable: ['with'], cover: ['tailor', 'livery', 'usher'] },
  'up-end-ghost-road': { track: 'wl', ...END_COMMON, sable: ['with', 'left'], cover: ['tailor', 'livery', 'usher', 'cloak'] },
  'up-end-nameless-martyr': { track: 'l', ...END_COMMON, sable: ['left'], cover: ['cloak', 'tailor', 'livery'] },
  'up-end-sold-seat': { track: 'l', ...END_COMMON, sable: ['left'], cover: ['cloak', 'tailor', 'livery'] },
  'up-end-become-the-list': { track: 'l', ...END_COMMON, sable: ['left'], cover: ['cloak', 'tailor', 'livery'] },
  'up-end-perch-answers': { track: 'r', ...END_COMMON, sable: ['rival'], cover: ['bare', 'tailor', 'livery'] },
  'up-end-sold-knife': { track: 'r', ...END_COMMON, sable: ['rival'], cover: ['bare', 'tailor', 'livery'] },
};
// Trim endings to the 7 most telling inserts each (keep every flag represented across the book).
export const ENDING_PICK = {
  'up-end-parliament-dawn': ['witness=bought', 'witness=dropped', 'faceKnown=yes', 'cabal=known', 'valerius=allied', 'rigg=allied', 'cover=livery'],
  'up-end-shadow-truce': ['witness=let-go', 'cabal=known', 'valerius=betrayed', 'rigg=betrayed', 'vault=breached', 'cover=tailor', 'faceKnown=yes'],
  'up-end-ghost-road': ['sable=with', 'sable=left', 'witness=bought', 'witness=dropped', 'faceKnown=yes', 'cover=usher', 'valerius=allied', 'rigg=allied'],
  'up-end-nameless-martyr': ['witness=dropped', 'witness=let-go', 'faceKnown=yes', 'cabal=known', 'cover=cloak', 'valerius=betrayed'],
  'up-end-sold-seat': ['witness=bought', 'cabal=known', 'valerius=allied', 'rigg=allied', 'cover=tailor', 'vault=breached'],
  'up-end-become-the-list': ['witness=dropped', 'witness=bought', 'cabal=known', 'cover=cloak', 'cover=livery', 'faceKnown=yes'],
  'up-end-perch-answers': ['witness=let-go', 'witness=bought', 'cabal=known', 'rigg=allied', 'valerius=betrayed', 'cover=bare', 'vault=breached'],
  'up-end-sold-knife': ['witness=dropped', 'faceKnown=yes', 'cabal=known', 'valerius=allied', 'rigg=betrayed', 'cover=tailor', 'cover=livery'],
};

export function allItems() {
  const items = [];
  const push = (track, node, table) => {
    for (const [flag, vals] of Object.entries(table)) for (const value of vals) items.push({ track, node, flag, value });
  };
  for (const [n, t] of Object.entries(W)) push('w', n, t);
  for (const [n, t] of Object.entries(L)) push('l', n, t);
  for (const [n, t] of Object.entries(R)) push('r', n, t);
  for (const [n, spec] of Object.entries(ENDING_PICK)) {
    const trk = E[n].track;
    for (const kv of spec) {
      const [flag, value] = kv.split('=');
      items.push({ track: trk, node: n, flag, value, ending: true });
    }
  }
  return items;
}
