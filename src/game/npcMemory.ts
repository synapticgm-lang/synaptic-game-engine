import type { CampaignBible, KeyNPC } from '@/data/campaigns/types';
import type { DoranMotivation, GameState, NpcAttitude, NpcMemory, Quest, TimelineFact } from './types';
import type { GameEvent } from './parser';
import type { NpcRole } from './npcRoleRegistry';
import { NPC_ROLE_REGISTRY } from './npcRoleRegistry';
import type { SpokenLine } from './tokenProse';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { authoredTopicsFor, merchantStockFactFor, roleVoiceFactFor } from './manusTopicBanks';
import { pickDataswornCharacterSeed } from './dataswornCharacterSeeds';
import { isMetNpc, syncNpcPresence } from './npcRecords';
import { isStaleCompanionDefault, personalAgendaFromSeed } from './companionAgency';

const MAX_FACTS_PER_NPC = 10;
const MAX_NPC_MEMORIES = 80;

/** Merchant offer is its stock (OPT3-1). */
export const MERCHANT_OFFER_STOCK = 'Health Tonic; Iron Nail; Reed Salve';

type RoleAgendaTemplate = {
  motivation: DoranMotivation;
  target: string;
  need: string;
  offer: string;
  traits: readonly [string, string];
  speechRegister: string;
};

/** Roles that still share a static agenda template. Companion is a relationship (M7), not a template. */
type AgendaTemplateRole = Exclude<NpcRole, 'companion'>;

/**
 * OPT-3 role-hint templates (data). Motivations: Doran and Parberry 2011.
 * Attitude categories match SRD 5.2.1 glossary (Friendly / Indifferent / Hostile).
 * M7: no shared `companion` profile — travelling companions seed a personal agenda like other NPCs.
 */
export const ROLE_AGENDA_TEMPLATES: Readonly<Record<AgendaTemplateRole, RoleAgendaTemplate>> = {
  guide: { motivation: 'Knowledge', target: 'the next safe door', need: 'a charge who will follow', offer: 'directions through the crisis', traits: ['steady', 'plain'], speechRegister: 'plain-guide' },
  'quest-patron': { motivation: 'Protection', target: 'the job they need done', need: 'someone to take the job', offer: 'a paid job', traits: ['urgent', 'direct'], speechRegister: 'plain-orders' },
  merchant: { motivation: 'Wealth', target: 'their wares', need: 'paying customers', offer: MERCHANT_OFFER_STOCK, traits: ['shrewd', 'practical'], speechRegister: 'prices-first' },
  'faction-envoy': { motivation: 'Reputation', target: 'their faction standing', need: 'a useful ally', offer: 'faction favour', traits: ['measured', 'loyal'], speechRegister: 'formal' },
  rival: { motivation: 'Reputation', target: 'outranking the player', need: 'proof they are ahead', offer: 'a contested lead', traits: ['proud', 'sharp'], speechRegister: 'edged' },
  herald: { motivation: 'Reputation', target: 'the news they carry', need: 'listeners', offer: 'a public proclamation', traits: ['loud', 'formal'], speechRegister: 'proclamation' },
  keeper: { motivation: 'Comfort', target: 'their house and guests', need: 'order under their roof', offer: 'lodging and a hearing', traits: ['hospitable', 'watchful'], speechRegister: 'plain-host' },
  mentor: { motivation: 'Ability', target: 'a student worth teaching', need: 'an attentive pupil', offer: 'hard-won advice', traits: ['patient', 'exacting'], speechRegister: 'formal-tutor' },
  antagonist: { motivation: 'Conquest', target: 'the plan they are running', need: 'the player out of the way', offer: 'a hard bargain', traits: ['cold', 'calculating'], speechRegister: 'threat-soft' },
  informant: { motivation: 'Knowledge', target: 'a secret worth selling', need: 'a buyer who pays', offer: 'a tip for coin or favour', traits: ['wary', 'curious'], speechRegister: 'low-voice' },
  captive: { motivation: 'Serenity', target: 'freedom from this hold', need: 'someone to open the way', offer: 'gratitude and what they know', traits: ['strained', 'hopeful'], speechRegister: 'plead-soft' },
  ruler: { motivation: 'Protection', target: 'their seat and people', need: 'loyal hands', offer: 'official leave or coin', traits: ['formal', 'grave'], speechRegister: 'formal' },
  traitor: { motivation: 'Serenity', target: 'covering their tracks', need: 'the truth kept quiet', offer: 'a dangerous secret', traits: ['nervous', 'guarded'], speechRegister: 'low-voice' },
  witness: { motivation: 'Knowledge', target: 'what they saw', need: 'to be believed', offer: 'their testimony', traits: ['shaken', 'earnest'], speechRegister: 'plain' },
  gatekeeper: { motivation: 'Protection', target: 'the gate they hold', need: 'eyes on the approach', offer: 'passage or a watch post', traits: ['stern', 'dutiful'], speechRegister: 'watch-orders' },
  artisan: { motivation: 'Equipment', target: 'their craft and tools', need: 'materials and commissions', offer: 'work for pay', traits: ['careful', 'proud'], speechRegister: 'plain-craft' },
  courier: { motivation: 'Ability', target: 'the delivery in their care', need: 'a clear road', offer: 'news from the road', traits: ['hurried', 'practical'], speechRegister: 'plain' },
  refugee: { motivation: 'Comfort', target: 'a safe place to rest', need: 'shelter and food', offer: 'what little they carry', traits: ['weary', 'grateful'], speechRegister: 'plead-soft' },
  oracle: { motivation: 'Knowledge', target: 'the pattern they read', need: 'a question worth answering', offer: 'a reading', traits: ['distant', 'precise'], speechRegister: 'formal' },
  'bounty-target': { motivation: 'Serenity', target: 'staying free of the hunt', need: 'a way past the hunters', offer: 'a cut of the take', traits: ['edged', 'restless'], speechRegister: 'street' },
  'debt-holder': { motivation: 'Wealth', target: 'the debt owed them', need: 'payment or leverage', offer: 'time — at a price', traits: ['patient', 'hard'], speechRegister: 'prices-first' },
  conspirator: { motivation: 'Conquest', target: 'the plot they share', need: 'a quiet ally', offer: 'a place in the scheme', traits: ['soft-spoken', 'sharp'], speechRegister: 'low-voice' },
  sacrifice: { motivation: 'Serenity', target: 'escaping the rite', need: 'rescue before the hour', offer: 'whatever they can swear', traits: ['afraid', 'urgent'], speechRegister: 'plead-soft' },
};

