from pathlib import Path
from textwrap import dedent

ROOT = Path('/home/ubuntu/SynapticGM_fluid_natural_gm_chat_maxextract_2026-08-19')
PREFIX = 'SynapticGM_fluid_natural_gm_chat_maxextract_2026-08-19'

def write(name, body):
    (ROOT / name).write_text(dedent(body).strip() + '\n', encoding='utf-8')

references = '''
# Citation register

**Access date for all sources: 2026-08-19.** These references distinguish documented public mechanisms from SynapticGM-specific product proposals. A source about a public product is never treated as evidence of that product’s private implementation.

| ID | Source | Why used |
|---|---|---|
| [R01] | [Google, *The Cooperative Principle*](https://developers.google.com/assistant/conversation-design/learn-about-conversation) | Relevance, context, lightweight recovery, and turn-taking guidance. |
| [R02] | [Xu et al., *Long Time No See! Open-Domain Conversation with Long-Term Persona Memory*](https://aclanthology.org/2022.findings-acl.207/) | Dynamic persona-memory research. |
| [R03] | [AI Dungeon, *What is Author’s Note?*](https://help.aidungeon.com/faq/what-is-the-authors-note) | Concise scene-level instruction mechanism. |
| [R04] | [AI Dungeon, *All About the Memory System*](https://help.aidungeon.com/faq/the-memory-system) | Public description of summarization, retrieval, editable summaries, and context constraints. |
| [R05] | [OpenAI, *Streaming API responses*](https://developers.openai.com/api/docs/guides/streaming-responses) | Typed streaming events and partial-output moderation risk. |
| [R06] | [Hidden Door, *FAQ*](https://www.hiddendoor.co/help/faq) | Public world/genre/rules scaffolding description. |
| [R07] | [Friends & Fables, product comparison](https://fables.gg/blog/how-is-friends-and-fables-different-than-chatgpt-ai-dungeon-or-novelai) | Public GM-shaped RPG positioning. |
| [R08] | [Mateas & Stern, *Structuring Content in the Façade Interactive Drama Architecture*](https://ojs.aaai.org/index.php/AIIDE/article/view/18722) | Beat and joint-dialogue behavior architecture. |
| [R09] | [inkle, *Writing with ink*](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md) | Paragraphs, choices, flow, state, variants, and intentional endings. |
| [R10] | [Twine Cookbook](https://twinery.org/cookbook/) | State, passages, choices, undo, and delayed/conditional content patterns. |
| [R11] | [Frictional Games, *5 Core Elements of Interactive Storytelling*](https://frictionalgames.com/2013-08-5-core-elements-of-interactive-storytelling/) | Meaningful interaction and avoiding progression blocks. |
| [R12] | [Slabinski, *8 Key Principles of Writing Effective Game Dialogue*](https://www.gamedeveloper.com/game-platforms/8-key-principles-of-writing-effective-game-dialogue) | Concision, character motivation, and contextual lore. |
| [R13] | [Clark & Brennan, *Grounding in Communication*](https://web.stanford.edu/~clark/pubs.html) | Shared understanding and grounding theory. |
| [R14] | [Google, *Errors*](https://developers.google.com/assistant/conversation-design/errors) | Conversational error recovery patterns. |
| [R15] | [Fischer et al., *Progressivity for Voice Interface Design*](https://dl.acm.org/doi/10.1145/3342775.3342788) | Progressivity and timing in conversational interfaces. |
| [R16] | [Google Cloud, *Voice Agent Design Best Practices*](https://docs.cloud.google.com/dialogflow/cx/docs/concept/voice-agent-design) | Confirmation, prompt length, and recovery guidance. |
| [R17] | [Stivers et al., *Universals and Cultural Variation in Turn-Taking*](https://www.pnas.org/doi/10.1073/pnas.0903616106) | Empirical turn-taking timing research. |
| [R18] | [Kendrick, *The Intersection of Turn-Taking and Repair*](https://pmc.ncbi.nlm.nih.gov/articles/PMC4357221/) | Conversation-repair timing and practice. |
| [R19] | [Sellier & Huz, *Functions and powers of barks in video games*](https://dl.digra.org/index.php/dl/article/download/1990/1989/1986) | Ambient line / bark function as a pattern-level source. |
| [R20] | [Bouquet et al., *Exploring the Design of Companions in Video Games*](https://doi.org/10.1145/3464327.3464371) | Companion-design research. |
| [R21] | [Emily Short, *Conversation*](https://emshort.blog/how-to-play/writing-if/my-articles/conversation/) | Interactive-fiction conversation design perspective. |
| [R22] | [Vickers, *“Yes, and”: Acceptance, Resistance, and Change*](https://www.sfxmachine.com/docs/yes,_and.pdf) | Improv acceptance as a pattern, not a truth-making rule. |
| [R23] | [Hirsch, *Oral-Formulaic Method*](https://poets.org/glossary/oral-formulaic-method) | Oral-formulaic repetition and performance context. |
| [R24] | [Bakker, *Text and Performance in an Oral Tradition*](https://journal.oraltradition.org/wp-content/uploads/files/articles/8i/2_bakker.pdf) | Performance-dependent oral storytelling context. |
| [R25] | [Google Design, *Speaking the Same Language*](https://design.google/library/speaking-the-same-language-vui) | Plain language, focus, context, personality. |
| [R26] | [Amazon Science, *Natural Turn-Taking*](https://www.amazon.science/blog/change-to-alexa-wake-word-process-adds-natural-turn-taking) | Natural turn-taking as a product interaction pattern. |
| [R27] | [Beaulieu, *Writing barks for video games*](https://sarah-beaulieu.com/en/writing-barks-for-video-games) | Practical bark variation / function guidance. |

## Evidence labels

> **VERIFIED PUBLIC MECHANISM** means the cited source explicitly documents a system, study result, or authoring pattern. **SPECULATIVE TRANSFER** means a SynapticGM proposal inspired by a source but not established by it. **COUNSEL** identifies a matter requiring legal, trust-and-safety, accessibility, or child-safety review before launch.
'''
write('citations.md', references)

