# F2 — Competitive and adjacent teardown: interaction feel only

This is a **pattern-level** teardown. It does not assert competitor private architecture, internal metrics, or quality rankings. A product name identifies only a public interaction model or help-page mechanism. “Steal” means adapt the public pattern; “refuse” means reject it for SynapticGM’s stated product law.

| Product / domain | Turn model | Streaming / reveal | Repair UX public signal | Persona / continuity signal | Story-quality smell to watch | “Heard me” pattern | Immersion killers | What to steal | What to refuse |
|---|---|---|---|---|---|---|---|---|---|
| General assistant chat (ChatGPT/Claude class) | Query → response → follow-up | Often incremental output | Brief recovery and contextual follow-up are recommended. [R01] | Conversation context | Helpdesk preambles | Answer direct asks promptly | Repeating the player’s request; multi-question walls | Relevance, concise repair, visible handoff | Assistant apology persona inside the fiction |
| Persona-chat class (Character.AI class) | Social exchange loop | Usually text-first | Not independently verified here | Persona consistency is a known research problem. [R02] | Affect without causal change | Stable manner of speaking | False intimacy; canon invented from implication | Stable relationship facts with provenance | Treating inferred affection as irrevocable canon |
| Companion-chat class (Replika class) | Relationship-maintenance loop | Text/audio variants may exist | Not independently verified here | Long-term persona memory is a public research goal. [R02] | Therapy-ish affirmation where a scene needs pressure | Personal callbacks | “I’m always here” dependence framing | Lightweight continuity callbacks | Emotional dependency mechanics |
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
