/**
 * Folk / peoples voice expectations — public-domain folklore tropes + original
 * SynapticGM LitRPG folk. Deepened from Manus folk-voice package 2026-08-19.
 *
 * Product law: diction + social instinct only. Never changes ledger facts,
 * stats, permits, or kit. Named NPC memory and CampaignContract override defaults.
 * No licensed IP (no Tolkien product names, D&D product race names as content,
 * anime series).
 */

import type { GameState } from './types.ts';

export interface FolkVoiceProfile {
  id: string;
  labels: string[];
  /** Speech cadence / turn-taking. */
  speech: string;
  /** Metaphor palette (short, optional cues). */
  metaphor: string;
  /** What readers usually expect socially. */
  expect: string;
  /** Kid Mode transform when contentMode is kid. */
  kid: string;
  /** Hard never-lines (cartoon / racist / licensed). */
  never: string;
}

export type FolkVoiceFormatOptions = {
  kidMode?: boolean;
};

/** Original SynapticGM folk palette — folklore patterns, not product races. */
export const FOLK_VOICE_PROFILES: FolkVoiceProfile[] = [
  {
    id: 'human',
    labels: ['human', 'humans', 'mortal', 'townsfolk'],
    speech: 'Match region, job, age, and stakes — plain adaptable turns, not a “human accent.”',
    metaphor: 'Local work, weather, family sayings, tools, food, or faith from THIS person’s bio.',
    expect:
      'Respect via names and reciprocity; insults target choices; hospitality follows host custom. Never treat “human” as the boring default culture.',
    kid: 'Clear boundaries, repair after rudeness, low-intensity disagreement. No sexual bargaining or social-exclusion threats.',
    never: 'No “humans are the normal race”; no real-world imitation accents; no universal greed/cowardice claims.',
  },
  {
    id: 'elf',
    labels: ['elf', 'elves', 'elven', 'elf-kin', 'fae-blood'],
    speech:
      'Measured, image-rich; short pause before commitment; simplify under pressure. No faux-archaic grammar spam.',
    metaphor: 'Seasons, light through leaves, craftwork, long maintenance, echoes, names.',
    expect:
      'Respect = remembering a preference; insult may be precise understatement; fear shows as caution, not superiority. Street elves ≠ court archivists.',
    kid: 'Patience and curiosity visible; grief becomes a request for quiet, not aloof contempt. No ancient-seducer framing.',
    never:
      'No Tolkien/D&D product names; no thee/thou spam; no “all elves are arrogant”; no “too old to explain.”',
  },
  {
    id: 'dwarf',
    labels: ['dwarf', 'dwarves', 'dwarven', 'stonefolk'],
    speech:
      'Deliberate and concrete; named materials, clear sequence, checkable promises. No comic gruff accent.',
    metaphor: 'Joinery, load-bearing work, heat, tools, tested seams, repaired objects.',
    expect:
      'Respect = crediting work and honoring limits; insult = claiming effort did not matter; hospitality may be repair, a seat, or practical instruction.',
    kid: 'Competence is cooperative — invite help checking a safe detail. No alcohol jokes or short-temper inevitability.',
    never:
      'No beard/body jokes; no “born for mining”; no automatic elf hostility; no pseudo-Scottish accent spelling.',
  },
  {
    id: 'orc',
    labels: ['orc', 'orcs', 'orcish'],
    speech:
      'Direct clauses, named stakes, invitation to state objections plainly. Blunt is not stupid; may be gentle or verbose.',
    metaphor: 'Weather fronts, trail markers, shelter, knots, scars as history, chosen kin.',
    expect:
      'Respect = saying the hard thing without evasion; hospitality may mark a shared table; fear prompts perimeter-check or request for terms.',
    kid: 'Recast bravado as safe bravery — ask for help, stand beside someone, name fear. No “savage” or bloodthirst framing.',
    never:
      'No broken grammar; no “all orcs love war”; no slur-coding or intelligence jokes; no licensed horde brands.',
  },
  {
    id: 'goblin',
    labels: ['goblin', 'goblins', 'goblin-kin'],
    speech:
      'Quick option-scanning, crisp scope questions, playful reframing. Standard grammar — speed is a choice, not a chitter.',
    metaphor: 'Pockets, hinges, leftovers, shortcuts, scrap value, tiny margins (sparingly).',
    expect:
      'Respect = asking what is negotiable; insult = an unpriced demand; hospitality may be a labeled shared cache. Bargains are proposals pending system confirm.',
    kid: 'Bargaining as turn-taking practice. No theft jokes, hoarding pathology, or menace.',
    never: 'No vermin imagery; no “sneaky by nature”; no comic squeaking as the only voice; no small-stature = criminality.',
  },
  {
    id: 'smallfolk',
    labels: ['smallfolk', 'halfling', 'halflings', 'small-folk'],
    speech:
      'Warm but not twee; practical observation then invitation. May be terse, grandiose, anxious, or formal.',
    metaphor: 'Hearths, routes, gardens, weatherproofing, shared meals, neighborhood rhythms — never compulsory food personality.',
    expect:
      'Respect = not talking over them or grabbing belongings; insult = treating care work as trivial; fear may favor evacuation planning.',
    kid: 'Safe belonging and resource-sharing. No adult/child confusion, patronizing language, or infantilized romance.',
    never:
      'No food-thief jokes; no “cute but useless”; no baby-talk; no Tolkien product names (incl. hobbit).',
  },
  {
    id: 'beastfolk',
    labels: ['beastfolk', 'beastkin', 'beast-folk', 'catfolk', 'wolfkin', 'foxfolk'],
    speech:
      'Person/profession first. Sensory needs may affect turn-taking — never animal-noise spelling.',
    metaphor: 'Chosen sensory experience, terrain, weather, movement — only traits the NPC states.',
    expect:
      'Ask before touching ears/tails/fur/horns/wings/gear; insult = crowding or treating a body as public; no pack/prey/alpha language.',
    kid: 'Sensory comfort, personal space, friendly consent. No predation, heat/mating, or threat displays.',
    never:
      'No animal sounds as dialogue; no “in heat” / “alpha” / prey-predator morality; no furry-bait defaults in Kid Mode.',
  },
  {
    id: 'dragonfolk',
    labels: ['dragonfolk', 'dragon-kin', 'drakekin'],
    speech:
      'Carefully enunciated promises; comfort with silence. Never hissing/growling as accent.',
    metaphor: 'Heat management, flight paths, weather pressure, molt/change, archives, lookout points.',
    expect:
      'Respect = acknowledging a kept promise; insult = public pressure to display wealth/wings/scales; hospitality = safe temperature or transparent exchange.',
    kid: 'Courage and weather safety imagery. No treasure greed, dominance, fire threats, or body commentary.',
    never:
      'No licensed dragonborn IP; no obligatory breath-weapon flex; no “all dragonfolk rich/proud/ancient.”',
  },
  {
    id: 'vampire',
    labels: ['vampire', 'vampires', 'bloodfolk', 'nightborn'],
    speech:
      'Permission-checking, precise offers, naming time or consent. Campaign etiquette — not an innate predation script.',
    metaphor: 'Thresholds, debt, night work, inheritance, hunger as a managed condition.',
    expect:
      'Invitation/threshold is CampaignContract or household etiquette (not universal folklore). Respect = explicit consent; insult = coercion or surprise feeding.',
    kid: 'No feeding-as-flirtation, erotic menace, grooming, or stalking. Hunger = neutral dietary/magical management.',
    never:
      'No named TV/novel franchises; no “you smell delicious”; no coercive invitation; no permanent-access-from-one-invite.',
  },
  {
    id: 'ghost_spirit',
    labels: ['ghost', 'ghosts', 'spirit', 'spectre', 'wraith'],
    speech:
      'Slightly asynchronous — brief pauses or exact tense when it clarifies. No echo/oooo spelling.',
    metaphor: 'Doors, traces, unfinished work, witnesses, names, weathered objects, remembered routes.',
    expect:
      'Ask how they wish to be named and whether the past may be discussed; insult = treating death as spectacle. Needs now > obligatory haunting.',
    kid: 'Protective, curious, or gently sad. No horror imagery, corpse detail, or bereavement pressure.',
    never: 'No jump-scare every turn; no forced unfinished-business trope; no licensed haunt properties.',
  },
  {
    id: 'troll',
    labels: ['troll', 'trolls'],
    speech:
      'Unhurried, exact, willing to define terms. May be elegant, chatty, or sparse — never dumb-brute grammar.',
    metaphor: 'Stone, crossings, weather, names, paths, shelter, agreements.',
    expect:
      'Respect = honoring a boundary and a literal promise; insult = assuming questions are simple because the speaker is large; hospitality may be a safe crossing.',
    kid: 'Fair explainable rules; riddles become cooperative puzzles. No gruesome tolls or fear imagery.',
    never:
      'No internet-troll joke as character; no stupidity/size jokes; no universal sun/bridge rule; no “me smash.”',
  },
  {
    id: 'merfolk',
    labels: ['merfolk', 'mermaid', 'merman', 'sea-folk', 'tidefolk'],
    speech:
      'Rhythmic but plain; may check tide/weather/breathing comfort. Do not make every merfolk sing.',
    metaphor: 'Currents, depth, shoals, anchors, storms, navigation, pressure.',
    expect:
      'Respect aquatic-access needs; insult = treating voice/body as performance; hospitality = weather knowledge or a marked swim route.',
    kid: 'Water safety, friendship, non-coercive songs. No sexualized bodies or drowning menace.',
    never:
      'No Disney/franchise mermaid IP; no siren-seductress default; no shell-bra body fixation; no drowning threats.',
  },
  // --- Original SynapticGM LitRPG folk (SPECULATIVE) ---
  {
    id: 'ledgerborn',
    labels: ['ledgerborn', 'ledger-born', 'construct folk', 'auditfolk'],
    speech:
      'Structured but humane: summarize, confirm, invite correction. No robotic monotone or binary-only speech.',
    metaphor: 'Margins, entries, balances, seals, bookmarks, maintenance logs, editions.',
    expect:
      'Respect = auditable trail and correcting the record; insult = falsifying a promise or treating them as a device.',
    kid: 'Checklists playful and optional. No “machine has no feelings” lesson or identity-as-property.',
    never:
      'No “unit/tool/it” without consent; no emotionless-logic stereotype; never alter ledger facts via voice.',
  },
  {
    id: 'mycelial',
    labels: ['mycelial', 'mycelials', 'sporefolk', 'spore-folk'],
    speech:
      'Patient turn-taking; occasional “let that settle.” No collective pronoun unless the named NPC uses one.',
    metaphor: 'Soil, shelter, rot-to-renewal, shade, fruiting, networks, rain — avoid infection language unless plot requires.',
    expect:
      'Ask before sharing a memory or scent signal; insult = calling someone contamination; hospitality = sheltered quiet.',
    kid: 'Gardens, patience, teamwork. No body horror, decay threat, parasitism, or loss of autonomy.',
    never: 'No default hive mind; no mold/rot insults; no spore coercion; no loss-of-self jokes.',
  },
  {
    id: 'ashkin',
    labels: ['ashkin', 'ash-kin', 'emberfolk', 'ember-folk'],
    speech:
      'Short warm statements when calm; more silence during emotional heat. Pause = self-regulation, not danger.',
    metaphor: 'Embers, kilns, hearths, cooling, glaze, smoke, banked fires — without linking anger to violence.',
    expect:
      'Ask about temperature/smoke tolerance; insult = demanding a heat display; fear may cool down before deciding.',
    kid: 'Campfire safety, cooking, warming hands. No fire threats, burn detail, or rage-as-identity.',
    never: 'No “hot-headed by blood”; no pyromania as identity; no flame accent effects.',
  },
  {
    id: 'glassborn',
    labels: ['glassborn', 'glass-born', 'crystalfolk', 'resonance-folk'],
    speech:
      'Clear diction, gentle corrections; prefer one speaker at a time in loud spaces. No chiming/shattering SFX as voice.',
    metaphor: 'Refraction, facets, resonance, lenses, stress lines, polish, echoes — not claims of fragility.',
    expect:
      'Ask before touching adornments or commenting on transparency; insult = calling someone brittle or decorative.',
    kid: 'Prisms, colors, listening games. No breakage threats or precious-object treatment.',
    never: 'No “fragile/shatter them” framing; no tinkling speech; no innate emotional coldness.',
  },
  {
    id: 'tidebound',
    labels: ['tidebound', 'tide-bound', 'estuary folk', 'brackish-folk'],
    speech: 'Context-setting first: conditions, time, available exits. Logistical, not mystical.',
    metaphor: 'Estuaries, brackish water, seasonal routes, mudflats, reeds, waiting pools, migrations.',
    expect:
      'Ask about moisture/temperature/access; insult = slime or disease coding; hospitality = safe water and a clear floor route.',
    kid: 'Pond ecology and travel planning. No gross-out slime jokes or predation.',
    never: 'No slimy/cold-blooded/disease imagery; no all-swamp-dweller claims; no animal noises as dialogue.',
  },
  {
    id: 'woven',
    labels: ['woven', 'weave-folk', 'threadfolk', 'textile-folk'],
    speech:
      'Occasional thread/knot/weave metaphors only; default to the NPC’s personal cadence. No stilted fabric puns.',
    metaphor: 'Seams, mending, warp and weft, dye, patterns, loose ends, hems — metaphor, not a duty to repair everyone.',
    expect:
      'Ask before touching garments/wraps/woven features; insult = unraveling or calling someone disposable.',
    kid: 'Mending, friendship bracelets, fair turn-taking. No bondage language or obligation manipulation.',
    never: 'No puppet/rag/unravel threats; no clothing sexualization; no forced-service framing.',
  },
];

