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

/** What anyone wears or is: a garment or a part of the body is no new object to hand. */
export const WORN_OR_BODY =
  /^(?:clothes|coat|cloak|hood|collar|sleeves?|cuffs?|shirt|tunic|jerkin|jacket|boots?|belt|hat|gloves?|pockets?|trousers|breeches|skirt|apron|scarf|shawl|eyes?|face|breath|voice|feet|foot|legs?|shoulders?|back|jaw|lips?|mouth|brow|neck|gaze|weight|heels?|hands?|arms?|fingers?|fists?|palms?|head|hair)$/;
/** A handed bag covers its other names. */
export const BAG_WORD = /^(?:pack|packs|backpack|satchel|knapsack|rucksack)$/;

/** Leg counts and trip durations are the travel record; the road itself is the story. */
export const TRAVEL_RECORD: RegExp[] = [
  /\blegs? (?:one|two|three|four|\d+)(?: of (?:one|two|three|four|\d+))?\b/i,
  /\b(?:first|second|third|fourth|final|last|next|other) leg\b/i,
  /\btravel (?:leg|record|log)\b/i,
  /\bthe (?:travel|journey|trip|walk) (?:had )?(?:took|taken|added|cost)\b/i,
  /\btravel(?:l?ed)? for (?:about |nearly |some |another )?(?:\w+ )?(?:minutes?|hours?)\b/i,
  /\b(?:half|part) of the travel\b/i,
];

/** A span the clock recorded ("+30 min" told as "half an hour") is the clock in the story, not the record read out. */
export function travelRecordRead(sentence: string, _engineResult?: string): boolean {
  return TRAVEL_RECORD.some((re) => re.test(narrationOf(sentence)));
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

/** The player's line is speech: quoted words, a talk verb, or a question chip with no mark ("Who are you"). */
export function playerLineSpeaks(playerInput: string): boolean {
  return /["“?]|^\s*(?:i|i'm|my|we|hello|hi|greetings|yes|no|who|what|where|why|how|when|which)\b|\b(?:say|says|said|tell|ask|talk|speak|shout|call|warn|answer|reply|greet|plead|persuade|parley|negotiate|threaten|bargain)\b/i.test(playerInput ?? '');
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