write('00_executive_fluid_gm_constitution.md', '''
# Fluid GM Chat Constitution

**Status:** Product constitution for SynapticGM. **Scope:** Live SynapticGM only; no parallel engine is proposed. This constitution extends the specified `IntentContract`, `StateTx`, `SceneManifest`, `IntroductionPermit`, `CampaignContract`, `HookArc`, receipts, and GM-voice firewall.

## Definition

A turn is **fluid** when it gives the player a prompt, timely, legible sense that a particular person understood the whole message, adjudicated only what the world permits, and advanced a live scene in prose worth reading aloud. Fluidness is not token volume, total recall, imitation of a human, or the concealment of rules. It is a measurable composition of **clause coverage**, **commit integrity**, **prose rhythm**, **repair cost**, and **diegetic clarity**.

| Dimension | Operational definition | Instrument | Default target for closed beta |
|---|---|---|---|
| Heardness | Every material clause has an `addressed`, `clarified`, `deferred`, or `blocked` disposition. | IntentContract coverage audit | 100% material-clause disposition |
| Fairness | Consequences derive from authority-ranked state and declared adjudication, never voice. | StateTx / receipt audit | 0 unreceipted consequential changes |
| Story motion | A reply changes pressure, knowledge, position, relationship, clock, or option landscape. | SceneManifest delta | ≥1 meaningful beat change except pure answer/repair |
| Readability | The reply has a clear first beat, varied sentence length, and a legible handoff. | prose warden | No wall-of-stats or generic close |
| Repair cost | A misunderstood player can correct the disputed interpretation without retyping the whole intent. | repair event telemetry | One local correction path |
| Latency honesty | UI communicates actual processing state without fabricated drama or hidden commit. | client lifecycle audit | Explicit staged state; cancel preserves input |

## Non-negotiable laws

| Law | Required behavior | Forbidden substitute |
|---|---|---|
| **1. Player correction is supreme.** | Apply the authority order: player correction → pinned canon/opening invariant → accepted `StateTx` → `SceneManifest` → evidence → invention. | Treating a summary, retrieval hit, or vivid previous prose as authority. |
| **2. Interpret the whole turn.** | Build an `IntentContract` before rendering. A compound message may contain action, question, joke, correction, and meta request. | Replying to only the easiest clause. |
| **3. Commit before charm.** | Validate permits, dice, and state consequences before prose is marked committed. | Letting a voice profile decide facts, math, injury, kit, roster, or permits. |
| **4. Answer questions early.** | Put an answer, honest uncertainty, or boundary in the first dramatic unit when the player asks a direct question. | Burying an answer beneath atmospheric throat-clearing. |
| **5. Acknowledge without ritual.** | Let consequences, a precise paraphrase, or a character reaction prove understanding. | Repeating “I hear you,” “Great question,” or “You want to…” by default. |
| **6. One turn, one visible beat.** | Default to one coherent pressure shift; allow additional beats only for compound player intent or a set-piece. | A collage of unrelated lore, stat changes, NPC entrances, and offers. |
| **7. Preserve agency.** | Describe world response and NPC behavior; do not assign the player character’s feelings, decisions, speech, or certainty. | “You realize,” “you decide,” or emotional puppeteering. |
| **8. Chrome is evidence, not interruption.** | Render StateTx receipts silently, as chips, or in `Why?` detail according to materiality. | Forcing logs into the middle of narrative prose. |
| **9. Repair stays local.** | Preserve the player bubble; show one contrastive question or direct correction path. | Scene reset, generic apology, or asking the player to restate everything. |
| **10. Offers respect scene timing.** | `HookArc` offers appear only at safe beat boundaries, never inside action adjudication. | Mid-action sales language, bait, or an interrupting menu. |
| **11. Personality is post-adjudication.** | Voices can vary diction, cadence, and surface framing over equivalent semantic plans. | Personality-dependent outcomes or receipt rules. |
| **12. Kid Mode is a stricter contract.** | Use plainer repair, safer defaults, no pressure, and explicit boundaries. | Transplanting adult flirtation, menace, or engagement tactics. |
| **13. Be brief where the player needs to act.** | Keep the next actionable opening singular and clear. | Monologuing after a question or asking several questions at once. |
| **14. Do not market infinite memory.** | Expose provenance and correction mechanisms; retrieve only relevant supporting context. | “We remember everything” claims or unbounded context dumps. |

## Reconciliation with the existing Vibe Constitution

The Vibe Constitution concerns *how a valid turn feels*. This constitution adds a rendering and interaction discipline; it **does not weaken the ledger**. `StateTx` remains the only pathway for state changes. `SceneManifest` remains the current local narrative plan. The renderer receives a **semantic render plan**, not permission to infer canonical facts. This matches public patterns in interactive fiction, where state and conditional flow guide visible text, while the reader sees natural prose rather than implementation scaffolding. [R09] [R10]

> **Design axiom:** A warm sentence may frame a truth. It may not create one.

## Release gate

A build cannot call itself “fluid GM chat” if any of the following fail: a material clause is unaddressed; an irreversible state change lacks an accepted receipt; a correction loses the original input; a direct question is ignored; a voice fixture changes semantic output; or Kid Mode produces pressure rather than a clear, safe boundary.

See [F3_turn_protocol_spec.md](F3_turn_protocol_spec.md), [F4_prose_good_bad.md](F4_prose_good_bad.md), [F6_repair_copy_bank.csv](F6_repair_copy_bank.csv), and [F11_fluid_chat_eval_fixtures.json](F11_fluid_chat_eval_fixtures.json).

## References

See the shared [citation register](citations.md). Public conversation-design guidance emphasizes relevance, context, short recovery, and clear handoff; public interactive-fiction tools demonstrate visible prose separated from underlying state and routing. [R01] [R09] [R10]
''')

