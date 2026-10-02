import type { OpeningBeatCard } from './types';

/**
 * Phase 4 extra Summoned Pact openers — unique place / why / cast / page1.
 * Seed-picked with the existing bible deck. Not 200 clones.
 * page1, fallback and beats are whole sentences: each names the object and where it is.
 */
export const SUMMONED_PACT_PHASE4_HOOKS: OpeningBeatCard[] = [
  {
    location: 'the common room of the Weighing Cup',
    faction: 'Innkeep Mara Vell and two Scale clerks drinking off-duty',
    castNpcIds: ['sp-npc-mara-vell'],
    summonIntent: 'The rite misfired into an inn, not a cathedral. They need a name before the close hears you arrived in a taproom.',
    openingOffer:
      'Stay as a guest and they will issue a room-key and a traveler’s cloak. Walk out and you keep Earth kit — Mara will still write you in the book.',
    page1:
      'The common room of the Weighing Cup smells of ale and wet wool. You are lying on your back on the inn’s flagstones, inside a chalk ring that boots have half scuffed away. A blue panel hangs in the air above a scarred table. Innkeep Mara Vell stares at you as if a barrel just turned into a person. Two Scale clerks have frozen with their cups halfway to their mouths. Nobody has put a weapon in your hands. A cloak lies folded on the bar, and it is offered to you only if you take a room.',
    beats: [
      'You are in the inn’s common room, not a vault, and the chalk ring is drawn on taproom stone.',
      'A blue panel hangs over a table, and Mara wants a name for the inn book.',
      'The cloak on the bar is an offer, not loot.',
    ],
    fallback:
      'You wake on the flagstones of the Weighing Cup inside a scuffed chalk ring. A blue panel hangs above a table. Mara Vell and two clerks stare at you. A cloak lies on the bar, offered if you take a room.',
  },
  {
    location: 'the Contract Hall notice board',
    faction: 'Clerk Brin Holt posting Crown jobs, already late',
    castNpcIds: ['sp-npc-brin-holt'],
    summonIntent: 'Someone stamped a summon onto a job-board rite. They wanted a contractor. They got an Earth soul.',
    openingOffer:
      'Take the posted job and they will issue a contractor’s chit and a short blade. Refuse the board and you keep Earth kit while Brin panics at the stamp.',
    page1:
      'The Contract Hall smells of paper, wax, and cold air. You sit up with your back against the hall’s notice board, and a chalk circle is drawn around the newest posting. A blue panel hangs over the pins on the board. Clerk Brin Holt drops a sheaf of jobs on the floor. The Crown stamp on the posting does not match your Earth clothes. A kit chit sits in a tray by the board, and it is yours only if you take the job.',
    beats: [
      'The notice board is full of pins, and a chalk circle surrounds one posting.',
      'A blue panel hangs over the board, and Brin is already late.',
      'The contractor chit in the tray is an offer, not starting kit.',
    ],
    fallback:
      'You wake against the Contract Hall notice board inside a chalk circle. A blue panel hangs over the pins. Clerk Brin Holt drops his jobs. A kit chit waits in a tray if you take the posting.',
  },
  {
    location: 'the cathedral kitchens in the Close',
    faction: 'Brother Tam and the night cooks who were not supposed to see this',
    castNpcIds: ['sp-npc-3'],
    summonIntent: 'The seventh ring dumped you into bread-steam, not the vault. Tam will hide you or sell you upstairs.',
    openingOffer:
      'Help them finish the night bake and they will wrap bread and a kitchen knife for the road. Shout for the Chanter and you keep Earth kit — Tam may still get blamed.',
    page1:
      'The cathedral kitchens under Valespire Close are full of bread steam and copper pans. You are lying on your back on the kitchen flagstones, inside a flour circle that a dropped tray has smeared. A blue panel hangs in the air above the kneading board. Brother Tam goes white. A cook swears once and covers the slit in the door. Nobody has offered you a hero’s blade. A wrapped loaf and a kitchen knife sit on the sideboard, and they are yours if you help, not if you shout.',
    beats: [
      'You are in the kitchens on a flour circle, because the rite missed the vault.',
      'A blue panel hangs over the kneading board, and Tam is too junior for this.',
      'The bread and the knife on the sideboard are an offer for help, not a gift in your hands.',
    ],
    fallback:
      'You wake on the kitchen flagstones inside a flour circle. A blue panel hangs over the kneading board. Brother Tam covers the door. A loaf and a knife wait on the sideboard if you help, not if you shout.',
  },
  {
    location: 'the ledger stair on the Palace Approach',
    faction: 'Court clerk Ila Pellane and two pike-guards',
    castNpcIds: ['sp-npc-ila-pellane'],
    summonIntent: 'They meant to summon a witness onto the palace stair, not a Pactborn. The ledger already has a blank line.',
    openingOffer:
      'Sign the blank and they will issue a visitor’s tabard and a pass-token. Refuse and you keep Earth kit while the pikes decide if you are an incident.',
    page1:
      'The ledger stair on the Palace Approach is cold marble that smells of ink. You are sitting on the stair, and a brass ring is chalked on the step under you. A blue panel hangs over an open book on a stand. Clerk Ila Pellane’s quill is still wet. Two pike-guards have not decided whether to salute you or seize you. A tabard lies folded on the stair rail, and it is yours only if you sign.',
    beats: [
      'You are on the palace stair beside an open ledger with one blank line.',
      'A blue panel hangs over the book, and the guards wait on the clerk.',
      'The tabard on the rail is an offer for a signature, not loot.',
    ],
    fallback:
      'You wake on the Palace Approach ledger stair inside a brass ring. A blue panel hangs over an open book. Ila Pellane’s quill is wet. A tabard waits on the rail if you sign.',
  },
  {
    location: 'Kitchen Saint Alley behind the Close',
    faction: 'Sister Pell and a marked child who will not speak first',
    castNpcIds: ['sp-npc-sister-pell'],
    summonIntent: 'Charity-circle, not Crown brass. They pulled you because the child’s mark woke and they had no priest left.',
    openingOffer:
      'Stay and they will share a blanket and a heel of bread. Leave and you keep Earth kit — the child still watches the panel.',
    page1:
      'Steam drifts from a bakery vent into Kitchen Saint Alley. You are lying on packed dirt in the alley, inside a charcoal circle drawn between two crates. A blue panel hangs in the steam. Sister Pell has flour on her sleeves. A marked child sits against the wall and will not speak first. Nobody here has a sword. A blanket lies on one of the crates, and it is yours if you stay the hour, not if you run.',
    beats: [
      'You are in a charity alley with a child whose mark woke, and there is no vault here.',
      'A blue panel hangs in the steam, and Pell is not a Chanter.',
      'The blanket on the crate is an offer to stay, not issued kit.',
    ],
    fallback:
      'You wake in Kitchen Saint Alley inside a charcoal circle. A blue panel hangs in the bakery steam. Sister Pell and a marked child stare at you. A blanket on a crate is offered if you stay.',
  },
  {
    location: 'the reed water of Mireglass March',
    faction: 'Ilyra Fen and Tekk Reed counting who comes back twice',
    castNpcIds: ['sp-npc-5', 'sp-npc-6'],
    summonIntent: 'A marsh circle meant to call a reflection, not an Earth soul. The March already has one of you in the water.',
    openingOffer:
      'Take a dry-path token and they will kit you with reed-wraps and a pole. Refuse the token and you keep Earth kit while the water still shows someone else.',
    page1:
      'Mireglass March stinks of reeds, and cold water reaches your shins. You are on a woven platform in the marsh, inside a circle of river chalk that is already washing away. A blue panel hangs over the black water. Ilyra Fen reads a reflection in the water that is not hers. Tekk Reed counts under his breath. A pole and some reed-wraps lie on the platform mat, and they are offered for a token, not given.',
    beats: [
      'You are on a marsh platform, and the chalk circle is washing into the water.',
      'A blue panel hangs over the water, and someone else already shows in the reflection.',
      'The reed-wraps on the mat are an offer, not starting loot.',
    ],
    fallback:
      'You wake on a woven platform in Mireglass March. A blue panel hangs over the black water. Ilyra Fen and Tekk Reed stare at a reflection that is not yours. A pole on the mat waits for a token.',
  },
  {
    location: 'the ash-heat of Cinderwake Trail',
    faction: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
    castNpcIds: ['sp-npc-9', 'sp-npc-10'],
    summonIntent: 'They finished a tracking-rite on the ash road. You arrived in the prints they were following.',
    openingOffer:
      'Walk with Oren and he will share water and a pilgrim scarf. Stay for Kessa and she will offer a brand-iron if you take her hunt — or you keep Earth kit and both of them.',
    page1:
      'Heat rises off the ash of Cinderwake Trail. You are lying on your back in a scorched circle on the trail. A blue panel hangs in the shimmering air. Brother Oren has a waterskin half raised. Kessa Cinder has already drawn your footprints in her book. Nobody has put a blade in your hand. A scarf sits on one pack and a brand-iron sits on the other, and both are offers, not your gear.',
    beats: [
      'You are on the ash road where two people in pursuit share one circle.',
      'A blue panel hangs in the heat, and Kessa already wrote you down.',
      'The scarf and the brand-iron on the packs are offered, not yours yet.',
    ],
    fallback:
      'You wake in a scorched circle on Cinderwake Trail. A blue panel hangs in the heat. Brother Oren and Kessa Cinder are already chasing something. Two packs on the ground hold two offers.',
  },
  {
    location: 'the hearing pit of the Sump Court',
    faction: 'Magistrate Sula Vane and broker Nox Kade',
    castNpcIds: ['sp-npc-13', 'sp-npc-14'],
    summonIntent: 'They summoned a clause, not a hero. The Sump wants a living signature on an illegal binding.',
    openingOffer:
      'Sign Sula’s cheap contract and they will issue a court token and a ferryman’s chit. Buy Nox’s leverage instead — or keep Earth kit and pay night prices later.',
    page1:
      'The hearing pit of the Sump Court lies under the street and smells of damp stone and lamp oil. You sit up in the pit, inside a salt circle on packed clay. A blue panel hangs over the magistrate’s bench. Sula Vane already has a quill in her hand. Nox Kade smiles like he is naming a price. A court token and a ferry chit sit on the rail of the pit, and they are offered for a signature, not given.',
    beats: [
      'You are in a court below the street, inside a salt circle, with two prices on offer.',
      'A blue panel hangs over the bench, and the binding is cheaper than mercy.',
      'The token and the chit on the rail are offers, not loot.',
    ],
    fallback:
      'You wake in the Sump Court hearing pit under the street. A blue panel hangs over the bench. Sula Vane has a quill, and Nox Kade has a price. A token waits on the rail.',
  },
  {
    location: 'a dead hall of the Hollow Engine',
    faction: 'Two Crown engineers who lost a containment chant',
    summonIntent: 'They tried to wake a machine with a Scale rite. The Engine stayed dead. You arrived instead.',
    openingOffer:
      'Help them reseal the hall and they will issue a spark-lamp and work gloves. Walk out and you keep Earth kit — the alert bells may still find you.',
    page1:
      'The dead hall of the Hollow Engine smells of cold iron and burned rain. You are lying on a metal grate in the hall, inside a chalk circle drawn over gears that do not turn. A blue panel hangs in the dark. Two engineers have frozen with a cracked tile held between them. Nobody has handed you a tool. A spark-lamp sits on a crate by the wall, and it is yours if you help reseal the hall, not if you run.',
    beats: [
      'You are in a dead machine hall where the gears stand still under the chalk.',
      'A blue panel hangs in the dark, and the containment chant failed.',
      'The spark-lamp on the crate is an offer for help, not starting kit.',
    ],
    fallback:
      'You wake on a grate in a dead hall of the Hollow Engine. A blue panel hangs in the dark. Two engineers hold a cracked tile. A spark-lamp on a crate waits if you help reseal the hall.',
  },
  {
    location: 'the wagon desk of the Argent Ledger',
    faction: 'Yara Quill ranking bodies and Kade Voss trying to void the paper',
    castNpcIds: ['sp-npc-22', 'sp-npc-23'],
    summonIntent: 'A mobile license rite. They wanted a ranked contractor. The Mark on you is an audit problem.',
    openingOffer:
      'Accept Yara’s rank stamp and she will issue a license plate and a short blade. Let Kade void the paper and you keep Earth kit — and his claim.',
    page1:
      'The wagon desk of the Argent Ledger smells of wagon wood and wet ink. You are on the wagon floor, inside a silver circle chalked around a stamp pad. A blue panel hangs over the rank book on the desk. Yara Quill already has a stamp raised. Kade Voss is arguing that the paper is void. A license plate sits in a tray on the desk, and it is yours only if you take the rank.',
    beats: [
      'You are in a license wagon by a stamp pad, between two clerks at war.',
      'A blue panel hangs over the rank book, and the Mark is an audit.',
      'The plate and the blade are offers, not equipped.',
    ],
    fallback:
      'You wake inside a silver circle on the floor of the Argent Ledger wagon. A blue panel hangs over the rank book. Yara has a stamp, and Kade wants the paper void. A license plate waits in a tray.',
  },
  {
    location: "the nave of Saint Vhal's Reliquary",
    faction: 'Reliquary wardens who treat you as a doctrine test',
    summonIntent: 'They summoned a proof, not a champion. If the Mark is wrong, the relic stays locked.',
    openingOffer:
      'Kneel the doctrine and they will issue a pilgrim tabard and a sealed vial. Walk the nave without kneeling and you keep Earth kit — the wardens still have the door.',
    page1:
      'The nave of Saint Vhal’s Reliquary smells of incense, and cold iron screens line the walls. You are lying on your back on the nave stones, inside a circle of white sand around a locked reliquary. A blue panel hangs under a saint’s mask on the wall. Wardens in grey stand near you and do not draw steel. One of them asks if you will kneel. A tabard and a sealed vial sit on a side altar, and they are offered for doctrine, not for taking.',
    beats: [
      'You are in a fortress shrine beside a locked relic, inside a white sand circle.',
      'A blue panel hangs under the saint’s mask, and the wardens want a kneel, not a speech.',
      'The tabard and the vial on the side altar are offers, not loot.',
    ],
    fallback:
      'You wake on the Reliquary nave stones inside a circle of white sand. A blue panel hangs under a saint’s mask. The wardens wait for you to kneel. A tabard sits on a side altar, offered and not taken.',
  },
  {
    location: 'the outdoor seam of the Integration Scar',
    faction: 'A Pact loadout crew and a debt-collector who arrived late',
    summonIntent: 'The Scar is where pacts and debts meet. They pulled you onto the seam before either side finished talking.',
    openingOffer:
      'Take the loadout crate and they will issue field kit. Pay the collector’s first tithe and you keep Earth clothes with a stamped debt — or refuse both.',
    page1:
      'The Integration Scar is a crack in the dirt under open sky, and the crack hums. You are lying on the Scar, inside a circle scored across the seam. A blue panel hangs in the daylight. A loadout crew has a crate half open beside the seam. A debt-collector holds a slate. Nobody has dressed you. The crate and the slate are two offers, and neither one is on you yet.',
    beats: [
      'You are on an outdoor seam with two crews and one circle.',
      'A blue panel hangs in the daylight, and the pact and the debt arrived together.',
      'The crate and the slate are offered, not equipped.',
    ],
    fallback:
      'You wake on the humming crack of the Integration Scar in daylight. A blue panel hangs over the seam. A loadout crate and a debt slate wait beside you. Neither one is on you yet.',
  },
  {
    location: 'a Lowmarket junk stall under tarps',
    faction: 'Fence Nemi Salt and a Crown watcher pretending to browse',
    castNpcIds: ['sp-npc-24'],
    summonIntent: 'They used a stolen Scale chalk to pull luck for a sale. They pulled you. The watcher already saw.',
    openingOffer:
      'Play customer and Nemi will press a junk-knife and a rain-cloak into the deal. Speak to the watcher and you keep Earth kit — Nemi may dump the stall.',
    page1:
      'The Lowmarket junk stall smells of tar and is stacked with Earth junk. You sit up behind the stall, on a chalk circle drawn on packed mud under the tarp. A blue panel hangs over a crate of buttons. Nemi Salt swears. A Crown watcher is still pretending to browse the tin cups on the counter. Nemi holds out a junk-knife hilt first, and it is yours only if you nod.',
    beats: [
      'You are behind a junk stall on stolen chalk while a watcher browses.',
      'A blue panel hangs over the button crate, and Nemi wanted luck, not a soul.',
      'The knife is an offer to play along, not loot.',
    ],
    fallback:
      'You wake under a Lowmarket tarp inside a chalk circle. A blue panel hangs over a crate of buttons. Nemi Salt swears while a watcher browses the cups. A junk-knife waits on your nod.',
  },
  {
    location: 'Valespire Harbor Quay at night tide',
    faction: 'Quay-master Pell Wren and two grain-hands who want you off the boards',
    castNpcIds: ['sp-npc-pell-wren'],
    summonIntent: 'A dock-luck rite at tide-turn. They wanted a fair wind. They got an Earth soul on the wet boards.',
    openingOffer:
      'Sign as extra crew and they will issue oilskins and a barge-hook. Stay on the quay and shout and you keep Earth kit — Pell may call the watch.',
    page1:
      'Harbor Quay smells of the night tide and wet rope. You are lying on your back on the quay boards, inside a salt circle that the water is already washing away. A blue panel hangs over the stacked grain sacks. Quay-master Pell Wren holds a lantern in your face. Two grain-hands want you off the boards before a clerk sees you. Oilskins hang on a peg by the grain, and they are yours if you sign as crew, not if you shout.',
    beats: [
      'You are on the quay at night in a washing salt circle, with a lantern in your face.',
      'A blue panel hangs over the grain, and they wanted wind, not a summon.',
      'The oilskins on the peg are an offer for a crew mark, not starting kit.',
    ],
    fallback:
      'You wake on the wet boards of Harbor Quay at night tide, inside a washing salt circle. A blue panel hangs over the grain. Pell Wren’s lantern is in your face. Oilskins wait on a peg if you sign.',
  },
  {
    location: 'a Scale counting-house on Ledger Row',
    faction: 'Auditor Venn Scale and two junior counters',
    castNpcIds: ['sp-npc-venn-scale'],
    summonIntent: 'They tried to summon a missing account into the book. The account was you.',
    openingOffer:
      'Sit the audit and they will issue a clerk’s sash and a numbered chit. Walk out mid-count and you keep Earth kit while Venn writes “unaccounted.”',
    page1:
      'The counting-house on Ledger Row is full of bead frames and dry ink. You are sitting on a stool inside a circle of coins on the floor. A blue panel hangs over an open ledger on the desk. Auditor Venn Scale has already ruled a line in the book. Two junior counters freeze with their abacus beads mid-count. A clerk’s sash lies folded on the desk, and it is yours if you sit the audit, not if you leave.',
    beats: [
      'You are in a counting-house inside a coin circle, and you are the missing account.',
      'A blue panel hangs over the ledger, and you are the line they could not find.',
      'The sash on the desk is an offer to sit, not loot.',
    ],
    fallback:
      'You wake on a counting-house stool inside a circle of coins. A blue panel hangs over the ledger. Auditor Venn Scale has ruled a line. A sash waits on the desk if you sit the audit.',
  },
  {
    location: 'a Crown courier loft above the Close',
    faction: 'Courier Ado Ferry and a sealed bag that was not meant to open',
    castNpcIds: ['sp-npc-16'],
    summonIntent: 'A delivery-rite to move a sealed name. The bag opened on an Earth soul instead of a letter.',
    openingOffer:
      'Carry the remaining seals and they will issue a courier sash and a night-pass. Drop the bag and you keep Earth kit — Ado still has a route to run.',
    page1:
      'The courier loft above the Close smells of dust and pigeons. You are on the loft floor, and circles of wax ring the boards around a burst satchel. A blue panel hangs over a pile of unopened seals. Ado Ferry looks from you to the empty bag. Nobody has offered you a sword. A sash and a night-pass hang on a hook by the door, and they are yours if you take the rest of the route.',
    beats: [
      'You are in a loft beside a burst satchel, and its seals are still closed.',
      'A blue panel hangs over the seals, and the letter was supposed to be you.',
      'The sash and the pass on the hook are offers for the route, not kit in hand.',
    ],
    fallback:
      'You wake in a courier loft inside rings of wax. A blue panel hangs over the seals. Ado Ferry stares at a burst satchel. A sash on a hook waits if you carry the remaining seals.',
  },
  {
    location: 'an Ash Court salt-pan camp at dusk',
    faction: 'Salt-burners who will swear you walked out of the pans, not a rite',
    summonIntent: 'They needed a body to claim a failed Crown summon. The pans are their proof, not Pellane’s brass.',
    openingOffer:
      'Wear their salt-cloak and they will issue a mask and a story. Refuse the cloak and you keep Earth kit — they may still walk you toward the Cinderflow.',
    page1:
      'Dusk heat rises off the white salt pans of an Ash Court camp. You sit up inside a circle of salt crust, and this is not a cathedral. A blue panel hangs over a pan of drying water. Salt-burners in cracked leather stand around you and do not bow. One of them holds a mask. They offer you a salt-cloak if you take their story, not if you name Pellane first.',
    beats: [
      'You are at the salt pans at dusk, and there is no Crown brass here.',
      'A blue panel hangs over the pans, and they want a story they can walk.',
      'The cloak and the mask are offers, not equipped.',
    ],
    fallback:
      'You wake inside a salt-crust circle at an Ash Court camp on the white pans at dusk. A blue panel hangs over the water. A salt-burner holds a mask. A salt-cloak is offered for their story, not Pellane’s.',
  },
  {
    location: 'the rain-cistern under Valespire Close',
    faction: 'Two drowned-rite novices and a handler shouting from the grate',
    summonIntent: 'A water-circle in the cistern. They wanted a clean pull. The water is already at your ribs.',
    openingOffer:
      'Climb when they drop the rope and they will issue dry clothes and a blanket. Stay in the water and you keep Earth kit — the handler may leave the grate shut.',
    page1:
      'Cold water reaches your ribs in the rain cistern under the Close. You stand in the cistern beside a fading chalk ring on the wet brick wall. A blue panel hangs above the waterline, and it is dry. Two novices tread water near you and will not touch you. A handler shouts through the grate above for your name. A rope lies coiled on the rim of the cistern, and it is yours if you climb, not if you freeze.',
    beats: [
      'You are in the cistern with water at your ribs and a grate above you.',
      'A blue panel hangs dry above the water, and they wanted a clean pull.',
      'The rope on the rim is an offer to climb, not starting kit.',
    ],
    fallback:
      'You wake in cold water in the rain cistern under the Close. A blue panel hangs dry above the waterline. A handler shouts through the grate. A rope waits on the rim.',
  },
  {
    location: 'a Crown archive stack behind iron mesh',
    faction: 'Archivist Lene Quill and a silent Scale witness',
    castNpcIds: ['sp-npc-lene-quill'],
    summonIntent: 'They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes.',
    openingOffer:
      'Read the one page they allow and they will issue a reader’s ribbon and a copied line. Refuse the page and you keep Earth kit — Lene will lock the mesh.',
    page1:
      'The Crown archive stack is dusty and closed in behind iron mesh. You are on the archive floor behind the shelves, inside a circle of library chalk around a pulled folio. A blue panel hangs over the empty shelves. Archivist Lene Quill holds one page turned face down. A Scale witness stands by the mesh and does not speak. A reader’s ribbon lies on the folio, and it is yours if you take the one page, not if you grab the rest.',
    beats: [
      'You are in the archive stack behind iron mesh, beside one forbidden folio.',
      'A blue panel hangs over the shelves, and the name they wanted is you.',
      'The ribbon on the folio is an offer to read one page, not to loot the stack.',
    ],
    fallback:
      'You wake in a Crown archive stack inside a circle of library chalk. A blue panel hangs over the shelves. Lene Quill holds one page face down. A ribbon on the folio waits if you read it.',
  },
  {
    location: 'the frozen ford on the Cinderflow',
    faction: 'Pellane scouts on one bank and Ash pickets on the other',
    summonIntent: 'A mid-ice rite to mark a border soul. Both banks want the name before the ice groans.',
    openingOffer:
      'Pick a bank and that side issues a coat and a pass. Stand the ice and you keep Earth kit while both sides freeze with you.',
    page1:
      'The ice groans on the frozen ford of the Cinderflow, and smoke drifts off the river. You are lying on your back on the ice, inside a circle scraped in the frost. A blue panel hangs in the wind above the ford. Pellane scouts watch from the near bank, and Ash pickets watch from the far bank. Two coats sit on two packs, one on each bank. Nobody has pulled you off the ice. Each bank offers its coat, and neither coat is in your hands.',
    beats: [
      'You are on a frozen ford with a scout camp on each bank and one circle on the ice.',
      'A blue panel hangs in the wind, and both sides want the name.',
      'The two coats are offered by the banks, not equipped.',
    ],
    fallback:
      'You wake on the ice of the frozen Cinderflow ford. A blue panel hangs in the wind. Scouts stand on one bank, and Ash pickets stand on the other. A coat waits on each bank. You are still on the ice.',
  },
  {
    location: 'the bell-tower of Valespire Cathedral',
    faction: 'Bell-warden Orth and a frightened novice on the ladder',
    castNpcIds: ['sp-npc-orth'],
    summonIntent: 'They pulled you into the tower to hide a failed vault-rite from the nave. The city can already hear the bells wrong.',
    openingOffer:
      'Help them still the bells and they will issue a rope-belt and a tower-pass. Climb down shouting and you keep Earth kit — Orth may lock the trapdoor.',
    page1:
      'Wind blows through the wooden slats of the bell-tower of Valespire Cathedral. You are on the tower floorboards, inside a chalk ring under a great bronze bell that is silent. A blue panel hangs in the air of the belfry. Bell-warden Orth holds a bell rope in both hands and will not pull it. A novice on the ladder looks ready to fall. A tower-pass hangs on a nail by the ladder, and it is yours if you help still the bells, not if you shout down to the square.',
    beats: [
      'You are in the belfry under a silent bronze bell, with the city below the slats.',
      'A blue panel hangs in the belfry, and the tower is hiding a failed vault rite.',
      'The tower-pass on the nail is an offer for help, not starting kit.',
    ],
    fallback:
      'You wake under a silent bronze bell in the bell-tower of Valespire Cathedral. A blue panel hangs in the belfry. Orth holds the bell rope and will not pull it. A tower-pass waits on a nail by the ladder.',
  },
  {
    location: 'a quarry circle outside Valespire’s east wall',
    faction: 'Quarry-boss Harn and Crown surveyors who want the cut blamed on you',
    castNpcIds: ['sp-npc-harn'],
    summonIntent: 'A work-rite to pull a strong back. They got an Earth soul. The surveyors need someone to sign the collapse.',
    openingOffer:
      'Take the blame-line and they will issue a work-coat and a chit. Refuse the line and you keep Earth kit — Harn may still walk you to the watch.',
    page1:
      'Stone dust hangs under open sky in the quarry outside the east wall. You are lying on your back in a quarry circle chalked on cut granite. A blue panel hangs over a dropped mallet. Quarry-boss Harn swears. The Crown surveyors already have a form ready. A work-coat lies folded on a cart, and it is yours if you sign for the collapse, not if you walk away.',
    beats: [
      'You are in a quarry on cut granite, and there is a collapse form waiting.',
      'A blue panel hangs over the mallet, and they wanted a strong back.',
      'The work-coat on the cart is an offer for a signature, not loot.',
    ],
    fallback:
      'You wake in a quarry circle on cut granite outside the east wall. A blue panel hangs over a dropped mallet. Harn swears, and the surveyors have a form. A work-coat on a cart waits if you sign.',
  },
  {
    location: 'a night-market roof over Lowmarket',
    faction: 'Roof-thieves who stole a Scale tile and a watch-horn already rising',
    summonIntent: 'They wanted a shadow-luck pull for a roof job. You arrived on the tiles. The horn is already up.',
    openingOffer:
      'Drop with them and they will toss you a dark cloak and a short line. Stay and wave at the horn and you keep Earth kit — they will leave you on the ridge.',
    page1:
      'The roof tiles over the Lowmarket night market are cold, and festival oil smells from the street below. You are on the roof, inside a circle scraped into the tiles around a stolen Scale shard. A blue panel hangs over the roof ridge. Three roof-thieves freeze. A watch-horn sounds from the street. A dark cloak lies bundled on the tiles, and it is yours if you drop down with them, not if you stand and wave.',
    beats: [
      'You are on the roof tiles beside a stolen shard while a horn sounds from the street.',
      'A blue panel hangs over the ridge, and they wanted luck, not a witness.',
      'The cloak on the tiles is an offer to drop, not starting kit.',
    ],
    fallback:
      'You wake on a cold roof over the Lowmarket night market, inside a scraped circle. A blue panel hangs over the ridge. Three thieves freeze while a horn sounds. A dark cloak waits on the tiles if you drop with them.',
  },
  {
    location: 'the stable loft behind the Weighing Cup',
    faction: 'Ostler Joss and a Crown handler who followed the wrong door',
    castNpcIds: ['sp-npc-joss'],
    summonIntent: 'The inn rite dumped you into hay, not the common room. The handler still wants a cathedral ending.',
    openingOffer:
      'Stay with Joss and he will issue a duster-coat and a back-gate key. Go with the handler and they will promise vault kit you have not seen — or keep Earth clothes and the horses.',
    page1:
      'The stable loft behind the Weighing Cup is full of hay dust and the heat of horses. You are lying on your back on the loft boards, inside a charcoal circle. A blue panel hangs over a tack rail. Ostler Joss holds a pitchfork half lowered. A Crown handler is already climbing the ladder and arguing that this is the wrong room. A duster-coat hangs on a peg, and it is yours if you take Joss’s gate, not the handler’s speech.',
    beats: [
      'You are in the stable loft in the hay, because the inn rite missed the taproom.',
      'A blue panel hangs over the tack rail, the handler is on the ladder, and the ostler is in the loft.',
      'The coat and the key are offers, not equipped.',
    ],
    fallback:
      'You wake in the stable loft behind the Weighing Cup inside a charcoal circle. A blue panel hangs over a tack rail. Joss holds a pitchfork, and a handler is on the ladder. A duster-coat waits on a peg.',
  },
];