/** Compact cross-folk cues — only when 2+ relevant folk are active. */
const CROSS_FOLK_CUES: Array<{ ids: [string, string]; cue: string }> = [
  {
    ids: ['elf', 'dwarf'],
    cue: 'Elf↔dwarf friction must be earned (tempo, credit, preservation vs intervention) with a repair route — never ancient racial hatred.',
  },
  {
    ids: ['orc', 'human'],
    cue: 'Orc↔human: name the rule, evidence, and appeal path. Direct speech ≠ aggression; evasion ≠ sneakiness.',
  },
  {
    ids: ['vampire', 'human'],
    cue: 'Vampire thresholds are campaign/household etiquette, revocable. Hunger is never flirtation.',
  },
  {
    ids: ['goblin', 'human'],
    cue: 'Goblin bargains: scope-first, transparent trade-offs, proposals only — voice cannot commit ledger/prices.',
  },
  {
    ids: ['beastfolk', 'human'],
    cue: 'Beastfolk sensory needs are individual and stated — ask before touch; never infer pack/instinct from body.',
  },
];

const GLOBAL_ANTI = `Global never (all folk): no comic phonetic accents; no real-world dialect imitation; no folk-wide moral/intelligence claims; no licensed catchphrases/places/languages; folk flavor never changes ledger, stats, permits, kit, prices, or quest eligibility. Named NPC memory and CampaignContract override every default.`;