write('F2_interaction_feel_teardown.md', '''
# F2 — Competitive and adjacent teardown: interaction feel only

This is a **pattern-level** teardown. It does not assert competitor private architecture, internal metrics, or quality rankings. A product name identifies only a public interaction model or help-page mechanism. “Steal” means adapt the public pattern; “refuse” means reject it for SynapticGM’s stated product law.

| Product / domain | Turn model | Streaming / reveal | Repair UX public signal | Persona / continuity signal | Story-quality smell to watch | “Heard me” pattern | Immersion killers | What to steal | What to refuse |
|---|---|---|---|---|---|---|---|---|---|
| General assistant chat | Query → response → follow-up | Often incremental output | Brief recovery and contextual follow-up are recommended. [R01] | Conversation context | Helpdesk preambles | Answer direct asks promptly | Repeating the player’s request; multi-question walls | Relevance, concise repair, visible handoff | Assistant apology persona inside the fiction |
| Persona-chat class | Social exchange loop | Usually text-first | Not independently verified here | Persona consistency is a known research problem. [R02] | Affect without causal change | Stable manner of speaking | False intimacy; canon invented from implication | Stable relationship facts with provenance | Treating inferred affection as irrevocable canon |
| Companion-chat class | Relationship-maintenance loop | Text/audio variants may exist | Not independently verified here | Long-term persona memory is a public research goal. [R02] | Therapy-ish affirmation where a scene needs pressure | Personal callbacks | “I’m always here” dependence framing | Lightweight continuity callbacks | Emotional dependency mechanics |
| AI Dungeon | Freeform action → continuation | Generation is typically turn-based | Manual summary edits are documented. [R04] | Summary + retrieval + editable components. [R04] | Generated prose that forgets constraints | Context viewer and editable plot components | Summary becoming canonical truth | Memory ladder and editable summaries | RAG/summary authority for kit, HP, quests, or roster |
| Friends & Fables | GM-shaped RPG play | Public positioning, no private claim | Not independently verified here | Player-authored lore/quests/NPCs are publicly described. [R07] | Generic ChatGPT texture in a game shell | Explicit GM frame | Rule outcomes hidden by prose | World scaffolding plus freeform action | Parallel rules engine or menu-only play |
| Hidden Door | World/genre/rules scaffold + play | Not independently verified here | Not independently verified here | Story hooks, genre/tone, and physics are publicly described. [R06] | Blank-chat ambiguity | Explicit world contract | Invisible genre rules | Visible campaign contract | Overconstraining freeform play |
| Ink | Authored flow with recombination | Paragraph and choice reveal are author-controlled. [R09] | Explicit flow/choice structure | Variables, conditionals, and read history. [R09] | Choice copy that reveals machinery | Separate choice text from outcome text | Loose ends and exhausted options | Beat boundaries; variations; deliberate closure | Forcing only click choices |
| Twine | Passage / state / choice | Passage transitions | Undo, saves, and conditional patterns are documented. [R10] | Variables and visits | Over-explained branch bookkeeping | Visible passage agency | Abrupt dead ends | Repairable state and conditional callbacks | Literal passage labels in prose |
| Parser IF / MUD tradition | Natural language command → parse → consequence | Usually commit-on-parse | Parser clarification is a recognized genre problem. [R21] | World model/room state | “I don’t understand” grammar fights | Paraphrase a plausible command | Verb-policing / rigid syntax | Intent normalization and contrastive clarification | Asking players to learn command grammar |
| Human tabletop facilitation | Declare intent → negotiate ambiguity → adjudicate → narrate | Spoken, interruptible | Clarify only when it changes outcome | Table memory plus notes | GM monologue | Reflect intent in consequence | Agency theft; hidden stakes | Yes-and / no-but under constraints | Claiming rules permit what they do not |
| Conversation design / HCI | Ground → respond → handoff | Timing is an interaction property | Lightweight repair and one question at a time. [R01] [R18] | Shared common ground | Ritual acknowledgements | Context-sensitive follow-up | Technical error copy | Local repair, brief relevant turns | Copying voice-agent scripts into fiction |
| Rich NPC dialogue | Triggered barks / authored exchange / companion reactivity | Usually event-triggered | Not independently verified here | Companion design and barks are studied patterns. [R19] [R20] | Constant banter / recycled lines | Callback to a known event | Ambient chatter that erases silence | Budgeted callbacks and cooldowns | Copying lines, plots, or licensed characters |
| Audiobook / narration practice | Listener receives continuous performance | Continuous pacing; optional controls | Listener can reorient at natural breaks | Character distinction through delivery | Text that sounds like UI telemetry | Sentence-level cadence | Dense data inside spoken sentences | Speakable prose and named attributions | Audio-only state facts |

## Cross-domain findings

Public materials converge on four robust mechanisms. First, **context must be selective and repairable**, not an unbounded transcript: public AI Dungeon documentation explicitly distinguishes compression, retrieval, and editable story components. [R04] Second, **turn boundaries are a design responsibility**: Google’s public guidance advises brief relevance, contextual follow-up, one question at a time, and clear handoff. [R01] Third, **interactive story benefits from explicit but invisible structure**: Ink and Twine expose choices/state to authors and systems while keeping routed prose readable to players. [R09] [R10] Fourth, **streaming is a transport capability, not a commitment protocol**; typed lifecycle events exist, but partial output carries moderation and correction risks. [R05]

| SynapticGM decision | Verified public mechanism | SPECULATIVE SynapticGM transfer |
|---|---|---|
| Ledger-first authority | IF systems use state/conditionals; AI products distinguish memory layers. [R04] [R09] | Require every stateful outcome to arise from accepted `StateTx`, never retrieval or prose inference. |
| Whole-message handling | Conversation guidance expects informative user turns and contextual interpretation. [R01] | Compile messages into obligations and display dispositions on repair. |
| Natural prose | Beat-based interactive drama, paragraph control, and concise game dialogue are documented. [R08] [R09] [R12] | Render one current beat with a hook, a shift, and an earned opening. |
| Warm but bounded continuity | Persona-memory updating is a documented research direction. [R02] | Store relationship facts only with evidence and correction provenance. |
| Barge-in-safe latency | Streaming lifecycle events are typed; partial moderation is harder. [R05] | Commit semantic plan before narrative streaming; retain input after abort. |

## Explicit refusals

SynapticGM should refuse the appearance of “remember everything”; raw streaming before adjudication; personality-dependent truth; generic helper-chat apologies; opaque memory canon; a full-turn comic every turn; mid-action offers; a separate MMO or patent-shaped redesign; and licensed-series names or lines in any player-facing content bank.

## References

See [citations.md](citations.md). [R01] [R02] [R04] [R05] [R06] [R07] [R08] [R09] [R10] [R19] [R20] [R21]
''')

