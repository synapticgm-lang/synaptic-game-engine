import type {
  CampaignBible,
  Difficulty,
  KeyNPC,
  LoreSnippet,
  OpeningMode,
  StarterQuest,
} from '@/data/campaigns/types';
import type { CampaignArchetype } from '@/game/archetypes';
import type { EngineMode } from '@/game/types';
import { resolveCustomBlankBible } from './customBlank';

export type LoreCategory = LoreSnippet['category'];
export type NpcDisposition = KeyNPC['disposition'];

export interface ExpertLoreDraft {
  title: string;
  category: LoreCategory;
  body: string;
}

export interface ExpertNpcDraft {
  name: string;
  role: string;
  disposition: NpcDisposition;
  description: string;
  hooks: string;
}

export interface ExpertQuestDraft {
  title: string;
  description: string;
  objectives: string;
}

export interface ExpertCustomDraft {
  title: string;
  tagline: string;
  genreTag: string;
  difficulty: Difficulty;
  premise: string;
  styleRail: string;
  startingLocation: string;
  worldNotes: string;
  fillGaps: boolean;
  lore: ExpertLoreDraft[];
  npcs: ExpertNpcDraft[];
  quests: ExpertQuestDraft[];
  openingHook: string;
  openingMode: OpeningMode;
  kitNote: string;
  folk: string;
}

export function emptyExpertDraft(): ExpertCustomDraft {
  return {
    title: 'Custom Campaign',
    tagline: '',
    genreTag: 'Custom',
    difficulty: 'Standard',
    premise: '',
    styleRail: '',
    startingLocation: '',
    worldNotes: '',
    fillGaps: true,
    lore: [],
    npcs: [],
    quests: [],
    openingHook: '',
    openingMode: 'weave',
    kitNote: '',
    folk: '',
  };
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)] ?? list[0];
}

const PITCHES = [
  'A quiet harbor town hides a ledger that writes itself at midnight.',
  'Two rival guilds share one street — and one missing courier.',
  'The last train out of the ashlands never arrived.',
  'A frontier hold’s wall-warden died; the wall still speaks.',
  'Someone auctioned a sealed Threshold key in a back-room den.',
  'A sky-port’s lighthouse shows islands that are not on any chart.',
  'The academy’s top student vanished mid-exam — with the exam.',
  'A fishing village’s nets bring up stamped System coins.',
];

const TAGLINES = [
  'You define the rules. The ledger keeps score.',
  'Original names only. The AI follows your sheets.',
  'Build the world. Then survive what you wrote.',
  'Blank rails. Your lore is ground truth.',
];

const GENRES = ['Custom', 'Mystery', 'Heist', 'Frontier', 'Academy', 'Horror', 'Romance', 'War', 'Exploration'];

const PREMISES = [
  'This campaign begins with a nearly empty ledger. Your Codex cards and opening answers are canon. The AI must not invent major factions, places, or laws without your confirmation — propose, then wait.',
  'A lived-in world with soft rules: travel is slow, rumors matter, and violence has social cost. Start small — one street, one problem — before any continent-spanning plot.',
  'Power exists, but it is scarce and tracked. Named abilities need Appraisal or a sheet. The opening scene is local pressure, not a prophecy lecture.',
  'Tone is grounded and specific. Prefer named people and places over archetypes. If a fact is not on a card or in opening answers, it is not settled yet.',
];

const STYLE_RAILS = [
  'Honor player opening canon for folk, place, look, and kit. Original names only — never paste closed novels or licensed settings. Keep the first hour local.',
  'Prose stays in the chosen perspective. No System jargon dumps. Quests stay unspoken until they appear in play. Describe rooms before creatures indoors.',
  'Consequences stick. Soft-fail when possible, but lies and debts return. Do not railroad allegiance. Comedy is allowed; cruelty needs player consent via tone.',
];

const PLACES = [
  'Lampmere market square',
  'Ashline Yard staging posts',
  'The Low Watt — food and rumor hub',
  'Greyferry dock warehouses',
  'Salt road waystation',
  'Cinder undercroft annex',
  'North bridge watch house',
  'where this tale opens',
];

const WORLD_NOTES = [
  'Mixed-folk city-state; Thresholds open in cellars and vaults.',
  'Frontier hold on a salt road; caravans are law.',
  'Sky-port over a fog sea; lifts and contracts.',
  'Rainy coastal metro; crews clear sealed annexes.',
  'Hill academy town; exams can kill.',
];

