// Pick book 2 config: "The Bell That Must Come Down" (pure choice, no dice). Original setting: a cliff-monastery and the thirteen stair-towns below it.
const A = (intent, extra = {}) => ({ intent, ...extra });
export const SLUG = 'vesperhold';
export const TITLE = 'The Bell That Must Come Down';
export const PFX = 'vh';
export const SEED = 20261102;
export const OUTLINE_PARTS = 18;

export const WORLD = `BOOK: "The Bell That Must Come Down", an original pick-your-own-path adventure (second person, present tense, British spelling, no dice or stats of any kind).
SETTING: Vesperhold is a monastery-city bolted to a mountain face above the cloud line, and below it the world is stairs: thirteen stair-towns hang down the cliff, each at a different altitude, with ropeways, glacier ladders and orchard valleys between. The reader is a bell-ringer's apprentice of Vesperhold. The Great Bell, Orison, cracked in the last storm; its bronze Clapper (a tongue as long as a forearm, heavy as a child, faintly humming) must be carried down to the foundry at Lowgate, at the foot of the mountain, to be recast before the ice-wind season closes the passes in twenty days. The apprentice carries the Clapper in a padded cradle on their back, and may be accompanied by Biscuit, a stubborn mule (always he/him/his; never she/her).
FACTIONS: the Ropewrights' Guild (rope-makers and cable-riders, who swear oaths on knots); the Cable Court (toll-lords of the ropeways, who lend at cruel terms and want the foundry's contract); the Terrace Millers (windmill-keepers of the barley terraces, proud and hungry); the Fog-Wardens (orchard folk who find their way by whistle and bell-rope); Lowgate's forge-masters (practical, scarred, short of tin).
TONE: crisp, vertical, cold and clear air, rope and bronze, small kindnesses and dry humour in the people. Low magic only (bells that remember, ice that sings, oaths tied in knots). No guns, no modern slang. Never mention sections, pages, choices as game terms, flags, stats, dice, or "you chose".`;