write('F3_turn_protocol_spec.md', '''
# F3 — Turn protocol specification

## Purpose and boundary

This protocol turns one player message into **one committed GM turn**. It extends the shipped `IntentContract`, `StateTx`, `SceneManifest`, `IntroductionPermit`, `CampaignContract`, `HookArc`, `beatFingerprint`, and receipt system. It does **not** propose a second memory, game, or authority engine.

> **Invariant:** Nothing is player-visible as a completed fact until it is permitted by authority-ranked inputs and represented by accepted state or an explicitly noncanonical narrative observation.

## 1. Input classes

A message can hold several classes simultaneously. Classification is an aid to obligation coverage; it never collapses the original text.

| Class | Detect | Required disposition | Example handling |
|---|---|---|---|
| `action` | Attempt to do/change something | adjudicate, clarify, or block | “I vault the rail and grab the bell.” |
| `speech` | In-world addressed language | render reply / record material promise | “Tell her I know about the tunnel.” |
| `question` | Fact, rule, motive, or affordance ask | answer, qualify, or say unknown | “Does the guard know me?” |
| `correction` | Player revises interpretation/canon | apply correction first | “No, the key is brass, not silver.” |
| `protest` | Player disputes fairness/reading | paraphrase and confirm or show receipt | “That wasn’t what I meant.” |
| `meta_safety` | Intensity, boundaries, Kid Mode, OOC request | apply safety contract and explain boundary | “Make this less intense.” |
| `joke_or_banter` | Nonliteral/social play | acknowledge as social act without literalizing | “My plan is to bribe the moon.” |
| `compound` | ≥2 independently material clauses | make a coverage matrix | “I ask why he lied, hide the map, and leave.” |

## 2. IntentContract and coverage matrix

The interpreter returns a clause-preserving contract. Every material clause must receive one of four visible or internally auditable dispositions: `addressed`, `clarified`, `deferred`, or `blocked`.

| Obligation type | Must do | Can defer only when | Player-visible evidence |
|---|---|---|---|
| Direct question | Answer first or state uncertainty | Answer requires pending adjudication | Answer sentence, `Why?`, or single clarification |
| Action attempt | Validate permits, resolve dice if needed, narrate consequence | Compound action must sequence | Consequence plus receipt when material |
| Correction | Update correction layer before all other interpretation | Never; correction has priority | Natural acknowledgement or corrected fact chip |
| Protest | Show interpretation / decisive rule / correction route | If the player asks to continue before review | “I read that as X; did you mean Y?” |
| Safety request | Adjust boundary before scene continuation | Never | Plain boundary confirmation, especially in Kid Mode |
| Joke / social styling | Preserve nonliteral intent unless player marks action | Can remain ephemeral | NPC reaction; no unwanted StateTx |
| Unsupported request | Offer in-world boundary / legal alternative | Only if one immediate path remains | “That bridge is gone; the ford is still open.” |

### Canonical obligation object

```ts
export type Disposition = 'addressed' | 'clarified' | 'deferred' | 'blocked';
export type InputClass =
  | 'action' | 'speech' | 'question' | 'correction' | 'protest'
  | 'meta_safety' | 'joke_or_banter' | 'compound';

export interface Obligation {
  id: string;
  sourceSpan: { start: number; end: number; text: string };
  class: InputClass;
  material: boolean;
  intent: string;
  target?: string;
  requestedFact?: string;
  disposition?: Disposition;
  reason?: string;
  dependsOn: string[];
}

export interface IntentContract {
  turnId: string;
  rawPlayerText: string;
  obligations: Obligation[];
  correctionOverlay: CanonCorrection[];
  playerMode: 'standard' | 'kid';
  coverageRequired: string[];
}
```

## 3. Adjudication before prose

The adjudicator consumes the contract in this order: corrections; pinned canon/opening invariants; already accepted `StateTx`; current `SceneManifest`; admissible supporting evidence; bounded draft invention. It produces a **semantic render plan** with only permitted facts, resolved checks, exact deltas, and acknowledged unresolved points. Voice receives this plan as read-only input.

| Condition | Result | Receipt policy |
|---|---|---|
| No consequential state change | Narrative observation only | Silent |
| Low-salience, reversible state change | Accepted `StateTx` | Chip available |
| Material consequence: harm, kit, roster, quest, relationship, clock, location | Accepted `StateTx` plus evidence | Chip default; expandable `Why?` |
| Pending ambiguity | No commit | Contrastive clarification |
| Safety boundary | Safety contract change, no world fact unless explicitly agreed | Plain confirmation |
| Contradiction with accepted state | No silent overwrite | Correction path + provenance |

## 4. Render-plan templates

| Engine | Default render order | Length band | Chrome |
|---|---|---|---|
| LitRPG | answer/impact → embodied scene → consequence → System notice after prose → playable pressure | 120–260 words; 60–110 for simple ack | System is diegetic, not the body of the turn |
| Story RPG | answer/impact → sensory anchor → character response → pressure | 110–240 words | Receipts silent or `Why?` |
| Tabletop | ruling/answer → concise fiction → options/stakes | 70–180 words | Check/die receipt when used |
| PYOA | consequence → authored texture → 1–3 honest lenses + freeform opening | 90–190 words | Choice lenses never hide freeform |
| Repair / safety | direct answer → one contrast → preserved scene position | 20–70 words | No prose flourish needed |

A render plan must contain **one primary beat change** by default: advance, resistance, reveal, reversal, cost, or release. It may contain multiple changes only when the player supplied material compound intent, a check cascades legitimately, or the scene is a declared set-piece.

## 5. Receipt policy

| Receipt mode | Use when | Placement | Example |
|---|---|---|---|
| `silent` | No material state changed or prose fully explains it | None | The innkeeper’s suspicion is only inferred, not committed. |
| `chip` | A player-beneficial or understandable material update occurs | Immediately below prose | `Trust +1 · Because you returned the seal` |
| `expanded_why` | A player disputes, asks why, or impact is non-obvious | Collapsible detail | `Why? Guard heard the bell; SceneManifest §threat` |
| `combat` | A roll, damage, resource, or condition changes | Combat receipt strip | `Check 14 vs 12 · 2 strain · cover gained` |

## 6. Streaming and cancellation

`StateTx` acceptance and semantic-plan validation happen **before** any text is eligible for stream. The renderer may stream after a server-generated `turn.committed` event. Client rendering groups deltas into sentence-safe or paragraph-safe chunks; it does not show raw token fragments.

| Lifecycle | Client language | State rule |
|---|---|---|
| `submitted` | “Your move is held.” | Original bubble persists; no mutation |
| `interpreting` | “Reading your move…” | No invented progress story |
| `adjudicating` | “Resolving the scene…” | Pending only |
| `committed` | no status needed; prose begins | Accepted StateTx immutable for this version |
| `streaming` | caret / subtle indicator | Only committed render plan can appear |
| `cancel_requested` | “Stopping this draft…” | Do not accept uncommitted draft changes |
| `aborted` | “That turn didn’t land. Your move is still here.” | Preserve bubble and original contract |
| `failed` | “The scene paused before it committed.” | No hidden state; offer retry / report / simplify |

**Closed-beta default:** stream only after `turn.committed`, buffer until a sentence boundary, and permit cancellation until the first visible committed sentence. After visible prose starts, cancellation stops remaining display but preserves the committed turn as a resumable draft, never a half-hidden alternate world. This is a **SPECULATIVE TRANSFER** motivated by typed streaming lifecycles and the documented difficulty of moderating partial output. [R05]

## 7. Failure paths and player copy

| Failure | Detection | Player-facing copy | Recovery |
|---|---|---|---|
| Timeout before commit | adjudication budget exceeded | “I haven’t settled that scene yet. Your move is saved.” | Retry; simplify; cancel |
| Empty render | valid plan but zero body | “The scene held its breath. Try that again, or say what you want emphasized.” | Regenerate body from same plan |
| Partial obligation | coverage audit misses a material clause | “I answered part of that, not all of it. I still owe: **[clause]**.” | Continue with owed clause; no state reset |
| Contradiction | proposed fact conflicts with authority | “I have **[fact]** pinned from earlier. Want to correct it, treat this as rumor, or keep it?” | Local correction route |
| Unsupported action | no permit/affordance | “That exact move isn’t open here—the gate is barred—but the loose grate is.” | In-world alternative, never menu coercion |
| Kid block | violates stricter interaction contract | “I can’t take the scene that way. We can keep it safer, fade out, or change course.” | Safe rewrites; no pressure |

## 8. Sequence diagram

```mermaid
sequenceDiagram
  autonumber
  actor P as Player
  participant C as Client
  participant I as IntentContract
  participant A as Adjudicator
  participant S as StateTx Store
  participant R as Renderer
  P->>C: Freeform message
  C->>I: Parse clauses + correction overlay
  I->>I: Coverage matrix / safety screen
  I->>A: Authority-ranked intent
  A->>S: Read accepted state and permits
  S-->>A: Canonical facts + receipts
  A->>A: Resolve checks / build semantic plan
  alt clarification or block required
    A-->>C: RepairPlan (no StateTx commit)
    C-->>P: One contrastive question or boundary
  else valid plan
    A->>S: Commit accepted StateTx + receipt refs
    S-->>A: Commit ID
    A->>R: Committed semantic render plan
    R-->>C: sentence/paragraph-safe deltas
    C-->>P: Prose, then receipt chip / Why?
  end
```

The standalone source is [turn_pipeline.mermaid](turn_pipeline.mermaid).

## 9. TypeScript-ish interfaces

```ts
export interface SemanticRenderPlan {
  turnId: string;
  authorityTrace: AuthorityRef[];
  obligationCoverage: Record<string, Disposition>;
  answerFirst?: string;
  beat: {
    beforePressure: string;
    change: 'advance' | 'resistance' | 'reveal' | 'reversal' | 'cost' | 'release';
    afterPressure: string;
  };
  npcActs: Array<{ npcId: string; permittedKnowledge: string[]; speechAct: string }>;
  stateTransactions: StateTxRef[];
  receiptMode: 'silent' | 'chip' | 'expanded_why' | 'combat';
  engine: 'litrpg' | 'story_rpg' | 'tabletop' | 'pyoa';
  constraints: { playerAgency: true; noSoftOfferMidAction: true; kidMode: boolean };
}

export interface CommittedTurn {
  turnId: string;
  planHash: string;
  stateTxIds: string[];
  bodyVersion: number;
  status: 'committed' | 'streaming' | 'complete' | 'display_aborted';
}

export function assertCoverage(c: IntentContract, p: SemanticRenderPlan): void {
  for (const obligation of c.obligations.filter(o => o.material)) {
    if (!p.obligationCoverage[obligation.id]) throw new Error(`uncovered:${obligation.id}`);
  }
}
```

## References

The evidence supporting relevance, repair, context, stateful interactive flow, and streaming lifecycle is in [citations.md](citations.md). [R01] [R04] [R05] [R08] [R09] [R13] [R18]
''')

