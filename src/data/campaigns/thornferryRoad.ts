import type { CampaignBible } from './types';

/**
 * Original SynapticGM story-RPG: a main-spine pick-your-own-adventure with optional sides.
 * Moral choice, inner commentary, ally/betray, party/solo — genre tropes only.
 * Not Fable, Albion, Heroes Guild, or any licensed world.
 */
export const thornferryRoad: CampaignBible = {
  id: 'thornferry-road',
  title: 'Thornferry Road',
  archetype: 'custom_world',
  engineMode: 'pyoa',
  difficulty: 'Standard',
  genreTag: 'Small-town road',
  tagline: 'A clear road. Hard choices. Your comments are the hero’s pulse.',
  shortDescription:
    'Wren Holt offers to walk the road with you — or you go alone. Ally with the mill, sell out to the magistrate, optional side work, several endings.',
  licenseNote:
    'Original SynapticGM setting. Uses common moral-choice / companion / village-road tropes. Not based on Fable, Albion, or any named game, novel, or show.',
  styleRail: `FORK STYLE (BINDING): walk with Wren, go alone, take Pell’s coin, help or rob at the ford, bless or refuse the chapel. Do not offer shove-Wren-as-bait / hide-the-charter / tap-the-charter unless they typed that.
ENDING LOGIC: Key on where the Millstone Charter went and whether Wren still walks with them. Local mill politics — not a god-emperor ending.`,
  startingLocation: 'the mill landing at Thornferry',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'tf-pack', name: 'Travel pack', capacity: 16 },

  openingRegistrar: {
    voice: 'inworld',
    label: 'THE STORY',
    startLine: 'This tale has a road. Confirm your name, then where it opens — Thornferry, or a place you name.',
  },
  openingHook:
    'Dawn on the mill landing. The ferry rope is wet. Wren Holt waits with a sealed charter and a question that is not small: walk the road together, or walk it alone. Nobody has handed you a destiny. The next page waits on what you say.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Give the name this tale will use.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Where does this open? Thornferry’s mill landing is the default. You may name another place, or pick random.',
      suggestions: ['The mill landing at Thornferry', 'Random place', 'The ferry inn'],
    },
    {
      id: 'look',
      kind: 'appearance',
      question: 'Describe your face and what you are wearing as this begins. Named garments, not adjectives.',
      suggestions: ['Wool cloak, boots, and a plain shirt', 'Local clothes, nothing fancy', 'A coat and the shoes I already owned'],
    },
  ],

  premise: `PLAYER AGENCY (BINDING): This is a long main story with optional side work — not an open sandbox. Follow the spine. Do not invent a kingdom map dump. Side seeds stay hidden until the player looks, talks, or wanders.

INNER VOICE (BINDING): The player’s typed comments, jokes, doubts, and asides ARE the main character’s thoughts and spoken reactions. Give a short inner beat (<thought>…</thought> or a line of dialogue in their voice) that matches what they typed, then let the world answer. Never overwrite their comment with a different personality. Honor the configured PERSPECTIVE. Honor the session’s visual style (comic / classic / tabletop) — do not switch engines.

ALLY / BETRAY / PARTY / SOLO (BINDING):
- Wren Holt offers to walk with them. Accepting makes a party. Refusing is a valid solo run; Wren may return later as rival, ally, or debt.
- Magistrate Pell wants the Millstone Charter for Highmark. Village miller Nedda wants it kept local. The player may ally, stall, or sell anyone out. Betrayal has social cost, not an alignment meter speech.
- Do not force a “good path.” Track who they stood with as story facts.

STORY SPINE (skeleton — unique prose each run; do not lecture the list):
1. Mill landing. Charter. Wren’s offer. First comment from the player is in-character.
2. Thornferry streets — mill, ferry inn, Pell’s clerk. One pressure, not three quests at once.
3. First fork: keep Wren, go alone, or take Pell’s coin in secret.
4. The road to Highmark (one road, a few stops — mill hamlet, ford, gate). Optional sides only if they look.
5. Proof the charter is more than paper (a name, a seal, a lie).
6. Highmark gate: deliver, burn, rewrite, or auction the charter.
7. Aftermath: who still walks with them, who will not.

SIDE QUEST SEEDS (writer only — spawn when earned; never dump):
- Ferry Debt: the boatman wants a signature or a favor.
- Mill Cat: Nedda’s apprentice is missing a night; kindness or ignore.
- Clerk’s Copy: Pell’s clerk offers a duplicate seal. Forgery is a choice.
- Rain at the Ford: help a traveler or rob them. Wren remembers.
- Quiet Bell: a chapel wants the charter blessed. Blessing is politics.

OPENING KIT (AUTHORITY): Worn clothes they named. The Millstone Charter is a quest paper, not a sword. Never invent an iron shortsword or traveler tunic unless the ledger has it.

ENDINGS (pick one when the charter is resolved; never list them in play; never end in the opening hour):
- Mill kept, Wren stayed: local peace, Highmark levy delayed.
- Mill kept, Wren gone or betrayed: you hold the mill alone; Pell sends collectors.
- Sold to Pell, Wren still walking with you: coin and a cold companion.
- Sold to Pell, solo: gold, no friends, mill riot rumor.
- Charter burned or forged: both sides hunt you; a third-path rumor.
- Delivered honestly with Wren: Highmark job offer; the mill remembers.

Do not name distant capitals until the road actually reaches them. Unique story every turn. Styles (wry / earnest / dark) follow the player’s comments.`,

  loreSnippets: [
    {
      id: 'tf-lore-1',
      title: 'Thornferry',
      category: 'world',
      body: 'A mill town on a short river crossing. One ferry, one mill, one inn, a magistrate’s clerk who visits twice a week. Not a capital. The road east is the story; the hills are optional.',
      tags: ['thornferry', 'mill', 'ferry', 'town'],
    },
    {
      id: 'tf-lore-2',
      title: 'The Millstone Charter',
      category: 'history',
      body: 'A sealed paper that says who may grind grain and who pays the levy. Highmark wants it. The mill wants it. Forging it, selling it, or keeping it are all story choices.',
      tags: ['charter', 'mill', 'law', 'quest'],
    },
    {
      id: 'tf-lore-3',
      title: 'Highmark',
      category: 'faction',
      body: 'A hill town two days east. Magistrate Pell speaks for it. They buy loyalty with coin and paper. The player does not start there.',
      tags: ['highmark', 'magistrate', 'road'],
    },
    {
      id: 'tf-lore-4',
      title: 'Walking Together',
      category: 'mechanic',
      body: 'If the player accepts Wren, describe two people on the road — sharing watches, arguing, backing each other. If they go solo, the road is quieter and more dangerous. Leaving someone behind is a stamp, not a lecture.',
      tags: ['party', 'solo', 'companion', 'choice'],
    },
  ],

  keyNPCs: [
    {
      id: 'tf-npc-1',
      name: 'Wren Holt',
      role: 'Charter courier, optional companion',
      disposition: 'ambiguous',
      description: 'Tired, dry humor, keeps the charter close. Will walk with the player or against them. Never a silent pack mule.',
      hooks: ['Offer to travel together', 'Ask if they can be trusted', 'Leave if betrayed'],
    },
    {
      id: 'tf-npc-2',
      name: 'Nedda Mill',
      role: 'Miller',
      disposition: 'friendly',
      description: 'Flour on her sleeves. Wants the charter local. Will feed you; will not forgive a sale to Pell without a fight of words.',
      hooks: ['Ask you to keep the charter', 'Offer a bed', 'Warn about Pell’s clerk'],
    },
    {
      id: 'tf-npc-3',
      name: 'Magistrate Pell',
      role: 'Highmark’s voice',
      disposition: 'neutral',
      description: 'Polite, paid, patient. Offers coin and protection for the charter. Betrayal of the mill is a business hour to Pell.',
      hooks: ['Buy the charter', 'Hire you as escort', 'Threaten the mill levy'],
    },
  ],

  starterQuests: [
    {
      id: 'tf-quest-1',
      title: 'The Road East',
      description: 'Decide what to do with the Millstone Charter — and whether anyone walks with you.',
      recommendedLevel: 1,
      objectives: ['Hear Wren’s offer', 'Choose party or solo', 'Take the charter toward Highmark or keep it'],
      rewards: 'A companion, an enemy, or both',
    },
  ],

  starterItems: [
    {
      id: 'tf-charter',
      name: 'Millstone Charter',
      rarity: 'Uncommon',
      itemType: 'quest',
      itemLevel: 1,
      description: 'Sealed paper. Opening, selling, or delivering it is a story choice. Not a weapon.',
    },
  ],
};
