import type { CampaignBible } from './types';

/**
 * Original SynapticGM isekai bible.
 * Genre tropes only — not any novel, anime, or game IP.
 * Hero vs villain is a stamp + player choice, not a forced allegiance.
 */
export const summonedPact: CampaignBible = {
  id: 'summoned-pact',
  title: 'The Summoned Pact',
  archetype: 'isekai',
  engineMode: 'litrpg',
  difficulty: 'Standard',
  tagline: 'They meant to summon a hero. The System also stamped a calamity.',
  shortDescription:
    'Hero/villain summoning LitRPG: Earth clothes, a glitched blessing, and a kingdom that needs you obedient. Obey, refuse, or play both sides — original world.',
  licenseNote:
    'Original SynapticGM setting. Uses common isekai summon tropes (circle, prophecy, cheat blessing, kingdom vs “demon” court, hero/villain stamp). Not based on any named series, novel, or anime.',
  startingLocation: 'The Sevenfold Circle under Valespire Cathedral',
  replaceDefaultLoadout: true,
  startingContainer: { id: 'sp-pockets', name: 'Pockets and bag from Earth', capacity: 16 },

  openingRegistrar: {
    voice: 'system',
    label: 'SYSTEM',
    startLine: 'Summoning complete. Confirm designation. Then name the Earth place the circle took you from — not a destination in this world.',
  },
  openingHook:
    'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault. Robed figures freeze mid-chant. A blue panel hangs at eye level — private, yours. One of them whispers “Pactborn.” Another, quieter: “The Mark is wrong.” Nobody hands you a sword. Your Earth clothes are still on you. The System has not asked you to save anyone yet.',
  openingPrompts: [
    { id: 'name', kind: 'name', question: 'Confirm designation.' },
    {
      id: 'where',
      kind: 'location',
      question: 'Origin lock. Name the Earth place you were in when the light took you (city, street, country). This is not a destination in Valespire.',
      suggestions: ['A city I actually know', 'Random Earth city', 'I was at home'],
    },
    {
      id: 'wear',
      kind: 'appearance',
      question: 'Visual profile. What were you wearing when the circle took you?',
      suggestions: ['What I had on today', 'Travel clothes', 'Whatever I slept in'],
    },
    {
      id: 'pockets',
      kind: 'kit',
      question: 'Personal-effects scan. What was actually on you? Combat-grade inventions will be rejected.',
      suggestions: ['Phone, keys, wallet', 'A bag with everyday stuff', 'Almost nothing'],
    },
  ],

  premise: `You were an ordinary person on Earth. A ritual in another world — the Sevenfold Circle, under Valespire Cathedral — pulled you through. The kingdom of Pellane summoned a [Pactborn] to end a war with the Ash Court. The System also rolled a second stamp: [Calamity Mark]. One summoned soul can carry either, or flicker between them. The court will call you Hero. The Ash Court will call you theirs. You do not have to answer either.

OPENING KIT (AUTHORITY): Worn clothes and pocket contents from Earth are the kit. Never invent an iron shortsword, traveler tunic, or healing draught unless the ledger already has it. The only System gift at registration is an unidentified [Circle Blessing] (glitched passive). Appraisal is required to name it.

PLAYER AGENCY (BINDING): No forced allegiance. Protest, jokes, and “why should I save you” are dialogue. The first scene is the circle and the people in the vault — not a journal dump. Do not unlock or name Guide Book quests until they are spoken in play.

HERO / VILLAIN FORK (CODE + WRITER):
- [Pactborn]: the court wants a champion. Privileges, handlers, a leash.
- [Calamity Mark]: the ritual “failed” or succeeded too well. Fear, exile offers, Ash Court envoys.
- The player’s first answers (cooperate / refuse / ask who is in charge) tilt the stamp. It can still flip later if they act against it.
- There is always one other summoned person in this age — the opposite stamp. Do not introduce them until a side or special seed is earned.

STORY SPINE (skeleton — unique each run; do not recap as a lecture):
1. Circle. Names. Blessing unidentified. Court argument in front of you.
2. First free hour in Valespire (cathedral close, market, or a locked guest wing) — ordinary people, not the war.
3. A handler asks you to swear the Pact. Swearing is optional. Refusal has social cost, not instant prison unless they attack.
4. First real threat is local (marked beast in the close, a sabotaged ward, a frightened crowd) — not the Ash King.
5. Proof the war story is incomplete (a letter, a prisoner, a cracked circle).
6. Meet or hear of the other summoned (opposite stamp).
7. Choose a side, a third path, or a lie that buys time.

SIDE QUEST SEEDS (writer only — spawn when the player looks, talks, or wanders; never dump the list):
- Otherworld Junk: a fence in Lowmarket pays for Earth objects (dead phone, branded shirt). Draws thieves and a System flag.
- The Kitchen Saint: cathedral cooks feed conscripts; a missing sack of grain is a crime or a mercy.
- Marked Child: a kid’s panel shows a fragment of your Blessing. Protect, report, or hide them.
- Appraisal Errand: a licensed Appraiser will name your Blessing for a favor — or lie.
- Wall-Watch: militia wants you on the west wall “for morale.” You can walk the wall, fake it, or vanish.
- Quiet Funeral: someone died in the ritual that brought you. Their sibling wants answers, not a hero speech.

SPECIAL / HIDDEN QUEST SEEDS (writer only — earn in scene; never as opening journal):
- The Other Circle: locate the second summoning site (failed or successful).
- Queen’s Private Ledger: Pellane started the war, or sold villages to buy the ritual.
- Ash Court Letter: an envoy offers citizenship if you wear the Calamity Mark openly.
- Sevenfold Crack: the circle is damaged; another summoning will tear the city.
- Blessing True Name: Appraisal reveals the glitch — power with a cost that matches the stamp they refused.
- Pactbreaker: publicly refuse the oath in court. Reputation split; both courts send agents.

Do not name distant hubs, the Ash King, or the other summoned until the player asks or a seed is triggered. Unique story every turn.`,

  loreSnippets: [
    {
      id: 'sp-lore-1',
      title: 'The Sevenfold Circle',
      category: 'mechanic',
      body: 'Seven brass rings inlaid in cathedral stone. Each ring is a vow: Name, Origin, Flesh, Gift, War, Court, Scale. The ritual that brought the player completed six rings. The seventh — Scale — stuttered. That stutter is why two stamps exist. Standing on the circle after arrival still tingles. Leaving it is allowed. Returning later may re-roll a glitched blessing, at a cost the System will not preview.',
      tags: ['circle', 'ritual', 'summoning', 'system'],
    },
    {
      id: 'sp-lore-2',
      title: 'Pactborn and Calamity Mark',
      category: 'mechanic',
      body: 'The System stamps summoned souls. [Pactborn] is the public hero class the court paid for: visible quest markers from the Crown, easier lodging, harder persuasion when you try to leave. [Calamity Mark] is the failure state in their doctrine: shops close, priests ward you, the Ash Court can find you. A soul may show one stamp on the panel and the other in rumor. Appraisal of the person (not just items) can reveal the true mix. Never force the player into either role in prose if they have not chosen it.',
      tags: ['hero', 'villain', 'stamp', 'agency'],
    },
    {
      id: 'sp-lore-3',
      title: 'Circle Blessing (Unidentified)',
      category: 'mechanic',
      body: 'At registration the System grants one glitched passive. Until Appraised it is [???]. Possible truths (pick one per campaign, do not list them in play): a once-per-day rewind of a single failed check; speech that people hear as the language they trust; a weapon that only exists while they are angry; a mark that beasts will not strike first; a leak that lets Ash Court scouts hear their location. Naming it without Appraisal is a lie. Power fantasy without a cost is forbidden — the glitch always has a tell.',
      tags: ['blessing', 'appraisal', 'cheat', 'cost'],
    },
    {
      id: 'sp-lore-4',
      title: 'Pellane and Valespire',
      category: 'world',
      body: 'Pellane is a highland kingdom. Valespire is its capital: cathedral, palace, Lowmarket, west wall. They are losing a grinding war against the Ash Court — not cartoon demons, a rival polity that uses ember-wards and bargains. The court told the public that a summoned Pactborn will end the war in a season. That is propaganda. The player should discover the real military situation by talking and walking, not by a lore dump.',
      tags: ['pellane', 'valespire', 'war', 'capital'],
    },
    {
      id: 'sp-lore-5',
      title: 'The Ash Court',
      category: 'faction',
      body: 'A coalition of ember-priests and march-lords east of the Cinderflow. They call Pellane oath-breakers. They will recruit a Calamity Mark as proof the Scale rejected Pellane. They are not mindless evil. Individual envoys can be honorable, cruel, or both. Do not spawn an Ash army in the cathedral on turn one.',
      tags: ['ash-court', 'faction', 'war'],
    },
    {
      id: 'sp-lore-6',
      title: 'The Scale',
      category: 'culture',
      body: 'Pellane’s state divinity is The Scale — balance, contracts, weighed souls. Priests insist summoning is holy. Street rumor says The Scale only watches. The System never confirms gods. Treat The Scale as culture unless a special seed makes it act.',
      tags: ['religion', 'scale', 'culture'],
    },
    {
      id: 'sp-lore-7',
      title: 'Appraisal Law',
      category: 'mechanic',
      body: 'Reading items, people, and places requires the Appraisal skill or a licensed Appraiser. Unlicensed Appraisal in Valespire is a fine. The player does not start with full lore — they start with eyes. Offer Appraisal as a choice or a hire, not as omniscience.',
      tags: ['appraisal', 'law', 'information'],
    },
    {
      id: 'sp-lore-8',
      title: 'The Other Summoned',
      category: 'history',
      body: 'Every successful Sevenfold ritual in recorded Pellane history pulled two souls and only advertised one. The other is hidden, exiled, or working for the Ash Court. This age’s other summoned is alive. Do not name them until the Other Circle or a rumor the player chases. They are a person with Earth clothes too — not a boss statue.',
      tags: ['double-summon', 'secret', 'mirror'],
    },
  ],

  keyNPCs: [
    {
      id: 'sp-npc-1',
      name: 'High Chanter Orel Vane',
      role: 'Ritual lead',
      disposition: 'ambiguous',
      description: 'Exhausted, precise, already composing the speech that will sell you to the court. Wants the seventh ring closed. Will lie about the stutter if you do not catch it.',
      hooks: ['Explain the Pact', 'Ask you to stay on the circle', 'Offer a private apology if pressed'],
    },
    {
      id: 'sp-npc-2',
      name: 'Captain Sera Quill',
      role: 'Crown handler',
      disposition: 'neutral',
      description: 'Assigned to keep the summoned soul alive and on-script. Respects competence. Hates being a babysitter. Will cover for you once if you do not humiliate the Crown in public.',
      hooks: ['Give a tour of the close', 'Demand you swear', 'Warn about Lowmarket thieves'],
    },
    {
      id: 'sp-npc-3',
      name: 'Brother Tam',
      role: 'Cathedral novice',
      disposition: 'friendly',
      description: 'Saw the seventh ring fail. Too junior to be believed. Will sneak you bread, gossip, and a way out through the kitchens.',
      hooks: ['Kitchen Saint seed', 'Show the crack in the circle', 'Introduce the marked child'],
    },
    {
      id: 'sp-npc-4',
      name: 'Envoy Cinder-Ash (alias “Ash”)',
      role: 'Ash Court agent',
      disposition: 'ambiguous',
      description: 'Does not appear until a special seed or a player who hunts rumors. Soft-spoken. Offers a letter, not a knife, the first time.',
      hooks: ['Ash Court Letter', 'Name the other summoned', 'Ask what you want that Pellane will not give'],
    },
  ],

  starterQuests: [
    {
      id: 'sp-quest-1',
      title: 'The Circle’s Price',
      description: 'You are on the Sevenfold Circle. Hear why Pellane summoned you. Swear the Pact, refuse it, or walk off the brass before anyone owns your name.',
      recommendedLevel: 1,
      objectives: [
        'Get off the floor and look at the vault',
        'Hear the court’s reason (or demand it)',
        'Choose: swear, refuse, or delay',
      ],
      rewards: 'Circle Blessing remains; reputation with Pellane or the street tilts',
    },
    {
      id: 'sp-quest-side-junk',
      title: 'Otherworld Junk',
      description: 'Someone in Lowmarket will pay for Earth objects. The System may flag the sale.',
      recommendedLevel: 2,
      objectives: ['Find a fence', 'Decide what to sell', 'Survive the attention'],
      rewards: 'Coin or heat — not both for free',
    },
    {
      id: 'sp-quest-side-child',
      title: 'Marked Child',
      description: 'A child in the close has a panel fragment that matches your Blessing.',
      recommendedLevel: 2,
      objectives: ['Find the child', 'Protect, report, or hide them'],
      rewards: 'An ally, a priest problem, or both',
    },
    {
      id: 'sp-quest-special-other',
      title: 'The Other Circle',
      description: 'A second summoning site exists. The other soul from this age is there, or was.',
      recommendedLevel: 3,
      objectives: ['Confirm the second circle', 'Find traces of the other summoned'],
      rewards: 'A name, a rival, or a partner',
    },
    {
      id: 'sp-quest-special-ledger',
      title: 'Queen’s Private Ledger',
      description: 'Pellane’s war story does not add up. The ledger is in the palace, not the cathedral.',
      recommendedLevel: 3,
      objectives: ['Get a reason to enter the palace', 'Read or steal a true account'],
      rewards: 'Leverage over the Crown — and a hunt',
    },
  ],

  starterItems: [
    {
      id: 'sp-clothes',
      name: 'The clothes you had on when the light took you',
      rarity: 'Common',
      itemType: 'armor',
      itemLevel: 1,
      equipped: true,
      slot: 'Body',
      provenance: 'Earth — still on you after the circle',
      description: 'Whatever you were wearing on Earth. Not armor. Not a costume. Replace this card when the player names real garments.',
    },
    {
      id: 'sp-blessing',
      name: 'Circle Blessing [???]',
      rarity: 'Rare',
      itemType: 'accessory',
      itemLevel: 1,
      equipped: true,
      slot: 'Shoulders',
      provenance: 'System gift at summoning — unidentified',
      description: 'A glitched passive. Appraisal required to name it. Not a sword. Not a potion.',
    },
  ],
};
