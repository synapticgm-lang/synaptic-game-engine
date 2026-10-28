/**
 * T10E — one shared shape for writer cue lines.
 * Built here for the writer (typedFreeText.clauseWriterFact); recognised and converted here for the
 * player-facing path (writerEngineResult / lastResortUsable / applyGovernanceToProse).
 * Writer still receives every cue; player-visible text never keeps cue chrome.
 * SRD 5.2.1 Communicating — brief speech is free; the engine does not invent the PC's line
 * (Wizards of the Coast, CC BY 4.0).
 *
 * T10P — Must narrate clauses convert to third-person act lines (never paste raw first-person).
 * Cue blocks are cut on cue headers, not on every ". ", so a period inside a clause cannot leak.
 */

import { isAggregatePersonToken, isCrowdFillerToken } from './chromeAuthority';
import { plainItemChromeInText } from './proseItemName';

/** Chrome that must never appear on the player book. */
export const WRITER_CUE_CHROME =
  /Must narrate|PC says exactly|Speech event|reaction slot|No one present to answer|The story must show/i;

export function hasWriterCueChrome(text: string): boolean {
  return WRITER_CUE_CHROME.test(text ?? '');
}

export function mustNarrateCue(clause: string): string {
  // T10Z — Fine Pistol / Bronze Reward Box never reach the writer as Title-Case system nouns.
  return `Must narrate: ${plainItemChromeInText(clause)}.`;
}

export function pcSaysExactlyCue(said: string): string {
  return `PC says exactly: "${said}" (do not rewrite).`;
}

/**
 * Who may hold a reaction / answer slot from a present list.
 * Crowd fillers never speak. Ledger cast groups ("the roof-thieves", "the Pact crew") do —
 * even when the hyphen-plural invent-shape marks them aggregate (T10X / T10V chain).
 */
function speakableHere(here: string[]): string[] {
  return here.filter((n) => !isCrowdFillerToken(n));
}

/**
 * Present named addressee → reaction slot. Crowd fillers are addressed but do not speak.
 * Ledger present groups (roof-thieves / Pact crew) open a reaction slot. When `presentHere`
 * is supplied (including `[]` = alone), a named who must be on that list or the cue is absence
 * (T10P). Omitting the list keeps the legacy named-slot behaviour for callers that only pass a
 * who. Unnamed talk with people here addresses them — never "empty scene" (T10M). Else empty-scene speech.
 */