/** Build OPT-3 agenda fields from a role-hint template (Doran motivation + bound target). */
export function agendaFromRole(src: {
  role: string;
  disposition?: NpcMemory['disposition'] | 'ambiguous';
  bindTarget?: string;
  npcId?: string;
  npcName?: string;
  seed?: string;
}): {
  goal: NonNullable<NpcMemory['goal']>;
  need: string;
  offer: string;
  attitude: NpcAttitude;
  traits: string[];
  speechRegister: string;
} {
  const role = src.role in NPC_ROLE_REGISTRY ? (src.role as NpcRole) : 'informant';
  // M7: companion is a travelling relationship — personal seed, not ROLE_AGENDA_TEMPLATES.companion.
  if (role === 'companion' || !(role in ROLE_AGENDA_TEMPLATES)) {
    const personal = personalAgendaFromSeed({
      npcId: src.npcId,
      npcName: src.npcName,
      seed: src.seed,
      disposition: src.disposition,
    });
    if ((src.bindTarget ?? '').trim()) {
      return { ...personal, goal: { ...personal.goal, target: src.bindTarget!.trim() } };
    }
    return personal;
  }
  const t = ROLE_AGENDA_TEMPLATES[role as AgendaTemplateRole];
  const target = (src.bindTarget ?? '').trim() || t.target;
  const offer = role === 'merchant' ? MERCHANT_OFFER_STOCK : t.offer;
  const attitude: NpcAttitude =
    src.disposition === 'friendly' || src.disposition === 'allied' || src.disposition === 'romanced'
      ? 'friendly'
      : src.disposition === 'hostile'
        ? 'hostile'
        : 'indifferent';
  return {
    goal: { motivation: t.motivation, target },
    need: t.need,
    offer,
    attitude,
    traits: [...t.traits],
    speechRegister: t.speechRegister,
  };
}

