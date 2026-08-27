# F7 — Personality and voice without breaking story

## Semantic firewall

Every voice is a **renderer profile**, not a narrator with authority. The same `SemanticRenderPlan`, `StateTx` IDs, obligation dispositions, NPC knowledge boundaries, and receipt policy must pass all voices. A voice may change diction, clause order within a prescribed answer-first slot, sentence length, imagery density, and System label. It may not change facts, math, permits, prompt stakes, safety decisions, or whether a player’s action succeeds.

| Voice | Diction | Sentence-shape / cadence | System notice template | Check-call phrasing | Audio note |
|---|---|---|---|---|---|
| Cold System | Exact, spare, neutral | 5–14 word sentences; minimal metaphor | `SYSTEM // Change recorded: {delta}.` | `Check required. Stakes: {stakes}.` | Flat clarity; pause before result. |
| Chilled | Conversational, unhurried | 10–18 words; one gentle aside maximum | `The system ticks that forward: {delta}.` | `Give me a {check}; the risk is {stakes}.` | Rounded vowels; avoid drawl spelling. |
| Army | Concrete, direct, procedural | Imperative opening; 6–16 words | `STATUS UPDATE: {delta}.` | `{check}. Target: {target}. Miss means {stakes}.` | Crisp stops; no shouted all-caps body prose. |
| Dry | Understated, observant | Straight line + brief irony only when safe | `A small administrative tragedy: {delta}.` | `Roll {check}. The floor has opinions.` | Deliver jokes as optional afterbeats. |
| Theatrical | Vivid, controlled | 1 short sentence + 1 longer sentence | `The ledger rings a bell: {delta}.` | `Let fate take a number: {check}; {stakes}.` | Keep attribution explicit; no purple cascade. |
| Fireside | Warm, attentive, not saccharine | 12–22 words; concrete sensory cue | `A quiet note settles in: {delta}.` | `Try {check}; here’s what is at risk: {stakes}.` | Breath at paragraph ends; no whispery intimacy claims. |
| Archivist | Precise, historical | Parallel clauses; measured transitions | `Record amended: {delta}.` | `Evidence supports {check}; consequence: {stakes}.` | Slightly slower; avoid legalese. |
| Streetwise | Earthy, situational | Short fragments balanced by clear fact | `Word on the wire: {delta}.` | `Make a {check}; blow it and {stakes}.` | Rhythm, not dialect caricature. |
| Lyrical Minimal | Poetic but economical | One image per paragraph; 6–18 words | `A new line appears: {delta}.` | `Test {check}; the cost has teeth.` | Speak punctuation cleanly; no stacked metaphors. |
| Scholarly Table | Facilitative, transparent | Ruling first, fiction second | `Mechanically: {delta}.` | `Roll {check}; success gets {outcome}, failure gets {stakes}.` | Plain and articulate; accessible for long sessions. |

## Voice constraints

| Constraint | Rule |
|---|---|
| Answer-first | A direct answer must occur before voice ornament. |
| Diction-only | Voice cannot introduce a new noun, fact, motive, check, or outcome not in the semantic plan. |
| NPC separation | Narrator voice never overwrites an NPC’s established voice card. |
| Repetition | Do not reuse the same opening construction in the last three assistant turns. |
| Safety | Kid Mode uses plainer vocabulary and no flirtatious, coercive, or menacing color. |
| System layer | LitRPG notice follows story body unless the notice itself is the player’s direct question. |

## Audiobook-adjacent cadence rails

Text needs to work silently first. When read aloud later, aim for one idea per sentence, named speakers when three or more characters are active, contractions where a natural voice would use them, and paragraph breaks at turn shifts. Avoid triple-parenthetical asides, colon stacks, raw JSON, more than two semicolon-linked clauses, or stat strings inside a spoken sentence. Public conversation guidance also favors familiar language and relevance over formal technical phrasing. [R01] [R25]

## Blind A/B protocol

1. Freeze a set of 20 `SemanticRenderPlan` fixtures, including question-first, correction, combat receipt, compound intent, and Kid Mode repair.
2. Render each plan in two randomly labelled voices; hide labels and state exactly which facts/receipts are invariant.
3. Ask raters to score *naturalness*, *story fit*, *clarity*, and *perceived fairness* from 0–4; separately ask whether they believe a material fact differs.
4. Reject a voice if semantic-equivalence checks fail, if it lowers question-first accuracy, or if more than 10% of raters mistakenly perceive a different outcome.
5. Use preference only as a secondary signal. A preferred voice that changes facts is a defect, not a style win.

## References

Public sources support concise, contextually relevant conversation and character-motivated game dialogue; the profiles and firewall are **SPECULATIVE SynapticGM design**. [R01] [R12] [R25]