export function speechAddressCue(who: string | null, presentHere?: string[] | null): string {
  const here =
    presentHere != null
      ? presentHere.map((n) => (n ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
      : null;
  if (who && isCrowdFillerToken(who)) {
    return `Speech event: you address ${who}. No one present to answer.`;
  }
  // Invented hyphen group not on the ledger → no slot (T10L salt-burners). On-ledger → reacts (T10X).
  if (who && isAggregatePersonToken(who) && here != null && !nameOnList(who, here)) {
    return `Speech event: you address ${who}. No one present to answer.`;
  }
  if (who && isAggregatePersonToken(who) && here == null) {
    return `Speech event: you address ${who}. No one present to answer.`;
  }
  if (who) {
    if (here != null && !nameOnList(who, here)) {
      return `Speech event: you address ${who}. No one present to answer.`;
    }
    return `Speech event: you address ${who}. NPC reaction slot open for ${who}.`;
  }
  const list = here ?? [];
  // T10V/T10X — crowd fillers are not speakers; ledger groups and named people are.
  const speakers = speakableHere(list);
  if (speakers.length === 1) {
    return `Speech event: you address ${speakers[0]}. NPC reaction slot open for ${speakers[0]}.`;
  }
  if (speakers.length > 1) {
    return `Speech event: you address the people here. NPC reaction slot open for ${speakers[0]}.`;
  }
  if (list.length === 1) {
    // Sole crowd filler: addressed, but nobody can answer as one NPC.
    return `Speech event: you address ${list[0]}. No one present to answer.`;
  }
  if (list.length > 1) {
    return `Speech event: you address the people here. No one present to answer.`;
  }
  return `Speech event: you address the empty scene. No one present to answer.`;
}

function nameOnList(who: string, here: string[]): boolean {
  const w = who.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!w) return false;
  for (let i = 0; i < here.length; i++) {
    const h = here[i]!.toLowerCase();
    if (h === w || h.includes(w) || w.includes(h)) return true;
  }
  return false;
}

export function showActCue(): string {
  return 'The story must show this act.';
}

/** Writer-facing fact for one clause (same strings the player path later converts). */
export function buildClauseWriterFact(
  clause: string,
  speech: boolean,
  opts?: { said?: string; addressee?: string | null; presentHere?: string[] | null },
): string {
  const parts: string[] = [mustNarrateCue(clause)];
  const here = opts?.presentHere ?? null;
  if (speech) {
    const said = (opts?.said ?? '').replace(/\s+/g, ' ').trim();
    const who = opts?.addressee?.trim() || null;
    if (said) parts.push(pcSaysExactlyCue(said));
    parts.push(speechAddressCue(who, here));
  } else {
    const who = opts?.addressee?.trim() || null;
    // T10P — offering / holding out to a named person who is not here is absence, not a reaction.
    if (who && here != null && !nameOnList(who, here)) {
      parts.push(speechAddressCue(who, here));
    } else {
      parts.push(showActCue());
      // T10X — unaddressed physical act (kick/point) with a present ledger group: they react.
      // Addressed Face/Talk targets stay show-act only (T10P — no Speech event stub).
      if (!who) {
        const reactors = speakableHere(
          (here ?? []).map((n) => (n ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean),
        );
        if (reactors.length >= 1) {
          parts.push(
            speechAddressCue(reactors.length === 1 ? reactors[0]! : null, reactors),
          );
        }
      }
    }
  }
  return parts.join(' ');
}

/** Irregular / common verb → simple past (fallback book body; not a full conjugator). */
function toSimplePast(verb: string): string {
  const v = (verb ?? '').toLowerCase();
  if (!v) return v;
  const irreg: Record<string, string> = {
    am: 'was',
    is: 'was',
    are: 'were',
    have: 'had',
    has: 'had',
    do: 'did',
    does: 'did',
    go: 'went',
    goes: 'went',
    come: 'came',
    comes: 'came',
    say: 'said',
    says: 'said',
    tell: 'told',
    tells: 'told',
    give: 'gave',
    gives: 'gave',
    take: 'took',
    takes: 'took',
    make: 'made',
    makes: 'made',
    leave: 'left',
    leaves: 'left',
    keep: 'kept',
    keeps: 'kept',
    hold: 'held',
    holds: 'held',
    stand: 'stood',
    stands: 'stood',
    sit: 'sat',
    sits: 'sat',
    get: 'got',
    gets: 'got',
    put: 'put',
    puts: 'put',
    run: 'ran',
    runs: 'ran',
    see: 'saw',
    sees: 'saw',
    slide: 'slid',
    slides: 'slid',
    rest: 'rested',
    rests: 'rested',
    stare: 'stared',
    stares: 'stared',
    kick: 'kicked',
    kicks: 'kicked',
    slam: 'slammed',
    slams: 'slammed',
    toss: 'tossed',
    tosses: 'tossed',
    throw: 'threw',
    throws: 'threw',
    pick: 'picked',
    picks: 'picked',
    grip: 'gripped',
    grips: 'gripped',
    face: 'faced',
    faces: 'faced',
    ask: 'asked',
    asks: 'asked',
    speak: 'spoke',
    speaks: 'spoke',
    talk: 'talked',
    talks: 'talked',
    step: 'stepped',
    steps: 'stepped',
    walk: 'walked',
    walks: 'walked',
  };
  if (irreg[v]) return irreg[v]!;
  if (v.endsWith('ie')) return `${v.slice(0, -2)}ied`;
  if (v.endsWith('y') && v.length > 2 && !/[aeiou]y$/i.test(v)) return `${v.slice(0, -1)}ied`;
  if (v.endsWith('e')) return `${v}d`;
  if (/[aeiou][bdfglmnprst]$/i.test(v) && !/(?:[aeiou]{2}|[aeiou][lr])$/i.test(v)) {
    return `${v}${v[v.length - 1]}ed`;
  }
  return `${v}ed`;
}

/**
 * First-person / bare imperative / gerund clause → one third-person past sentence (fallback book body).
 * Subject is the PC display name when known (T10R); never a raw I-paste.
 * T10AH — curly apostrophes and I am/have/will are one unit (never "Jax'm" / "Jax have");
 * leading -ly is an adverb, not a verb ("suddenly drop" → "suddenly dropped", not "suddenlied drop").
 */
export function clauseToThirdPerson(clause: string, subject = 'They'): string {
  let c = (clause ?? '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/g, '');
  if (!c) return '';
  const who = (subject || 'They').trim() || 'They';
  // Smart quotes / modifier letter apostrophe → ASCII so I'm / I've / I'll match before bare I.
  c = c.replace(/[\u2019\u2018\u02BC]/g, "'");
  // Leading I'm / I've / I'll / I'd / I am / I have / I will keep their tense (do not strip to a bare verb).
  const leadModal = c.match(/^(?:I'(m|ve|ll|d)|I\s+(am|have|will))\s+(.*)$/i);
  if (leadModal) {
    const kind = (leadModal[1] ?? leadModal[2] ?? '').toLowerCase();
    const rest = (leadModal[3] ?? '').trim();
    const mid =
      kind === 'm' || kind === 'am'
        ? 'was'
        : kind === 've' || kind === 'have'
          ? 'had'
          : 'would';
    const line = `${who} ${mid}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
    return line.endsWith('.') ? line : `${line}.`;
  }
  // Strip a leading bare I so we do not double the subject.
  c = c.replace(/^(?:I|i)\s+/i, '');
  c = c
    .replace(/\bI'm\b/gi, `${who} was`)
    .replace(/\bI've\b/gi, `${who} had`)
    .replace(/\bI'll\b/gi, `${who} would`)
    .replace(/\bI'd\b/gi, `${who} would`)
    .replace(/\bI am\b/gi, `${who} was`)
    .replace(/\bI have\b/gi, `${who} had`)
    .replace(/\bI will\b/gi, `${who} would`)
    .replace(/\bwe(?:'re| are)\b/gi, `${who} was`)
    .replace(/\bwe've\b/gi, `${who} had`)
    .replace(/\bwe'll\b/gi, `${who} would`)
    .replace(/\bwe\b/gi, who)
    .replace(/\bour\b/gi, 'their')
    .replace(/\bus\b/gi, 'them')
    .replace(/\bmy\b/gi, 'their')
    .replace(/\bmine\b/gi, 'theirs')
    .replace(/\bme\b/gi, 'them')
    // Bare I last — after contractions so "I'm" cannot become "Name'm".
    .replace(/\bI\b/g, who);
  // Mid-clause bare I → Name left a present stem ("Name check" / "Name have"): finish the tense.
  const whoEsc = who.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  c = c.replace(
    new RegExp(
      `\\b${whoEsc}\\s+(have|has|am|is|are|do|does|will|check|think|know|want|need|go|come|see|get|take|make|say|tell|hold)\\b`,
      'gi',
    ),
    (_m, v: string) => `${who} ${toSimplePast(v)}`,
  );
  // "we hold…" → "Name hold…" — subject is already written; past-tense the next verb (never "Name named …").
  const alreadyWho = c.match(new RegExp(`^${whoEsc}\\s+([A-Za-z]+)\\b(.*)$`, 'i'));
  if (alreadyWho) {
    const verb = alreadyWho[1]!;
    // Mid-clause conjugator may already have written past (held/had); do not double to helded.
    const alreadyPast =
      /ed$/i.test(verb)
      || /^(?:was|were|had|did|went|came|took|made|said|told|held|kept|left|saw|got|put|ran|slid|asked|checked)$/i.test(
        verb,
      );
    const past = alreadyPast ? verb : toSimplePast(verb);
    const rest = (alreadyWho[2] ?? '').trim();
    const line = `${who} ${past}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
    return line.endsWith('.') ? line : `${line}.`;
  }
  // Leading -ly adverb + verb ("suddenly drop…") — do not past-tense the adverb.
  const lyVerb = c.match(/^([A-Za-z]+ly)\s+([A-Za-z]+)\b(.*)$/i);
  if (lyVerb) {
    const past = toSimplePast(lyVerb[2]!);
    const rest = (lyVerb[3] ?? '').trim();
    const line = `${who} ${lyVerb[1]!.toLowerCase()} ${past}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
    return line.endsWith('.') ? line : `${line}.`;
  }
  // Gerund / while-gerund adjunct ("staring at Oskar" / "while staring at Oskar") → finite past.
  const gerund = c.match(/^(?:while\s+)?([a-z]+ing)\b(.*)$/i);
  if (gerund) {
    const past = gerundToPast(gerund[1]!);
    const rest = (gerund[2] ?? '').trim();
    const line = `${who} ${past}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
    return line.endsWith('.') ? line : `${line}.`;
  }
  // Leading finite verb → past: "slide a coin…" / "Ask Vessa…" / "Face the thugs."
  const lead = c.match(/^([A-Za-z]+)\b(.*)$/);
  if (lead) {
    const past = toSimplePast(lead[1]!);
    const rest = (lead[2] ?? '').trim();
    const line = `${who} ${past}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
    return line.endsWith('.') ? line : `${line}.`;
  }
  const body = c.charAt(0).toLowerCase() + c.slice(1);
  const line = `${who} ${body}`.replace(/\s+/g, ' ').trim();
  return line.endsWith('.') ? line : `${line}.`;
}

/** -ing form → simple past for adjunct clauses split off by `while`. */
function gerundToPast(gerund: string): string {
  const g = gerund.toLowerCase();
  const known: Record<string, string> = {
    staring: 'stared',
    sliding: 'slid',
    resting: 'rested',
    tossing: 'tossed',
    throwing: 'threw',
    kicking: 'kicked',
    slamming: 'slammed',
    gripping: 'gripped',
    holding: 'held',
    looking: 'looked',
    watching: 'watched',
    waiting: 'waited',
    sitting: 'sat',
    standing: 'stood',
    walking: 'walked',
    running: 'ran',
    giving: 'gave',
    taking: 'took',
    making: 'made',
    coming: 'came',
    going: 'went',
    leaving: 'left',
    keeping: 'kept',
    asking: 'asked',
    speaking: 'spoke',
    talking: 'talked',
    saying: 'said',
    telling: 'told',
  };
  if (known[g]) return known[g]!;
  // Default: drop -ing and apply simple past (resting→rest→rested already covered).
  const stem = g.replace(/ing$/i, '');
  return toSimplePast(stem);
}

const CUE_HEAD =
  /(?:Must narrate:|PC says exactly:|Speech event:|The story must show this act\.?|NPC reaction slot open for |No one present to answer\.?)/gi;

/**
 * One sentence from writerEngineResult's ". "-split (legacy single-sentence path).
 * Prefer convertWriterCueFact for full engine facts (handles periods inside Must narrate).
 */
export function plainFromWriterCueSentence(
  s: string,
  subject?: string,
): { cue: true; plain: string } | { cue: false } {
  const raw = (s ?? '').trim();
  if (!raw) return { cue: false };
  const body = raw.endsWith('.') ? raw.slice(0, -1) : raw;
  const who = (subject ?? '').trim() || 'They';

  if (body.startsWith('Must narrate:')) {
    const clause = plainItemChromeInText(body.slice('Must narrate:'.length).trim());
    return { cue: true, plain: clauseToThirdPerson(clause, who) };
  }
  if (/^The story must show this act$/i.test(body)) return { cue: true, plain: '' };
  if (/^No one present to answer$/i.test(body)) {
    return { cue: true, plain: 'No one was there to answer.' };
  }
  if (/^NPC reaction slot open for /i.test(body)) {
    const name = body.replace(/^NPC reaction slot open for\s+/i, '').trim();
    // T10S — never "answered" with no content; silence is the honest last-resort beat when the
    // writer miss path converts cues (live writer + ensureSpokenAnswer supply content/motive).
    if (name && !/^the (?:people here|empty scene)$/i.test(name)) {
      return { cue: true, plain: `${name} said nothing.` };
    }
    return { cue: true, plain: '' };
  }

  const sayHead = 'PC says exactly: "';
  const sayTail = '" (do not rewrite)';
  if (body.startsWith(sayHead)) {
    const end = body.lastIndexOf(sayTail);
    if (end > sayHead.length) {
      // T10R — PC name + past when named; "You said" only for unnamed / second-person.
      const said = body.slice(sayHead.length, end);
      if (who && who !== 'They' && who !== 'You') {
        return { cue: true, plain: `${who} said, "${said}".` };
      }
      return { cue: true, plain: `You said, "${said}".` };
    }
    return { cue: true, plain: '' };
  }

  const speechHead = 'Speech event: you address ';
  if (body.startsWith(speechHead)) {
    const addr = body.slice(speechHead.length).trim();
    return { cue: true, plain: addr ? `You spoke to ${addr}.` : '' };
  }

  return { cue: false };
}

/**
 * T10P/T10R — convert a full engine-fact string (may contain several cue clauses) to player prose.
 * Cuts on cue headers so a period inside "Must narrate: …" cannot leak as raw first-person.
 * Subject is the PC display name when known (past tense + named acts / quotes).
 */
export function convertWriterCueFact(fact: string, subject?: string): string {
  const raw = (fact ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const pc = (subject ?? '').trim() || 'They';
  const out: string[] = [];
  let hadMustNarrate = false;
  let hadExactSay = false;
  let absentAnswer = false;
  let reactionWho: string | null = null;

  const push = (plain: string) => {
    const p = (plain ?? '').replace(/\s+/g, ' ').trim();
    if (!p) return;
    out.push(p.endsWith('.') || p.endsWith('?') || p.endsWith('!') ? p : `${p}.`);
  };

  // Walk cue-headed spans; non-cue prose (Travel: / Fight: / roll lines) passes through.
  CUE_HEAD.lastIndex = 0;
  const hits: { index: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = CUE_HEAD.exec(raw)) != null) {
    hits.push({ index: m.index, text: m[0]! });
  }
  if (!hits.length) return raw;

  if (hits[0]!.index > 0) {
    // T10AH — STATUS ledger glued before Must narrate (Rest: / Encounter budget / Moved within) is not story.
    const headRaw = raw.slice(0, hits[0]!.index).trim().replace(/[.]+$/g, '');
    const headParts = headRaw
      .split(/(?<=[.!?])\s+|;\s+/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    for (const part of headParts) {
      if (/^(?:Encounter budget:|Combat status:|Exhaustion:|Initiative —|Rounds? \d+|Death save:|XP Gained:|Gold Gained:|Coins\b|Moved within\b|Combat status\b)/i.test(part)) {
        continue;
      }
      if (/^Rest:/i.test(part)) {
        const low = part.toLowerCase();
        const kind = low.includes('long rest') ? 'long rest' : low.includes('short rest') ? 'short rest' : 'rest';
        push(`You took a ${kind}.`);
        continue;
      }
      push(part.endsWith('.') ? part : `${part}.`);
    }
  }

  for (let i = 0; i < hits.length; i++) {
    const start = hits[i]!.index;
    const end = i + 1 < hits.length ? hits[i + 1]!.index : raw.length;
    const span = raw.slice(start, end).trim();
    const head = hits[i]!.text;

    if (/^Must narrate:/i.test(head)) {
      const clause = span.slice(head.length).trim().replace(/[.]+$/g, '');
      // Drop a trailing "Speech event…" that was glued without its own hit (should not happen).
      const cut = clause.search(/\bSpeech event:|\bPC says exactly:|\bThe story must show/i);
      const body = (cut >= 0 ? clause.slice(0, cut) : clause).trim().replace(/[.]+$/g, '');
      if (body) {
        // T10U — one quoted utterance mid-clause: act, one speech verb + quote, trailing
        // while-adjunct as narration (never a second quoted say).
        // SRD 5.2.1 Communicating — the speaker's words stay theirs; action adjuncts are not speech.
        const mid = body.match(
          /^(.+?),?\s+(shout(?:ing)?|yell(?:ing)?|say(?:ing)?|said|tell(?:ing)?|whisper(?:ing)?|call(?:ing)?\s+out)\s*[,:]?\s*(["\u201c])([^"\u201d]+)(["\u201d])\s*(.*)$/i,
        );
        if (mid) {
          const act = (mid[1] ?? '').replace(/[.]+$/g, '').trim();
          const verbRaw = (mid[2] ?? 'said').toLowerCase();
          const said = (mid[4] ?? '').trim().replace(/[.,;:]+$/g, '');
          const trail = (mid[6] ?? '').trim().replace(/^[.,;:]+/, '').trim();
          const speechVerb = /shout/.test(verbRaw)
            ? 'shouted'
            : /yell/.test(verbRaw)
              ? 'yelled'
              : /whisper/.test(verbRaw)
                ? 'whispered'
                : /call/.test(verbRaw)
                  ? 'called'
                  : 'said';
          if (act) {
            push(clauseToThirdPerson(act, pc));
            hadMustNarrate = true;
          }
          if (said) {
            if (pc && pc !== 'They' && pc !== 'You') push(`${pc} ${speechVerb}, "${said}".`);
            else push(`You ${speechVerb}, "${said}".`);
            hadExactSay = true;
          }
          if (trail) {
            push(clauseToThirdPerson(trail, pc));
            hadMustNarrate = true;
          }
          continue;
        }
        // T10Y — quote-leading Must narrate (`"You hear that?" I whisper loudly`) paints one
        // attribution + optional act; never `Name said, Name said` from act+PC-says doubling.
        // Require a closed quote, or an unclosed quote whose tail is a speech/act clause — not a
        // mid-phrase space (`"… in B-flat."` must not split on the space before B-flat).
        const leadQ =
          body.match(/^(["\u201c])([^"\u201d]+)\1\s+((?:I\s+)?(?:whisper|say|said|tell|shout|yell|call)\b.*)$/i) ??
          body.match(/^(["\u201c])([^"\u201d]+)$/);
        if (leadQ?.[2]?.trim()) {
          const said = leadQ[2]!.trim().replace(/[.,;:]+$/g, '');
          let rest = (leadQ[3] ?? '').trim().replace(/[.]+$/g, '');
          const speechVerb = rest.match(
            /^(?:I\s+)?(whisper|say|said|tell|shout|yell|call(?:\s+out)?)\w*\b(?:\s+\w+)?[,.]?\s*(.*)$/i,
          );
          const vRaw = (speechVerb?.[1] ?? 'said').toLowerCase();
          const afterVerb = (speechVerb?.[2] ?? '').trim();
          const paintVerb = /whisper/.test(vRaw)
            ? 'whispered'
            : /shout/.test(vRaw)
              ? 'shouted'
              : /yell/.test(vRaw)
                ? 'yelled'
                : /call/.test(vRaw)
                  ? 'called'
                  : /tell/.test(vRaw)
                    ? 'told'
                    : 'said';
          if (said) {
            if (pc && pc !== 'They' && pc !== 'You') push(`${pc} ${paintVerb}, "${said}".`);
            else push(`You ${paintVerb}, "${said}".`);
            hadExactSay = true;
          }
          rest = speechVerb ? afterVerb : rest.replace(/^(?:I\s+)/i, '');
          if (rest && !/^(?:loudly|softly|quietly|firmly)$/i.test(rest)) {
            push(clauseToThirdPerson(rest, pc));
            hadMustNarrate = true;
          }
          continue;
        }
        // Quotes glued into Must narrate (unclosed player quote) still paint as PC speech.
        const q = body.match(/["\u201c]([^"\u201d]+)["\u201d]?\s*$/);
        const act = (q ? body.slice(0, q.index).trim() : body).replace(/[.]+$/g, '').trim();
        if (act) {
          push(clauseToThirdPerson(act, pc));
          hadMustNarrate = true;
        }
        if (q?.[1]?.trim()) {
          const said = q[1].trim().replace(/[.,;:]+$/g, '');
          if (pc && pc !== 'They' && pc !== 'You') push(`${pc} said, "${said}".`);
          else push(`You said, "${said}".`);
          hadExactSay = true;
        }
      }
      continue;
    }
    if (/^PC says exactly:/i.test(head)) {
      // Already painted from Must narrate mid-clause speech — one verb + quote only (T10U).
      if (hadExactSay) continue;
      const sayHead = 'PC says exactly: "';
      const sayTail = '" (do not rewrite)';
      const endQ = span.lastIndexOf(sayTail);
      if (span.toLowerCase().startsWith(sayHead.toLowerCase()) && endQ > sayHead.length) {
        const said = span.slice(sayHead.length, endQ);
        if (pc && pc !== 'They' && pc !== 'You') push(`${pc} said, "${said}".`);
        else push(`You said, "${said}".`);
        hadExactSay = true;
      }
      continue;
    }
    if (/^Speech event:/i.test(head)) {
      const noOne = /No one present to answer/i.test(span);
      const whoMatch = span.match(/Speech event:\s*you address\s+(.+?)(?:\.|$)/i);
      const who = (whoMatch?.[1] ?? '').replace(/\s+/g, ' ').trim();
      if (noOne) {
        absentAnswer = true;
        if (who && !/^the empty scene$/i.test(who)) {
          push(`${who} was not there to answer.`);
        } else {
          push('No one was there to answer.');
        }
        continue;
      }
      if (/NPC reaction slot open for /i.test(span)) {
        const slot = span.match(/NPC reaction slot open for\s+(.+?)(?:\.|$)/i);
        const slotWho = (slot?.[1] ?? who).replace(/\s+/g, ' ').trim();
        if (slotWho && !/^the (?:people here|empty scene)$/i.test(slotWho)) {
          reactionWho = slotWho;
        }
      }
      // Act already narrated from Must narrate, or exact say already painted — skip stub "You spoke".
      if (hadMustNarrate || hadExactSay) continue;
      if (who) push(`You spoke to ${who}.`);
      continue;
    }
    if (/^The story must show/i.test(head)) continue;
    if (/^NPC reaction slot open for /i.test(head)) {
      const name = span.replace(/^NPC reaction slot open for\s+/i, '').replace(/\.+$/, '').trim();
      if (name && !/^the (?:people here|empty scene)$/i.test(name)) reactionWho = name;
      continue;
    }
    if (/^No one present to answer/i.test(head)) {
      if (!absentAnswer) push('No one was there to answer.');
      absentAnswer = true;
      continue;
    }
  }

  // T10S — present addressee gets a reaction beat on last-resort cue convert. Live path: writer
  // or ensureSpokenAnswer (motive / disposition; T10AI extends to crowd/role). Never claim they
  // "answered" with no words — stripSpeakerSilence replaces this when exchange content exists.
  if (!absentAnswer && reactionWho) {
    push(`${reactionWho} said nothing.`);
  }

  return out.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * T10S — engine fact shown to a sentence-repair model. Must narrate / PC says / reaction-slot cues
 * are writer instructions, not story to paste. Feeding their third-person form invited repairs to
 * copy the player's clauses onto the NPC. Keep only mechanical outcomes (rolls, Took, Attempt…).
 */
export function engineFactForRepair(fact: string): string {
  const raw = (fact ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  if (!hasWriterCueChrome(raw)) return raw;
  const kept: string[] = [];
  CUE_HEAD.lastIndex = 0;
  const hits: { index: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = CUE_HEAD.exec(raw)) != null) {
    hits.push({ index: m.index, text: m[0]! });
  }
  if (!hits.length) return raw;
  if (hits[0]!.index > 0) {
    const head = raw.slice(0, hits[0]!.index).trim();
    if (head) kept.push(head.replace(/[.]+$/g, '').trim());
  }
  /** Roll / take outcomes that sit after a cue head must survive for repair — not PC Must-narrate acts. */
  const peelMechanical = (chunk: string): string => {
    const found =
      chunk.match(
        /\b(?:SUCCESS|FAIL(?:URE)?)\s*(?:\([^)]*\))?|\bTook the\s+[^.]+\.?|\bAttempt(?:ed)?\s+[^.]+\.?/gi,
      ) ?? [];
    return found.map((s) => s.replace(/[.]+$/g, '').trim()).filter(Boolean).join(' ');
  };
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i]!.index;
    const end = i + 1 < hits.length ? hits[i + 1]!.index : raw.length;
    const span = raw.slice(start, end).trim();
    const head = hits[i]!.text;
    const body = span.slice(head.length).trim();
    // Drop writer-only cues (PC acts / exact say / reaction chrome). Keep mechanical outcomes only.
    if (/^Must narrate:/i.test(head) || /^The story must show/i.test(head)) {
      const mech = peelMechanical(body);
      if (mech) kept.push(mech);
      continue;
    }
    if (/^PC says exactly:/i.test(head)) continue;
    if (/^Speech event:/i.test(head)) continue;
    if (/^NPC reaction slot open for /i.test(head)) continue;
    if (/^No one present to answer/i.test(head)) continue;
    if (body) kept.push(body.replace(/[.]+$/g, '').trim());
  }
  return kept.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