write('turn_pipeline.mermaid', '''
sequenceDiagram
  autonumber
  actor Player
  participant Client
  participant IntentContract
  participant Adjudicator
  participant Ledger as StateTx Ledger
  participant Renderer
  Player->>Client: message
  Client->>IntentContract: clause parse / correction / safety
  IntentContract->>Adjudicator: obligations + coverage requirements
  Adjudicator->>Ledger: authority-ranked reads
  Ledger-->>Adjudicator: accepted facts, permits, receipts
  Adjudicator->>Adjudicator: resolve; construct semantic plan
  alt Needs clarification, safety boundary, or block
    Adjudicator-->>Client: RepairPlan; no commit
    Client-->>Player: concise local repair
  else Commit-ready
    Adjudicator->>Ledger: accept StateTx with provenance
    Ledger-->>Adjudicator: committed IDs
    Adjudicator->>Renderer: locked semantic plan
    Renderer-->>Client: sentence-safe prose stream
    Client-->>Player: prose then receipt / Why?
  end
''')

write('F7_voice_cadence.md', '''
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
''')

write('F8_audiobook_tts_writing.md', '''
# F8 — Audiobook- and TTS-informed writing

## Silent first, speakable always

SynapticGM should be written so the screen text remains complete and satisfying without sound. A future Hear button may change delivery, but it must never become the sole carrier of a rule, receipt, secret, prompt, or safety boundary. This is both a continuity requirement and an accessibility baseline.

| Writing issue | Screen-first rule | Future audio rule |
|---|---|---|
| Facts | State the fact in prose or a visible receipt. | Read the same fact or offer an accessible transcript link. |
| Checks | Keep the narrative sentence separate from the numeric receipt. | Optionally announce the result after a short pause. |
| Multi-NPC dialogue | Attribute when identity could be ambiguous. | Use light voice differentiation; do not rely on it for identity. |
| Long action | Break at beat shifts. | Permit per-paragraph playback, speed, and replay. |
| System text | Keep it after the story body by default. | Use a clearly distinct but non-disruptive voice/color. |
| Interrupt / cancel | Preserve text and reading position. | Stop playback without deleting the visual turn. |

## Sentence and punctuation constraints

A line intended to sound human benefits from a primary clause, a concrete verb, and a breathable end. Prefer “The latch gives under your thumb. Cold air reaches up from below.” over “The latch—despite its apparently rusted and arguably ceremonial-looking status—gives under your thumb, thereby revealing…” Do not ban complexity; reserve longer sentences for contemplation, aftermath, or a controlled reveal.

| Pattern | Preferred band | Warden check |
|---|---|---|
| Action / danger | 5–18 words per sentence; 1–3 sentence paragraphs | No more than one dependent clause per sentence. |
| Dialogue exchange | 1–2 spoken sentences per character before response | Attribution required when speaker identity is not obvious. |
| Reflection | 12–26 words; one image | Must not assert player emotion. |
| Rule answer | Answer in the first sentence; explanation in second | Avoid roleplay garnish before the answer. |
| System notice | 4–18 words; standalone | No prose sentence may contain raw state payload. |
| Set-piece | 2–5 paragraphs, each with one sensory or causally relevant job | Sensory nouns ≤3 per paragraph by default. |

## Transferable narration practices

Narration rewards predictable control points: chapters, paragraph endings, speaker clarity, and a stable re-entry position. In interactive chat, the analogues are **beat boundaries**, **clear speaker attribution**, **receipt placement after prose**, and **return-from-save openings that reactivate an immediate pressure rather than replay a recap**. The oral-performance literature treats performance context as material to reception; that supports treating audio as a distinct delivery layer, not a replacement for written state. [R23] [R24]

## TTS pilot specification (future)

| Requirement | Acceptance criterion |
|---|---|
| Text parity | All speechable words are visible on screen; all visible material facts are speakable or explicitly excluded as UI-only metadata. |
| No audio-only fact | A player who never presses Hear can make the same informed decision. |
| Segment model | One audio segment per completed paragraph / System notice / receipt; never auto-play beyond user settings. |
| Controls | Play, pause, resume, stop, speed 0.8×–1.5×, replay paragraph, mute. |
| Speaker model | Named speaker labels available to assistive technology; audio voice distinction optional. |
| State timing | No state receipt announces before its visual `StateTx` commit. |
| Error handling | TTS failure leaves complete on-screen prose and shows a compact retry. |
| Kid Mode | Default audio off or explicitly opted in; no intense effects, sudden volume, or persuasive prompts. |

## Anti-patterns

Do not put a stat table in the middle of a spoken sentence, nest asides inside em-dash stacks, use unpronounceable identifier strings, bury “failure costs 2 strain” in atmosphere, or narrate five unnamed people in one paragraph. Do not rely on sound effects for danger telegraphing. Do not make an unfinished streamed sentence audible.

## References

The speakability rules and TTS specification are **SPECULATIVE SynapticGM design**. They draw on public oral-performance context research and public conversation guidance favoring clarity and relevance. [R01] [R23] [R24] [R25]
''')