const LORE_DECK: ExpertLoreDraft[] = [
  {
    title: 'Author’s Authority',
    category: 'mechanic',
    body: 'Only Codex cards, quest sheets, and confirmed opening answers are canon. The AI proposes; the ledger commits.',
  },
  {
    title: 'The First Street',
    category: 'world',
    body: 'One named street or square is the opening hub. Distant cities stay unnamed until the player asks or travels.',
  },
  {
    title: 'Shared Law',
    category: 'culture',
    body: 'Contracts and public Grades (or local equivalents) matter more than speeches. Breaking a deal has social cost.',
  },
  {
    title: 'Scarce Power',
    category: 'mechanic',
    body: 'Named skills and rare items require discovery. Do not invent endgame gear at chargen.',
  },
  {
    title: 'Quiet Hands Rumor',
    category: 'faction',
    body: 'A research circle buys samples and secrets. Useful, clinical, never free.',
  },
  {
    title: 'Old Threshold',
    category: 'history',
    body: 'Eight years or eight ages ago — skin to the world — the first sealed rift changed the local economy.',
  },
];

const NPC_DECK: ExpertNpcDraft[] = [
  {
    name: 'Mara Keene',
    role: 'Crew lead / fixer',
    disposition: 'friendly',
    description: 'Practical, allergic to speeches. Will cover one lie if you do not get her people killed.',
    hooks: 'Offer a job share; ask what you saw; warn about auditors',
  },
  {
    name: 'Lin Vos',
    role: 'Auditor / clerk',
    disposition: 'ambiguous',
    description: 'Polite clipboard energy. Offers legal cover and a leash in the same breath.',
    hooks: 'Voluntary interview; temporary stamp; hint that growth leaves a tell',
  },
  {
    name: 'Pax Orr',
    role: 'Fence',
    disposition: 'ambiguous',
    description: 'Buys curios and hush. Smiles like a receipt.',
    hooks: 'Buy scrap; fake papers; broker a researcher',
  },
  {
    name: 'Dr. Rhee',
    role: 'Healer',
    disposition: 'friendly',
    description: 'Heals first, asks hard questions second. Notices injuries that do not match the story.',
    hooks: 'Patch wounds; press on contradictions; tip about sample hunters',
  },
  {
    name: 'Joss Vale',
    role: 'Rival professional',
    disposition: 'ambiguous',
    description: 'Peaked early and knows it. Competitive, not stupid.',
    hooks: 'Joint job; challenge your story; sponsor registration for a favor',
  },
];

const QUEST_DECK: ExpertQuestDraft[] = [
  {
    title: 'Walk Out Breathing',
    description: 'Survive the opening pressure and decide who learns your secret.',
    objectives: 'Get clear of danger; give someone an answer (true, partial, or lie); choose hide, register, or bargain',
  },
  {
    title: 'First Share',
    description: 'A local crew offers a small job if you can follow orders.',
    objectives: 'Show up at the staging hub; accept, decline, or renegotiate; complete or abort',
  },
  {
    title: 'Scrap Fence',
    description: 'Someone pays for curios from the incident. The sale can draw heat.',
    objectives: 'Find the fence; decide what to sell; survive the attention',
  },
];

const OPENING_HOOKS = [
  'Dust and voices. A private panel only you can see. Someone wants a headcount.',
  'Dawn market. A sealed door cracks. Your panel blooms mid-run — only you see it.',
  'Night watch. Something spills through a seam. Your first skill fires by accident.',
  'Infirmary light. You should be dead. Healers argue while a ledger whispers.',
  'Job board. Someone posts your name who should not know it.',
  'Quiet shrine or archive. Alone. Footsteps on the stairs.',
  'Festival square. Others get their First Mark. Yours opens anyway — wrong day.',
  'Light, then stone. Robed figures freeze. A stamp flickers wrong.',
];

const KIT_NOTES = [
  'Whatever you already had on — no invented endgame gear.',
  'Local clothes and a small bag of everyday kit.',
  'Travel-worn cloak, boots, and pocket odds.',
  'Work uniform or crew armband and empty pockets.',
];

const FOLK = ['Human', 'Elf', 'Dwarf', 'Beastfolk', 'Halfling', 'Something rarer — say what'];