export const FLAGS = {
  mule: { values: ['biscuit', 'alone'], desc: 'whether Biscuit the mule travels with the reader (biscuit) or the reader goes down on foot alone (alone)' },
  rope: { values: ['guild', 'own'], desc: 'whether the reader carries a Ropewrights\' Guild rope and its protection (guild) or only their own old rope (own)' },
  oath: { values: ['sworn', 'free'], desc: 'whether the reader swore the Ropewrights\' knot-oath (sworn) or stayed unbound (free)' },
  debt: { values: ['owed', 'clear'], desc: 'whether the reader owes the Cable Court a toll-debt (owed) or travels clear (clear)' },
  rumor: { values: ['true', 'false'], desc: 'whether the reader believes the rumour that the Lowgate foundry still stands and is hiring (true) or that it has flooded and gone cold (false)' },
  calls: { values: ['y', 'n'], desc: 'whether the reader learned the Terrace Millers\' wind-calls (y) or not (n)' },
  bell: { values: ['wrapped', 'bare'], desc: 'whether the Clapper is wrapped and padded (wrapped) or carried bare and chipped by the climb (bare)' },
  scar: { values: ['y'], desc: 'whether the reader carries a frostbite scar from holding the line on the glacier (y)' },
};
export const GATE_POOL = [
  { region: 2, cond: { mule: 'biscuit' }, why: 'Biscuit the mule is with the reader and knows the ledges and the ropeway stalls' },
  { region: 2, cond: { mule: 'alone' }, why: 'the reader travels without the mule, light and quick, and so notices what a pack-animal would crowd out' },
  { region: 2, cond: { rope: 'guild' }, why: 'the reader carries a Ropewrights\' Guild rope and is waved through guild places' },
  { region: 2, cond: { rope: 'own' }, why: 'the reader carries only their own old rope and so is overlooked or underestimated' },
  { region: 3, cond: { oath: 'sworn' }, why: 'the reader swore the knot-oath and is known by the ropewrights for it' },
  { region: 3, cond: { debt: 'owed' }, why: 'the reader owes the Cable Court a toll-debt and is recognised by its collectors' },
  { region: 3, cond: { debt: 'clear' }, why: 'the reader owes nobody and can bargain freely' },
  { region: 4, cond: { rumor: 'true' }, why: 'the reader believes the foundry still stands and acts on it' },
  { region: 4, cond: { rumor: 'false' }, why: 'the reader believes the foundry has gone cold and looks for another way to recast the bell' },
  { region: 4, cond: { calls: 'y' }, why: 'the reader can answer the Terrace Millers\' wind-calls' },
  { region: 5, cond: { bell: 'bare' }, why: 'the Clapper is bare and chipped, and rings or complains in the fog' },
  { region: 5, cond: { bell: 'wrapped' }, why: 'the Clapper is wrapped and silent, and the reader passes quietly' },
  { region: 5, cond: { scar: 'y' }, why: 'the reader carries the frostbite scar that marks them as one who crossed the glacier' },
];
export const REGIONS = [
  null,
  { name: 'Vesperhold and the Ninety Steps', theme: 'the cliff-monastery, its bell-towers and mule yards; outfitting, kin and rivals; the reader takes the Clapper and chooses a companion and a rope; the first stairs down' },
  { name: 'The Rope Markets', theme: 'bazaars slung on cables across the gorge, ropewrights and winch-boys, the Cable Court\'s toll-houses, a knot-oath, rumours of Lowgate' },
  { name: 'The Windmill Terraces', theme: 'stepped barley terraces in thin air, windmill-keepers whose harvest bell is silent, hard bargains, wind-calls that carry between mills' },
  { name: 'The Glacier Ladders', theme: 'ice stairs and rope-bridges across a moving glacier, whiteouts and crevasses; the Clapper, the mule and the body are all tested' },
  { name: 'The Fogbank Orchards', theme: 'an orchard valley drowned in cloud, Fog-Wardens who navigate by whistle and bell-rope, rival carriers, a muffled and uncanny quiet' },
  { name: 'Lowgate and the Foundry', theme: 'the river-port at the foot of the mountain, the flooded foundry quarter, forge-masters short of tin, the furnace, every old promise coming due and the final decision about the bell' },
];
export const CHOKES = {
  1: [
    { title: 'the Mule Yard', exits: [A('Take Biscuit the mule to carry the pack', { setFlags: { mule: 'biscuit' } }), A('Go down on foot, alone and light', { setFlags: { mule: 'alone' } })], brief: 'the reader decides whether to take Biscuit, a stubborn mule who knows the stairs, or to go alone and light' },
    { title: 'the Rope Store', exits: [A('Sign for a Ropewrights\' Guild rope', { setFlags: { rope: 'guild' } }), A('Trust your own old rope', { setFlags: { rope: 'own' } })], brief: 'the reader decides whether to sign for a Guild rope (strong, with the Guild\'s protection and obligations) or carry their own worn rope' },
  ],
  2: [
    { title: 'the Knot-Oath Stall', exits: [A('Tie the knot-oath for the Ropewrights\' help', { setFlags: { oath: 'sworn' } }), A('Refuse the oath and pay full price', { setFlags: { oath: 'free' } })], brief: 'the Ropewrights offer shelter and passage in exchange for a knot-oath (to answer one request later); the reader accepts or refuses' },
    { title: 'the Cable Court Toll-House', exits: [A('Take the Cable Court\'s loan of passage', { setFlags: { debt: 'owed' } }), A('Pay the toll from your own purse', { setFlags: { debt: 'clear' } })], brief: 'a Cable Court toll-house: take their loan (a debt, with a collector who will come for it) or pay from the reader\'s purse' },
  ],
  3: [
    { title: 'the Rumour Mill', exits: [A('Believe the foundry still stands and is hiring', { setFlags: { rumor: 'true' } }), A('Believe the foundry flooded and went cold', { setFlags: { rumor: 'false' } })], brief: 'two rival rumours about the Lowgate foundry; the reader decides which to believe, and it will colour how they act' },
    { title: 'the Miller\'s Lesson', exits: [A('Stay a night and learn the wind-calls', { setFlags: { calls: 'y' } }), A('Press on without the lesson', { setFlags: { calls: 'n' } })], brief: 'a Terrace Miller offers to teach their wind-calls in a night, at the cost of a day' },
  ],
  4: [
    { title: 'the Ice Cradle', exits: [A('Wrap the Clapper tight against the cold', { setFlags: { bell: 'wrapped' } }), A('Leave it bare and keep your hands free', { setFlags: { bell: 'bare' } })], brief: 'the glacier begins; the reader decides how to protect the Clapper (wrapped and slow, or bare and quick but exposed)' },
    { title: 'the Whiteout', exits: [A('Hold the line through the whiteout with your own hands', { setFlags: { scar: 'y' } }), A('Cut Biscuit\'s lead and save yourself', { setFlags: { mule: 'alone' } })], brief: 'a whiteout on a rope-bridge; the reader holds the line (and is frostbitten) or cuts loose what is slowing them' },
  ],
  5: [
    { title: 'the Orchard Gate', exits: [A('Biscuit knows the way through the fog', { when: { mule: 'biscuit' } }), A('Find your own way through the fog', { when: { not: { mule: 'biscuit' } } })], brief: 'the fog-drowned orchard; those with Biscuit have a guide who smells the safe paths, those without must improvise' },
    { title: 'the Warden\'s Post', exits: [A('Answer the Wardens in wind-call', { when: { calls: 'y' } }), A('Slip past the Wardens unseen', { when: { not: { calls: 'y' } } })], brief: 'Fog-Wardens at a whistle-post; those who learned wind-calls can talk their way past, the rest must sneak or bluff' },
  ],
  6: [
    { title: 'the Foundry Quarter', exits: [A('Walk the hiring foundry you believed in', { when: { rumor: 'true' } }), A('Search the cold flooded foundry for what survives', { when: { not: { rumor: 'true' } } })], brief: 'the foundry quarter; what the reader finds depends on whether they came believing it was hiring or cold' },
    { title: 'the Furnace Door', exits: [A('Tie the Ropewrights\' knot to open the door', { when: { oath: 'sworn' } }), A('Force the door by hand', { when: { not: { oath: 'sworn' } } })], brief: 'the furnace door: sworn Ropewrights know a knot the old door remembers; others must force it' },
  ],
};
export const ENDINGS = [
  { key: 'A1', stance: 'A', title: 'The Bell Rings Whole', when: { bell: 'wrapped', oath: 'sworn' }, brief: 'You give the Clapper to the forge-masters to recast the Great Bell for the lowlands: it arrives unmarked, the knot-oath brings the Ropewrights to hang it, and Orison rings true across the mountain.' },
  { key: 'A2', stance: 'A', title: 'A True Bell, No Choir', when: { bell: 'wrapped', not: { oath: 'sworn' } }, brief: 'You give the Clapper to the forge-masters and the bell is recast well, but nobody owes you a favour, and the Ropewrights and the Cable Court both squabble over who may hang it.' },
  { key: 'A3', stance: 'A', title: 'The Cracked Note', when: { not: { bell: 'wrapped' } }, brief: 'You give the Clapper to the forge-masters, but the bare bronze is chipped from the climb; the recast bell rings with a flaw in its note that the whole mountain learns to love.' },
  { key: 'B1', stance: 'B', title: 'Biscuit Carries It Home', when: { mule: 'biscuit' }, brief: 'You carry the Clapper back up the mountain to keep it from the furnace; Biscuit shoulders the cradle the whole climb, and Vesperhold gets its bronze back, unrung.' },
  { key: 'B2', stance: 'B', title: 'The Long Way Up', when: { not: { mule: 'biscuit' } }, brief: 'You carry the Clapper back up the mountain alone, step by step; you reach the cloister changed, with the bronze safe and nobody left who remembers why it mattered.' },
  { key: 'C1', stance: 'C', title: 'Ploughshares, No Strings', when: { debt: 'clear' }, brief: 'You melt the Clapper into plough-blades for the Terrace Millers, owing nobody; the terraces are turned and the barley will grow.' },
  { key: 'C2', stance: 'C', title: 'The Song in the Metal', when: { not: { debt: 'clear' }, calls: 'y' }, brief: 'You melt the Clapper into plough-blades with the Cable Court\'s debt on your back; the Millers sing the wind-calls into the casting and the blades hum in the furrow.' },
  { key: 'C3', stance: 'C', title: 'Bronze and Silence', when: { not: { any: [{ debt: 'clear' }, { calls: 'y' }] } }, brief: 'You melt the Clapper into plough-blades with the Cable Court\'s debt behind you and no wind-calls to speak with the Millers; a quiet, uncertain gift.' },
];
export const OPENERS = ['Follow the main stair', 'Cut across the lower ledges', 'Ask the way of a stranger', 'Take the old carriers\' path'];
export const PROLOGUE = {
  p1: { brief: 'Opening: the reader is a bell-ringer\'s apprentice of Vesperhold, the monastery-city above the cloud line; the Great Bell Orison has cracked, and the Prioress hands over its bronze Clapper to be carried down thirteen stair-towns to the foundry at Lowgate before the ice-wind season closes the passes in twenty days.', exits: ['Take the Clapper at once', 'Ask the Prioress what she is not saying'] },
  p2a: { brief: 'The reader takes the Clapper straight from the Prioress\'s hands; describe it (a bronze tongue as long as a forearm, heavy as a child, faintly humming) and the padded cradle, and what it is for (recasting the Great Bell at Lowgate).', exit: 'Go to pack for the descent' },
  p2b: { brief: 'The reader questions the Prioress; she admits that nobody has come back up from Lowgate in a year, that the Cable Court has been buying the ropeways, and that no bell below has rung true since the master founder left. Include the description of the Clapper (a bronze tongue as long as a forearm, faintly humming) and its purpose.', exit: 'Go to pack for the descent' },
  p3: { brief: 'Packing at dawn at the cloister gate; the novices and old ringers see the reader off; the cradle on their back, a water skin, and the ninety steps down ahead.', exit: 'Step onto the first stair' },
};
export const FINALE = {
  brief: 'The final reckoning at the Lowgate Foundry: the Clapper is within reach of the furnace, the door is open, and the reader must choose what becomes of the bronze. Each exit is one stance.',
  stances: { A: ['Recast the Great Bell for the lowlands', 'vh-f-A'], B: ['Carry the Clapper back up the mountain', 'vh-f-B'], C: ['Melt it into ploughshares for the terraces', 'vh-f-C'] },
};
export const AFTERMATH = 'what changes for the people of the mountain and the lowlands, weeks later';
