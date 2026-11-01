// Dice book 3 config (2d6, content/pyoa/DICE-RULES.md): "The Hundredth Door of the Underlibrary". Original setting: a vast underground library whose catalogue rewrites itself.
export const SLUG = 'underlibrary';
export const TITLE = 'The Hundredth Door of the Underlibrary';
export const PFX = 'ul';
export const SEED = 20261201;
export const STATS = ['STUDY', 'WILL', 'GUILE', 'GRACE'];
export const FALLBACK = 'misfiled';
export const WORLD = `BOOK: "The Hundredth Door of the Underlibrary", an original gamebook of shelves, ink and forgotten things (second person, present tense, British spelling). Beneath the city of Quillon lies the Underlibrary, an endless cave-and-stack library whose catalogue has begun to rewrite itself: shelves drift, corridors swap places, and books quietly change what they say. The reader is a shelver, a junior page of the Underlibrary. The Archivist, Thessaly Marr, who keeps the Index of All Things, has vanished. Her note says the Hundredth Door, the vault where the original Index is kept, has opened of its own accord; whoever reads the Index decides what the world will remember and what it will forget. There is a countdown: the Long Closing, when the deep stacks seal themselves for a generation. Everyone wants the Index.
TONE: dust, ink, lamp-oil and old paper, hushed, strange and curious, with dry wit in the people. Low magic only (marginal notes that whisper, books that bite, doors that remember). No guns, no modern slang. Never mention dice, rolls, stats, targets, marks, sections, pages as game terms or "you chose".
PLACES: the Returns Desk (the shelvers' hall under the city, stamps, trolleys, the night-porter). The Reading Rooms (galleried halls of readers, rival scholars, the lending clerk, the ink-sellers). The Unshelved Stacks (moving shelves, ink-rivers, the Misfiled Wing where lost things pile up, a bridge made of spines). The Cataloguers' Court (a tribunal of rule-keepers in a hall of card-drawers). The Deep Annexe (the oldest stacks, the Marginalia, the Last Reader's chair).
FACTIONS: the Cataloguers (order, rules, fines); the Shelvers' Fellowship (your own people, rough loyalty); the Burners (zealots who say the Index is a lie and must be burned); the Marginalia (the whispering ghosts of readers who left notes in margins); the Last Reader (a very old, blind scholar who has read everything and remembers it all).
STATS the engine rolls: ${'STUDY, WILL, GUILE, GRACE'}. Never name them in prose.`;
export const REGION_NOTE = [
  'Region 0, THE RETURNS DESK (prologue): the night shift, the missing Archivist\'s note, learning the first test with a gentle, low-stakes risk.',
  'Region 1, THE READING ROOMS (Act I hub): rival scholars, the Shelvers\' Fellowship, the lending clerk, the ink-sellers, clues to Thessaly; the reader gathers a first ally.',
  'Region 2, THE UNSHELVED STACKS (the drifting shelves): the Misfiled Wing, ink-rivers, the bridge of spines; resource pressure from lamp-oil and wits.',
  'Region 3, THE CATALOGUERS\' COURT (tribunal intrigue): the Cataloguers, a trial or a bargain, a route to the Deep Annexe.',
  'Region 4, THE DEEP ANNEXE (the oldest stacks): the Marginalia, the Last Reader, a moral trial, the question of what happened to Thessaly.',
  'Region 5, THE HUNDREDTH DOOR (finale): the vault itself, the Index, the final choices, the Closing near; when the countdown runs out the finale is forced.',
];
export const REGIONS = [
  { n: 0, name: 'The Returns Desk', budget: 40, stat: ['STUDY', 'GUILE'] },
  { n: 1, name: 'The Reading Rooms', budget: 160, stat: ['STUDY', 'WILL', 'GUILE', 'GRACE'] },
  { n: 2, name: 'The Unshelved Stacks', budget: 220, stat: ['WILL', 'GRACE', 'STUDY', 'GUILE'] },
  { n: 3, name: "The Cataloguers' Court", budget: 220, stat: ['GUILE', 'STUDY', 'GRACE', 'WILL'] },
  { n: 4, name: 'The Deep Annexe', budget: 200, stat: ['WILL', 'STUDY', 'GRACE', 'GUILE'] },
  { n: 5, name: 'The Hundredth Door', budget: 120, stat: ['WILL', 'GRACE', 'STUDY', 'GUILE'] },
];
export const ENDINGS = [
  { key: 'remember-all', title: 'Remember Everything', len: 4, region: 4, hook: 'the reader earns the Last Reader\'s trust and a promise to read the Index aloud, complete and unedited' },
  { key: 'great-forgetting', title: 'The Great Forgetting', len: 3, region: 4, hook: 'the reader learns of a mercy in forgetting, and how the Index could be made to wipe the worst of the past' },
  { key: 'cataloguers-century', title: "The Cataloguers' Century", len: 3, region: 3, hook: 'the reader is offered a position of rank and power by the Cataloguers' },
  { key: 'the-burning', title: 'The Burning', len: 3, region: 2, hook: 'the reader meets the Burners and learns what they would do with a match and the Index' },
  { key: 'marginalia-speak', title: 'The Marginalia Speak', len: 3, region: 4, hook: 'the reader hears a margin-ghost\'s plea to let the dead readers finally speak aloud' },
  { key: 'last-readers-chair', title: "The Last Reader's Chair", len: 3, region: 4, hook: 'the reader is invited to take the old scholar\'s seat and read forever' },
  { key: 'edit-one-line', title: 'Edit One Line', len: 3, region: 3, hook: 'the reader finds out that the Index can be changed by exactly one line, and by whom' },
  { key: 'thessalys-way', title: "Thessaly's Way", len: 4, region: 4, hook: 'the reader finds a marginal note in the missing Archivist\'s own hand' },
  { key: 'free-shelves', title: 'The Free Shelves', len: 3, region: 1, hook: 'the reader wins the Shelvers\' Fellowship over to the idea of a library with no locked doors' },
  { key: 'blank-page', title: 'The Blank Page', len: 3, region: 2, hook: 'the reader stumbles on a single blank page in the Misfiled Wing and the idea that the Index could be left unread' },
  { key: 'sell-the-index', title: 'Sell the Index', len: 3, region: 3, hook: 'the reader is approached by a buyer who values the Index as property' },
  { key: 'misfiled', title: 'Misfiled', len: 2, region: 0, hook: '' },
];
