/**
 * Kid Mode language lock.
 * Casual swears become silly in-world wording (fuck → feck/duck).
 * Spaced, leet, and mashed spellings still match. Identity slurs are masked, not joked.
 */

type Swap = { term: string; alts: string[]; wholeWord?: boolean };

/** Longer terms first so "fucking" wins over "fuck". */
const FUN_SWAPS: Swap[] = [
  { term: 'motherfucker', alts: ['mean goose', 'grumpy duck'] },
  { term: 'motherfuck', alts: ['oh fudge'] },
  { term: 'fuckity', alts: ['feckity', 'ducky'] },
  { term: 'fucking', alts: ['fecking', 'ducking', 'fudging'] },
  { term: 'fucked', alts: ['fecked', 'ducked'] },
  { term: 'fucker', alts: ['fecker', 'goose'] },
  { term: 'fuck', alts: ['feck', 'duck', 'fudge'] },
  { term: 'bullshit', alts: ['baloney', 'nonsense'] },
  { term: 'shite', alts: ['poop', 'mud'] },
  { term: 'shit', alts: ['poop', 'crap', 'mud'] },
  { term: 'asshole', alts: ['grump', 'silly-billy'] },
  { term: 'arsehole', alts: ['grump', 'silly-billy'] },
  { term: 'bastard', alts: ['rascal', 'scoundrel'] },
  { term: 'bollocks', alts: ['balderdash', 'nonsense'] },
  { term: 'bullcrap', alts: ['baloney'] },
  { term: 'bitch', alts: ['witch', 'grump'] },
  { term: 'wanker', alts: ['goose', 'noodle'] },
  { term: 'tosser', alts: ['goose', 'noodle'] },
  { term: 'twat', alts: ['goose'] },
  { term: 'dickhead', alts: ['goose', 'noodle'] },
  { term: 'pissed', alts: ['steamed', 'grumpy'] },
  { term: 'pissing', alts: ['splashing'] },
  { term: 'piss', alts: ['splash', 'puddle'] },
  { term: 'bugger', alts: ['bother', 'fudge'] },
  { term: 'bloody', alts: ['blooming', 'ruddy'], wholeWord: true },
  { term: 'damn', alts: ['darn', 'drat'], wholeWord: true },
  { term: 'dammit', alts: ['darn it', 'drat'] },
  { term: 'goddamn', alts: ['gosh darn'] },
  { term: 'crap', alts: ['crud', 'dust'], wholeWord: true },
  { term: 'dick', alts: ['stick', 'pete'], wholeWord: true },
  { term: 'cock', alts: ['rooster'], wholeWord: true },
  { term: 'pussy', alts: ['kitty'] },
  { term: 'slut', alts: ['rogue'] },
  { term: 'whore', alts: ['rogue'] },
  { term: 'pervert', alts: ['nosy goose'] },
  { term: 'perve', alts: ['snoop', 'goose'] },
  { term: 'perv', alts: ['snoop'] },
  { term: 'arse', alts: ['bottom'], wholeWord: true },
  { term: 'ass', alts: ['bottom'], wholeWord: true },
  { term: 'hell', alts: ['heck'], wholeWord: true },
  { term: 'cunt', alts: ['meanie'] },
  { term: 'tit', alts: ['bird'], wholeWord: true },
  { term: 'boob', alts: ['button'] },
  { term: 'porn', alts: ['a silly cartoon'] },
  { term: 'sex', alts: ['hugs'], wholeWord: true },
  { term: 'sexy', alts: ['silly'] },
  { term: 'horny', alts: ['giggly'] },
  { term: 'wtf', alts: ['what the fudge', 'oh my'] },
  { term: 'stfu', alts: ['hush please'] },
  { term: 'lmao', alts: ['haha'] },
  { term: 'lmfao', alts: ['haha'] },
];

/** Not joked. Masked so they never land as names, gear, or quoted chat. */
const MASK_TERMS: Swap[] = [
  { term: 'nigger', alts: ['unkind word'] },
  { term: 'nigga', alts: ['unkind word'] },
  { term: 'faggot', alts: ['unkind word'] },
  { term: 'fag', alts: ['unkind word'], wholeWord: true },
  { term: 'retard', alts: ['unkind word'] },
  { term: 'retarded', alts: ['unkind word'] },
  { term: 'tranny', alts: ['unkind word'] },
  { term: 'kike', alts: ['unkind word'] },
  { term: 'spastic', alts: ['unkind word'] },
];

const LEET: Record<string, string> = {
  a: 'a4@',
  b: 'b8',
  c: 'c(',
  e: 'e3',
  g: 'g9',
  i: 'i1!|',
  l: 'l1',
  o: 'o0',
  s: 's5$',
  t: 't7+',
  u: 'uv',
};

function charClass(ch: string): string {
  const mapped = LEET[ch] ?? ch;
  const uniq = [...new Set([...mapped])].map((c) => (c === '+' || c === '|' || c === '(' || c === '$' ? `\\${c}` : c));
  return `[${uniq.join('')}]`;
}

function termPattern(term: string, wholeWord: boolean): RegExp {
  const chars = [...term.toLowerCase()];
  const body = chars
    .map((ch, i) => {
      const piece = `${charClass(ch)}+`;
      return i === chars.length - 1 ? piece : `${piece}[^a-z0-9]*`;
    })
    .join('');
  const wrapped = wholeWord ? `(?<![a-z0-9])${body}(?![a-z0-9])` : body;
  return new RegExp(wrapped, 'gi');
}

function pickAlt(alts: string[], sample: string): string {
  let n = 0;
  for (let i = 0; i < sample.length; i++) n = (n + sample.charCodeAt(i) * (i + 3)) % 997;
  return alts[n % alts.length] ?? alts[0]!;
}

function matchCase(sample: string, replacement: string): string {
  if (sample.length > 1 && sample === sample.toUpperCase()) return replacement.toUpperCase();
  if (sample[0] && sample[0] === sample[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

const ALL_SWAPS: Swap[] = [...MASK_TERMS, ...FUN_SWAPS].sort((a, b) => b.term.length - a.term.length);

const COMPILED = ALL_SWAPS.map((swap) => ({
  ...swap,
  re: termPattern(swap.term, swap.wholeWord === true),
}));

export function applyKidFriendlySwears(text: string): string {
  if (!text) return text;
  let next = text;
  for (const swap of COMPILED) {
    next = next.replace(swap.re, (hit) => matchCase(hit, pickAlt(swap.alts, hit)));
  }
  return next;
}

export const sanitizeInput = (input: string, mode: 'kid' | 'adult' | 'unrestricted'): string => {
  if (mode !== 'kid') return input;
  return applyKidFriendlySwears(input);
};
