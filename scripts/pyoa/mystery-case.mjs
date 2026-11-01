// The Orrery Inquest - case bible (the SOLUTION lives here; prose generators only see per-node briefs).
// Original setting, cast and plot. Structure (hub/day clock, evidence flags, proof-gated accusation) follows
// the fair-play case-file pattern only.
export const CASE = {
  slug: 'orrery-inquest',
  title: 'The Orrery Inquest',
  prefix: 'oi',
  truth: {
    culprit: 'marrable',
    method: 'Hesper Quillon was killed by quicksilver (mercury) fumes. Sometime before six on the evening of his death, Ottoline Marrable stirred a mercury salt into the regulator oil can; the lamp under the great regulator warmed it to vapour in the sealed chamber where Quillon bolted himself in to wind the regulator at midnight.',
    motive: 'Marrable had for years sold the Orrery\'s ground crystal lenses to a private buyer and fitted pressed glass in their place. Quillon had found the swap and meant to table a lens audit before the Convocation.',
    accessory: 'Captain Roderick Hale, who bought the crystal lenses and, after the death, took the audit folder from the chamber to protect himself. He did not kill anyone.',
    framed: 'Dunstan Pike, the junior assistant, whom the Magistrate wants hanged because his initials are on the oil refill chit.',
  },
  cast: {
    inquirer: 'the player: a Crown Inquirer of the Lantern Bench (no name given; address as "you")',
    wick: 'Wick, your young clerk, keeps the case board; earnest, ink-stained, fond of lists',
    marrable: 'Ottoline Marrable, Instrument-Keeper of the Orrery; brisk, soft-spoken, grey gloves, always wiping her hands on a canvas workshop apron',
    pike: 'Dunstan Pike, junior assistant; nervous, left-handed, writes in pencil, lodged in Lantern Gaol',
    teague: 'Bram Teague, night watchman of the Orrery; slow, honest, keeps a roster book',
    anselm: 'Brother Anselm Tarn, almoner of the Lamp Chapel; gentle, evasive about his evenings',
    vane: 'Lady Cressida Vane, patron of the Orrery; sharp, proud, deep in debt',
    ilse: 'Ilse Quillon, the dead man\'s daughter; composed, grieving, secretly engaged to Anselm',
    hale: 'Captain Roderick Hale, Admiralty liaison at Quay Nine; hearty, nervous when lenses are mentioned',
    lyle: 'Perpetua Lyle, Registry archivist; dry wit, guards her shelves',
    gorse: 'Chief Magistrate Gorse; impatient, wants Pike hanged before the Convocation',
  },
  locs: {
    orr: { name: 'The Orrery Hall', look: 'a drum-shaped brass-and-glass tower, the great orrery turning slowly under its dome; stair, regulator chamber, instrument galleries', people: ['Bram Teague, night watchman', 'Mrs Haldane, hall housekeeper', 'Nell, a twelve-year-old apprentice'] },
    oil: { name: 'The Oil Store and Instrument Workshop', look: 'a cramped annexe: locked oil cupboard, benches, lens racks, ink pots, coat hooks, smells of whale-oil and metal', people: ['Ottoline Marrable, Instrument-Keeper', 'Nell, a twelve-year-old apprentice'] },
    cha: { name: 'The Lamp Chapel', look: 'a small candle-lit chapel on Wick Lane with a vigil book and a cold almshouse', people: ['Brother Anselm Tarn, almoner', 'Sexton Obadiah Frisk'] },
    van: { name: 'Vane House', look: 'a tall townhouse with a glasshouse conservatory, ledgers in the morning room and a nervous steward', people: ['Lady Cressida Vane', 'Mr Lorrimer, her steward'] },
    qui: { name: 'Quillon House, Pewter Row', look: 'a narrow house of clocks, the late astronomer\'s study upstairs, a nosy neighbour opposite', people: ['Ilse Quillon', 'Hettie, the old maid'] },
    pie: { name: 'Quay Nine, Admiralty Pier', look: 'a windy stone pier of crates and customs sheds, the Captain\'s office above a rope store', people: ['Captain Roderick Hale', 'Tobias Finch, his clerk', 'Harbour-master Ngozi Bell'] },
    gao: { name: 'Lantern Gaol', look: 'a damp gaol on Chain Steps, visiting cell, gaoler\'s desk, Pike\'s cell with a pencil stub', people: ['Dunstan Pike, prisoner', 'Mr Crake, gaoler'] },
    arc: { name: 'The Registry Archive', look: 'a hushed vaulted records hall of chits, rosters and ledgers, brass shelf ladders', people: ['Perpetua Lyle, archivist', 'Sam, a runner-boy'] },
    mar: { name: 'Gloam Market and the Canal Ferry', look: 'a crowded lamplit market over the canal, laundry boats, a ferry stage and a tavern called The Spare Cog', people: ['Old Joss, ferryman', 'Maud Ketterick, laundress', 'Fenn, tavern-keeper'] },
  },
  // which locations open on which day (days 1-5); day 6 is the Convocation
  schedule: {
    1: ['orr', 'oil', 'gao', 'qui', 'cha', 'arc'],
    2: ['orr', 'oil', 'arc', 'qui', 'van', 'mar'],
    3: ['arc', 'oil', 'pie', 'gao', 'mar', 'van'],
    4: ['orr', 'pie', 'cha', 'mar', 'arc', 'oil'],
    5: ['orr', 'gao', 'van', 'qui', 'pie', 'arc'],
  },
  // flag -> clue. kind E=essential to the solution, H=red herring, S=supporting. observe = what the player is plainly TOLD (never the interpretation).
  clues: {
    oilcan:   { kind: 'E', observe: 'The regulator oil can has its wax seal cracked, and a film of tiny silver beads of quicksilver floats on the oil and rolls when tilted.', src: [['oil', 1], ['oil', 2], ['orr', 1]] },
    watch:    { kind: 'E', observe: 'Quillon\'s silver pocket watch is dull and frosted white as if coated, while his brass keys beside it are untouched.', src: [['orr', 1], ['qui', 2], ['orr', 4]] },
    chit:     { kind: 'E', observe: 'The oil refill chit for the evening of the death is initialled "D.P." in blue-green verdigris ink, with a rightward slant, on paper with a clean machine-trimmed edge.', src: [['arc', 2], ['oil', 2], ['arc', 3]] },
    inkshop:  { kind: 'E', observe: 'Blue-green verdigris ink is mixed only in the Instrument Workshop to Marrable\'s own recipe; the workshop ink pot is nearly dry and Pike has never been seen using anything but pencil.', src: [['oil', 1], ['oil', 3], ['arc', 4]] },
    lefty:    { kind: 'E', observe: 'Dunstan Pike is left-handed; his handwriting slopes backward, to the left, never to the right like the chit.', src: [['gao', 1], ['gao', 3], ['orr', 2]] },
    apron:    { kind: 'E', observe: 'Marrable\'s canvas workshop apron and grey gloves have a silvery sheen at the pockets and smell faintly metallic; a wad of cotton wool in the pocket is beaded with quicksilver.', src: [['oil', 3], ['oil', 4], ['mar', 4]] },
    candle:   { kind: 'E', observe: 'Marrable swore she saw Quillon enter the chamber at half past eleven by the stair candle-clock, but the watch roster records the stair candle-clock was snuffed out by the watchman at ten to eleven.', src: [['orr', 2], ['arc', 3], ['mar', 2]] },
    lensfund: { kind: 'E', observe: 'The lens fund ledger shows fourteen ground crystal lenses paid for, while the Admiralty inventory lists the same fourteen as pressed glass; the audit pages are missing.', src: [['arc', 3], ['arc', 4], ['pie', 3]] },
    audit:    { kind: 'E', observe: 'A note in Quillon\'s hand: "I table the lens audit at the Convocation. O.M. may explain herself beforehand."', src: [['qui', 2], ['orr', 4], ['qui', 5]] },
    halefolder: { kind: 'S', observe: 'Captain Hale\'s clerk saw him carry a green audit folder, tied with a sailor\'s knot, from the Orrery on the morning the body was found.', src: [['pie', 3], ['pie', 4], ['orr', 4]] },
    visits:   { kind: 'H', observe: 'Brother Anselm was seen leaving Quillon House by the back door at nine on the night of the death.', src: [['qui', 1], ['cha', 1]] },
    vaneforge:{ kind: 'H', observe: 'A letter extending Lady Vane\'s loan, signed "H. Quillon", is a forgery: the signature is traced.', src: [['van', 2], ['arc', 2]] },
    will:     { kind: 'H', observe: 'Quillon\'s new will leaves his Orrery shares to his daughter Ilse.', src: [['qui', 5], ['arc', 4]] },
    pikelie:  { kind: 'H', observe: 'Pike lied about sleeping in the infirmary that night; he was drinking at The Spare Cog until eleven.', src: [['mar', 2], ['gao', 1]] },
    ticket:   { kind: 'H', observe: 'Ilse\'s night-coach ticket to Brack is stamped 9:50 pm; she was twelve miles away at the death.', src: [['qui', 1], ['mar', 4]] },
  },
  // confrontations: id, where/when, needs (flags), sets flag, reveal
  confronts: [
    { id: 'c_pike',   who: 'Dunstan Pike',        at: [['gao', 3], ['gao', 5]], needs: { chit: 'y', lefty: 'y' }, sets: 'pikeclear', reveal: 'Pike admits he was drinking, but swears he never signed the chit; relieved, he says Marrable always told him to leave the oil store to her.' },
    { id: 'c_ink',    who: 'Ottoline Marrable',   at: [['oil', 3], ['oil', 4]], needs: { inkshop: 'y', chit: 'y' }, sets: 'slip', reveal: 'Marrable blames Pike, but in doing so slips and mentions that "the oil was silvered" before you told her anything about the oil.' },
    { id: 'c_candle', who: 'Ottoline Marrable',   at: [['oil', 4], ['orr', 4]], needs: { candle: 'y' }, sets: 'caught', reveal: 'Marrable corrects her story: she cannot explain how she saw Quillon by a candle-clock that was already out.' },
    { id: 'c_hale',   who: 'Captain Roderick Hale', at: [['pie', 4]], needs: { halefolder: 'y' }, sets: 'accessory', reveal: 'Hale admits he bought the crystal lenses and took the audit folder to protect himself, but swears he never touched the oil.' },
    { id: 'c_vane',   who: 'Lady Cressida Vane',  at: [['van', 3], ['van', 5]], needs: { vaneforge: 'y' }, sets: 'vanecleared', reveal: 'Vane admits forging the letter to hide her debt; she was at the opera until midnight, her ticket stub proves it.' },
    { id: 'c_anselm', who: 'Brother Anselm Tarn', at: [['cha', 4]], needs: { visits: 'y' }, sets: 'anselmcleared', reveal: 'Anselm confesses the secret engagement to Ilse; the sexton\'s vigil book shows him kneeling in the chapel from half past ten until dawn.' },
    { id: 'c_ilse',   who: 'Ilse Quillon',        at: [['qui', 5]], needs: { will: 'y' }, sets: 'ilsecleared', reveal: 'Ilse shows the stamped ticket and a witness note; she was on the Brack coach, twelve miles away, when her father died.' },
  ],
  // accusation proofs (all set on the proofs page; each exit is gated by the clues that make it honest)
  proofs: {
    p_method: { label: 'How: quicksilver in the regulator oil', needs: { oilcan: 'y', watch: 'y' } },
    p_hand:   { label: 'Whose hand: the chit is Marrable\'s ink, not Pike\'s hand', needs: { inkshop: 'y', chit: 'y', lefty: 'y' } },
    p_lie:    { label: 'The lie: her alibi or her slip', needsAny: [{ candle: 'y' }, { slip: 'y' }] },
    p_motive: { label: 'Why: the lens fraud and the audit', needs: { lensfund: 'y', audit: 'y' } },
  },
  suspects: ['marrable', 'pike', 'anselm', 'vane', 'ilse', 'hale'],
};