/** Fill missing OPT-3 fields once; never overwrite a value already set (except stale companion default). */
export function ensureNpcAgenda(
  memory: NpcMemory,
  src?: {
    role?: string;
    disposition?: NpcMemory['disposition'] | 'ambiguous';
    bindTarget?: string;
    seed?: string;
  },
): NpcMemory {
  const staleCompanion = isStaleCompanionDefault(memory);
  if (
    !staleCompanion
    && memory.goal?.motivation
    && memory.goal.target
    && memory.need
    && memory.offer
    && memory.attitude
    && memory.traits
    && memory.traits.length >= 1
    && memory.traits.length <= 2
    && memory.speechRegister
  ) {
    return memory;
  }
  const fresh = agendaFromRole({
    role: src?.role ?? memory.roleHint ?? memory.sheet?.job ?? 'informant',
    disposition: src?.disposition ?? memory.disposition,
    bindTarget: src?.bindTarget,
    npcId: memory.npcId,
    npcName: memory.npcName,
    seed: src?.seed,
  });
  return {
    ...memory,
    goal: staleCompanion || !memory.goal ? fresh.goal : memory.goal,
    need: staleCompanion || !memory.need ? fresh.need : memory.need,
    offer: staleCompanion || !memory.offer ? fresh.offer : memory.offer,
    attitude: memory.attitude ?? fresh.attitude,
    traits: staleCompanion || !memory.traits?.length ? fresh.traits : memory.traits.slice(0, 2),
    speechRegister: staleCompanion || !memory.speechRegister ? fresh.speechRegister : memory.speechRegister,
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Upsert per-NPC memory from lore cards / timeline so knowledge doesn't bleed across NPCs.
 */
export function mergeNpcMemoriesFromTurn(
  state: GameState,
  events: GameEvent[],
  timelineFacts: TimelineFact[],
  turn: number
): NpcMemory[] {
  const map = new Map<string, NpcMemory>();
  for (const m of state.npcMemories ?? []) {
    map.set(normalizeName(m.npcName), { ...m, facts: [...m.facts] });
  }
  const findKey = (name: string): string | undefined => {
    const k = normalizeName(name);
    if (map.has(k)) return k;
    for (const [key, m] of map) {
      if ((m.aliases ?? []).some((a) => normalizeName(a) === k)) return key;
    }
    return undefined;
  };

  for (const e of events) {
    if (e.type === 'lore-card' && e.cardType === 'npc' && e.name) {
      const key = findKey(e.name);
      if (!key) continue;
      const existing = map.get(key)!;
      const summary = (e.summary ?? '').trim();
      if (summary && !existing.facts.includes(summary.slice(0, 160))) {
        existing.facts = [...existing.facts, summary.slice(0, 160)].slice(-MAX_FACTS_PER_NPC);
      }
      const disp = summary.match(/disposition:\s*(hostile|neutral|friendly|allied|romanced|ambiguous)/i)?.[1];
      if (disp) {
        const d = disp.toLowerCase();
        existing.disposition =
          d === 'ambiguous' ? 'unknown' : (d as NpcMemory['disposition']);
      }
      existing.lastSeenTurn = turn;
      map.set(key, existing);
    }
  }

  for (const fact of timelineFacts) {
    if (fact.kind !== 'npc') continue;
    const nameMatch = fact.text.match(/(?:met|spoke with|told|asked)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const key = findKey(name);
    if (!key) continue;
    const existing = map.get(key)!;
    if (!existing.facts.includes(fact.text)) {
      existing.facts = [...existing.facts, fact.text].slice(-MAX_FACTS_PER_NPC);
    }
    existing.lastSeenTurn = turn;
    map.set(key, existing);
  }

  const result = Array.from(map.values())
    .sort((a, b) => b.lastSeenTurn - a.lastSeenTurn)
    .slice(0, MAX_NPC_MEMORIES);
  return syncNpcPresence(result, state);
}

export { formatNpcMemoriesForPrompt } from './npcRecords';

const KIND_ACT =
  /\b(help|heal|spare|thank|apologiz|give|share|comfort|protect|honest|kind|offer)\b/i;
const HARD_ACT =
  /\b(threaten|refuse|insult|steal|demand|lie|attack|intimidate|shove|rob|grab|shake|yank)\b/i;
const CURIOUS_ACT =
  /\b(ask|talk|speak|bargain|negotiat|listen|chat|hang out)\b/i;
const WALK_ACT =
  /\b(walk away|leave|go another|another direction|ignore)\b/i;

const FREE_ACT =
  /\b(free|release|unlock|untie|unchain|unshackle|rescue|cut (?:\w+ )?loose|break (?:\w+ )?out)\b/i;
const HARM_ACT = /\b(attack|steal|shove|rob|stab|strike|hit|punch|kick|kill|betray|sell (?:\w+ )?out|grab|shake|yank)\b/i;
const THREAT_ACT = /\b(threaten|intimidate|demand)\b/i;

/** What the player's action does to the person it targets, for stance: the same verb classes as treatment. */
export function stanceActionKind(action: string): 'free' | 'harm' | 'threat' | 'kind' | null {
  if (FREE_ACT.test(action)) return 'free';
  if (HARM_ACT.test(action)) return 'harm';
  if (THREAT_ACT.test(action)) return 'threat';
  if (KIND_ACT.test(action) && !HARD_ACT.test(action)) return 'kind';
  return null;
}

function treatmentLabel(action: string): 'kind' | 'hard' | 'curious' | 'walkaway' | null {
  if (HARD_ACT.test(action) && !KIND_ACT.test(action)) return 'hard';
  if (KIND_ACT.test(action)) return 'kind';
  if (WALK_ACT.test(action)) return 'walkaway';
  if (CURIOUS_ACT.test(action)) return 'curious';
  return null;
}

function findTargetNpc(memories: NpcMemory[], action: string, presentNames: string[]): NpcMemory | undefined {
  const hay = action.toLowerCase();
  const pool = memories.length
    ? memories
    : presentNames.map((name) => ({
        npcId: name.toLowerCase(),
        npcName: name,
        disposition: 'unknown' as const,
        facts: [] as string[],
        lastSeenTurn: 0,
      }));
  const named = pool.find((m) => hay.includes(m.npcName.toLowerCase()));
  if (named) return named;
  // T10Z — "grab Sefa's arm" / "shove past Sefa" must hit Sefa Aske (token, not only full name).
  for (const m of pool) {
    const parts = m.npcName.toLowerCase().split(/[\s'’-]+/).filter((t) => t.length >= 3);
    if (parts.some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay))) return m;
  }
  for (const p of presentNames) {
    const pl = p.toLowerCase();
    if (pl.length >= 3 && new RegExp(`\\b${pl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay)) {
      return pool.find((m) => m.npcName.toLowerCase() === pl) ?? {
        npcId: pl,
        npcName: p,
        disposition: 'unknown' as const,
        facts: [] as string[],
        lastSeenTurn: 0,
      };
    }
  }
  const present = presentNames[0]?.toLowerCase();
  if (present) return pool.find((m) => m.npcName.toLowerCase() === present);
  return undefined;
}

/**
 * Pin how the player treated a named person this turn. Local disposition only — not a karma meter.
 */
export function recordNpcTreatmentFromAction(
  memories: NpcMemory[],
  playerAction: string,
  turn: number,
  presentNames: string[] = []
): NpcMemory[] {
  const treatment = treatmentLabel(playerAction);
  if (!treatment) return memories;
  const target = findTargetNpc(memories, playerAction, presentNames);
  if (!target) return memories;

  const note =
    treatment === 'kind'
      ? `Treated kindly (T${turn})`
      : treatment === 'hard'
        ? `Treated harshly / refused (T${turn})`
        : treatment === 'walkaway'
          ? `Player walked away (T${turn})`
          : `Talked / asked (T${turn})`;

  const nextDisp: NpcMemory['disposition'] =
    treatment === 'kind'
      ? target.disposition === 'hostile'
        ? 'neutral'
        : target.disposition === 'unknown'
          ? 'friendly'
          : target.disposition
      : treatment === 'hard'
        ? target.disposition === 'allied' || target.disposition === 'romanced'
          ? target.disposition
          : 'hostile'
        : target.disposition;

  const map = new Map(memories.map((m) => [normalizeName(m.npcName), { ...m, facts: [...m.facts] }]));
  const key = normalizeName(target.npcName);
  const existing = map.get(key) ?? { ...target, facts: [...target.facts] };
  if (!existing.facts.some((f) => f.startsWith(note.slice(0, 18)))) {
    existing.facts = [...existing.facts, note].slice(-MAX_FACTS_PER_NPC);
  }
  existing.disposition = nextDisp;
  existing.lastSeenTurn = turn;
  map.set(key, existing);
  return Array.from(map.values())
    .sort((a, b) => b.lastSeenTurn - a.lastSeenTurn)
    .slice(0, MAX_NPC_MEMORIES);
}

/**
 * T10Z — hard treatment of someone present: they refuse / walk off (engine fact).
 * Roughing up a present NPC must change the scene (disposition already hostile via
 * recordNpcTreatmentFromAction); leaving clears present so the road can move on.
 * SRD 5.2.1 Communicating / social interaction — Hostile attitude; they will not stay to be grabbed.
 */
export function applyHostilePresentLeave(
  state: GameState,
  playerAction: string,
): { state: GameState; receipts: string[] } {
  const treatment = treatmentLabel(playerAction);
  if (treatment !== 'hard') return { state, receipts: [] };
  const present = (state.sceneFacts?.present ?? []).filter((n) => n.trim().length > 1);
  const companions = (state.companions ?? []).map((c) => c.name).filter(Boolean) as string[];
  const pool = [...present, ...companions];
  if (!pool.length) return { state, receipts: [] };
  const target = findTargetNpc(state.npcMemories ?? [], playerAction, pool);
  if (!target) return { state, receipts: [] };
  const here = pool.some(
    (p) =>
      p.toLowerCase() === target.npcName.toLowerCase()
      || p.toLowerCase().includes(target.npcName.toLowerCase().split(/\s+/)[0]!)
      || target.npcName.toLowerCase().includes(p.toLowerCase()),
  );
  if (!here) return { state, receipts: [] };
  const drop = target.npcName.toLowerCase();
  const nextPresent = present.filter((p) => {
    const pl = p.toLowerCase();
    return pl !== drop && !pl.includes(drop.split(/\s+/)[0]!) && !drop.includes(pl);
  });
  const base = state.sceneFacts ?? {
    crowd: 'unknown' as const,
    noise: 'unknown' as const,
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn ?? 0,
  };
  const receipt = `${target.npcName} pulls away and will not stay to be handled.`;
  return {
    state: {
      ...state,
      sceneFacts: { ...base, present: nextPresent, updatedTurn: state.turn ?? 0 },
    },
    receipts: [receipt],
  };
}

function uniqueTopics(topics: string[]): string[] {
  return [...new Set(topics.filter(Boolean))].slice(-16);
}

function memoryMatchesNpc(memory: NpcMemory, npcName: string): boolean {
  const key = npcName.trim().toLowerCase();
  if (!key) return false;
  const full = memory.npcName.toLowerCase();
  const id = memory.npcId.toLowerCase();
  if (full === key || id === key) return true;
  const last = full.split(/\s+/).pop() ?? '';
  return last.length >= 3 && last === key;
}

export function findNpcMemory(
  memories: NpcMemory[] | undefined,
  npcName: string
): NpcMemory | undefined {
  return (memories ?? []).find((m) => memoryMatchesNpc(m, npcName));
}

/** True after a prior harvest marked this person as met. */
export function hasMetBefore(state: GameState, npcName: string): boolean {
  const m = findNpcMemory(state.npcMemories, npcName);
  if (!m) return false;
  return (
    m.introSpoken === true
    || (m.meetCount ?? 0) >= 1
    || (m.completedTopics ?? []).includes('intro')
  );
}

/** Ordinary first-person speech ("I'm off to market") is not an intro; the speaker's name must follow. */
const SELF_INTRO_HEAD =
  String.raw`\b(?:i am called|i am|i['’]m|my name is|call me|(?:allow|let) me (?:to )?introduce(?:\s+myself)?)`;

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sentenceLooksLikeSelfIntro(sentence: string, npcName: string): boolean {
  const n = npcName.trim();
  if (n.length < 2) return false;
  if (new RegExp(`${SELF_INTRO_HEAD}[,:]?\\s+${escapeRe(n)}\\b`, 'i').test(sentence)) return true;
  return new RegExp(
    `\\b${escapeRe(n)}\\s+introduces\\s+(?:him|her|them)self\\b`,
    'i'
  ).test(sentence);
}

/**
 * Drop re-intro sentences for NPCs who already spoke an intro.
 * If the strip would empty the beat, keep the original (do not hand talk to stitch).
 */
export function scrubNpcIntroRepeat(
  text: string,
  memories: NpcMemory[] | undefined
): string {
  const spoken = (memories ?? []).filter(
    (m) => m.introSpoken === true || (m.meetCount ?? 0) >= 1 || (m.completedTopics ?? []).includes('intro')
  );
  if (!spoken.length || !text.trim()) return text;
  const parts = text.split(/(?<=[.!?])\s+/);
  const kept = parts.filter((sentence) => {
    for (const m of spoken) {
      if (sentenceLooksLikeSelfIntro(sentence, m.npcName)) return false;
      const given = m.npcName.split(/\s+/).pop();
      if (given && given !== m.npcName && sentenceLooksLikeSelfIntro(sentence, given)) {
        return false;
      }
    }
    return true;
  });
  const next = kept.join(' ').replace(/\s{2,}/g, ' ').trim();
  return next || text;
}

/** Write the locked PC name onto people already on the ledger (CAST / harvested). */
export function rememberPlayerName(state: GameState, playerName: string): GameState {
  const name = playerName.trim();
  if (!name) return state;
  const list = state.npcMemories ?? [];
  if (!list.length) return state;
  let dirty = false;
  const next = list.map((m) => {
    if (!isMetNpc(m) || m.knownPlayerName === name) return m;
    dirty = true;
    const fact = `Knows the player as ${name}`;
    return {
      ...m,
      knownPlayerName: name,
      facts: m.facts.includes(fact) ? m.facts : [...m.facts, fact].slice(-MAX_FACTS_PER_NPC),
    };
  });
  return dirty ? { ...state, npcMemories: next } : state;
}

/** The player's current stay at this place: the place plus its visit number (circling.visits), counting an arrival not yet recorded. */
export function currentVisitKey(state: Pick<GameState, 'currentLocation' | 'circling'>): string {
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const key = here.toLowerCase();
  const recorded = state.circling?.visits?.[key] ?? 0;
  const pending = state.circling?.lastLocation === here ? 0 : 1;
  return `${key}#${recorded + pending}`;
}

/**
 * First harvest creates stranger + intro (met on this visit, not met before); a mention on a later
 * visit counts one meeting and upgrades to acquaintance. Mentions on the same visit never count.
 */
export function upsertHarvestedNpcMemory(
  memories: NpcMemory[],
  name: string,
  turn: number,
  visit?: string
): NpcMemory[] {
  const key = name.toLowerCase();
  const existing = memories.find(
    (n) =>
      n.npcName.toLowerCase() === key
      || (n.aliases ?? []).some((a) => a.toLowerCase() === key)
  );
  if (existing) {
    const rosterOnly =
      !existing.introSpoken
      && !(existing.meetCount)
      && !(existing.completedTopics ?? []).includes('intro');
    if (rosterOnly) {
      return memories.map((n) =>
        n === existing
          ? {
              ...n,
              met: true,
              meetCount: 0,
              seenVisit: visit,
              lastSeenTurn: turn,
              introSpoken: true,
              completedTopics: uniqueTopics([...(n.completedTopics ?? []), 'intro']),
              relationshipStatus: 'stranger',
              facts: n.facts.some((f) => /Introduced in play/i.test(f))
                ? n.facts
                : [...n.facts, `Introduced in play T${turn}`].slice(-MAX_FACTS_PER_NPC),
            }
          : n
      );
    }
    const newVisit = !!visit && !!existing.seenVisit && visit !== existing.seenVisit;
    const meetCount = (existing.meetCount ?? 0) + (newVisit ? 1 : 0);
    const seen = `Seen in play T${turn}`;
    return memories.map((n) =>
      n === existing
        ? {
            ...n,
            met: true,
            meetCount,
            seenVisit: visit ?? n.seenVisit,
            lastSeenTurn: turn,
            introSpoken: true,
            completedTopics: uniqueTopics([...(n.completedTopics ?? []), 'intro']),
            relationshipStatus:
              n.relationshipStatus === 'stranger' || !n.relationshipStatus
                ? newVisit
                  ? 'acquaintance'
                  : (n.relationshipStatus ?? 'stranger')
                : n.relationshipStatus,
            facts: n.facts.some((f) => f.startsWith('Seen in play'))
              ? n.facts
              : [...n.facts, seen].slice(-MAX_FACTS_PER_NPC),
          }
        : n
    );
  }
  return memories;
}

function rosterDisplayName(raw: string): string {
  return raw.replace(/\s*\(alias[^)]*\)\s*/gi, '').replace(/\s+/g, ' ').trim();
}

function roleFromBibleNpc(npc: KeyNPC): NpcRole {
  const roleOnly = npc.role.toLowerCase();
  if (/quest-patron|quest[- ]giver/.test(roleOnly)) return 'quest-patron';
  const hay = `${npc.role} ${npc.description}`.toLowerCase();
  if (/rival/.test(hay)) return 'rival';
  if (/merchant|broker|quartermaster|fence/.test(hay)) return 'merchant';
  if (/spy|informant|archiv/.test(hay)) return 'informant';
  if (/gate|warden|sentinel|guard/.test(hay)) return 'gatekeeper';
  if (/captive|bound knight/.test(hay)) return 'captive';
  if (/traitor|apostate|deserter/.test(hay)) return 'traitor';
  if (/conspir|smuggl/.test(hay)) return 'conspirator';
  if (/antagonist|architect/.test(hay)) return 'antagonist';
  if (/ruler|magistrate|abbot|commander/.test(hay)) return 'ruler';
  if (/mentor|advocate/.test(hay)) return 'mentor';
  if (/quest-patron|handler|captain/.test(hay)) return 'quest-patron';
  if (/courier|ferry/.test(hay)) return 'courier';
  if (/artisan|engineer|cutter/.test(hay)) return 'artisan';
  if (/refugee|survivor/.test(hay)) return 'refugee';
  if (/witness|child|twin|echo/.test(hay)) return 'witness';
  if (/guide|novice|healer|brother/.test(hay)) return 'guide';
  if (/keeper|curator/.test(hay)) return 'keeper';
  if (/envoy|faction|agent/.test(hay)) return 'faction-envoy';
  return 'informant';
}

function bibleDisp(d: KeyNPC['disposition']): NpcMemory['disposition'] {
  if (d === 'friendly') return 'friendly';
  if (d === 'hostile') return 'hostile';
  return 'neutral';
}

/**
 * Seed bible keyNPCs into npcMemories as dormant roster rows.
 * Does not mark introSpoken / meetCount — first harvest still 12a stranger.
 */
export function seedBibleNpcRoster(state: GameState, bible: CampaignBible | undefined | null): GameState {
  if (!bible?.keyNPCs?.length) return state;
  const bibleId = bible.id;
  const map = new Map<string, NpcMemory>();
  for (const m of state.npcMemories ?? []) {
    map.set(normalizeName(m.npcName), { ...m, facts: [...m.facts] });
  }
  const knownNames: string[] = [];
  for (let ki = 0; ki < bible.keyNPCs.length; ki++) {
    const n = bible.keyNPCs[ki]!;
    knownNames.push(rosterDisplayName(n.name), n.name);
    const aliases = n.aliases ?? [];
    for (let ai = 0; ai < aliases.length; ai++) knownNames.push(aliases[ai]!);
  }
  for (const npc of bible.keyNPCs) {
    const name = rosterDisplayName(npc.name);
    if (!name || !canHarvestAsNamedPerson(name, bibleId, knownNames)) continue;
    const key = normalizeName(name);
    if (map.has(key)) continue;
    const role = roleFromBibleNpc(npc);
    const extras: string[] = [];
    const voice = roleVoiceFactFor(role);
    if (voice) extras.push(voice);
    const stock = merchantStockFactFor(role, name);
    if (stock) extras.push(stock);
    const authored = authoredTopicsFor(name);
    if (authored[0]?.line) extras.push(`Authored line: ${authored[0].line}`);
    const disposition = bibleDisp(npc.disposition);
    // OPT-3: bind the Doran goal to a player-facing motive line — never bible hooks/description
    // (those are GM notes: "Secret:", "Moral anchor:", "Obstacle:", …) which leaked onto chips (T10I).
    const motiveRaw = (npc.motiveLines?.[0] ?? '').replace(/\s+/g, ' ').trim();
    const bindTarget = motiveRaw
      ? motiveRaw
          .replace(/^I (?:only )?want\s+/i, '')
          .replace(/[,.].*$/, '')
          .trim()
          .slice(0, 80) || undefined
      : undefined;
    let row = ensureNpcAgenda(
      {
        npcId: npc.id || `roster-${key.replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        npcName: name,
        disposition,
        facts: [`Bible roster: ${role}`, ...extras].slice(0, MAX_FACTS_PER_NPC),
        lastSeenTurn: 0,
        roleHint: role,
        aliases: npc.aliases ?? [],
        met: false,
        present: false,
        ...(npc.motiveLines?.length ? { motiveLines: npc.motiveLines } : {}),
      },
      { role, disposition, bindTarget: bindTarget || undefined },
    );
    // OPT-3 Datasworn seeds: LitRPG/RPG take descriptor as a trait; tabletop flavour only (fact line).
    let salt = 0;
    for (let i = 0; i < name.length; i++) salt = (salt + name.charCodeAt(i) * (i + 1)) % 9973;
    const descriptor = pickDataswornCharacterSeed('descriptor', salt);
    if ((state.engineMode === 'litrpg' || state.engineMode === 'rpg') && descriptor) {
      const second = row.traits?.[1] ?? row.traits?.[0] ?? 'plain';
      row = { ...row, traits: [descriptor, second === descriptor ? 'plain' : second].slice(0, 2) };
    } else if (state.engineMode === 'dnd' && descriptor) {
      const flavour = `Flavour seed (Datasworn): ${descriptor}`;
      let hasFlavour = false;
      for (let fi = 0; fi < row.facts.length; fi++) {
        if (row.facts[fi]!.startsWith('Flavour seed (Datasworn):')) hasFlavour = true;
      }
      if (!hasFlavour) {
        row = { ...row, facts: [...row.facts, flavour].slice(0, MAX_FACTS_PER_NPC) };
      }
    }
    map.set(key, row);
  }
  // Fill agenda on any prior roster row that still lacks fields (set-once; never overwrite).
  for (const [key, m] of map) {
    map.set(
      key,
      ensureNpcAgenda(m, {
        role: m.roleHint ?? 'informant',
        disposition: m.disposition,
        bindTarget: m.goal?.target,
      }),
    );
  }
  const next = Array.from(map.values());
  for (let i = 1; i < next.length; i++) {
    const cur = next[i]!;
    let j = i - 1;
    while (j >= 0 && next[j]!.lastSeenTurn < cur.lastSeenTurn) {
      next[j + 1] = next[j]!;
      j--;
    }
    next[j + 1] = cur;
  }
  return { ...state, npcMemories: next.slice(0, MAX_NPC_MEMORIES) };
}

function roleHay(memory: NpcMemory): string {
  return `${memory.roleHint ?? ''} ${memory.facts.join(' ')}`.toLowerCase();
}

export function isMerchantMemory(memory: NpcMemory): boolean {
  return /merchant|broker|quartermaster|fence|vendor|trader/.test(roleHay(memory));
}

export function isQuestGiverMemory(memory: NpcMemory): boolean {
  if (isMerchantMemory(memory)) return false;
  return /quest-patron|quest.giver|handler|captain/.test(roleHay(memory));
}

export function npcShouldExit(state: GameState, npcName: string): boolean {
  return findNpcMemory(state.npcMemories, npcName)?.shouldExit === true;
}

const BUY_ACT =
  /\b(buy|bought|purchase|purchased|pay for|i(?:'|’)ll take|trade for|i take the)\b/i;

export function isBuyPlayerAction(raw: string): boolean {
  return BUY_ACT.test(raw.replace(/\s+/g, ' ').trim());
}

function presentNamedPeople(state: GameState): string[] {
  return (state.sceneFacts?.present ?? []).filter((n) => n.trim().length > 1);
}

function findPresentMerchant(state: GameState): NpcMemory | undefined {
  const present = presentNamedPeople(state);
  const memories = state.npcMemories ?? [];
  for (const name of present) {
    const m = findNpcMemory(memories, name);
    if (m && isMerchantMemory(m)) return m;
  }
  return memories.find((m) => isMerchantMemory(m) && present.some((p) => memoryMatchesNpc(m, p)));
}

function findPresentQuestGiver(state: GameState): NpcMemory | undefined {
  const present = presentNamedPeople(state);
  const memories = state.npcMemories ?? [];
  for (const name of present) {
    const m = findNpcMemory(memories, name);
    if (m && isQuestGiverMemory(m)) return m;
  }
  return undefined;
}

function uniquePurchases(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (name.length < 3) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.slice(-12);
}

export function recordMerchantPurchases(
  memories: NpcMemory[],
  merchantName: string,
  items: string[],
  turn: number
): NpcMemory[] {
  const gained = uniquePurchases(items);
  if (!gained.length) return memories;
  return memories.map((m) => {
    if (!memoryMatchesNpc(m, merchantName)) return m;
    const purchases = uniquePurchases([...(m.purchases ?? []), ...gained]);
    const facts = [...m.facts];
    for (const item of gained) {
      const note = `Bought: ${item} T${turn}`;
      if (!facts.some((f) => f.toLowerCase() === note.toLowerCase())) {
        facts.push(note);
      }
    }
    return {
      ...m,
      purchases,
      facts: facts.slice(-MAX_FACTS_PER_NPC),
      lastSeenTurn: turn,
    };
  });
}

function questNewlyLive(before: Quest[] | undefined, after: Quest[] | undefined): boolean {
  const prev = new Map((before ?? []).map((q) => [q.id, q]));
  for (const q of after ?? []) {
    const live = q.revealed === true || q.status === 'active';
    if (!live) continue;
    const old = prev.get(q.id);
    if (!old) return true;
    const wasLive = old.revealed === true || old.status === 'active';
    if (!wasLive) return true;
    if (old.status !== 'active' && q.status === 'active') return true;
  }
  return false;
}

const ACCEPT_QUEST_ACT =
  /\b(accept(?: the)?(?: quest| job| contract| pact)?|swear(?: the pact)?|i(?:'|’)ll take (?:the )?(?:quest|job|contract|pact)|take the (?:quest|job|contract))\b/i;

export function markQuestGiverExit(
  memories: NpcMemory[],
  giverName: string,
  turn: number
): NpcMemory[] {
  return memories.map((m) => {
    if (!memoryMatchesNpc(m, giverName) || !isQuestGiverMemory(m)) return m;
    if (m.shouldExit) return m;
    const fact = `Quest accepted — left T${turn}`;
    return {
      ...m,
      shouldExit: true,
      exitReason: 'quest-accepted',
      completedTopics: uniqueTopics([...(m.completedTopics ?? []), 'farewell']),
      facts: m.facts.includes(fact) ? m.facts : [...m.facts, fact].slice(-MAX_FACTS_PER_NPC),
      lastSeenTurn: turn,
    };
  });
}

export function applyNpcExitToPresent(state: GameState): GameState {
  const present = state.sceneFacts?.present;
  if (!present?.length) return state;
  const next = present.filter((name) => !npcShouldExit(state, name));
  if (next.length === present.length) return state;
  return {
    ...state,
    sceneFacts: {
      ...state.sceneFacts,
      present: next,
    },
  };
}

export function isKindSocialPad(choice: string): boolean {
  return /\b(offer help|give a gift|comfort|befriend|ask (?:him|her|them) to join|apologiz)\b/i.test(
    choice
  );
}

export function isHardSocialPad(choice: string): boolean {
  return (
    /\b(attack|threaten|rob|shove|intimidate|strike|assault)\b/i.test(choice)
    && !/\b(corpse|body|lastkill)\b/i.test(choice)
  );
}

export function isRepeatPurchasePad(state: GameState, choice: string): boolean {
  if (!/\b(buy|purchase|trade for|take the)\b/i.test(choice)) return false;
  const hay = choice.toLowerCase();
  for (const m of state.npcMemories ?? []) {
    if (!m.purchases?.length) continue;
    for (const item of m.purchases) {
      if (item.length >= 3 && hay.includes(item.toLowerCase())) return true;
    }
  }
  return false;
}

export function dispositionBlocksPad(state: GameState, choice: string): boolean {
  const present = presentNamedPeople(state);
  const memories = (state.npcMemories ?? []).filter((m) =>
    present.some((p) => memoryMatchesNpc(m, p))
  );
  if (!memories.length) return false;
  if (memories.some((m) => m.disposition === 'hostile') && isKindSocialPad(choice)) {
    return true;
  }
  if (
    memories.some((m) => m.disposition === 'friendly' || m.disposition === 'allied' || m.disposition === 'romanced')
    && isHardSocialPad(choice)
  ) {
    const hay = choice.toLowerCase();
    const namedFriend = memories.some(
      (m) =>
        (m.disposition === 'friendly' || m.disposition === 'allied' || m.disposition === 'romanced')
        && hay.includes(m.npcName.toLowerCase())
    );
    if (namedFriend || !/\b[A-Z][a-z]+\b/.test(choice)) return true;
  }
  return false;
}

/**
 * 12c leftover social ledger — merchant purchases, quest-giver exit, present trim.
 * Does not touch opening stitch / hooks. No new GM prompt rails.
 */
const SAID_TOPICS = new Set(['who', 'want', 'refuse']);
const SPEECH_CUE = /["“”]|\b(?:said|says|saying|spoke|speaks|told|tells|answered|answers|replied|replies|asked|asks)\b/i;
const QUOTE_SPAN = /["“]([^"“”]{2,400})["”]/g;
const MAX_SAID_PER_NPC = 12;

type QuoteSpan = { start: number; words: string };
type SentenceSpan = { start: number; end: number; text: string };

/** Sentences of the beat with their offsets; quoted speech is masked so a stop inside a quote does not split. */
function sentenceSpans(text: string): SentenceSpan[] {
  const masked = text.replace(QUOTE_SPAN, (all, inner: string) => {
    const stop = inner.match(/[.!?]+$/)?.[0] ?? '';
    return all[0] + 'x'.repeat(inner.length - stop.length) + stop + all[all.length - 1];
  });
  const out: SentenceSpan[] = [];
  const re = /[^.!?]+(?:[.!?]+["”]?|$)/g;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(masked))) {
    if (!hit[0].trim()) {
      if (re.lastIndex === hit.index) re.lastIndex++;
      continue;
    }
    out.push({ start: hit.index, end: hit.index + hit[0].length, text: text.slice(hit.index, hit.index + hit[0].length) });
  }
  return out;
}

function quoteSpans(text: string): QuoteSpan[] {
  return [...text.matchAll(QUOTE_SPAN)]
    .map((q) => ({ start: q.index ?? 0, words: q[1]!.replace(/\s+/g, ' ').trim().replace(/,$/, '') }))
    .filter((q) => q.words.length >= 2);
}

/** Full name, aliases, and the person's own first name when no one else present shares it. */
function speakerNames(m: NpcMemory, presentNames: string[]): string[] {
  const names = [m.npcName, ...(m.aliases ?? [])];
  const first = m.npcName.trim().split(/\s+/);
  if (first.length > 1 && first[0]!.length > 1) {
    const key = first[0]!.toLowerCase();
    const sharing = presentNames.filter((n) => n.trim().split(/\s+/)[0]?.toLowerCase() === key);
    if (sharing.length <= 1) names.push(first[0]!);
  }
  return names;
}

function nameIndex(sentence: string, names: string[]): number {
  const hits = names
    .filter((n) => n.trim().length > 1)
    .map((n) => sentence.search(new RegExp(`\\b${escapeRe(n.trim())}\\b`, 'i')))
    .filter((i) => i >= 0);
  return hits.length ? Math.min(...hits) : -1;
}

const SPOKEN_OBJECT = String.raw`(?:(?:him|her|them|me|us|you|[A-Z][\w'-]+(?:\s[A-Z][\w'-]+)?)\s+)`;
const REPORTED_SPEECH = new RegExp(
  String.raw`\b(?:(?:said|says|saying|answered|answers|replied|replies)(?:\s+to\s+${SPOKEN_OBJECT}|\s+${SPOKEN_OBJECT}(?=that\b))?|(?:told|tells|telling|warned|warns)\s+${SPOKEN_OBJECT}?)\s*(that\s+)?([^"“”]+)$`
);
const NOT_A_CLAUSE =
  /^(?:\w+ly|nothing|without|with|in|at|to|from|after|before|as|while|for|by|through|into|over|under|again|once|no|not)\b/i;

const CLAUSE_PRONOUN = /^(?:he|she|they|it|we|i|you|there|someone|nobody|everyone)$/i;
const CLAUSE_DETERMINER =
  /^(?:the|a|an|this|these|those|his|her|their|its|our|my|your|every|each|some|no|one|two|three|all|both)$|'s$/i;
const CLAUSE_BREAK =
  /^(?:like|for|of|to|in|on|at|with|without|from|by|as|into|onto|over|under|through|toward|towards|and|but|or|while|when|if|because)$/i;
const CLAUSE_QUANTIFIER = /^(?:few|many|several|some|two|three|four|five|all|both)$/i;
const FINITE_VERB =
  /^(?:was|were|is|are|am|had|has|have|did|does|do|would|could|should|will|can|must|might|may|shall|came|went|took|gave|kept|left|lost|knew|saw|stood|sat|ran|fell|broke|held|sent|made|got|found|paid|meant|owed)$/i;
const CLAUSE_ADVERB = /^(?:\w+ly|only|never|still|always|already|just|not|once)$/i;

function looksFinite(word: string, prev: string | undefined): boolean {
  if (FINITE_VERB.test(word)) return true;
  if (/^[a-z]+ed$/.test(word)) return true;
  if (/^[a-z]+[^su']s$/.test(word)) return !prev || !CLAUSE_QUANTIFIER.test(prev);
  return false;
}

/**
 * The word before `next` only describes the noun `next` ("the official stamp in…"): `next` is a plain
 * lower-case noun, not a verb, link word, determiner or pronoun, and no verb follows it as its own.
 */
export function isNounAdjunctBefore(next: string, after: string | undefined): boolean {
  if (!/^[a-z]+$/.test(next)) return false;
  if (looksFinite(next, undefined) || CLAUSE_BREAK.test(next) || CLAUSE_ADVERB.test(next)) return false;
  if (CLAUSE_DETERMINER.test(next) || CLAUSE_PRONOUN.test(next) || /^(?:who|whom|whose|which|that|then|himself|herself|themselves)$/.test(next)) return false;
  const a = (after ?? '').toLowerCase().replace(/[^a-z'-]/g, '');
  return !a || !looksFinite(a, next);
}

/** A clause with its own subject and a finite verb ("the seventh ring was taken"), not a noun phrase ("Jax's name like…"). */
function hasSubjectAndVerb(words: string): boolean {
  const tokens = words.split(' ').map((t) => t.replace(/[^\w'-]/g, ''));
  const head = tokens[0] ?? '';
  if (CLAUSE_PRONOUN.test(head)) {
    const next = CLAUSE_ADVERB.test(tokens[1] ?? '') ? tokens[2] : tokens[1];
    return !!next && looksFinite(next.toLowerCase(), undefined);
  }
  if (!CLAUSE_DETERMINER.test(head) && !/^[A-Z]/.test(head)) return false;
  for (let i = 1; i < Math.min(tokens.length, 6); i++) {
    const t = tokens[i]!;
    if (CLAUSE_BREAK.test(t)) return false;
    if (CLAUSE_ADVERB.test(t)) continue;
    if (!CLAUSE_DETERMINER.test(tokens[i - 1]!) && looksFinite(t.toLowerCase(), tokens[i - 1])) return true;
  }
  return false;
}

/**
 * The words of reported speech in a sentence: "said / told <someone> that …", or "said / told <listener> <clause>"
 * when the clause has its own subject and verb. "Said <noun phrase>" (said Jax's name, said a prayer) is an action.
 */
function reportedClause(sentence: string, after: number): string | null {
  const hit = sentence.slice(after).match(REPORTED_SPEECH);
  if (!hit) return null;
  const words = hit[2]!.replace(/\s+/g, ' ').replace(/[\s.!?,;:]+$/, '').trim();
  if (NOT_A_CLAUSE.test(words) || words.split(' ').length < 4) return null;
  if (!hit[1] && !hasSubjectAndVerb(words)) return null;
  return words;
}

/**
 * Gap 1 — the verbatim record of what each person here said this turn: the quote in the sentence
 * that names them with a speech cue, else the reported clause after said / told / answered (that),
 * else the quote in the next sentence. Keyed by the words; never a stage direction with no speech.
 */
export function recordSpokenTopics(
  memories: NpcMemory[],
  presentNames: string[],
  topics: string[],
  gmText: string,
  turn: number,
  /** Token JSON turns: the accepted writer speech lines. Prose quote-parsing is only for non-JSON turns. */
  speech?: SpokenLine[]
): NpcMemory[] {
  const text = gmText.replace(/\s+/g, ' ').trim();
  if (!text) return memories;
  const asked = topics.filter((t) => SAID_TOPICS.has(t));
  const topic = asked[0] ?? topics.find(Boolean) ?? 'other';
  const here = new Set(presentNames.map(normalizeName));
  if (speech) return recordSpeechLines(memories, here, presentNames, asked, topic, speech, text, turn);
  const quotes = quoteSpans(text);
  const sentences = sentenceSpans(text);
  const taken = new Set<number>();
  const reported = new Set<number>();
  const inSentence = (s: SentenceSpan | undefined) =>
    s ? quotes.filter((q) => q.start >= s.start && q.start < s.end && !taken.has(q.start)) : [];

  return memories.map((m) => {
    if (!here.has(normalizeName(m.npcName))) return m;
    const names = speakerNames(m, presentNames);
    const spoken: QuoteSpan[] = [];
    sentences.forEach((s, i) => {
      const at = nameIndex(s.text, names);
      if (at < 0 || !SPEECH_CUE.test(s.text)) return;
      const own = inSentence(s);
      const clause = own.length || reported.has(s.start) ? null : reportedClause(s.text, at);
      if (clause) {
        reported.add(s.start);
        spoken.push({ start: s.start, words: clause });
        return;
      }
      const lines = own.length ? own : inSentence(sentences[i + 1]);
      for (const q of lines) {
        taken.add(q.start);
        spoken.push(q);
      }
    });
    if (!spoken.length) return m;
    const said = [...(m.said ?? [])];
    for (const q of spoken) {
      const line = q.words.slice(0, 180);
      if (!said.some((s) => s.line === line)) said.push({ topic, turn, line });
    }
    return {
      ...noteMotiveUse(m, spoken.map((q) => q.words)),
      said: said.slice(-MAX_SAID_PER_NPC),
      completedTopics: asked.length ? uniqueTopics([...(m.completedTopics ?? []), ...asked]) : m.completedTopics,
    };
  });
}

/** A motive line this person just said moves to the back of `motiveUsed`, so the next pick is the least recent. */
function noteMotiveUse(m: NpcMemory, words: string[]): NpcMemory {
  const spoken = (m.motiveLines ?? []).filter((l) => words.some((w) => w.trim().toLowerCase() === l.toLowerCase()));
  if (!spoken.length) return m;
  return { ...m, motiveUsed: [...(m.motiveUsed ?? []).filter((l) => !spoken.includes(l)), ...spoken] };
}

/** Each speech line goes to the person its declared speaker names, when that person is here and the words made the page. */
function recordSpeechLines(
  memories: NpcMemory[],
  here: Set<string>,
  presentNames: string[],
  asked: string[],
  topic: string,
  speech: SpokenLine[],
  committed: string,
  turn: number
): NpcMemory[] {
  const page = committed.toLowerCase();
  const owner = (speaker: string): NpcMemory | undefined => {
    const key = normalizeName(speaker);
    const live = memories.filter((m) => here.has(normalizeName(m.npcName)));
    return live.find((m) => [m.npcName, ...(m.aliases ?? [])].some((n) => normalizeName(n) === key))
      ?? live.find((m) => speakerNames(m, presentNames).some((n) => normalizeName(n) === key));
  };
  const byName = new Map<string, string[]>();
  for (const line of speech) {
    const words = line.words.replace(/\s+/g, ' ').trim();
    if (words.length < 2 || !page.includes(words.toLowerCase())) continue;
    const m = owner(line.speaker);
    if (!m) continue;
    byName.set(m.npcName, [...(byName.get(m.npcName) ?? []), words.slice(0, 180)]);
  }
  if (!byName.size) return memories;
  return memories.map((m) => {
    const lines = byName.get(m.npcName);
    if (!lines) return m;
    const said = [...(m.said ?? [])];
    for (const line of lines) {
      if (!said.some((s) => s.line === line)) said.push({ topic, turn, line });
    }
    return {
      ...noteMotiveUse(m, lines),
      said: said.slice(-MAX_SAID_PER_NPC),
      completedTopics: asked.length ? uniqueTopics([...(m.completedTopics ?? []), ...asked]) : m.completedTopics,
    };
  });
}

/**
 * The people here learn the player's name only when it is said aloud this turn: on the player's
 * own line, or inside spoken words on the committed page (speech lines on token turns, quotes otherwise).
 */
export function recordPlayerNameHeard(
  memories: NpcMemory[],
  presentNames: string[],
  playerName: string | undefined,
  playerLine: string,
  gmText: string,
  speech?: SpokenLine[]
): NpcMemory[] {
  const name = playerName?.trim();
  if (!name || !presentNames.length) return memories;
  const forms = [...new Set([name, name.split(/\s+/)[0]!])].filter((f) => f.length >= 2);
  const says = (text: string) => forms.some((f) => new RegExp(`\\b${escapeRe(f)}\\b`, 'i').test(text));
  const spoken = speech ? speech.map((l) => l.words) : quoteSpans(gmText.replace(/\s+/g, ' ')).map((q) => q.words);
  if (!says(playerLine) && !spoken.some(says)) return memories;
  const here = new Set(presentNames.map(normalizeName));
  const fact = `Knows the player as ${name}`;
  let dirty = false;
  const next = memories.map((m) => {
    if (m.knownPlayerName === name) return m;
    if (![m.npcName, ...(m.aliases ?? [])].some((n) => here.has(normalizeName(n)))) return m;
    dirty = true;
    return {
      ...m,
      knownPlayerName: name,
      facts: m.facts.includes(fact) ? m.facts : [...m.facts, fact].slice(-MAX_FACTS_PER_NPC),
    };
  });
  return dirty ? next : memories;
}

/** The one meeting write: each named person the committed beat showed is met on this visit. */
export function recordMeetings(state: GameState, names: string[], turn: number): GameState {
  if (!names.length) return state;
  const visit = currentVisitKey(state);
  let memories = state.npcMemories ?? [];
  for (const name of names) memories = upsertHarvestedNpcMemory(memories, name, turn, visit);
  return memories === state.npcMemories ? state : { ...state, npcMemories: memories };
}

export function applySocialLedgerTurn(args: {
  state: GameState;
  playerAction: string;
  gainedItemNames?: string[];
  questsBefore?: Quest[];
  questsAfter?: Quest[];
  turn: number;
  /** Hall-talk topics on the player line (caller computes; avoids an import cycle). */
  talkTopics?: string[];
  /** The committed GM beat. */
  gmText?: string;
  /** Token JSON turns: the accepted writer speech lines (see recordSpokenTopics). */
  speechLines?: SpokenLine[];
  /** Named people the committed beat showed (`narrativeHarvest.harvestNarrativePeople`). */
  metNames?: string[];
}): GameState {
  const { playerAction, turn } = args;
  let state = recordMeetings(args.state, args.metNames ?? [], turn);
  if (!state.openingEstablishment?.complete) return state;
  if ((state.turn ?? 0) < 2 && turn < 2) return state;

  let memories = state.npcMemories ?? [];
  if (args.gmText) {
    memories = recordSpokenTopics(
      memories,
      state.sceneFacts?.present ?? [],
      args.talkTopics ?? [],
      args.gmText,
      turn,
      args.speechLines
    );
  }
  memories = recordPlayerNameHeard(
    memories,
    state.sceneFacts?.present ?? [],
    state.character?.name,
    playerAction,
    args.gmText ?? '',
    args.speechLines
  );
  if (isBuyPlayerAction(playerAction)) {
    const merchant = findPresentMerchant(state);
    const items = uniquePurchases(args.gainedItemNames ?? []);
    if (merchant && items.length) {
      memories = recordMerchantPurchases(memories, merchant.npcName, items, turn);
    }
  }

  const acceptShaped = ACCEPT_QUEST_ACT.test(playerAction);
  const newlyLive = questNewlyLive(args.questsBefore, args.questsAfter ?? state.quests);
  if (acceptShaped || newlyLive) {
    const giver = findPresentQuestGiver({ ...state, npcMemories: memories });
    if (giver) {
      memories = markQuestGiverExit(memories, giver.npcName, turn);
    }
  }

  state = { ...state, npcMemories: memories };
  return applyNpcExitToPresent(state);
}