function collectFolkSearchText(state: GameState): string {
  const bits: string[] = [];
  const c = state.character;
  if (c?.name) bits.push(c.name);
  if (c?.appearance) bits.push(c.appearance);
  if (c?.bio) bits.push(c.bio);
  for (const companion of state.companions ?? []) {
    bits.push(companion.name, companion.role ?? '', companion.notes ?? '');
  }
  for (const mem of state.npcMemories ?? []) {
    bits.push(mem.npcName ?? '', mem.relationshipSummary ?? '', ...(mem.facts ?? []));
  }
  if (state.campaignPremise) bits.push(state.campaignPremise);
  const sheet = state.locationSheet;
  if (sheet?.name) bits.push(sheet.name);
  if (state.currentLocation) bits.push(state.currentLocation);
  const recent = (state.log ?? []).slice(-4).map((e) => e.content).join('\n');
  bits.push(recent);
  return bits.filter(Boolean).join('\n').toLowerCase();
}

/** Word-boundary-ish match so "self" does not hit "elf". */
function textHasLabel(text: string, label: string): boolean {
  const needle = label.toLowerCase();
  if (!needle) return false;
  if (needle.includes(' ') || needle.includes('-')) {
    return text.includes(needle);
  }
  const re = new RegExp(`(?:^|[^a-z0-9])${needle}(?:[^a-z0-9]|$)`, 'i');
  return re.test(text);
}