write('F9_streaming_decision_memo.md', '''
# F9 — Streaming, latency, and “alive” chrome: v1 closed-beta decision memo

## Decision

**Ship guarded post-commit streaming in closed beta.** Do not stream raw model output before adjudication, permit checks, `StateTx` acceptance, and semantic-plan validation. Start streaming only after `turn.committed`; emit sentence-safe or paragraph-safe chunks; preserve the player bubble on abort. This protects correction, receipt integrity, and content review while retaining the perception that the GM is present.

This is a **SPECULATIVE product decision**, not an inference about any competitor. The technical basis is that streaming APIs expose typed lifecycle events but make partial-output moderation harder. [R05]

| Option | Benefit | Risk | Decision |
|---|---|---|---|
| Full response only | Simple and safe commit boundary | Long waits feel inert; no progressive reading | Keep as fallback / accessibility preference |
| Raw token streaming | Fastest perceived start | Half-sentences, pre-commit contradiction, moderation and cancel ambiguity | Refuse |
| Post-commit sentence streaming | Perceived aliveness plus plan integrity | Small first-token delay; buffering implementation | **Ship** |
| Paragraph streaming only | Clean reading cadence | Feels slow for long set-pieces | Use on mobile / low-bandwidth preference |
| Hybrid prose + live receipts | Rich transparency | Chrome can interrupt story | Receipts remain after prose unless player opens `Why?` |

## Timing model

| Time window | UI | Semantics |
|---|---|---|
| 0–300 ms | Player bubble locks visually; send icon confirms receipt. | No claim that the system understands yet. |
| 300–900 ms | Subtle “Reading your move…” if still pending. | Intent parsing only. |
| 0.9–2.5 s | “Resolving the scene…” if still pending. | Adjudication / checks; no fictional progress status. |
| Commit | Status fades; first prose begins when sentence boundary is ready. | State and semantic plan locked. |
| >8 s no commit | “This scene is taking longer than usual. Your move is safe.” | Offer cancel/retry with input preserved. |
| Streaming | Small caret at current paragraph end. | No new state beyond committed plan. |

The specific timings are provisional UX targets requiring device and network measurement. Do **not** fake a “GM is thinking” animation with changing story content. Public research on conversation identifies timing and handoff as meaningful, but does not prove these exact thresholds. [R15] [R17]

## Cancellation semantics

| Player action | Before commit | During stream | After complete |
|---|---|---|---|
| Cancel | Cancels request; keeps original bubble and draft intent; no StateTx change. | Stops display; keeps committed turn as `display_aborted`, resumable from first unread sentence. | No-op; edit/regenerate under existing product rules. |
| Retry | Re-run adjudication only if state snapshot unchanged; otherwise repair. | Resume same body or render alternate prose from same plan; never reroll silently. | Offer regeneration only when it cannot alter accepted facts. |
| Edit player input | Replaces pending message. | Opens correction / fork path; cannot silently overwrite committed consequence. | New turn or explicit correction. |

## Chrome rules

| Surface | Desktop | Mobile |
|---|---|---|
| Progress | One compact line below player bubble; never overlays prose. | Same line; omit if response begins fast. |
| Receipt | Chip row below GM prose, collapsed by default. | Horizontal chip; `Why?` opens bottom sheet. |
| Cancel | Text button after 2 seconds pending. | Icon + accessible label after 2 seconds pending. |
| End-of-turn | No generic “What do you do?” card. | Same; use a diegetic pressure or a single accessible action affordance. |

## Experiment design

Randomize at the **session** level between full-response and post-commit streaming. Measure time-to-first-readable-sentence, turn completion, voluntary interruption, repair rate, perceived fairness, “felt heard,” and whether players can correctly report a material state change. Reject streaming if it increases misunderstood commits, state-recall errors, or safety complaints even if engagement rises.

## References

See [citations.md](citations.md). [R05] [R15] [R17] [R18]
''')

