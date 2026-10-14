/**
 * tt-fix-3 — the one reading of "the writer read out the record, posed the choice, decided the PC's mind or told
 * a roll the engine did not make". The game gate (`engineFactGate`) and the fact checker (`scripts/factCheck.mjs`)
 * both import this file, so a pattern fixed here is fixed in play, in autoplay and in the review tool at once.
 * No imports: Node loads this file directly for the checker.
 */

const QUOTED = /["“][^"”]*["”]/g;
/** The narrator's words only: a person talking (in quotes) is not the narrator reading the record. */
export const narrationOf = (s: string): string => (s ?? '').replace(QUOTED, ' ');
export const escRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NUM = '(?:\\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|forty-five|fifty|sixty|ninety|several|a few|half an?|a quarter of an?|another)';
/** A clock span the engine's travel record holds ("two hours", "half an hour", "thirty minutes"). */
const DURATION = new RegExp(`\\b${NUM}\\s+(?:more\\s+)?(?:minutes?|hours?)\\b`, 'i');

/** Leg counts and trip durations are the travel record; the road itself is the story. */
export const TRAVEL_RECORD: RegExp[] = [
  /\blegs? (?:one|two|three|four|\d+)(?: of (?:one|two|three|four|\d+))?\b/i,
  /\b(?:first|second|third|fourth|final|last|next|other) leg\b/i,
  /\btravel (?:leg|record|log)\b/i,
  /\bthe (?:travel|journey|trip|walk) (?:had )?(?:took|taken|added|cost)\b/i,
  /\btravel(?:l?ed)? for (?:about |nearly |some |another )?(?:\w+ )?(?:minutes?|hours?)\b/i,
  /\b(?:half|part) of the travel\b/i,
];

/** The engine fact carries a time or travel record this turn ("Travel: … +30 min, now dusk"). */
export function factHasTimeRecord(engineResult: string): boolean {
  return /\bTravel:|\+\s*\d+\s*(?:min|h)\b|\bnow (?:dawn|morning|midday|afternoon|dusk|evening|night)\b/i.test(engineResult ?? '');
}

export function travelRecordRead(sentence: string, engineResult: string): boolean {
  const s = narrationOf(sentence);
  if (TRAVEL_RECORD.some((re) => re.test(s))) return true;
  return factHasTimeRecord(engineResult) && DURATION.test(s);
}

/** The player's decision left hanging in the narration instead of ending on the scene. */
export function choicePosePatterns(who: string): RegExp[] {
  return [
    new RegExp(`\\b${who}\\s+(?:(?:would|will|must|should|could|had|has|have|needs?|needed|was|is|now|still|left)\\s+){1,3}(?:to\\s+)?(?:decide|choose)\\b`, 'i'),
    new RegExp(`\\bwhether (?:or not )?${who}\\b[^.!?]*\\bor\\b`, 'i'),
    new RegExp(`\\bwaits? for ${who} to (?:decide|choose|face|act|answer)\\b`, 'i'),
    /\b(?:would|will) decide (?:how|what|whether|where|which)\b/i,
    /\bthe (?:question|choice|decision) (?:is|was|now|remains|remained) (?:whether|if|which)\b/i,
    /\b(?:choices?|decisions?)\b[^.!?]{0,60}\b(?:waits?|waited|awaits?|awaited|loomed|looms|remained|remains|lay|lies|stood|stands)\b/i,
    /\bquestions?\b[^.!?]{0,40}\b(?:waits?|waited|awaits?|awaited)\b/i,
  ];
}

/** The narrator deciding the PC's feeling, certainty or mind. */
export function agencyPatterns(who: string): RegExp[] {
  const mind = '(?:certain|sure|uneasy|afraid|nervous|wary|anxious|calm|relieved|angry|glad|hopeful|doubtful|think|wonder|doubt|feel|fear|believe|want)';
  return [
    new RegExp(`\\b${who}\\s+(?:decided|realized|realised|resolved|chose)\\b`, 'i'),
    /\bmade (?:the|this|that|it) (?:\w+ )?(?:feel|seem)\b/i,
    new RegExp(`\\bmade ${who}\\s+${mind}\\b`, 'i'),
    new RegExp(`\\b${who}\\s+(?:did not|didn['’]t|does not|doesn['’]t)\\s+(?:like|trust|want|believe)\\b`, 'i'),
    new RegExp(`\\b${who}\\s+(?:felt|was|grew)\\s+(?:\\w+\\s+)?(?:certain|sure|uneasy|afraid|nervous|anxious|relieved|hopeful)\\b`, 'i'),
  ];
}

/** The player's line is speech: quoted words or a talk verb. */
export function playerLineSpeaks(playerInput: string): boolean {
  return /["“?]|^\s*(?:i|i'm|my|we|hello|hi|greetings|yes|no)\b|\b(?:say|says|said|tell|ask|talk|speak|shout|call|warn|answer|reply|greet|plead|persuade|parley|negotiate|threaten|bargain)\b/i.test(playerInput ?? '');
}

/** The narrator giving the PC words the player never said. */
export function pcSpeechPatterns(who: string): RegExp[] {
  return [
    new RegExp(`\\b${who}\\s+(?:\\w+\\s+)?(?:said|says|spoke|speaks|asked|asks|shouted|shouts|called|calls|warned|warns|answered|answers|replied|replies|told|tells|whispered|whispers|muttered|mutters)\\b`, 'i'),
  ];
}

/** What the fight fact says the PC and the foes did this turn. */
export function fightRolls(engineResult: string | undefined | null) {
  const f = engineResult ?? '';
  return {
    isFight: /\bFight:|ENGINE OUTCOME|\battacks you\b|\bhits you\b|\bYou attack\b|\bYou hit\b|\bunconscious\b|\bdeath save\b|\bYou are dead\b|\bYour breath stops\b|\bbreath falters\b/i.test(f),
    pcLanded: /\bYou (?:hit|land a critical blow on|cast)\b|\bYour blow carries\b|\bEven your miss clips\b|\bonly partly escapes\b/.test(f),
    pcCannotAct: /\bcannot move, speak or act\b|\bYou are dead\b|\bYour breath stops\b|\bYou cannot move or act\b/.test(f),
    foeActed: /\b(?:attacks|hits|lands a critical blow on|bites|strikes|stings|claws) you\b/.test(f),
    foeHits: (f.match(/\b(?:hits|lands a critical blow on) you\b/g) ?? []).length,
    foeMisses: (f.match(/\battacks you\b[^.]*\band misses\b/g) ?? []).length,
  };
}

const NOT_A_FOE = '(?!\\s+(?:the\\s+|a\\s+)?(?:ground|floor|dirt|mud|earth|stone|stones|wall|road|nothing|air|only))';
const PC_BLOW = '(?:struck|strikes|hit|hits|landed|lands|connected|connects|slashed|slashes|stabbed|stabs|pierced|pierces|wounded|wounds|sliced|slices)';
const PC_ACT = '(?:swung|swings|lunged|lunges|attacked|attacks|thrust|thrusts|parried|parries|dodged|dodges|blocked|blocks|raised|raises|drew|draws|fired|fires|cast|casts|charged|charges|rolled|rolls|scrambled|scrambles)';

/** One sentence's fight problem against the fact, or null. */
export function rollContradiction(sentence: string, who: string, engineResult: string): boolean {
  const rolls = fightRolls(engineResult);
  if (!rolls.isFight) return false;
  const s = narrationOf(sentence);
  const subject = `\\b${who}(?:['’]s|r)?\\s+(?:\\w+\\s+){0,2}?`;
  if ((!rolls.pcLanded || rolls.pcCannotAct) && new RegExp(`${subject}${PC_BLOW}\\b${NOT_A_FOE}`, 'i').test(s)) return true;
  // A PC who cannot act (down, dead) swings, dodges or draws nothing.
  if (rolls.pcCannotAct && new RegExp(`${subject}${PC_ACT}\\b`, 'i').test(s)) return true;
  if (rolls.foeHits > 0 && rolls.foeMisses === 0 && new RegExp(`\\b(?:missed|misses|went wide of|glanced off)\\s+${who}\\b`, 'i').test(s)) return true;
  // No foe attack in the fact: nothing strikes, bites or stings the PC this turn.
  if (!rolls.foeActed && new RegExp(`\\b(?:struck|strikes|hit|hits|bit|bites|stung|stings|clawed|claws|raked|rakes|slashed|slashes|tore into|sank (?:its|their) \\w+ into)\\s+${who}\\b`, 'i').test(s)) return true;
  return false;
}

export const HIT_WORDS = /\b(?:hit|hits|struck|strikes|bit|bites|bitten|cut|cuts|wound\w*|blood\w*|pain\w*|slash\w*|gash\w*|tore|tears?|sank|sinks|pierc\w*|stab\w*|slam\w*|crack\w*|knock\w*|fell|falls?|collaps\w*|drops?|dropped|reel\w*|stagger\w*|burn\w*|sting\w*|ache\w*|hurt\w*)\b/i;

const STEP_STOP = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'onto', 'that', 'this', 'your', 'their', 'his', 'her', 'its', 'are', 'was', 'were', 'has', 'have', 'had', 'what', 'who', 'any', 'all', 'out', 'off', 'not', 'them', 'they', 'then', 'than', 'there', 'where', 'when', 'while']);
export const wordsOf = (s: string): string[] => (String(s ?? '').toLowerCase().match(/[a-z][a-z'’-]+/g) ?? []);
const stem = (w: string) => w.replace(/(?<!s)s$/, '').replace(/(?:ing|ed)$/, '');

/** Three content words in a row from a quest step: the step's own clue. */
export function stepRuns(desc: string): string[] {
  const w = wordsOf(desc);
  const out: string[] = [];
  for (let i = 0; i + 3 <= w.length; i += 1) {
    const run = w.slice(i, i + 3);
    if (run.every((x) => x.length >= 3 && !STEP_STOP.has(x))) out.push(run.join(' '));
  }
  return out;
}

function stepStems(desc: string, pc: string): Set<string> {
  const skip = pc.toLowerCase();
  return new Set(wordsOf(desc).filter((w) => w.length >= 3 && !STEP_STOP.has(w) && w !== skip).map(stem));
}

/** The narrator restating a task as still owed ("still must be hauled up", "still wait for someone to read"). */
const OBLIGATION = /\b(?:still\s+(?:must|needs?|needed|wants?|wanted|waits?|waited|hangs?|has to|had to)|must be \w+|needs? to be|needed (?:\w+\s+)?(?:review|reading|checking|counting|hauling|doing)|waits? (?:for (?:someone|somebody|anyone|\w+) )?to (?:be )?\w+)\b/i;

/**
 * A sentence that reads an open quest step aloud: the step's own three-word clue, three of its words the page
 * never showed, or two of its words told as a task still owed. `known` is the page, the engine fact and the input.
 */
export function questStepLeak(openSteps: string[], sentence: string, known: string, pc = ''): string | null {
  const said = wordsOf(narrationOf(sentence));
  const saidLine = ` ${said.join(' ')} `;
  const knownWords = ` ${wordsOf(known).join(' ')} `;
  const knownStems = new Set(wordsOf(known).map(stem));
  const saidStems = new Set(said.map(stem));
  const owed = OBLIGATION.test(narrationOf(sentence));
  for (const desc of openSteps) {
    const run = stepRuns(desc).find((r) => saidLine.includes(` ${r} `) && !knownWords.includes(` ${r} `));
    if (run) return run;
    const shared = [...stepStems(desc, pc)].filter((w) => saidStems.has(w));
    if (owed && shared.length >= 2) return shared.join(' ');
    const fresh = shared.filter((w) => !knownStems.has(w));
    if (fresh.length >= 3) return fresh.join(' ');
  }
  return null;
}

/** A quest's title spoken by the narrator: the journal read aloud ("word reached them about The Tainted Waters"). */
export function questTitleNamed(titles: string[], sentence: string): string | null {
  const s = narrationOf(sentence).toLowerCase();
  for (const t of titles) {
    const core = String(t ?? '').replace(/^\s*(?:\[[^\]]*\]\s*)?(?:the\s+)?/i, '').trim().toLowerCase();
    if (core.split(/\s+/).length < 2) continue;
    if (new RegExp(`\\b${escRe(core)}\\b`).test(s)) return t;
  }
  return null;
}