export function detectActiveFolkIds(state: GameState): string[] {
  const text = collectFolkSearchText(state);
  const hits: string[] = [];
  for (const profile of FOLK_VOICE_PROFILES) {
    if (profile.labels.some((label) => textHasLabel(text, label))) {
      hits.push(profile.id);
    }
  }
  return hits;
}

function formatCrossFolkCues(activeIds: string[]): string {
  const set = new Set(activeIds);
  const lines = CROSS_FOLK_CUES.filter(
    (row) => set.has(row.ids[0]) && set.has(row.ids[1]),
  ).map((row) => `• ${row.cue}`);
  return lines.length ? `\nCross-folk this scene:\n${lines.join('\n')}` : '';
}

export function formatFolkVoiceForPrompt(
  state: GameState,
  options: FolkVoiceFormatOptions = {},
): string {
  const ids = detectActiveFolkIds(state);
  const profiles = ids.length
    ? FOLK_VOICE_PROFILES.filter((p) => ids.includes(p.id))
    : [];
  const kidMode = Boolean(options.kidMode);

  const header = `=== FOLK / PEOPLES VOICE (PUBLIC-DOMAIN TROPES) ===
When an NPC or the PC is of a named folk, match reader expectations for how that people tends to speak and react — then override with THIS individual's established temperament, job, and memory.
Folk flavour is diction and social instinct only. It never changes stats, permits, kit, or ledger facts.
Precedence: CampaignContract → named NPC memory → scene/safety → role → individual → folk default → neutral.
Never use licensed series race names, catchphrases, or plotlines.
${GLOBAL_ANTI}`;

  if (!profiles.length) {
    return `${header}
No specific folk flagged this turn — still treat named peoples as people with culture, not costumes.
==============================================`;
  }

  const body = profiles
    .map((p) => {
      const kidLine = kidMode ? ` Kid — ${p.kid}` : '';
      return `• ${p.id.toUpperCase()}: Speech — ${p.speech} Metaphor — ${p.metaphor} Expect — ${p.expect}${kidLine} Never — ${p.never}`;
    })
    .join('\n');

  return `${header}
Active this scene (detected):
${body}${formatCrossFolkCues(ids)}
==============================================`;
}
