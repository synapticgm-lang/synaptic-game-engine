/** Option-set diversity: distinct roles / cooldowns (semantic, not exact text). */
import type { GameState, EngineMode } from './types';
import { canonicalizeIntent, intentSimilarity, type SemanticIntent } from './semanticLoopDetector';
export interface ChoiceProfile {
  text: string;
  intent: SemanticIntent;
  role: ChoiceRole;
  outcomeType: OutcomeType;
}
export type ChoiceRole =
  | 'objective_forward'
  | 'risky_upside'
  | 'social_world'
  | 'disengage'
  | 'safe_explore'
  | 'generic';
export type OutcomeType =
  | 'progress'
  | 'risk'
  | 'relationship'
  | 'information'
  | 'resource'
  | 'position'
  | 'stall';
export interface DiversityContract {
  requiredRoles: ChoiceRole[];
  minOptions: number;
  maxSimilarity: number;
}
export interface OptionCooldown {
  canonical: string;
  lastOfferedTurn: number;
  offerCount: number;
  cooldownTurns: number;
}
export interface DiversityViolation {
  kind: 'missing_role' | 'too_similar' | 'on_cooldown' | 'semantic_duplicate';
  description: string;
  choices?: string[];
}
export function classifyChoiceRole(
  choice: string,
  intent: SemanticIntent,
  state: GameState
): ChoiceRole {
  const lower = choice.toLowerCase();
  // Check if this advances an active quest
  const activeQuests = (state.quests ?? []).filter(q => q.status === 'active' && q.revealed);
  for (const quest of activeQuests) {
    const questKeywords = quest.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (questKeywords.some(kw => lower.includes(kw))) {
      return 'objective_forward';
    }
    // Check objectives
    for (const obj of quest.objectives ?? []) {
      if (!obj.completed && obj.description) {
        const objKeywords = obj.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        if (objKeywords.some(kw => lower.includes(kw))) {
          return 'objective_forward';
        }
      }
    }
  }
  // Disengage patterns
  if (intent.action === 'disengage' || /\b(walk away|leave|exit|decline|refuse)\b/i.test(lower)) {
    return 'disengage';
  }
  // Risky patterns
  if (/\b(attack|fight|confront|challenge|demand|threaten|force)\b/i.test(lower)) {
    return 'risky_upside';
  }
  // Social patterns
  if (intent.action === 'ask' || /\b(talk|speak|negotiate|persuade|charm|befriend)\b/i.test(lower)) {
    return 'social_world';
  }
  // Safe exploration
  if (intent.action === 'inspect' || intent.action === 'search' || intent.action === 'listen') {
    return 'safe_explore';
  }
  return 'generic';
}
export function predictOutcomeType(choice: string, role: ChoiceRole, _intent: SemanticIntent): OutcomeType {
  if (role === 'objective_forward') return 'progress';
  if (role === 'risky_upside') return 'risk';
  if (role === 'social_world') return 'relationship';
  if (role === 'disengage') return 'position';
  const lower = choice.toLowerCase();
  if (/\b(take|grab|acquire|loot|claim)\b/i.test(lower)) return 'resource';
  if (/\b(ask|question|learn|discover|investigate)\b/i.test(lower)) return 'information';
  if (/\b(travel|move|go to|enter)\b/i.test(lower)) return 'position';
  if (/\b(wait|observe|listen|browse)\b/i.test(lower)) return 'stall';
  return 'information';
}
export function buildChoiceProfiles(choices: string[], state: GameState, turn: number): ChoiceProfile[] {
  const out: ChoiceProfile[] = [];
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i]!;
    const intent = canonicalizeIntent(choice, turn);
    const role = classifyChoiceRole(choice, intent, state);
    out.push({ text: choice, intent, role, outcomeType: predictOutcomeType(choice, role, intent) });
  }
  return out;
}
export function getDiversityContract(state: GameState): DiversityContract {
  const activeQuests: typeof state.quests = [];
  for (const q of state.quests ?? []) {
    if (q.status === 'active' && q.revealed) activeQuests.push(q);
  }
  const inCombat = !!state.activeEncounter;
  const inDungeon = !!state.activeDungeon;
  const alone = state.openingEstablishment?.aloneArrival === true && !state.activeEncounter;
  const requiredRoles: ChoiceRole[] = [];
  if (activeQuests.length > 0) requiredRoles.push('objective_forward');
  if (inCombat) return { requiredRoles: ['risky_upside', 'disengage'], minOptions: 2, maxSimilarity: 0.7 };
  if (!alone) requiredRoles.push('social_world');
  if (!inCombat && !inDungeon) requiredRoles.push('disengage');
  return {
    requiredRoles: requiredRoles.length > 0 ? requiredRoles : ['safe_explore', 'social_world', 'disengage'],
    minOptions: 3,
    maxSimilarity: 0.75,
  };
}
export function checkDiversityContract(
  profiles: ChoiceProfile[],
  contract: DiversityContract
): DiversityViolation[] {
  const violations: DiversityViolation[] = [];
  // Check minimum options
  if (profiles.length < contract.minOptions) {
    violations.push({
      kind: 'missing_role',
      description: `Need at least ${contract.minOptions} options, have ${profiles.length}`,
    });
  }
  // Check required roles
  const presentRoles = new Set<ChoiceRole>();
  for (let i = 0; i < profiles.length; i++) presentRoles.add(profiles[i]!.role);
  for (const required of contract.requiredRoles) {
    if (!presentRoles.has(required)) {
      violations.push({
        kind: 'missing_role',
        description: `Missing required role: ${required}`,
      });
    }
  }
  // Check semantic similarity (pairwise)
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const similarity = intentSimilarity(profiles[i].intent, profiles[j].intent);
      if (similarity > contract.maxSimilarity) {
        violations.push({
          kind: 'too_similar',
          description: `Options too similar (${(similarity * 100).toFixed(0)}%): "${profiles[i].text.slice(0, 40)}" vs "${profiles[j].text.slice(0, 40)}"`,
          choices: [profiles[i].text, profiles[j].text],
        });
      }
    }
  }
  // Check for semantic duplicates (same action + target + purpose)
  const seen = new Map<string, string>();
  for (const profile of profiles) {
    const key = `${profile.intent.action}:${profile.intent.target}:${profile.intent.purpose}`;
    if (seen.has(key)) {
      violations.push({
        kind: 'semantic_duplicate',
        description: `Duplicate semantic intent: "${profile.text.slice(0, 40)}" matches "${seen.get(key)?.slice(0, 40)}"`,
        choices: [profile.text, seen.get(key)!],
      });
    }
    seen.set(key, profile.text);
  }
  return violations;
}
const TRAVEL_CHIP = /^(?:travel|head|go|walk|move|return|journey)\s+(?:back\s+)?(?:to|toward|towards|into)\s+(.+)$/i;
const ENTER_CHIP = /^enter\s+(.+)$/i;
const TALK_CHIP = /^(?:talk|speak)\s+(?:to|with)\s+(.+)$/i;
/** Title-Case run after the talk/travel verb is the chip's named target. */
const ASK_NAMED_CHIP = /^[Aa]sk\s+((?:[A-Z][\w'’-]*)(?:\s+[A-Z][\w'’-]*)*)/;
function targetKey(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, '')
    .replace(/^(?:the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
/** Cooldown key: named target when present, else the chip label. */
export function canonicalizeOption(choice: string): string {
  const label = choice.trim();
  const travel = label.match(TRAVEL_CHIP) ?? label.match(ENTER_CHIP);
  if (travel) return `travel:${targetKey(travel[1])}:explore`;
  const talk = label.match(TALK_CHIP);
  if (talk) return `ask:${targetKey(talk[1])}:gather_info`;
  const askNamed = label.match(ASK_NAMED_CHIP);
  if (askNamed) return `ask:${targetKey(askNamed[1])}:gather_info`;
  const intent = canonicalizeIntent(label, 0);
  const target = intent.action === 'generic' && intent.target === 'environment' ? targetKey(label) : intent.target;
  return `${intent.action}:${target}:${intent.purpose}`;
}
export function isOnCooldown(
  choice: string,
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): { onCooldown: boolean; turnsRemaining?: number; cooldown?: OptionCooldown } {
  const cooldown = cooldowns.get(canonicalizeOption(choice));
  if (!cooldown) return { onCooldown: false };
  const turnsSinceLast = currentTurn - cooldown.lastOfferedTurn;
  if (turnsSinceLast < cooldown.cooldownTurns) {
    return { onCooldown: true, turnsRemaining: cooldown.cooldownTurns - turnsSinceLast, cooldown };
  }
  return { onCooldown: false, cooldown };
}
export function updateCooldowns(
  choices: string[],
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): Map<string, OptionCooldown> {
  const updated = new Map(cooldowns);
  for (const choice of choices) {
    const canonical = canonicalizeOption(choice);
    const existing = updated.get(canonical);
    if (existing) {
      updated.set(canonical, {
        ...existing,
        lastOfferedTurn: currentTurn,
        offerCount: existing.offerCount + 1,
        cooldownTurns: existing.offerCount >= 3 ? Math.min(10, existing.cooldownTurns + 2) : existing.cooldownTurns,
      });
    } else {
      const lower = choice.toLowerCase();
      const base =
        /\b(walk away|check (?:the|your) bag|wait|observe)\b/i.test(lower) ? 5
        : /\b(listen|browse|inspect surroundings)\b/i.test(lower) ? 3
        : 2;
      updated.set(canonical, { canonical, lastOfferedTurn: currentTurn, offerCount: 1, cooldownTurns: base });
    }
  }
  for (const [key, cooldown] of updated.entries()) {
    if (currentTurn - cooldown.lastOfferedTurn > 50) updated.delete(key);
  }
  return updated;
}
export function filterCooldownChoices(
  choices: string[],
  currentTurn: number,
  cooldowns: Map<string, OptionCooldown>
): { filtered: string[]; removed: Array<{ choice: string; reason: string }> } {
  const filtered: string[] = [];
  const removed: Array<{ choice: string; reason: string }> = [];
  for (const choice of choices) {
    const check = isOnCooldown(choice, currentTurn, cooldowns);
    if (check.onCooldown) {
      removed.push({
        choice,
        reason: `On cooldown: ${check.turnsRemaining} turns remaining (offered ${check.cooldown?.offerCount} times recently)`,
      });
    } else filtered.push(choice);
  }
  return { filtered, removed };
}
