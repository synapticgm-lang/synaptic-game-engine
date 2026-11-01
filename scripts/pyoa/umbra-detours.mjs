// Gated detour pages for Umbra: a new exit at an anchor page, shown only when a flag holds, leading to one new page that rejoins the mainline.
export const DETOURS = [];
const add = (track, key, anchor, when, rejoin, idea, label) => DETOURS.push({ track, key, id: `up-${track}-det-${key}`, anchor: `up-${track}-${anchor}`, when, rejoin: `up-${track}-${rejoin}`, idea, labelHint: label });

const COVER_IDEA = {
  tailor: ["the disgraced tailor's debt coat", 'a clerk of the cordon eyes the coat, recognises the tailor\'s stitching, and waves you through as a debtor being escorted out of trouble'],
  livery: ["the porter's rough livery", 'porters carry crates through the cordon; you fall into step behind a hand-cart and nobody looks at a face above a crate'],
  usher: ["the opera usher's uniform", 'the cordon is guarding a theatre-side door; a sergeant mistakes you for the house staff he was told to expect and lets you in with a lantern'],
  cloak: ["the Archbishop's own cloak", 'the cloak\'s embroidered hem makes sentries stand aside and avert their eyes, until someone realises the Archbishop is dead and you have little time'],
  bare: ['no disguise at all', 'you have no cover to lose: you go over the wall where the cordon has no reason to look, but you are seen by the one person you hoped would not, and the exposure costs you something'],
};

for (const t of ['w', 'l', 'r']) {
  const A = {
    w: { start: 'exchange-roofs', mid: 'faction-summons', mid2: 'eclipse-approach', mid2to: 'eclipse-roofs', last: 'eclipse-roofs', lastTo: 'final-choice', cab: 'eclipse-approach' },
    l: { start: 'exchange-ridge', mid: 'faction-letters', mid2: 'eclipse-rise', mid2to: 'eclipse-ridgeline', last: 'eclipse-ridgeline', lastTo: 'solo-final', cab: 'eclipse-rise' },
    r: { start: 'exchange-parapet', mid: 'faction-bid', mid2: 'eclipse-begins', mid2to: 'her-perch', last: 'eclipse-begins', lastTo: 'her-perch', cab: 'eclipse-begins' },
  }[t];
  const midTo = { w: 'eclipse-approach', l: 'eclipse-rise', r: 'eclipse-begins' }[t];
  const startTo = { w: 'faction-summons', l: 'faction-letters', r: 'faction-bid' }[t];
  const wit = { w: 'almoner', l: 'deacon', r: 'turnkey' }[t];
  add(t, 'recognised', A.start, { faceKnown: 'yes' }, startTo, `The ${wit} who got away has described the player's face. A stranger on the high ground now says, quietly, that they know that face from the description, and instead of calling the Guard they trade a real, useful warning or a short-cut for something small. It must feel like a risk that pays in information.`, 'Answer the stranger who knows your face');
  add(t, 'one-hand', A.mid, { cabal: 'known' }, midTo, `The player has read the vault's counter-ledgers: both houses are one hand. At the house's door the player lays out the one-handwriting proof and names it aloud, so both rooms hear. Show a cold, quiet shift in the room: they now bargain differently, and the player slips out before either side decides what to do with the truth.`, 'Name both houses as one hand');
  add(t, 'service-tunnel', A.cab, { vault: 'breached' }, A.mid2to, `The player forced the vault lock earlier, so the vault's old service tunnel is open and the player can use it as a hidden way across the district, pulling pipes and chalk marks from the gas-men. A damp, cramped, quick passage with one small danger, coming out ahead of the Guard.`, 'Slip through the opened vault tunnel');
  add(t, 'silk-carriage', A.cab, { valerius: 'allied' }, A.mid2to, `Lord Valerius (silk, polite menace) took the player under his protection. A closed carriage with silk-lined blinds and his crest hidden under a cloth waits for the player and carries them through the district. Cost: the driver says the debt is noted.`, "Call in Valerius's carriage");
  add(t, 'foundry-warrant', A.cab, { rigg: 'allied' }, A.mid2to, `Matron Rigg (iron foundry, warrants, the gaol books) took the player under her protection. A foundry foreman with a stamped warrant takes the player through a cordon as a "prisoner in transit". Heavy, practical, a little humiliating, entirely effective. The debt is noted in iron.`, "Show Rigg's foundry warrant");
  const covers = { w: ['tailor', 'livery', 'usher'], l: ['cloak', 'tailor', 'livery'], r: ['bare', 'tailor', 'livery'] }[t];
  for (const c of covers) add(t, 'pass-' + c, A.last, { cover: c }, A.lastTo, `Cover-based checkpoint pass. The player is wearing ${COVER_IDEA[c][0]}. At the last checkpoint before the final choice: ${COVER_IDEA[c][1]}.`, `Pass the checkpoint in ${COVER_IDEA[c][0].replace(/^the |^a |^an /, '')}`);
}
