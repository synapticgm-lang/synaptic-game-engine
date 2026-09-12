import type { OpeningBeatCard } from './types';

/**
 * Phase 4 extra Summoned Pact openers — unique place / why / cast / page1.
 * Seed-picked with the existing bible deck. Not 200 clones.
 */
export const SUMMONED_PACT_PHASE4_HOOKS: OpeningBeatCard[] = [
  {
    location: 'the common room of the Weighing Cup',
    faction: 'Innkeep Mara Vell and two Scale clerks drinking off-duty',
    summonIntent: 'The rite misfired into an inn, not a cathedral. They need a name before the close hears you arrived in a taproom.',
    openingOffer:
      'Stay as a guest and they will issue a room-key and a traveler’s cloak. Walk out and you keep Earth kit — Mara will still write you in the book.',
    page1:
      'Ale-steam and wet wool. You are on your back on the Weighing Cup’s flagstones, a chalk ring half-scuffed by boot traffic. A blue panel hangs over a scarred table. Innkeep Mara Vell stares as if a barrel just grew a person. Two Scale clerks freeze with cups halfway up. Nobody has put a weapon in your hands. A cloak is folded on the bar — offered if you take a room, not yours yet.',
    beats: [
      'Inn common room, not a vault. Chalk on taproom stone.',
      'A blue panel hangs. Mara wants a name for the book.',
      'A cloak on the bar is an offer, not loot.',
    ],
    fallback:
      'Ale-steam. You wake on the Weighing Cup’s flagstones in a scuffed chalk ring. A blue panel hangs. Mara Vell and two clerks stare. A cloak on the bar is an offer, not yours yet.',
  },
  {
    location: 'the Contract Hall notice board',
    faction: 'Clerk Brin Holt posting Crown jobs, already late',
    summonIntent: 'Someone stamped a summon onto a job-board rite. They wanted a contractor. They got an Earth soul.',
    openingOffer:
      'Take the posted job and they will issue a contractor’s chit and a short blade. Refuse the board and you keep Earth kit while Brin panics at the stamp.',
    page1:
      'Paper, wax, and cold hall air. You sit up against the Contract Hall notice board; a chalk circle is drawn around the newest posting. A blue panel hangs over the pins. Clerk Brin Holt drops a sheaf of jobs. The Crown stamp on the paper does not match your Earth clothes. A kit chit sits in a tray — offered if you take the job, not in your pocket.',
    beats: [
      'Notice board, pins, a circle around one posting.',
      'A blue panel hangs. Brin is already late.',
      'A contractor chit is an offer, not starting kit.',
    ],
    fallback:
      'You wake against the Contract Hall notice board inside a chalk circle. A blue panel hangs. Clerk Brin Holt drops the jobs. A kit chit waits if you take the posting.',
  },
  {
    location: 'the cathedral kitchens in the Close',
    faction: 'Brother Tam and the night cooks who were not supposed to see this',
    summonIntent: 'The seventh ring dumped you into bread-steam, not the vault. Tam will hide you or sell you upstairs.',
    openingOffer:
      'Help them finish the night bake and they will wrap bread and a kitchen knife for the road. Shout for the Chanter and you keep Earth kit — Tam may still get blamed.',
    page1:
      'Bread-steam and copper pans. You are on your back on kitchen flagstones under Valespire Close, a flour circle smeared by a dropped tray. A blue panel hangs over the kneading board. Brother Tam goes white. A cook swears once and covers the door-slit. Nobody offered a hero’s blade. A wrapped loaf and a kitchen knife sit on the sideboard — if you help, not if you shout.',
    beats: [
      'Kitchens, flour, a rite that missed the vault.',
      'A blue panel hangs. Tam is too junior for this.',
      'Bread and a knife are an offer for help, not a gift in your hands.',
    ],
    fallback:
      'Bread-steam. You wake on kitchen flagstones in a flour circle. A blue panel hangs. Brother Tam covers the door. A loaf and a knife wait if you help, not if you shout.',
  },
  {
    location: 'the ledger stair on the Palace Approach',
    faction: 'Court clerk Ila Pellane and two pike-guards',
    summonIntent: 'They meant to summon a witness onto the palace stair, not a Pactborn. The ledger already has a blank line.',
    openingOffer:
      'Sign the blank and they will issue a visitor’s tabard and a pass-token. Refuse and you keep Earth kit while the pikes decide if you are an incident.',
    page1:
      'Cold marble and ink. You are sitting on the Palace Approach ledger stair, a brass ring chalked on one step. A blue panel hangs over an open book. Clerk Ila Pellane’s quill is still wet. Two pike-guards have not decided whether to salute or seize. A tabard is folded on the rail — offered if you sign, not on your shoulders.',
    beats: [
      'Palace stair, open ledger, one blank line.',
      'A blue panel hangs. Guards wait on the clerk.',
      'A tabard is an offer for a signature, not loot.',
    ],
    fallback:
      'Marble and ink. You wake on the Palace Approach ledger stair inside a brass ring. A blue panel hangs. Ila Pellane’s quill is wet. A tabard waits if you sign.',
  },
  {
    location: 'Kitchen Saint Alley behind the Close',
    faction: 'Sister Pell and a marked child who will not speak first',
    summonIntent: 'Charity-circle, not Crown brass. They pulled you because the child’s mark woke and they had no priest left.',
    openingOffer:
      'Stay and they will share a blanket and a heel of bread. Leave and you keep Earth kit — the child still watches the panel.',
    page1:
      'Steam from a bakery vent. You are on packed dirt in Kitchen Saint Alley, a charcoal circle between crates. A blue panel hangs in the steam. Sister Pell has flour on her sleeves. A marked child sits against the wall and will not speak first. Nobody has a sword. A blanket is offered if you stay the hour, not if you run.',
    beats: [
      'Alley, charity, a child’s mark, no vault.',
      'A blue panel hangs. Pell is not a Chanter.',
      'A blanket is an offer to stay, not issued kit.',
    ],
    fallback:
      'Bakery steam. You wake in Kitchen Saint Alley inside a charcoal circle. A blue panel hangs. Sister Pell and a marked child stare. A blanket is offered if you stay.',
  },
  {
    location: 'the reed water of Mireglass March',
    faction: 'Ilyra Fen and Tekk Reed counting who comes back twice',
    summonIntent: 'A marsh circle meant to call a reflection, not an Earth soul. The March already has one of you in the water.',
    openingOffer:
      'Take a dry-path token and they will kit you with reed-wraps and a pole. Refuse the token and you keep Earth kit while the water still shows someone else.',
    page1:
      'Reed-stink and cold water at the shins. You are on a woven platform in Mireglass March, a circle of river-chalk that is already bleeding. A blue panel hangs over black water. Ilyra Fen reads a reflection that is not hers. Tekk Reed counts under his breath. A pole and reed-wraps lie on the mat — offered for a token, not in your hands.',
    beats: [
      'Marsh platform, chalk bleeding into water.',
      'A blue panel hangs. Someone else is already in the reflection.',
      'Reed-wraps are an offer, not starting loot.',
    ],
    fallback:
      'Reed water. You wake on a woven platform in Mireglass March. A blue panel hangs. Ilyra Fen and Tekk Reed stare at a reflection that is not yours. A pole waits for a token.',
  },
  {
    location: 'the ash-heat of Cinderwake Trail',
    faction: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
    summonIntent: 'They finished a tracking-rite on the ash road. You arrived in the prints they were following.',
    openingOffer:
      'Walk with Oren and he will share water and a pilgrim scarf. Stay for Kessa and she will offer a brand-iron if you take her hunt — or you keep Earth kit and both of them.',
    page1:
      'Ash-heat and a road that remembers feet. You are on your back in a scorched circle on Cinderwake Trail. A blue panel hangs in the shimmer. Brother Oren has a waterskin half-raised. Kessa Cinder already has your prints in a book. Nobody put a blade in your hand. A scarf and a brand-iron sit on opposite packs — two offers, not equipped.',
    beats: [
      'Ash road, pursuit, two factions in one circle.',
      'A blue panel hangs. Kessa already wrote you down.',
      'Scarf or brand-iron — offered, not yours yet.',
    ],
    fallback:
      'Ash-heat. You wake in a scorched circle on Cinderwake Trail. A blue panel hangs. Brother Oren and Kessa Cinder are already mid-pursuit. Two packs hold two offers.',
  },
  {
    location: 'the hearing pit of the Sump Court',
    faction: 'Magistrate Sula Vane and broker Nox Kade',
    summonIntent: 'They summoned a clause, not a hero. The Sump wants a living signature on an illegal binding.',
    openingOffer:
      'Sign Sula’s cheap contract and they will issue a court token and a ferryman’s chit. Buy Nox’s leverage instead — or keep Earth kit and pay night prices later.',
    page1:
      'Damp stone and lamp-oil under the street. You sit up in the Sump Court’s hearing pit, a salt circle on packed clay. A blue panel hangs over the magistrate’s bench. Sula Vane already has a quill. Nox Kade smiles like a price. A court token and a ferry chit sit on the rail — offered for a signature, not in your pocket.',
    beats: [
      'Below-street court, salt circle, two prices.',
      'A blue panel hangs. The binding is cheaper than mercy.',
      'Token and chit are offers, not loot.',
    ],
    fallback:
      'Lamp-oil under the street. You wake in the Sump Court hearing pit. A blue panel hangs. Sula Vane has a quill; Nox Kade has a price. A token waits on the rail.',
  },
  {
    location: 'a dead hall of the Hollow Engine',
    faction: 'Two Crown engineers who lost a containment chant',
    summonIntent: 'They tried to wake a machine with a Scale rite. The Engine stayed dead. You arrived instead.',
    openingOffer:
      'Help them reseal the hall and they will issue a spark-lamp and work gloves. Walk out and you keep Earth kit — the alert bells may still find you.',
    page1:
      'Cold iron and a smell like burned rain. You are on a grate in a dead hall of the Hollow Engine, a chalk circle over gears that do not turn. A blue panel hangs in the dark. Two engineers freeze with a cracked tile between them. Nobody has handed you a tool. A spark-lamp sits on a crate — offered if you help reseal, not if you run.',
    beats: [
      'Dead machine-hall, gears still, chalk on iron.',
      'A blue panel hangs. The containment chant failed.',
      'A spark-lamp is an offer for help, not starting kit.',
    ],
    fallback:
      'Burned rain and still gears. You wake on a grate in the Hollow Engine. A blue panel hangs. Two engineers hold a cracked tile. A spark-lamp waits if you help reseal.',
  },
  {
    location: 'the wagon desk of the Argent Ledger',
    faction: 'Yara Quill ranking bodies and Kade Voss trying to void the paper',
    summonIntent: 'A mobile license rite. They wanted a ranked contractor. The Mark on you is an audit problem.',
    openingOffer:
      'Accept Yara’s rank stamp and she will issue a license plate and a short blade. Let Kade void the paper and you keep Earth kit — and his claim.',
    page1:
      'Wagon-wood and wet ink. You are on the floor of the Argent Ledger’s mobile desk, a silver circle chalked around a stamp-pad. A blue panel hangs over the rank book. Yara Quill already has a stamp raised. Kade Voss is arguing the paper is void. A license plate sits in a tray — offered if you take the rank, not pinned to you.',
    beats: [
      'License wagon, stamp-pad, two clerks at war.',
      'A blue panel hangs. The Mark is an audit.',
      'A plate and a blade are offers, not equipped.',
    ],
    fallback:
      'Wet ink in a wagon. You wake inside a silver circle on the Argent Ledger desk. A blue panel hangs. Yara has a stamp; Kade wants the paper void. A license plate waits in a tray.',
  },
  {
    location: "the nave of Saint Vhal's Reliquary",
    faction: 'Reliquary wardens who treat you as a doctrine test',
    summonIntent: 'They summoned a proof, not a champion. If the Mark is wrong, the relic stays locked.',
    openingOffer:
      'Kneel the doctrine and they will issue a pilgrim tabard and a sealed vial. Walk the nave without kneeling and you keep Earth kit — the wardens still have the door.',
    page1:
      'Incense and cold iron screens. You are on your back on the Reliquary nave stones, a circle of white sand around a locked reliquary. A blue panel hangs under a saint’s mask. Wardens in grey do not draw steel. One of them asks if you will kneel. A tabard and a sealed vial sit on a side altar — offered for doctrine, not theft.',
    beats: [
      'Fortress-shrine, locked relic, white sand circle.',
      'A blue panel hangs. They want a kneel, not a speech.',
      'Tabard and vial are offers, not loot.',
    ],
    fallback:
      'Incense. You wake on Reliquary nave stones in white sand. A blue panel hangs. Wardens wait on a kneel. A tabard sits on a side altar — offered, not taken.',
  },
  {
    location: 'the outdoor seam of the Integration Scar',
    faction: 'A Pact loadout crew and a debt-collector who arrived late',
    summonIntent: 'The Scar is where pacts and debts meet. They pulled you onto the seam before either side finished talking.',
    openingOffer:
      'Take the loadout crate and they will issue field kit. Pay the collector’s first tithe and you keep Earth clothes with a stamped debt — or refuse both.',
    page1:
      'Open sky and a crack in the dirt that hums. You are on the Integration Scar, a circle scored across the seam. A blue panel hangs in daylight. A loadout crew has a crate half-open. A debt-collector holds a slate. Nobody has dressed you. The crate and the slate are two offers — not on you yet.',
    beats: [
      'Outdoor seam, two crews, one circle.',
      'A blue panel hangs. Pact and debt arrived together.',
      'Crate or slate — offered, not equipped.',
    ],
    fallback:
      'Daylight on a humming crack. You wake on the Integration Scar. A blue panel hangs. A loadout crate and a debt slate wait. Neither is on you yet.',
  },
  {
    location: 'a Lowmarket junk stall under tarps',
    faction: 'Fence Nemi Salt and a Crown watcher pretending to browse',
    summonIntent: 'They used a stolen Scale chalk to pull luck for a sale. They pulled you. The watcher already saw.',
    openingOffer:
      'Play customer and Nemi will press a junk-knife and a rain-cloak into the deal. Speak to the watcher and you keep Earth kit — Nemi may dump the stall.',
    page1:
      'Tar-smell and stacked Earth junk. You sit up behind a Lowmarket stall, chalk on packed mud under the tarp. A blue panel hangs over a crate of buttons. Nemi Salt swears. A Crown watcher is still pretending to browse tin cups. A junk-knife is offered hilt-first if you nod — not in your hand until you do.',
    beats: [
      'Junk stall, stolen chalk, a watcher browsing.',
      'A blue panel hangs. Nemi wanted luck, not a soul.',
      'A knife is an offer to play along, not loot.',
    ],
    fallback:
      'Tar and junk. You wake under a Lowmarket tarp in a chalk circle. A blue panel hangs. Nemi Salt swears; a watcher browses cups. A junk-knife waits on a nod.',
  },
  {
    location: 'Valespire Harbor Quay at night tide',
    faction: 'Quay-master Pell Wren and two grain-hands who want you off the boards',
    summonIntent: 'A dock-luck rite at tide-turn. They wanted a fair wind. They got an Earth soul on the wet boards.',
    openingOffer:
      'Sign as extra crew and they will issue oilskins and a barge-hook. Stay on the quay and shout and you keep Earth kit — Pell may call the watch.',
    page1:
      'Night tide and wet rope. You are on your back on Harbor Quay boards, a salt circle already washing. A blue panel hangs over stacked grain. Quay-master Pell Wren has a lantern in your face. Two grain-hands want you off the boards before a clerk sees. Oilskins hang on a peg — offered if you sign crew, not if you shout.',
    beats: [
      'Night quay, washing salt circle, lantern in your face.',
      'A blue panel hangs. They wanted wind, not a summon.',
      'Oilskins are an offer for a crew mark, not starting kit.',
    ],
    fallback:
      'Wet boards at night tide. You wake on Harbor Quay in a washing salt circle. A blue panel hangs. Pell Wren’s lantern is in your face. Oilskins wait on a peg if you sign.',
  },
  {
    location: 'a Scale counting-house on Ledger Row',
    faction: 'Auditor Venn Scale and two junior counters',
    summonIntent: 'They tried to summon a missing account into the book. The account was you.',
    openingOffer:
      'Sit the audit and they will issue a clerk’s sash and a numbered chit. Walk out mid-count and you keep Earth kit while Venn writes “unaccounted.”',
    page1:
      'Bead-frames and dry ink. You are on a counting-house stool inside a coin-circle on Ledger Row. A blue panel hangs over an open ledger. Auditor Venn Scale has already ruled a line. Two juniors freeze with abacus beads. A clerk’s sash is folded on the desk — offered if you sit the audit, not if you leave.',
    beats: [
      'Counting-house, coin-circle, a missing account.',
      'A blue panel hangs. You are the line they could not find.',
      'A sash is an offer to sit, not loot.',
    ],
    fallback:
      'Dry ink. You wake on a counting-house stool inside a coin-circle. A blue panel hangs. Auditor Venn Scale has ruled a line. A sash waits if you sit the audit.',
  },
  {
    location: 'a Crown courier loft above the Close',
    faction: 'Courier Ado Ferry and a sealed bag that was not meant to open',
    summonIntent: 'A delivery-rite to move a sealed name. The bag opened on an Earth soul instead of a letter.',
    openingOffer:
      'Carry the remaining seals and they will issue a courier sash and a night-pass. Drop the bag and you keep Earth kit — Ado still has a route to run.',
    page1:
      'Dust and pigeon-smell. You are on the floor of a courier loft above the Close, wax circles on the boards around a burst satchel. A blue panel hangs over unopened seals. Ado Ferry looks from you to the empty bag. Nobody offered a sword. A sash and a night-pass sit on a hook — offered if you take the remaining route.',
    beats: [
      'Loft, burst satchel, seals still closed.',
      'A blue panel hangs. The letter was supposed to be you.',
      'Sash and pass are offers for the route, not kit in hand.',
    ],
    fallback:
      'Pigeon-dust. You wake in a courier loft inside wax circles. A blue panel hangs. Ado Ferry stares at a burst satchel. A sash waits if you take the remaining seals.',
  },
  {
    location: 'an Ash Court salt-pan camp at dusk',
    faction: 'Salt-burners who will swear you walked out of the pans, not a rite',
    summonIntent: 'They needed a body to claim a failed Crown summon. The pans are their proof, not Pellane’s brass.',
    openingOffer:
      'Wear their salt-cloak and they will issue a mask and a story. Refuse the cloak and you keep Earth kit — they may still walk you toward the Cinderflow.',
    page1:
      'Dusk heat off white pans. You sit up in a salt-crust circle at an Ash Court camp, not a cathedral. A blue panel hangs over evaporating water. Salt-burners in cracked leather do not bow. One of them holds a mask. A salt-cloak is offered if you take their story — not if you name Pellane first.',
    beats: [
      'Salt pans, dusk, no Crown brass.',
      'A blue panel hangs. They want a story they can walk.',
      'Cloak and mask are offers, not equipped.',
    ],
    fallback:
      'Dusk on white pans. You wake in a salt-crust circle at an Ash Court camp. A blue panel hangs. A mask waits. A salt-cloak is offered for their story, not Pellane’s.',
  },
  {
    location: 'the rain-cistern under Valespire Close',
    faction: 'Two drowned-rite novices and a handler shouting from the grate',
    summonIntent: 'A water-circle in the cistern. They wanted a clean pull. The water is already at your ribs.',
    openingOffer:
      'Climb when they drop the rope and they will issue dry clothes and a blanket. Stay in the water and you keep Earth kit — the handler may leave the grate shut.',
    page1:
      'Cold water at the ribs. You are in the rain-cistern under the Close, a fading chalk ring on the wet brick. A blue panel hangs above the waterline, dry. Two novices tread water and will not touch you. A handler shouts through the grate for a name. A rope is coiled on the rim — offered if you climb, not if you freeze.',
    beats: [
      'Cistern, water at the ribs, grate above.',
      'A blue panel hangs dry. They wanted a clean pull.',
      'A rope is an offer to climb, not starting kit.',
    ],
    fallback:
      'Cold water. You wake in the rain-cistern under the Close. A blue panel hangs dry above the waterline. A handler shouts through the grate. A rope waits on the rim.',
  },
  {
    location: 'a Crown archive stack behind iron mesh',
    faction: 'Archivist Lene Quill and a silent Scale witness',
    summonIntent: 'They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes.',
    openingOffer:
      'Read the one page they allow and they will issue a reader’s ribbon and a copied line. Refuse the page and you keep Earth kit — Lene will lock the mesh.',
    page1:
      'Dust and iron mesh. You are on the archive floor behind the stack, a circle of library-chalk around a pulled folio. A blue panel hangs over empty shelves. Archivist Lene Quill has one page turned face-down. A Scale witness does not speak. A reader’s ribbon lies on the folio — offered if you take the page, not if you grab the rest.',
    beats: [
      'Archive stack, iron mesh, one forbidden folio.',
      'A blue panel hangs. The name they wanted is you.',
      'A ribbon is an offer to read one page, not loot the stack.',
    ],
    fallback:
      'Dust and mesh. You wake in a Crown archive stack inside library-chalk. A blue panel hangs. Lene Quill has one page face-down. A ribbon waits if you read it.',
  },
  {
    location: 'the frozen ford on the Cinderflow',
    faction: 'Pellane scouts on one bank and Ash pickets on the other',
    summonIntent: 'A mid-ice rite to mark a border soul. Both banks want the name before the ice groans.',
    openingOffer:
      'Pick a bank and that side issues a coat and a pass. Stand the ice and you keep Earth kit while both sides freeze with you.',
    page1:
      'Ice-groan and river-smoke. You are on your back on the frozen Cinderflow ford, a scraped circle in the rime. A blue panel hangs in the wind. Pellane scouts on the near bank; Ash pickets on the far. Two coats sit on opposite packs. Nobody has pulled you off the ice. The offers are the banks, not a gift in your hands.',
    beats: [
      'Frozen ford, two banks, one circle on ice.',
      'A blue panel hangs. Both sides want the name.',
      'Two coats — offered by bank, not equipped.',
    ],
    fallback:
      'Ice-groan. You wake on the frozen Cinderflow ford. A blue panel hangs. Scouts on one bank, Ash pickets on the other. Two coats wait. You are still on the ice.',
  },
  {
    location: 'the bell-tower of Valespire Cathedral',
    faction: 'Bell-warden Orth and a frightened novice on the ladder',
    summonIntent: 'They pulled you into the tower to hide a failed vault-rite from the nave. The city can already hear the bells wrong.',
    openingOffer:
      'Help them still the bells and they will issue a rope-belt and a tower-pass. Climb down shouting and you keep Earth kit — Orth may lock the trapdoor.',
    page1:
      'Wind through louver slats. You are on the bell-tower boards, a chalk ring under a silent bronze. A blue panel hangs in the belfry. Bell-warden Orth has both hands on a rope he will not pull. A novice on the ladder looks ready to drop. A tower-pass sits on a nail — offered if you help still the bells, not if you shout to the square.',
    beats: [
      'Belfry, silent bronze, city under the slats.',
      'A blue panel hangs. The vault failed; the tower hid it.',
      'A pass is an offer to help, not starting kit.',
    ],
    fallback:
      'Wind in the belfry. You wake under a silent bronze in Valespire’s bell-tower. A blue panel hangs. Orth will not pull the rope. A tower-pass waits on a nail.',
  },
  {
    location: 'a quarry circle outside Valespire’s east wall',
    faction: 'Quarry-boss Harn and Crown surveyors who want the cut blamed on you',
    summonIntent: 'A work-rite to pull a strong back. They got an Earth soul. The surveyors need someone to sign the collapse.',
    openingOffer:
      'Take the blame-line and they will issue a work-coat and a chit. Refuse the line and you keep Earth kit — Harn may still walk you to the watch.',
    page1:
      'Stone-dust and open sky. You are on your back in a quarry circle outside the east wall, chalk on cut granite. A blue panel hangs over a dropped mallet. Quarry-boss Harn swears. Crown surveyors already have a form. A work-coat is folded on a cart — offered if you sign the collapse, not if you walk.',
    beats: [
      'Quarry, cut granite, a collapse form.',
      'A blue panel hangs. They wanted a strong back.',
      'A work-coat is an offer for a signature, not loot.',
    ],
    fallback:
      'Stone-dust. You wake in a quarry circle outside the east wall. A blue panel hangs. Harn swears; surveyors have a form. A work-coat waits if you sign.',
  },
  {
    location: 'a night-market roof over Lowmarket',
    faction: 'Roof-thieves who stole a Scale tile and a watch-horn already rising',
    summonIntent: 'They wanted a shadow-luck pull for a roof job. You arrived on the tiles. The horn is already up.',
    openingOffer:
      'Drop with them and they will toss you a dark cloak and a short line. Stay and wave at the horn and you keep Earth kit — they will leave you on the ridge.',
    page1:
      'Cold tiles and festival-oil smell from below. You are on a Lowmarket night-market roof, a tile-circle scraped around a stolen Scale shard. A blue panel hangs over the ridge. Three roof-thieves freeze. A watch-horn rises from the street. A dark cloak is bundled — offered if you drop with them, not if you stand and wave.',
    beats: [
      'Roof tiles, stolen shard, horn from the street.',
      'A blue panel hangs. They wanted luck, not a witness.',
      'A cloak is an offer to drop, not starting kit.',
    ],
    fallback:
      'Cold tiles. You wake on a Lowmarket night-market roof inside a scraped circle. A blue panel hangs. Thieves freeze; a horn rises. A dark cloak waits if you drop with them.',
  },
  {
    location: 'the stable loft behind the Weighing Cup',
    faction: 'Ostler Joss and a Crown handler who followed the wrong door',
    summonIntent: 'The inn rite dumped you into hay, not the common room. The handler still wants a cathedral ending.',
    openingOffer:
      'Stay with Joss and he will issue a duster-coat and a back-gate key. Go with the handler and they will promise vault kit you have not seen — or keep Earth clothes and the horses.',
    page1:
      'Hay-dust and horse-heat. You are on your back in the stable loft behind the Weighing Cup, a charcoal circle in the boards. A blue panel hangs over a tack rail. Ostler Joss has a pitchfork half-lowered. A Crown handler is already on the ladder, arguing this is the wrong room. A duster-coat hangs on a peg — offered if you take Joss’s gate, not the handler’s speech.',
    beats: [
      'Stable loft, hay, the inn rite missed the taproom.',
      'A blue panel hangs. Handler on the ladder; ostler in the loft.',
      'A coat and a key are offers, not equipped.',
    ],
    fallback:
      'Hay-dust. You wake in the stable loft behind the Weighing Cup. A blue panel hangs. Joss has a pitchfork; a handler is on the ladder. A duster-coat waits on a peg.',
  },
];