const NAMES = ['Jax', 'Ren', 'Sam', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jordan', 'Blake', 'Sable', 'Vex'];
const CLASSES = ['Wanderer', 'Courier', 'Warden', 'Scribe', 'Fixer', 'Medic', 'Scout', 'Unmarked'];
const LOOKS = [
  'Travel clothes, short hair, tired eyes',
  'Local coat, practical boots, nothing flashy',
  'Work kit still on from the last shift',
  'Cloak, scuffed boots, a scar you do not explain yet',
];
const BIOS = [
  'Already living here when the story starts. No summoned origin unless you say so.',
  'New in town with a thin cover story and thinner coin.',
  'Local enough that people know your face, not your secrets.',
  'Running from a debt, a stamp, or both.',
];

export type ExpertSectionId =
  | 'framing'
  | 'premise'
  | 'world'
  | 'lore'
  | 'people'
  | 'quests'
  | 'opening'
  | 'kit'
  | 'folk'
  | 'pc'
  | 'pitch';

export function randomizeExpertSection(
  draft: ExpertCustomDraft,
  section: ExpertSectionId,
): ExpertCustomDraft {
  switch (section) {
    case 'framing':
      return {
        ...draft,
        title: pick(['Ashline Campaign', 'Lampmere Ledger', 'Salt Road Custom', 'Threshold Watch', 'Blank Meridian']),
        tagline: pick(TAGLINES),
        genreTag: pick(GENRES),
      };
    case 'premise':
      return { ...draft, premise: pick(PREMISES), styleRail: pick(STYLE_RAILS) };
    case 'world':
      return {
        ...draft,
        startingLocation: pick(PLACES),
        worldNotes: pick(WORLD_NOTES),
      };
    case 'lore': {
      const card = pick(LORE_DECK);
      const next = [...draft.lore.filter((l) => l.title !== card.title), { ...card }].slice(-12);
      return { ...draft, lore: next };
    }
    case 'people': {
      const npc = pick(NPC_DECK);
      const next = [...draft.npcs.filter((n) => n.name !== npc.name), { ...npc }].slice(-8);
      return { ...draft, npcs: next };
    }
    case 'quests': {
      const q = pick(QUEST_DECK);
      const next = [...draft.quests.filter((x) => x.title !== q.title), { ...q }].slice(-6);
      return { ...draft, quests: next };
    }
    case 'opening':
      return {
        ...draft,
        openingHook: pick(OPENING_HOOKS),
        openingMode: Math.random() < 0.35 ? 'scene' : 'weave',
      };
    case 'kit':
      return { ...draft, kitNote: pick(KIT_NOTES) };
    case 'folk':
      return { ...draft, folk: pick(FOLK) };
    case 'pitch':
      return {
        ...draft,
        premise: draft.premise.trim()
          ? `${pick(PITCHES)}\n\n${draft.premise}`
          : pick(PITCHES),
        tagline: draft.tagline || pick(TAGLINES),
      };
    case 'pc':
      return draft;
    default:
      return draft;
  }
}

export function randomizePcFields(): {
  name: string;
  classTitle: string;
  appearance: string;
  bio: string;
  folk: string;
} {
  return {
    name: pick(NAMES),
    classTitle: pick(CLASSES),
    appearance: pick(LOOKS),
    bio: pick(BIOS),
    folk: pick(FOLK),
  };
}

export function randomizeSimplePitch(): string {
  return pick(PITCHES);
}

const LICENSE =
  'Original SynapticGM custom campaign. Player-authored sheets are canon. Do not paste copyrighted novels or closed campaign settings. Invent original names only.';

/** Build a playable bible from Expert draft (or Simple pitch overlay). */
export function buildPlayerCampaignBible(opts: {
  engineMode: EngineMode;
  archetype: CampaignArchetype;
  draft: ExpertCustomDraft;
  simplePitch?: string;
}): CampaignBible {
  const blank = resolveCustomBlankBible(opts.engineMode);
  const d = opts.draft;
  const title = d.title.trim() || 'Custom Campaign';
  const pitch = opts.simplePitch?.trim();
  const premiseParts = [
    d.premise.trim() || blank.premise,
    d.worldNotes.trim() ? `WORLD NOTES: ${d.worldNotes.trim()}` : '',
    pitch ? `PLAYER PITCH: ${pitch}` : '',
    d.fillGaps
      ? 'AI FILL GAPS: Soft texture is allowed where sheets are empty — never contradict player cards.'
      : 'AI FILL GAPS: Off. Do not invent major setting facts without confirmation.',
  ].filter(Boolean);

  const loreSnippets: LoreSnippet[] = (
    d.lore.length > 0
      ? d.lore.map((l, i) => ({
          id: `player-lore-${i + 1}`,
          title: l.title.trim() || `Lore ${i + 1}`,
          category: l.category,
          body: l.body.trim() || 'TBD',
          tags: ['custom', 'player'],
        }))
      : blank.loreSnippets.slice(0, 1).map((l, i) => ({
          ...l,
          id: `player-lore-${i + 1}`,
          tags: [...(l.tags ?? []), 'custom', 'player'],
        }))
  );

  const keyNPCs: KeyNPC[] = d.npcs.map((n, i) => ({
    id: `player-npc-${i + 1}`,
    name: n.name.trim() || `NPC ${i + 1}`,
    role: n.role.trim() || 'Local',
    disposition: n.disposition,
    description: n.description.trim() || 'Undescribed.',
    hooks: n.hooks
      .split(/[;|]/)
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 5),
  }));

  const starterQuests: StarterQuest[] =
    d.quests.length > 0
      ? d.quests.map((dq, i) => ({
          id: `player-quest-${i + 1}`,
          title: dq.title.trim() || `Quest ${i + 1}`,
          description: dq.description.trim() || 'TBD',
          recommendedLevel: 1,
          objectives: dq.objectives
            .split(/[;|]/)
            .map((o) => o.trim())
            .filter(Boolean)
            .slice(0, 6),
          rewards: 'Story progress',
        }))
      : blank.starterQuests.map((q, i) => ({ ...q, id: `player-quest-${i + 1}` }));


  const kitBody = d.kitNote.trim() || 'Whatever you already had on. No invented endgame gear.';
  const folkLine = d.folk.trim() ? `Player folk/body (canon): ${d.folk.trim()}.` : '';

  return {
    ...blank,
    id: `player-custom-${opts.engineMode}`,
    title,
    archetype: opts.archetype,
    engineMode: opts.engineMode,
    difficulty: d.difficulty,
    genreTag: d.genreTag.trim() || 'Custom',
    tagline: d.tagline.trim() || blank.tagline,
    shortDescription: (d.tagline || d.premise || blank.shortDescription || '').slice(0, 200),
    licenseNote: LICENSE,
    premise: premiseParts.join('\n\n'),
    styleRail: [d.styleRail.trim(), folkLine, LICENSE].filter(Boolean).join('\n'),
    loreSnippets,
    keyNPCs,
    starterQuests,
    starterItems: [
      {
        id: 'player-kit-clothes',
        name: 'The clothes you already had on',
        rarity: 'Common',
        itemType: 'armor',
        itemLevel: 1,
        equipped: true,
        slot: 'Body',
        provenance: 'Custom opening kit',
        description: kitBody,
      },
    ],
    startingLocation: d.startingLocation.trim() || blank.startingLocation || 'where this tale opens',
    replaceDefaultLoadout: true,
    startingContainer: { id: 'player-kit-bag', name: 'What you had on you', capacity: 16 },
    openingMode: d.openingMode,
    openingHook: d.openingHook.trim() || undefined,
    openingHooks: d.openingHook.trim() ? undefined : blank.openingHooks,
    openingRegistrar: {
      voice: 'inworld',
      label: opts.engineMode === 'litrpg' ? 'THE TALE' : 'THE REGISTER',
      startLine: 'The scene is already moving. Confirm who you are in this place.',
    },
    openingPrompts: [
      { id: 'name', kind: 'name', question: 'What name does this tale use for you?' },
      {
        id: 'folk',
        kind: 'species',
        question: 'What folk or body are you in this world?',
        suggestions: ['Human', 'Elf', 'Dwarf', 'Beastfolk', 'Something else — I will say'],
      },
      {
        id: 'where',
        kind: 'location',
        question: 'Where does this open? Name a place, or pick a random place.',
        suggestions: ['Random place', 'The place I wrote', 'A street I invent'],
      },
      {
        id: 'look',
        kind: 'appearance',
        question: 'What do you look like, and what are you wearing?',
        suggestions: ['Local clothes', 'Travel kit', 'Whatever I already owned'],
      },
      {
        id: 'kit',
        kind: 'kit',
        question: 'What is actually on you? Combat-grade inventions will be rejected.',
        suggestions: ['Everyday kit for this place', 'A small bag', 'Almost nothing'],
      },
    ],
    worldOutlineId: null,
  };
}

export function expertDraftReady(draft: ExpertCustomDraft, charName: string, askNameLater: boolean): {
  ok: boolean;
  reason?: string;
} {
  if (!draft.title.trim()) return { ok: false, reason: 'Add a campaign title.' };
  if (draft.premise.trim().length < 40 && !draft.fillGaps) {
    return { ok: false, reason: 'Add a short premise, or turn on Fill gaps.' };
  }
  if (!askNameLater && !charName.trim()) {
    return { ok: false, reason: 'Add a character name, or choose Ask at opening.' };
  }
  if (!draft.fillGaps && draft.lore.length < 1) {
    return { ok: false, reason: 'Add at least one lore card, or turn on Fill gaps.' };
  }
  return { ok: true };
}