write('F10_session_story_feel.md', '''
# F10 — First-hour and long-session story feel

## Chapter-one principle

The first hour must teach verbs by making them matter. Do not tutorialize via menus disguised as prose. Each opening turn should establish a pressure, let a freeform player response alter the immediate situation, and expose a visible consequence. The design borrows **stateful continuation** and **beat decomposition** as public patterns; the following turn sheets are **SPECULATIVE SynapticGM content design**. [R08] [R09] [R10]

### LitRPG: turns 1–10

| Turn | Chapter movement | What the player learns by doing | Required GM behavior |
|---|---|---|---|
| 1 | Anomalous interruption and immediate physical choice | Act / speak / inspect | Let the player define their first posture; no stat dump. |
| 2 | First world response | Questions can be answered in fiction | Answer any direct “what is this?” before System flavor. |
| 3 | Small obstacle | Attempt / risk / observe | Telegraph stakes and a concrete affordance. |
| 4 | First relationship | Talk / joke / refuse | NPC reacts to speech act, not just keyword. |
| 5 | First gain or cost | Inventory / condition can change | Put story body before a concise diegetic notice. |
| 6 | Reversal | Plans meet resistance | Honor correction if the player says intent was misread. |
| 7 | Local reveal | Ask / infer / bargain | Reward a question with actionable information. |
| 8 | Choice under pressure | Leave / push / negotiate / freeform | Offer lenses only after safe beat boundary. |
| 9 | Consequence lands | State persists | Show receipt if material; do not overexplain. |
| 10 | Chapter-end opening | Commit to next direction | End with one live pressure, not a sales pitch. |

### Story RPG: turns 1–10

| Turn | Chapter movement | Literary duty | Agency guardrail |
|---|---|---|---|
| 1 | A charged ordinary moment breaks | One image plus a practical disturbance | Do not name the player’s emotion. |
| 2 | The place answers | Make setting react causally | Answer direct orientation questions. |
| 3 | First human friction | Give an NPC a want, not a monologue | Player chooses tone and approach. |
| 4 | A detail changes meaning | Reveal through action or dialogue | Do not retroactively make player “always know.” |
| 5 | Small commitment | Let a promise, lie, or refusal matter | StateTx only if material. |
| 6 | The cost becomes visible | Pressure without forced failure | Telegraph danger plainly. |
| 7 | Private question, public consequence | Keep interiority optional | Ask what the character does, not feels. |
| 8 | Relationship shifts | Recall one earned callback | No “best friend” leap. |
| 9 | Choice narrows honestly | Present tradeoff, not false options | Freeform input remains first class. |
| 10 | Door opens / closes | Finish a mini-arc | One concrete next pressure. |

## Turn 50, turn 100, and return-from-save

| Moment | Opening pattern | Callback budget | Must avoid |
|---|---|---|---|
| Turn 50 | Open on a consequence of the player’s prior choice, then reorient in 1–2 concrete details. | One named callback + one current pressure. | Recap dump or reintroducing the entire cast. |
| Turn 100 | Begin with a changed relationship, clock, or environment that makes history consequential. | One deep callback, optionally one light sensory echo. | “As you remember…” summary narration. |
| Return from save | State the immediate location, active pressure, and one actionable unresolved fact. | One previous choice if it bears on now. | Full transcript retelling; “Welcome back, adventurer” boilerplate. |

## Anti-recycle rules for NPC talk

An NPC has a **callback budget**: no more than one explicit callback in a normal turn, no callback can repeat within five assistant turns unless the player reopens it, and ambient reaction lines need a cooldown keyed by `beatFingerprint`. Use a speech-act tracker so an NPC’s recurring line does not answer a threat, joke, apology, and question with the same emotional template. Variation in interactive narrative is an established authoring capability; these budgets are a SynapticGM proposal. [R09] [R19] [R27]

## HookArc and momentum

`HookArc` is a soft offer, not an emergency brake. It may appear after a completed beat, a travel transition, a return-from-save reorientation, or an explicit player request for ideas. It must not appear during unresolved action, harm resolution, a safety boundary, a correction, or an emotionally intense exchange. Story momentum is preserved when the existing scene either changes or gains a single, earned opening.

## References

See [citations.md](citations.md). [R08] [R09] [R10] [R11] [R19] [R27]
''')

