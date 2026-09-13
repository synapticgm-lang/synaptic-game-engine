import type { OpeningHookCard } from './types';

/**
 * Seed-picked starter cameras for ready-made bibles that only shipped a single
 * `openingHook`. Hero Awakening and Summoned Pact keep decks on the bible itself.
 * Writer rewrites — ingredients, not a script. No licensed series names.
 */
export const OPENING_HOOK_DECKS: Record<string, OpeningHookCard[]> = {
  'system-integration': [
    {
      location: 'A cracked city street',
      text:
        'The sky tears open over the pavement you were already walking. A voice — not human, not machine — speaks to every mind: "Integration complete." A blue panel flickers at eye level. Cars have stopped. Nobody has handed you a class yet.',
    },
    {
      location: 'your apartment at Registration',
      text:
        'You were making tea. The window goes white. A panel hangs over the sink: Registration. The kettle still sings. Down in the street, someone is screaming a Wave warning you have not heard yet.',
    },
    {
      location: 'a shop or cafe at Registration',
      text:
        'Indoor lights die, then the panel. You are still in line. The clerk’s screen is a blue rectangle too. Glass in the door spiderwebs. Integration does not wait for you to pay.',
    },
    {
      location: 'a car stuck in traffic',
      text:
        'Traffic is already wrong before the sky tears. Your dashboard dies. A panel hangs over the wheel. Horns. A dungeon seam opens in the shopfront beside the jam.',
    },
    {
      location: 'a metro platform',
      text:
        'The train does not come. The platform panel is not a timetable. Integration. People freeze with phones that no longer light. Something moves in the tunnel that the System has not named.',
    },
    {
      location: 'your workplace floor',
      text:
        'Open-plan morning. Then every monitor is the same blue. A colleague laughs once and stops. The building’s lights are Integration now. Your class is already assigned.',
    },
    {
      location: 'a park path at Registration',
      text:
        'Ordinary path, ordinary sky — until it is not. A panel at eye level. Birds gone. A rift sits where the fountain was. You still have this morning’s clothes.',
    },
    {
      location: 'a stairwell between floors',
      text:
        'You were between errands, between floors. The stairwell flickers. A panel. Someone above you is already bargaining with a class they did not pick.',
    },
  ],

  'gatebreak-ward': [
    {
      location: 'Ward 9 street under a new gate',
      text:
        'Blue bruise-light over Ward 9. An unscheduled gate is chewing the subway stairs. Militia armbands, not guild plate. Your panel is late and cheap. Someone shouts for a headcount.',
    },
    {
      location: 'Ward 9 civilian shelter',
      text:
        'Shelter cots, bad coffee, a gate alarm that will not shut up. You were Unlicensed. A sergeant wants bodies at the stair, not heroes. Your panel ticks anyway.',
    },
    {
      location: 'Ward 9 night market',
      text:
        'Night market stalls. The gate opens in the butcher’s freezer. Civilians run. A guild recruiter is already filming. You are local. The System pays for clears.',
    },
    {
      location: 'the subway mouth under Ward 9',
      text:
        'You were taking the last train. The tunnel is a gate throat now. Rank stamp: too low. Something E-class that does not care about ranks is already on the platform.',
    },
    {
      location: 'a Ward 9 rooftop lookout',
      text:
        'Rooftop watch. Gates bloom over richer wards like jewelry. Yours is the ugly one. A panel. A neighbor wants you to hold the stair while they get kids out.',
    },
    {
      location: 'Ward militia lockup',
      text:
        'You were detained for an unlicensed scrap-clear. The lockup lights go gate-blue. The sergeant who jailed you now needs you. Your panel was never the problem.',
    },
  ],

  'dungeon-transport': [
    {
      location: 'A stone corridor on Floor 1 of the Abyssal Spire',
      text:
        'The alley rift closed behind you. Stone corridor. Torches without fuel. A panel: Floor 1. Descend. There is no door back — only damp air and a sound further down.',
    },
    {
      location: 'Floor 1 arrival chamber of the Abyssal Spire',
      text:
        'You wake on arrival-stone, not in the alley. The rift is a healed scar in the air. Safe-room rumor is three floors down. Your pockets are still Earth’s.',
    },
    {
      location: 'a flooded Floor 1 side-passage',
      text:
        'You stepped through into knee-water, not a dry hall. The panel still says Floor 1. Something moves under the ripples. The main corridor light is a different kind of wrong.',
    },
    {
      location: 'Floor 1 stair that only goes down',
      text:
        'The first thing you see is a stair that refuses to go up. Panel. Hunger meter you did not ask for. Footsteps — not yours — on the landing below.',
    },
    {
      location: 'a Floor 1 collapsed chapel',
      text:
        'Rift into a chapel the Spire ate. Pew-wood, no sky. A panel over the altar. The exit you want is a boss gate, not a door.',
    },
    {
      location: 'Floor 1 with one other arrival',
      text:
        'Two of you came through. The other person is already bargaining with the panel. The Spire does not care who led. Only down.',
    },
  ],

  'void-audience': [
    {
      location: "The Auditor's desk in the Void",
      text:
        'Soft grey. A desk that was not there. The Auditor is already waiting with a point budget. You remember dying. The Audience is not visible yet — only the sense of being watched.',
    },
    {
      location: 'the Void queue before the desk',
      text:
        'You are not first. Other dead wait in a line that has no floor. The Auditor calls a number that is yours. Flaws are on the clipboard before you sit.',
    },
    {
      location: 'the Void observation gallery',
      text:
        'You wake in a gallery, not at the desk. Below, someone else’s negotiation is already entertainment. The Auditor clears its throat. Your trial is next.',
    },
    {
      location: "the Auditor's desk — mid-bargain",
      text:
        'You arrive already mid-sentence. A Flaw is half-chosen. The Auditor does not restart. Cosmic Favor is 0. The Audience likes that.',
    },
    {
      location: 'a Void threshold before rebirth',
      text:
        'The desk is behind you. The Resonance is a door of weather. The Auditor asks if you want to add one more Flaw before you fall through.',
    },
    {
      location: 'the Void with no desk yet',
      text:
        'Featureless grey and your own last memory. Then the desk. Then the function that calls itself the Auditor. No gods. A form.',
    },
  ],

  'ascending-spire': [
    {
      location: 'the plaza before the Ascending Spire',
      text:
        'The black spire punched the sky overnight. Climbers queue for permits. Your tag is still blank. Floor 1 laws are posted in a language that rearranges.',
    },
    {
      location: 'Floor 1 gate of the Ascending Spire',
      text:
        'You are already inside the first biome. The stair behind you is a rumor. A Floor Law writes itself on the air. Someone is dying to a rule you have not read.',
    },
    {
      location: 'the Ranking Board outside the Spire',
      text:
        'Dawn at the Ranking Board. Names you do not know, floors you have not seen. A marshal stamps your tag. A rival is already one floor ahead in the rumor mill.',
    },
    {
      location: 'a climber camp at the Spire base',
      text:
        'Tents, ration bricks, people who came back from Floor 7 wrong. Your first ascent is unpaid. The System only loves height.',
    },
    {
      location: 'Floor 1 law-change corridor',
      text:
        'The corridor you entered is not the corridor you are in. Floor Law just flipped. Silence only — or fire double. You find out by surviving.',
    },
    {
      location: 'Spire gate after a failed clear',
      text:
        'Someone else’s clear failed. Gear on the steps. The Spire kept a name. Your permit is still valid. The marshal will not look at the pile.',
    },
  ],

  'inkbound-academy': [
    {
      location: 'an Inkbound dorm at first bell',
      text:
        'You wake in a dorm bed. A blank Class Codex on the nightstand. The schedule writes itself. Your roommate is already late for a midterm that can kill.',
    },
    {
      location: 'Inkbound orientation hall',
      text:
        'Orientation. Living ink in the air. House colors you have not chosen. A dean with a red pen asks why your Codex is still empty.',
    },
    {
      location: 'the Inkbound library stacks',
      text:
        'You skipped the dorm. The Restricted Stack is already rearranging. A footnote tries to live in your mouth. First bell has not rung.',
    },
    {
      location: 'Inkbound dueling yard',
      text:
        'Yard dust. A house challenge you did not sign. Ink-mage students want a witness. Your Codex opens whether you wanted a class or not.',
    },
    {
      location: 'a detention classroom at Inkbound',
      text:
        'Detention before enrollment. The red pen edits the chalkboard into a quest. You are already on a ledger. House points are not yours yet.',
    },
    {
      location: 'Inkbound night corridor',
      text:
        'After lights. The corridor ink glows. Someone is smuggling a living glyph. Your schedule adds a midnight class you did not pick.',
    },
  ],

  'hollow-core': [
    {
      location: 'a half-collapsed cave around a newborn Core',
      text:
        'You awaken as a Core crystal. Menu: Expand, Spawn, Bargain. The cave is small. Footsteps — adventurers or hunters — are already in the throat of the tunnel.',
    },
    {
      location: 'a Core chamber after a raid',
      text:
        'You wake after a raid you do not remember. Rooms are bitten. Mana is low. A dying adventurer is still in your first trap. Bargain or feed.',
    },
    {
      location: 'a Core border against a rival crystal',
      text:
        'Your light meets another Core’s light through cracked stone. Territory. The System offers a theme you have not chosen. Guild picks are already on the map.',
    },
    {
      location: 'a Core landlord’s first rented room',
      text:
        'You are a Core that already has a tenant. They want rent in mana. The menu still says you could eat them. First choice is hospitality or hunger.',
    },
    {
      location: 'a Core crystal in a mined-out hollow',
      text:
        'Miners left tools. You are the new landlord of a hole. Spawn is expensive. Someone is coming back for the crystal they thought was dead.',
    },
    {
      location: 'a Core dream before the cave',
      text:
        'A last human memory, then crystal. The Auditor of dungeons is a menu. Grow or be mined. The first room is still rubble.',
    },
  ],

  'cursed-keep': [
    {
      location: 'Greyhollow, at the inn',
      faction: 'the innkeep',
      summonIntent: 'A name in the inn book before they will talk about the keep.',
      openingCost: 'The road is already washed out. You stay in Greyhollow or you walk the flood.',
      page1:
        'The last coach is already gone. Autumn rain hits the leaded windows of the Greyhollow Inn. You stand in the entry, water on the floorboards, an open ledger on the oak counter. The few by the hearth will not talk about the keep on the hill. Something up there already knows you are here.',
      text:
        'Last coach. Autumn rain already on the road behind you. The inn book is open. Greyhollow will not talk about the keep on the hill. Something in it already knows you are here.',
    },
    {
      location: 'Greyhollow mill lane at dusk',
      faction: 'exhausted faces on the porch',
      summonIntent: 'The notice wants the missing child found. The porch wants to know if you are help.',
      openingCost: 'Night on the mill lane with no honest light but the inn.',
      page1:
        'Dusk on the Greyhollow mill lane. You arrive on foot, boots in cold mud. The mill wheel turns with no water in the bed. A tattered notice says a child has been missing three nights. Ahead, the inn light is the only honest one. Exhausted faces on the porch watch you come.',
      text:
        'You arrive on foot, not by coach. The mill wheel turns with no water. A child is missing three nights. The inn light is the only honest one.',
    },
    {
      location: 'Greyhollow churchyard',
      faction: 'Father Aldous',
      summonIntent: 'Father Aldous wants to know if you are the face from his dream.',
      openingCost: 'The opened graves stay open. He will not walk you back to the coach.',
      page1:
        'You are left in the Greyhollow churchyard, shin-deep in wet grass. The carriage is already rattling into fog. Three fresh graves gape; the coffins are splintered from the inside. Father Aldous stands by the iron gate with a silver icon, hollow-eyed, as if you stepped out of his dream. He raises a lantern toward your face.',
      text:
        'You are dropped at the church, not the inn. Fresh graves opened from the inside. Father Aldous has not slept. He looks at you as if you were in his dream.',
    },
    {
      location: 'the washed-out road into Greyhollow',
      faction: 'two sentries',
      summonIntent: 'The sentries want a name and a reason you waded in.',
      openingCost: 'The road behind you is gone. They can leave you in the reeds.',
      page1:
        'The road into Greyhollow is already gone. You wade the last mile through floodwater. Drained livestock float in the reeds. The keep on the hill is a silhouette that does not match the stories. Two sentries step from a ruined wall as you drag onto the bank, crossbows half-raised.',
      text:
        'The road is already gone. You wade the last mile. Livestock drained. The keep is a silhouette that does not match the stories.',
    },
    {
      location: 'Greyhollow tavern common room',
      faction: 'the woodcutter and the innkeep',
      summonIntent: 'The woodcutter wants help for the missing child. The mayor wants the keep unnamed.',
      openingCost: 'Greyhollow will not help you if you name the keep.',
      page1:
        'You are already in the Greyhollow tavern common room when the mayor denies everything. The woodcutter will not sit, knuckles white on a felling axe. In the corner a priest’s hands shake around a cup. Heat from the hearth feels wrong. Nobody will name the keep. They are measuring whether you are help or another trouble.',
      text:
        'You are already in the common room when the mayor denies everything. The woodcutter will not sit. A priest’s hands shake around a cup.',
    },
    {
      location: 'Greyhollow gate after dark',
      faction: 'two militia',
      summonIntent: 'The militia want you inside the bar, not back in the woods.',
      openingCost: 'The gate stays barred. The rain and the keep are what you get.',
      page1:
        'The oak gate of Greyhollow slams and the bar slides home. They let you in because the rain and the woods left you no choice. You stand in the muddy courtyard. On the palisade a sentry watches the keep, not you. Two militia step from the guardhouse with lanterns and the look of people who already regret the night.',
      text:
        'The gate is barred. They still let you in because the rain left you no choice. Someone on the wall watches the keep, not you.',
    },
    {
      location: 'Greyhollow well at midnight',
      faction: 'Father Aldous',
      summonIntent: 'Aldous wants to know what answered from the shaft.',
      openingCost: 'The inn lights stay a rumor uphill if you refuse him.',
      page1:
        'Midnight at the Greyhollow well. The bucket rope is cut. You arrive alone; the inn lights are a rumor uphill. Something answered from the shaft before you spoke. Father Aldous is already on the cobbles with a lantern, as if he dreamed you would come here first.',
      text:
        'You start at the well, not the inn. The rope is cut. Aldous dreamed you would come here first.',
    },
    {
      location: 'the keep gate above Greyhollow',
      faction: 'a steward behind the oak',
      summonIntent: 'The steward wants to know who sent you before the bar moves.',
      openingCost: 'The oak stays shut. The village stays a smear downhill.',
      page1:
        'You are already at the keep gate above Greyhollow, not the village. The oak is swollen shut. Crow-shot holes in the door. No inn book, no coach. A steward’s voice behind the planks asks who sent you — and will not open until you answer.',
      text:
        'Keep gate first. The village is a smear downhill. Someone behind the oak wants a name before the bar moves.',
    },
  ],

  'shattered-coast': [
    {
      location: 'The harborside streets of Saltmar',
      text:
        'Saltmar’s lower ward stinks of fish and lift-oil. You are a newcomer with a guild letter or a lie. The Compact is holding by habit. Something in the deep sea is not a rumor.',
    },
    {
      location: 'Saltmar Great Lift landing',
      text:
        'You arrive on the Great Lift, not the harbor stairs. Upper Ward faces look down. A Scribe wants your name before a Mariner does.',
    },
    {
      location: 'a Saltmar Middle Ward market',
      text:
        'Market noise, rope bridges, a job that is not the one you were hired for. Five guilds. One of them already knows you are here.',
    },
    {
      location: 'Saltmar undercity sea-caves',
      text:
        'You were smuggled in through the undercity. The Compact does not cover this door. A dragon the histories killed is a line in a wet book.',
    },
    {
      location: 'a Saltmar dock night shift',
      text:
        'Night on the Mariners’ dock. Something came up in a net that should not swim. You are paid to ask why. The Sentinels will want a cut of the answer.',
    },
    {
      location: 'Saltmar Athenaeum steps',
      text:
        'You start on the Scribes’ steps with a translation job. The text mentions a dragon. The other four guilds would prefer you had not read it.',
    },
  ],

  'fabled-legacy': [
    {
      location: 'The village of Mossford',
      text:
        'Dawn in Mossford. A stranger is already bleeding in Fen’s bakery doorway. The wound will not close. Brennan looks at you as if you were in an old story.',
    },
    {
      location: 'Mossford green at first light',
      text:
        'You walk onto the green as Corvin collapses. A map with a missing piece. Marta wants physics. Brennan wants the cairn left shut.',
    },
    {
      location: 'the road into Mossford',
      text:
        'Last hill before the village. You hear the bakers before you see them. A wounded courier is the most exciting thing Mossford has had in years.',
    },
    {
      location: 'Mossford church stoop',
      text:
        'You arrive at the stoop, not the inn. Old Faith marks on the wood. The Hollow Cairn is a name nobody wanted you to learn on day one.',
    },
    {
      location: 'Mossford mill pond',
      text:
        'Kids at the pond. Then the stranger. Then a geas-cut that will not clot. Sable wants to come. Fen does not.',
    },
    {
      location: 'Mossford elder’s porch',
      text:
        'Brennan’s porch first. He already knows the wound. He will beg you not to open the cairn. He is hiding why.',
    },
  ],

  'millstone-road': [
    {
      location: 'the muddy road toward Millstone Ford',
      text:
        'Three wagons. Merchant Lessa. The last escort vanished near the old mill. The crates tick at night. Bandits are the easy rumor.',
    },
    {
      location: 'a roadside tavern before Millstone Ford',
      text:
        'You take the job in a tavern, not on the road yet. The mill’s wheel turns with no water. Lessa will not open the crates.',
    },
    {
      location: 'the old mill on Millstone Road',
      text:
        'You catch up at the mill, not the hire. Wheel turning dry. Missing escort gear in the weeds. The cargo is still sealed.',
    },
    {
      location: 'a ford camp at dusk',
      text:
        'Camp before the flood-ford. Rain. The crates tick louder. Someone on the far bank has a lantern that is not a lantern.',
    },
    {
      location: 'Millstone Ford gate',
      text:
        'You arrive as the wagons do. Gossip is flour-priced. The sealed crest on the crates is a problem the town already has.',
    },
    {
      location: 'a hill watch above the caravan',
      text:
        'You were hired as eyes, not blades. From the hill the mill wheel is wrong. The road is a ribbon with too few people on it.',
    },
  ],

  'broken-crown-keep': [
    {
      location: 'the quiet upper floors of Ernost Keep',
      text:
        'Upper floors are quiet. Undercroft is not. Two warbands want a dwarf hostage with a vault cipher. Clans will pay silver. The keep does not care who you are.',
    },
    {
      location: 'the undercroft stair of Ernost Keep',
      text:
        'You enter by the cellar stair, not the gate. Orc and troll argument-noise. A prisoner’s cough. Your call is rescue, side, or walk.',
    },
    {
      location: 'a camp outside Ernost Keep',
      text:
        'Clan tents in the ruin’s shadow. They want the hostage alive. The keep’s upper hall is a lie of peace.',
    },
    {
      location: 'Ernost gatehouse at dusk',
      text:
        'Gatehouse first. No guards who still work for a crown. A note: the cipher is downstairs. So is everyone who wants it.',
    },
    {
      location: 'a collapsed chapel in Ernost',
      text:
        'You come in through the chapel hole. Below, warbands. Above, pigeons. The prisoner knows a number you do not.',
    },
    {
      location: 'Ernost hostage pit (you are not the hostage)',
      text:
        'You find the pit before the politics. The dwarf is alive. Both warbands are one corridor away. First page is who you tell.',
    },
  ],

  'verdant-blight': [
    {
      location: 'the blight-edge village',
      text:
        'Green that is the wrong green. Crops that move. The village hired you because the last ranger did not come back. Something in the wood wants names.',
    },
    {
      location: 'a blighted farm lane',
      text:
        'You arrive at a lane that was a field last season. The blight has a pulse. A child says the trees learned to walk.',
    },
    {
      location: 'the ranger station at the veil',
      text:
        'Empty station. Maps with new ink. Your job is the wood. The wood is already in the station.',
    },
    {
      location: 'a shrine swallowed by blight',
      text:
        'Stone saints under vine. The priest is gone. The blight is listening. First choice is cut, burn, or talk.',
    },
    {
      location: 'a river ford turning green',
      text:
        'Ford water is syrup-green. Wagons will not cross. Something downstream is blooming on purpose.',
    },
    {
      location: 'the village moot about the blight',
      text:
        'Moot first. They will not agree. You are the outsider they will blame if the wood wins. The blight does not wait for votes.',
    },
  ],

  'stillroot-veil': [
    {
      location: 'the peat-path into Stillroot',
      text:
        'Lantern of peat-oil. Shadows that point at moving corpses. The veil is a wet wood that remembers. You were asked to walk in. Coming out is extra.',
    },
    {
      location: 'Stillroot village palisade',
      text:
        'Palisade first. They bar the gate at dusk because the dead walk toward light. Your lantern might be a mistake.',
    },
    {
      location: 'a Stillroot funeral that will not stay down',
      text:
        'You arrive for a burial. The buried do not agree. Stillroot’s rule is quiet and cruel. The veil wants a second name.',
    },
    {
      location: 'peat-cutters’ camp',
      text:
        'Camp on the cuts. Something in the peat sits up. The cutters want you to be the one who checks.',
    },
    {
      location: 'a drowned chapel in the veil',
      text:
        'Chapel floor is water. Saints look the wrong way. A corpse in the pew is not at rest. Your lantern’s shadow argues.',
    },
    {
      location: 'Stillroot inn after a failed watch',
      text:
        'The watch failed. The inn is full of people who will not say what they saw. You still have a bed if you take the next watch.',
    },
  ],

  'thornferry-road': [
    {
      location: 'the mill landing at Thornferry',
      faction: 'Wren Holt',
      summonIntent: 'Wren wants you on the road with the charter, or they walk it alone.',
      openingCost: 'Refuse and Wren walks alone. The ferry rope keeps pulling without you.',
      page1:
        'Dawn mist on the mill landing at Thornferry. The ferry rope is wet against the current. Wren Holt stands at the end of the dock with a sealed charter, wax still red. “This has to move,” Wren says. “We walk the road together, or I walk it alone.” The rope keeps pulling. Wren waits.',
      text:
        'Dawn on the mill landing. Ferry rope wet. Wren Holt waits with a sealed charter: walk the road together, or walk it alone. The next page is that answer.',
    },
    {
      location: 'the ferry inn at Thornferry',
      faction: 'Wren Holt',
      summonIntent: "Wren wants a partner on the charter before Pell's coin decides.",
      openingCost: 'The oak door is at your back. You can still walk away and leave Wren the road.',
      page1:
        'The Thornferry inn is warm with mutton and wet wool. Wren Holt sits across a scarred table, already arguing Pell’s coin. The sealed charter lies between you. The oak door is at your back; you can still walk away and leave Wren the road.',
      text:
        'Inn first, landing second. Wren is already arguing with Pell’s coin. The charter is on the table. You can still walk away.',
    },
    {
      location: 'the ford below Thornferry',
      faction: 'Wren Holt',
      summonIntent: 'Wren wants help across the ford with the charter.',
      openingCost: "Refuse and you are the problem that gets you killed. The magistrate's man is already on the far bank.",
      page1:
        'Freezing water at the rocky ford below Thornferry. The mill landing is only a shadow upstream. The crossing rope is frayed. Wren clutches a sealed charter — help, or the problem that gets you killed. On the far bank the magistrate’s man sits a black horse with a crossbow on the pommel.',
      text:
        'You meet the crisis at the ford, not the mill. Wet rope, a charter, a companion who might be a problem. The magistrate’s man is on the far bank.',
    },
    {
      location: 'Thornferry chapel stoop',
      faction: 'Wren Holt',
      summonIntent: 'Wren wants your name on the writ.',
      openingCost: 'The oak doors stay shut. The road does not care about hymns.',
      page1:
        'Morning bell from the Thornferry chapel. You stand on the cracked stoop; the oak doors stay shut. Wren Holt is already on the steps with a sealed charter, blocking the easy exit. The road does not care about hymns. The next word is whether your name goes on the writ.',
      text:
        'Chapel first. Bless or refuse. Wren finds you with the charter anyway. The road does not care about hymns.',
    },
    {
      location: 'a side-path off Thornferry Road',
      faction: 'Wren Holt',
      summonIntent: 'Wren still wants the partnership answered.',
      openingCost: 'Pell still holds the coin. Heavy feet are already in the undergrowth.',
      page1:
        'Canopy keeps the side-path off Thornferry Road in twilight. The mill landing is miles behind. Wren Holt followed into the brush with the sealed charter and will not drop the partnership question. Pell still holds the coin. A branch snaps ahead — heavy feet in the undergrowth. Wren’s hand is already on a short blade. They look at you and wait.',
      text:
        'You start on a side job. The mill landing is a rumor behind you. Wren still has the question. Pell still has coin.',
    },
    {
      location: 'Thornferry mill at last light',
      faction: 'Wren Holt',
      summonIntent: 'Wren wants the ford in the dark, or the mill until dawn.',
      openingCost: 'The ferry is not coming. Wait alone and the river still moves.',
      page1:
        'Dusk paints the river at the Thornferry mill a deep purple. The ferry is already late. Wren Holt stands on the slick dock with the sealed charter tight against their chest. Something dark breaks the water by the pilings and is gone. Wren steps back. “The ferry isn’t coming. We take the ford in the dark, or we wait in the mill until dawn.” The river is still moving.',
      text:
        'Dusk, not dawn. The ferry is already late. Wren’s question is sharper. The charter is heavier.',
    },
    {
      location: 'the magistrate’s porch at Thornferry',
      faction: 'Wren Holt',
      summonIntent: 'The clerk wants your name for the writ before anyone walks the road.',
      openingCost: 'Refuse the name and the mill stays a rumor. Wren still has the charter.',
      page1:
        'You start on the magistrate’s porch, not the mill. Wren Holt is already arguing the sealed charter under a lamp. A clerk wants your name for the writ before anyone walks the road. The river is a sound behind the house. Wren looks at you and waits.',
      text:
        'Magistrate’s porch. The mill is a rumor. Wren still has the charter. The clerk wants a name for the writ.',
    },
    {
      location: 'the mill loft before Wren finds you',
      faction: 'Wren Holt',
      summonIntent: 'Wren wants you to walk together, or they walk it alone.',
      openingCost: 'Refuse and Wren takes the landing question without you.',
      page1:
        'Grain-dust in the Thornferry mill loft. You are here first. The ferry rope knocks below. Wren Holt’s boots hit the ladder with the sealed charter already in hand. “I was told you’d be on the landing,” Wren says. “We still walk together, or I walk it alone.”',
      text:
        'Mill loft first. Wren finds you late. The landing question is the same; the room is not.',
    },
  ],

  'giltwood-estate-conundrum': [
    {
      location: 'the Billiard Room of Giltwood Estate',
      text:
        'Thunder. Midnight. Lord Harrington dead on the rug. A pocket watch that runs backward in your hand. Beatrice drops brandy and names a servants’ passage — if you will not pin it on her.',
    },
    {
      location: 'the servants’ passage of Giltwood Estate',
      text:
        'You are already in the passage when the thud lands in the billiard room. The watch is ticking the wrong way. Beatrice is ahead of you, or behind you.',
    },
    {
      location: 'Giltwood library at the storm',
      text:
        'Library first. The body is a shout from down the hall. The watch is still in Harrington’s hand until you take it. Guests are already lying.',
    },
    {
      location: 'Giltwood storm porch',
      text:
        'You arrive by the porch as midnight hits. Stained glass. A thud. Six guests, one corpse, a maid who knows a cellar.',
    },
    {
      location: 'Giltwood wine cellar',
      text:
        'Beatrice’s passage dumps you in the cellar first. Above, a murder. In your pocket, later, a watch that runs backward. The next page is whether you go up.',
    },
    {
      location: 'Giltwood guest corridor',
      text:
        'Corridor doors opening. A scream that is not thunder. You reach the rug with everyone else. The watch is already wrong.',
    },
  ],

  'vesper-glass-cipher': [
    {
      location: 'the Flooded Archives of Oakhaven',
      text:
        'Stolen tome. Vesper-Glass humming on your chest. Guild bells in the flooded tunnel. Silas offers a soot-stained hand and a smuggler’s route. Boots behind you.',
    },
    {
      location: 'a flooded side tunnel of Oakhaven',
      text:
        'You are already in the side tunnel. The archives are a noise. Silas is bleeding. The glass is warm. Enforcers have the main route.',
    },
    {
      location: 'Oakhaven surface grate',
      text:
        'You surface first — bells still below. The cipher is wet. Silas wants you to go back down for his sister’s name. The Guild wants the glass.',
    },
    {
      location: 'an Oakhaven pipe-listener nest',
      text:
        'Pipe-listeners heard the theft. You start in their nest, not the stacks. Silas is a rumor until he is not. The glass hums anyway.',
    },
    {
      location: 'Oakhaven archive stairs, half-flooded',
      text:
        'Stairs, not the deep stacks. Water at the calves. Bells. Silas’s split lip. The next page is route, not lore.',
    },
    {
      location: 'a collapsing Oakhaven tunnel',
      text:
        'The tunnel is already coming down. The glass is the only light. Silas’s hand. Trust is a direction, not a speech.',
    },
  ],

  'erebus-9-swarm-directive': [
    {
      location: 'Air-Lock Bay 4, Deep-Seam Mining Rig Charybdis',
      text:
        'Strobes. Outer bulkhead under chitin. Vance begs you to override. The nav-drive is ice in your hands. Wet clicking in the vents. Share the air or seal it.',
    },
    {
      location: 'inner bulkhead corridor, Rig Charybdis',
      text:
        'You start one door inward. Bay 4 is a sound. Vance is on the radio. The drive is yours. The swarm is in the vents either way.',
    },
    {
      location: 'Charybdis med-bay during the breach',
      text:
        'Med-bay first. Casualties. Then the lock alarm. The nav-drive was stashed in a locker you should not have opened.',
    },
    {
      location: 'Charybdis canteen at klaxon',
      text:
        'Canteen. Then klaxon. Then everyone running the wrong way. Vance is at Bay 4. You still have the sphere.',
    },
    {
      location: 'a Charybdis maintenance crawl',
      text:
        'Crawlspace. Clicking above the grate. You hear Vance on the lock. The drive knocks against the pipe. First page is whether you drop into the bay.',
    },
    {
      location: 'Charybdis bridge with no helm',
      text:
        'Bridge is empty. Swarm on the cameras. Bay 4 is the only undogged lock. The fleet does not know. You do.',
    },
  ],

  'rose-gold-ultimatum': [
    {
      location: 'the VIP Powder Room at the Starlight Gala',
      text:
        'Bride sobbing. Dossier in your clutch. Julian’s knock. Chloe knows the laundry chutes. Lie, leak, or walk — the gala is already a crime scene of manners.',
    },
    {
      location: 'the hotel service hallway',
      text:
        'You are already in the service hall. The powder room is a closed door and a knock. Chloe has the chutes. The dossier is still yours.',
    },
    {
      location: 'Starlight Gala ballroom edge',
      text:
        'Ballroom first. Then the bride’s collapse. Then the powder room. Julian is already smiling for cameras that are not yours.',
    },
    {
      location: 'Starlight Gala cloakroom',
      text:
        'Cloakroom. The dossier was planted in a coat. You took it. The powder-room crisis is one corridor away.',
    },
    {
      location: 'a Starlight Gala balcony',
      text:
        'Balcony air. Phone lights below. Chloe texts: now. Julian is at the powder-room door. The clutch is heavy.',
    },
    {
      location: 'Starlight kitchens during the gala',
      text:
        'Kitchens. Chloe’s turf. The bride is a rumor upstairs. The dossier is real. Julian will find this room third.',
    },
  ],

  'null-parameter-protocol': [
    {
      location: 'the Shattered Summoning Dais of Aethelgard',
      text:
        'Cubicle gone. Ozone. You lie in a crater of runes. ERROR 404: HERO NOT FOUND. Kaelen offers a cloak. Executioners are coming for failed summons.',
    },
    {
      location: 'the jagged wilds beyond the crater',
      text:
        'You wake past the dais, not on it. The error still hangs in your eyes. Kaelen finds you. The Vanguard wants the glitch dead, not interviewed.',
    },
    {
      location: 'an Aethelgard roadside after the failed summon',
      text:
        'Road, not crater. Office clothes. A crystal in your fist. A battle-mage bleeding. The System is a story object you can crash.',
    },
    {
      location: 'a Vanguard checkpoint outside Aethelgard',
      text:
        'You are already in a cage-wagon. Failed summon. Kaelen is the other prisoner. The error in your eyes is the only key.',
    },
    {
      location: 'Aethelgard tavern, still in Earth clothes',
      text:
        'Someone dragged you to a tavern before the purge squad. The crystal is in the ale-stain. Kaelen wants you to run. The Crown wants a hero that exists.',
    },
    {
      location: 'the dais under rain',
      text:
        'Rain on shattered obsidian. Same error. Fewer witnesses. Kaelen’s cloak. The next page is run, talk, or poke the hologram.',
    },
  ],

  'resin-sonata': [
    {
      location: 'the Glass Atrium of the Grand Funicular',
      text:
        'Seawater weeps in. High-Architect dead. Eden-Resin syringe in your hand. Aris offers maintenance shafts. Brass-Gargant footsteps on the promenade.',
    },
    {
      location: 'Opaline maintenance shafts',
      text:
        'You start in the shafts. The atrium is a groan above. Aris is ahead with a wrench. The syringe is still unspent.',
    },
    {
      location: 'an Opaline pressure-lock',
      text:
        'Lock first. Then the atrium news. The last uncorrupted resin is a rumor until it is in your fist. The Gargant is a timetable.',
    },
    {
      location: 'Opaline promenade before the atrium',
      text:
        'Promenade. Mutated socialites. Then the Glass Atrium. Aris. The syringe. Follow the drip or seal a hatch.',
    },
    {
      location: 'a dry Opaline side-chapel',
      text:
        'One dry room. The parasite is a hymn in the pipes. The syringe is the last clean note. Aris knows the shafts.',
    },
    {
      location: 'Opaline funicular car, stalled',
      text:
        'The car stalled between wards. Ocean against the glass. The Architect is already dead above. You still have to climb.',
    },
  ],

  'umbra-protocol': [
    {
      location: 'the Bell-Tower of the Grand Exchange',
      text:
        'Archbishop dead. Architect’s Ledger ticking in your hands. Guard hounds through stained glass. Sable tosses a climbing harness. Blend or climb.',
    },
    {
      location: 'the rooftops of Veridia',
      text:
        'You are already on the roofs. The tower is a bell-scream behind. Sable is hit. The Ledger still ticks. The list of architects is not safe.',
    },
    {
      location: 'Grand Exchange floor during the bells',
      text:
        'Floor crowd, not tower. Then the bells. Then blood upstairs. You still have to get the book. Sable already has a hole in her side.',
    },
    {
      location: 'a Veridia blind-spot alley',
      text:
        'Alley first. Harness second. Tower third. The Ledger is a weight you stole on the way down — or have not stolen yet.',
    },
    {
      location: 'Veridia belfry stair',
      text:
        'Stair, not floor. Glass going. Sable above. The Archbishop is a problem you are about to own.',
    },
    {
      location: 'a Veridia disguise shop at dusk',
      text:
        'You start in a change of clothes. The tower job is tonight. The Ledger is the reason. Sable is the complication.',
    },
  ],

  'crimson-nocturne': [
    {
      location: 'The Weeping Mausoleum of House Valerius',
      text:
        'Blood on lace. Ampoule from your sire’s ashes. Rams at the marble. Julian weeps scarlet and offers the catacombs. Drink, refuse, or kneel to hunters.',
    },
    {
      location: 'the catacombs beneath House Valerius',
      text:
        'Catacombs first. Fire is a rumor above. Julian is already here. The vial is in your cuff. The Inquisition will find the stairs.',
    },
    {
      location: 'Lacrimosa street outside the mausoleum',
      text:
        'You are in the street when the rams hit. Blessed fire. You still have the Ampoule. Julian is a voice from the dark.',
    },
    {
      location: 'a Valerius crypt alcove',
      text:
        'Alcove. Sire already ash. The vial is yours. Julian’s hand. Hunters’ Latin. The next page is thirst.',
    },
    {
      location: 'House Valerius chapel under siege',
      text:
        'Chapel, not mausoleum. Same fire. Same vial. Julian wants the dark. The hunters want a kneeling corpse.',
    },
    {
      location: 'the mausoleum doors from the inside',
      text:
        'You hold the doors. The rams hit your shoulders. Julian has the catacomb key. The Ampoule is a choice that will not wait.',
    },
  ],

  'onyx-blood-covenant': [
    {
      location: "The VIP Mezzanine of 'The Obsidian Orchid'",
      text:
        'Bass. A Lycan snaps the bouncer. Sanguine Ledger against your chest. Kaelen’s motorcycle is the night’s only exit. Get on, refuse, or walk into the pack.',
    },
    {
      location: 'the alley behind The Obsidian Orchid',
      text:
        'Alley first. Bike already hot. The club is a bass-thud. Kaelen is possessive. The Ledger is still upstairs until you say otherwise.',
    },
    {
      location: "The Obsidian Orchid dance floor",
      text:
        'Floor, not mezzanine. Then the snap. Then the Ledger. Kaelen’s jaw is crimson. The pack is already in the stairwell.',
    },
    {
      location: 'a Night-Lord safehouse after the club',
      text:
        'You are already out. The Ledger is warm. Kaelen wants the bond named. The pack wants the book. First page is still the night.',
    },
    {
      location: "VIP stairs of The Obsidian Orchid",
      text:
        'Stairs. Bouncer dying above. Kaelen below. You have not decided if the Ledger is leverage or a love-letter.',
    },
    {
      location: 'a rain-slick Night-city overpass',
      text:
        'Overpass. Bike. Club behind. Ledger in the jacket. Kaelen asks once. The coven and the pack are both on the radio.',
    },
  ],

  'salt-road-heist': [
    {
      location: 'a warehouse loft before the salt-tax score',
      faction: 'the crew',
      summonIntent: 'First move is yours — the plan, the cut, or the walk.',
      openingCost: 'Walk and you are out of the crew before Heat is even up.',
      page1:
        'The warehouse loft smells of dust and old rope. A stolen map of the Salt Road is pinned to a crate, the Consul tax ledger marked as the prize. Heat is still zero. Nobody in the crew is watching the map — they are watching each other’s hands. The muscle leans across the crate. “Talk is done. First move is yours — the plan, the cut, or the walk.”',
      text:
        'Crew. Map. Salt-tax ledger on a Consul caravan. Heat is still zero. Trust is not. First page is the plan, the cut, or the walk.',
    },
    {
      location: 'a Salt Road waystation',
      faction: 'an enforcer',
      summonIntent: 'The enforcer wants to hear why you are late.',
      openingCost: 'Someone already sold a name. He can sell yours next.',
      page1:
        'The waystation is a cramped shack on the Salt Road, woodsmoke and stale ale. You are supposed to join the crew here, a day out from the Consul caravan. Someone in the local syndicate has already sold a name, and the room is too quiet. An enforcer at the bar blocks the path to their table. “You’re late,” he says, and waits. What do you tell him?',
      text:
        'You join the crew at a waystation, not a loft. The caravan is a day out. Someone already sold a name.',
    },
    {
      location: 'the Consul caravan’s night camp',
      faction: 'the thief beside you',
      summonIntent: 'The thief wants your move on the lockbox.',
      openingCost: 'Go loud and Heat rises before dawn.',
      page1:
        'Night camp on the Salt Road. You are already on the job, crouched in the wagon-shadow. The tax ledger sits in an iron lockbox a few feet away. Armed hirelings move between lanterns. Go loud and Heat rises before dawn. The thief beside you has picks out and is waiting on your move.',
      text:
        'You start on the job, not the planning. The ledger is in a locked wagon. Heat will rise if you go loud.',
    },
    {
      location: 'a Salt Road tavern hire',
      faction: 'Vessa',
      summonIntent: 'Vessa wants a cutter and a name she can use.',
      openingCost: 'The watch is already in the door. She can leave you to them.',
      page1:
        'Pipe smoke and cheap wine in a Salt Road tavern booth. Vessa sits across the sticky wood and wants a cutter. The score is local politics wearing a padlock; rivals are buying names before you have one. The door opens on two watchmen scanning the room. She keeps a silver pouch under her hand and waits to hear what you call yourself.',
      text:
        'Tavern. Vessa wants a cutter. The score is politics wearing a padlock. Rivals want your names before you have one.',
    },
    {
      location: 'a cliff path above the caravan road',
      faction: 'the scout',
      summonIntent: 'The scout wants who leads — wait, strike, or abort.',
      openingCost: 'Abort and the caravan rolls without you.',
      page1:
        'Wind on the cliff path above the Salt Road. You are in the scrub, eyes on the wagons below. The crew is late. Twenty outriders surround a rumor of a ledger. Wait, strike in the pass, or abort. Down below a horse whinnies and the caravan starts to halt. The scout beside you is waiting on who leads.',
      text:
        'Eyes on the road. The crew is late. The ledger is a rumor with guards. First choice is wait, steal early, or abort.',
    },
    {
      location: 'a safehouse after a rehearsal gone loud',
      faction: 'the muscle',
      summonIntent: 'The muscle wants a name to give if the watch kicks the door.',
      openingCost: 'Someone in this room wants out, and may sell the rest.',
      page1:
        'The safehouse reeks of sweat and spilled drink. The rehearsal went loud — fake guards fought, bells rang — and Heat is already up in the district. The real Salt Road score will be worse. Someone in this room wants out, and might sell the rest. The muscle stops in front of you with a bloodied crowbar, waiting to hear whose name you give if the watch kicks the door.',
      text:
        'Rehearsal already made Heat. The real score is worse. Someone wants out. The Consul does not know — yet.',
    },
    {
      location: 'a salt-pan camp at dawn',
      faction: 'Vessa',
      summonIntent: 'The cutter wants to hear if you lead, cut, or walk.',
      openingCost: 'Walk and the crew goes on without you.',
      page1:
        'Dawn glare off the salt pans. You join the crew here, not in a loft. The Consul caravan is two ridges over. Vessa has the map weighted with a stone. Heat is still zero. The cutter across the fire is waiting to hear if you lead, cut, or walk.',
      text:
        'Salt pans at dawn. The loft is a rumor. The caravan is two ridges over. First move is still yours.',
    },
    {
      location: 'the Consul counting-house back door',
      faction: 'a hired lockpick',
      summonIntent: 'The lockpick wants your word before the grate.',
      openingCost: 'Go loud and Heat rises in the district before the caravan moves.',
      page1:
        'You start at the Consul counting-house back door, not the road. The tax ledger is inside an iron cage you can already see through a grate. A hired lockpick is waiting on your word. Go loud and Heat rises in the district before the caravan ever moves.',
      text:
        'Back door, not the Salt Road. The ledger is already in sight. Heat will rise if you go loud here.',
    },
  ],

  'glass-harbor-letters': [
    { location: 'the docks at Glass Harbor', text: 'Dawn letters. A packet that should not have your name. Tide against the pilings. Someone wants the mail unread.' },
    { location: 'Glass Harbor sorting loft', text: 'Loft first. Steam and glue. A letter with a false seal. The docks are a rumor of who paid.' },
    { location: 'a Glass Harbor cafe with a wet envelope', text: 'Cafe. Envelope. Your name in a dead man’s hand. The harbor still thinks this is postage.' },
    { location: 'Glass Harbor night pier', text: 'Night pier. A drop. The letters are already late. A cutter wants the packet more than the crown does.' },
    { location: 'a customs shed at Glass Harbor', text: 'Customs. The packet is contraband if anyone opens it. You opened it. Now the shed door is a choice.' },
    { location: 'Glass Harbor boarding-house stair', text: 'Stair. Landlady. A letter slipped under a door that is not yours. The docks can wait until you decide who you are.' },
  ],

  'embercourt-oath': [
    { location: 'Embercourt’s outer hall', text: 'Oath-day. Banners. A vow that will outlive the speaker. Someone in the gallery already broke theirs.' },
    { location: 'Embercourt yard at first torch', text: 'Yard. Torches. The hall is still closing ranks. Your name is on a list you did not write.' },
    { location: 'a side chapel of Embercourt', text: 'Chapel first. The oath is a whisper. The court is a knife. You can still leave before they notice you.' },
    { location: 'Embercourt feast before the vow', text: 'Feast. Then the vow. Then the person who will not kneel. You are seated too close.' },
    { location: 'the road to Embercourt', text: 'Road. Rain. The oath is tomorrow. A messenger wants you to turn around.' },
    { location: 'Embercourt cells under the hall', text: 'You start in a cell. The oath is happening without you — or because of you. A key is a rumor.' },
  ],

  'rainglass-case': [
    { location: 'a rain-glass detective office', text: 'The case is already on the blotter. Rain against the glass. A client who is lying. A city that prefers you slow.' },
    { location: 'Rainglass alley behind the office', text: 'Alley first. A body that is not the case yet. Then the office. Then the lie.' },
    { location: 'a Rainglass tram at night', text: 'Tram. Envelope. You are already hired. The office is a destination, not a start.' },
    { location: 'Rainglass morgue slab', text: 'Morgue. The case has a face. The client will hate that you saw it first.' },
    { location: 'a Rainglass club with a false name', text: 'Club. Your name is not the one at the door. The case is a song. Someone wants it unsung.' },
    { location: 'Rainglass bridge in the rain', text: 'Bridge. A drop. The office light is still on. The city is a smear. First page is who you wait for.' },
  ],

  'static-house': [
    { location: 'the front hall of Static House', text: 'The house is louder than the storm. Radios that should be dead. A family that will not admit the static is a guest.' },
    { location: 'Static House kitchen at odd hours', text: 'Kitchen. The kettle knows a frequency. Someone upstairs is answering it.' },
    { location: 'a Static House attic of dead sets', text: 'Attic. Stacked radios. One of them is still warm. The family wants you to unplug the wrong one.' },
    { location: 'Static House porch in the storm', text: 'Porch. You have not gone in. The house is already talking. First page is the knocker.' },
    { location: 'Static House cellar switchboard', text: 'Cellar. A switchboard that predates the house. Voices on a line that has no poles.' },
    { location: 'the lane to Static House', text: 'Lane. The house is a silhouette with too many aerials. A neighbor will not look at it. You will.' },
  ],

  'driftwake-crew': [
    { location: 'Driftwake’s wet deck at launch', text: 'Crew. A job that is not on any chart. The wake is already wrong. First page is who you trust with the wheel.' },
    { location: 'a Driftwake dock before cast-off', text: 'Dock. Arguments. The chart is a fake. Someone still wants to sail.' },
    { location: 'Driftwake hold during a squall', text: 'Hold first. Deck later. The cargo is a problem. The crew is a worse one.' },
    { location: 'Driftwake galley after a bad watch', text: 'Galley. Someone did not come back from watch. The sea is not done. The captain will not say the name.' },
    { location: 'a fog bank off Driftwake’s bow', text: 'Fog. No deck visible. Voices that are not the crew. The job was supposed to be simple.' },
    { location: 'Driftwake crow’s nest', text: 'Nest. A light that is not a lighthouse. The crew wants you down. The light wants you staring.' },
  ],

  'ashline-convoy': [
    { location: 'Ashline road at the convoy’s tail', text: 'Ash on the wind. Wagons. A route nobody maps twice. Something ahead is already burning.' },
    { location: 'an Ashline wayfort', text: 'Wayfort. The convoy is late. The ash is early. You are hired to be the reason it arrives.' },
    { location: 'Ashline night camp', text: 'Camp. No fire — ash takes it. A scout did not return. The road continues whether you do.' },
    { location: 'a burned village on the Ashline', text: 'Village first. Convoy second. The ash has a schedule. Survivors want space on a wagon.' },
    { location: 'Ashline ridge lookout', text: 'Ridge. The convoy is a line of insects. The next town is a rumor of roofs.' },
    { location: 'the Ashline gate of the last intact town', text: 'Gate. They may not let the convoy in. You are the argument. The ash does not negotiate.' },
  ],

  'twin-lanterns': [
    { location: 'the Twin Lanterns inn common room', text: 'Two lanterns, two stories. Someone is lying in both. A room is available if you pick a side without knowing the sides.' },
    { location: 'Twin Lanterns yard at dusk', text: 'Yard. One lantern is dark. The innkeep will not say which guest did that. You have a key anyway.' },
    { location: 'a Twin Lanterns upstairs corridor', text: 'Corridor. Two doors, two arguments. The common room is a noise. First page is which knock you answer.' },
    { location: 'the road sign for Twin Lanterns', text: 'Sign. Rain. The inn is a glow. A traveler going the other way will not meet your eye.' },
    { location: 'Twin Lanterns cellar', text: 'Cellar. A third lantern that is not on the sign. The inn has a story it does not sell upstairs.' },
    { location: 'Twin Lanterns stable', text: 'Stable. A horse that arrived without a rider. The inn wants you to ask downstairs, not up.' },
  ],

  'redmesa-claim': [
    { location: 'Redmesa claim shack at noon', text: 'Heat. A stake in the ground. Someone else’s claim-jump is already a rumor. Water is the real score.' },
    { location: 'Redmesa ridge above the claim', text: 'Ridge. Dust. The shack is a matchbox. Riders on the other heat-shimmer want the paper in your pocket.' },
    { location: 'a Redmesa saloon hire', text: 'Saloon first. Claim second. The job is holding dirt. The town is holding its breath.' },
    { location: 'Redmesa dry creek', text: 'Creek with no water. The claim depends on a spring that may be a lie. First page is whether you dig or ride.' },
    { location: 'Redmesa night on the claim', text: 'Night. Coyotes that are not coyotes. A lantern on the next ridge that should not be there.' },
    { location: 'the land office in Redmesa', text: 'Office. The claim is a stamp. The man who stamped it is already gone. You still have to stand on the dirt.' },
  ],

  'cape-district-vigil': [
    { location: 'Cape District night beat', text: 'Foghorn. A vigil that is not quite police. Someone is missing on the cape path. The district wants it quiet.' },
    { location: 'Cape District pier office', text: 'Office. Paperwork. Then a body the tide returned. The vigil starts whether you signed the book.' },
    { location: 'the cape path at last light', text: 'Path. Wind. A lantern that is not yours. The district behind you pretends this is still a promenade.' },
    { location: 'Cape District boarding house', text: 'Boarding house. A tenant who will not come down. The cape has weather that is a person.' },
    { location: 'a Cape District chapel watch', text: 'Chapel. Vigil in the old sense. The missing were last seen lighting a candle that would not stay lit.' },
    { location: 'Cape District tram terminus', text: 'Terminus. Last tram. Fog. You are the only one who got off. The cape path starts here.' },
  ],

  'wayfarers-map': [
    { location: 'a wayfarer’s table with an unfinished map', text: 'Ink still wet. Roads that move. A patron who wants a town that may not exist. First page is which line you trust.' },
    { location: 'a crossroads the map does not admit', text: 'Crossroads. The map is wrong on purpose. A fellow wayfarer offers a copy that is worse.' },
    { location: 'a cartographer’s loft', text: 'Loft. Compasses that disagree. Your commission is a coast that ate the last surveyor.' },
    { location: 'a roadside shrine to lost roads', text: 'Shrine. Tokens for places that folded. The map in your pack just gained a stain that is a path.' },
    { location: 'an inn that is on no gazetteer', text: 'Inn. The map put you here. The innkeep has never heard of your patron. The next page is stay or redraw.' },
    { location: 'a cliff the map calls a ferry', text: 'Cliff. No ferry. The map is lying or the world is. You still have to get the party down.' },
  ],

  'hearthwick-teas': [
    { location: 'Hearthwick’s front parlor', text: 'Tea that is not only tea. A customer who will not leave. The blend on the counter has a rumor in it.' },
    { location: 'Hearthwick kitchen after closing', text: 'Kitchen. The shop is locked. Someone is still ordering. The kettle knows a name you have not heard.' },
    { location: 'Hearthwick lane at opening bell', text: 'Lane. Queue. A blend that sold out before you arrived — except one tin with your name.' },
    { location: 'a Hearthwick greenhouse', text: 'Greenhouse. Leaves that should not grow here. The parlor is a front. First page is harvest or tell.' },
    { location: 'Hearthwick upstairs let-room', text: 'Let-room. The shop below is a muffled ritual. Your rent is tea and silence.' },
    { location: 'the alley behind Hearthwick', text: 'Alley. Spent leaves that steam in cold air. A delivery that is not from any wholesaler.' },
  ],

  'blank-canvas': [
    { text: 'An empty ledger. You name the place. The camera waits on your first fact. Nothing major is true until you say it.' },
    { text: 'A doorway with no world behind it yet. Codex cards will be ground truth. The first page is location, tone, and one hard rule.' },
    { text: 'A table, a map with no ink, a question: where does this custom world actually start?' },
  ],
  'blank-canvas-dnd': [
    { text: 'Tabletop custom. The road, tavern, or keep is whatever you just named. Dice later. First page is the place you sit down in.' },
    { text: 'An inn book with no town yet. Folk, kit, and the first rumor are yours to lock. The GM follows your cards.' },
    { text: 'A crossroads miniature with no painted hills. You say the weather. The tale starts walking.' },
  ],
  'blank-canvas-rpg': [
    { text: 'Story RPG custom. No dice HUD. The first sentence is the place and the problem you named. The AI does not invent a different premise.' },
    { text: 'A blank first page. Your Codex is canon. Open in the room you actually want, not a default street.' },
    { text: 'A door. Your rules. The camera is HERE once you say where HERE is.' },
  ],
};