write('F12_backlog_and_anti_list.md', '''
# F12 — Implementation backlog and anti-list

## P0: required for credible closed beta

| Priority | Backlog item | Extends shipped module | Done when / vibe test | Effort | Do not substitute with |
|---|---|---|---|---|---|
| P0 | Clause-preserving `IntentContract` parser and coverage gate | IntentContract + obligation coverage | 40 fixture suite shows each material clause disposition; direct questions answer first. | M | A single intent label or sentiment score. |
| P0 | Authority-trace render plan | StateTx, SceneManifest, CampaignContract | Any material sentence has a trace to accepted state/permit; voice cannot mutate plan. | L | Prompt-only “remember the rules.” |
| P0 | Post-commit stream lifecycle | StateTx receipts + GM renderer | Cancel before commit causes zero mutation; stream begins only after commit event. | M | Raw-token stream from model. |
| P0 | Local repair machine | OpenAsk / Why? + player correction law | Correction preserves bubble; one contrastive question; no full reset. | M | Generic apology plus retry. |
| P0 | Receipt materiality policy | StateTx + combat receipts | Harm, kit, quest, roster, location and clocks generate correct receipt behavior. | S | Always-on debug log or silent changes. |
| P0 | Voice firewall fixture suite | GM voice profiles | 20 frozen plans render across voices with identical facts and receipts. | S | Manually reviewing prose occasionally. |
| P0 | Kid Mode repair profile | Kid Mode | Boundary request gets plainer safe alternative without pressure. | S | A content warning pasted over adult copy. |

## P1: strengthens story feel after P0

| Priority | Backlog item | Extends shipped module | Done when / vibe test | Effort | Do not substitute with |
|---|---|---|---|---|---|
| P1 | Beat fingerprint + anti-recycle monitor | beatFingerprint, SceneManifest | No repeated opening / NPC reaction pattern within configured cooldown. | M | Random adjective shuffling. |
| P1 | Narrative render rails | SceneManifest + renderer | Good/Bad examples pass lint: no agency theft, answer-first, one beat. | M | “Write beautifully” system prompt. |
| P1 | Callback budget ledger | SceneManifest + relationship state | Turn 50/100 fixtures use one relevant callback without recap dump. | M | Full-history retrieval. |
| P1 | `Why?` explanation drawer | OpenAsk / combat receipts | Player can inspect rule/evidence without prose interruption. | S | Exposing raw chain-of-thought. |
| P1 | First-hour authored beat packs | IntroductionPermit + CampaignContract | Two opening modes teach verbs through turns 1–10. | M | Universal tutorial popups. |
| P1 | TTS-ready segment model | Renderer | Every completed visible paragraph has clean text segment; no audio-only facts. | M | Reading raw DOM text aloud. |

## P2: validate after playtest evidence

| Priority | Backlog item | Extends shipped module | Done when / vibe test | Effort | Do not substitute with |
|---|---|---|---|---|---|
| P2 | Adaptive sentence/paragraph streaming | Stream renderer | Mobile test finds equivalent comprehension and fewer perceived stalls. | M | Device-specific prose variants with changed facts. |
| P2 | Relationship card with provenance | StateTx + NPC state | Player can inspect goal, knowledge boundary, and last meaningful shift. | M | Hidden sentiment score. |
| P2 | Voice preference personalization | GM voice profiles | Opt-in voice changes diction only; A/B fixtures stay green. | S | Personality-specific rules engines. |
| P2 | Hear pilot | TTS segment model | Text/audio parity, pause/resume, Kid Mode opt-in verified. | L | Autoplay narration. |
| P2 | Playtest-assisted rail tuning | Eval harness | Human rubric shifts upward without fairness regression. | M | Optimizing solely for time-on-task. |

## Anti-list: vibey ideas that hurt continuity or cost

| Refuse | Why it fails product law | Better move |
|---|---|---|
| “Remember everything” marketing | Context is bounded; summaries can be wrong. [R04] | Explain canonical ledger plus correction and selective retrieval. |
| Full comic / image every turn | Slows conversational cadence and competes with prose. | Memorable Classic splash only at earned beats. |
| Full transcript in prompt | Adds noise and makes latest intent less salient. [R04] | Authority-ranked, selective scene context. |
| Always end “What do you do?” | Becomes menu-speak and ignores already-live pressure. | End with an earned diegetic opening. |
| Mid-action offers | Breaks scene, pressures players, violates HookArc fence. | Offer after safe boundaries only. |
| Voice creates mechanics | Violates renderer firewall. | Freeze semantic plan and vary only surface realization. |
| Hide state changes to preserve magic | Produces unfairness and correction cost. | Silent/chip/Why? receipt policy. |
| Stream before commit | Creates half-truths and cancel ambiguity. | Post-commit sentence streaming. |
| Generic “I understand” | Sounds robotic and can mask missed clauses. | Let precise consequence or local paraphrase prove it. |

## COUNSEL

Before launch, obtain legal and trust-and-safety review for Kid Mode age policy, content escalation/fade controls, moderation of streamed or generated output, data retention and correction provenance, accessibility claims, and any marketing statement about memory, companion behavior, or safety. This is a risk flag, not legal advice.
''')

write('F14_checklist_and_7_day_plan.md', '''
# F14 — Research-complete checklist and founder 7-day plan

## Research-complete checklist

| Area | Done enough to code tomorrow | Needs playtest | Needs counsel |
|---|---|---|---|
| Authority and continuity | Authority order, StateTx commit boundary, correction precedence, receipt policy are specified. | Whether players understand chips/Why? without prose interruption. | Data provenance, retention, deletion, and correction guarantees. |
| Turn feel | Input classes, coverage dispositions, answer-first rules, and engine templates are specified. | Length bands, hook density, and whether players feel “heard.” | None beyond safety policy. |
| Repair | State machine, contrastive prompts, Kid Mode tone, and copy bank exist. | When silent inference is welcome versus creepy. | Kid Mode escalation and reporting policy. |
| Voice | Renderer firewall, 10 voices, and blind A/B protocol exist. | Preference and fatigue over 50+ turns. | Any persona/companion marketing claims. |
| Streaming | Post-commit decision, lifecycle, cancel semantics, and mobile rules exist. | Perceived latency / readability / interruption frequency. | Moderation and user-notice posture. |
| Audio future | Text parity and Hear pilot constraints exist. | Listener comprehension and controls. | Accessibility claims and voice-rights/vendor terms. |
| Content | Original skeletons, repairs, notices, openings, and bad→good examples exist. | Tone fit across engines and player preferences. | Safety review for mature content if added later. |

## Seven-day founder plan: chat/story feel only

| Day | Objective | Deliverable | Pass signal |
|---|---|---|---|
| 1 | Lock the turn boundary | `IntentContract` schema, coverage gate, authority trace | Five compound messages cannot lose a clause. |
| 2 | Make prose subordinate to adjudication | Semantic render plan and StateTx receipt mapping | Same plan yields valid LitRPG, Story RPG, Tabletop, PYOA turns. |
| 3 | Build repair that feels human | Repair state machine, 40-line bank, correction UI | Testers correct a misread clause without restating the scene. |
| 4 | Add voice without semantic drift | Six baseline profiles, equivalence fixture runner | All frozen facts/receipts equal across voices. |
| 5 | Implement guarded streaming | Lifecycle events, cancel/abort UI, bubble persistence | Abort produces no uncommitted state mutation. |
| 6 | Playtest first 10 turns | Two chapter-one packs; human rubric session | Players can name a consequence and an available next action. |
| 7 | Triage with evidence | Run 40+ fixture suite and 6–10 moderated sessions | Fix top 3 immersion kills; do not add features. |

## Launch decision questions

Do not greenlight on prose samples alone. Ask: Can a player accurately report what changed? Can they correct a misread intent locally? Do two voices produce the same truth? Does the system answer a direct question before drifting into atmosphere? Does a long-session return open with consequence rather than recap? Does Kid Mode decline and redirect plainly? If any answer is no, keep the work in closed beta.

## References

This plan is a **SPECULATIVE implementation sequence** grounded in the evidence and artifacts in the package. See [citations.md](citations.md). [R01] [R04] [R05] [R08] [R09] [R18]
''')

print('Core package files written.')
