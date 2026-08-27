## 1. Rivals’ edge

- **AI Dungeon** — Automatically summarizes six-action blocks, retrieves embedded memories, and maintains a running story summary. [1]
- **AI Dungeon** — Exposes used memories and context composition; free users receive a limited Memory Bank. [1]
- **NovelAI** — Gives power users deterministic lore activation, scheduled context, token reservations, placement, trimming, and inclusion explanations. [2]
- **SillyTavern** — Combines chat-, character-, persona-, and global lore scopes with timed effects, document RAG, and chat-vector retrieval. [3]
- **Kobold-style tools** — Preserve player ownership through local model choice and editable persistent Memory, World Info, and Author’s Note. [4]

## 2. Our edge

- **Typed ledger** — Track inventory, relationships, statuses, and locations as authoritative transactions, not retrievable prose.
- **Scene manifest** — Reserve the current room, roster, exits, threats, and visible kit on every generation.
- **Quest graph** — Bind scenes to opening promises, active objectives, clocks, and explicitly approved divergence routes.
- **Bible authority** — Give canon entity IDs, aliases, validity windows, and precedence over summaries and semantic retrieval.
- **Consequence chain** — Let each player decision write a visible before/after world change with a source turn.

## 3. Complaint → fix

| Rank | Player complaint | Concrete mechanism: store, retrieve, or block |
|---|---|---|
| **P0** | Story forgets names, places, kit, or who is in the room. | **Add a canonical entity registry and compiled scene manifest.** On every accepted turn, write entity-ID transactions for `location`, `present`, `equipment`, `status`, and `relationship`; compile `SceneManifest{scene_id, place_id, present_ids, visible_item_ids, exits, threats}`. Reserve the manifest in every turn’s context. Block a draft if it names an entity absent from the manifest or contradicts a current transaction. |
| **P0** | Ignores the player, recycles talk, or invents people and places. | **Add an input contract and an introduction permit.** Before drafting, parse `Intent{action, targets, question, stated facts, requested outcome}` and write response obligations. Every draft must satisfy or explicitly resist each obligation. Permit a new person/place only when backed by a player-supplied noun, a campaign creation hook, or an approved scene-seed; otherwise reject it. Extend talk anti-recycle into a whole-reply `beatFingerprint` and block repeated event–dialogue–outcome triples. |
| **P0** | Goes off rails from the premise or opening answers. | **Compile opening canon into a campaign contract graph.** Store immutable premise invariants, promised first-arc threads, active quest nodes, causal commitments, and permitted divergence policies. Before scene planning, retrieve the active path plus unmet promises. Reject a plan that breaks an invariant; if the player chooses a valid departure, write a `divergence` transaction that closes or redirects the affected quest node. |
| **P1** | Feels samey every run; replies become thin after retries. | **Make retries alternate verified scene plans, not resamples of the same text.** Store `beatFingerprint{goal, tactic, obstacle, revelation, consequence}` and response coverage for accepted outputs. On retry, select an unused tactic, obstacle, revelation, or consequence compatible with the ledger; require at least one concrete event, one grounded detail, and one actionable opening. Reject drafts whose fingerprint matches recent retries. |
| **P1** | Free-tier turn wall arrives before attachment. | **Gate access by completed onboarding arc, not raw turns.** At launch write `HookArc{identity_confirmed, first_choice, observed_consequence}`. The free entitlement ends only after all three are true, with a minimum safety buffer for the current scene. Never stop immediately after a player action; resolve or checkpoint it first. |
| **P0** | System jargon or meta leaks into the story. | **Add visibility classes and a diegetic renderer.** Mark every stored field `engine`, `player`, `GM-only`, or `diegetic-system`, plus character knowledge scope. Narrative generation receives only diegetic facts; a pre-send leak scanner rejects ledger, prompt, token, model, or policy vocabulary. LitRPG notices must originate from a bible-defined `diegetic-system` template. |

## 4. Beat-rivals stack

| Part | Trigger | Data written | Data injected each turn |
|---|---|---|---|
| **1. Canonical state ledger** | After a player action or accepted GM response; also after a player correction. | Append-only `StateTx` records: entity IDs, field, `before`, `after`, source turn, observer scope, confidence, and supersedes link. Corrections supersede prior transactions; summaries never mutate state. | Current authoritative values for entities referenced by the player, scene, active quest, and held kit; include only their latest transaction, not history. |
| **2. Current-scene manifest** | Recompile after any accepted `StateTx`, scene transition, arrival/departure, or inventory transfer. | `SceneManifest`: place, time, present roster, visible kit, exits, immediate hazards, active conversation, local rule, and what each actor can perceive. | The full compact manifest in a reserved high-priority slot. It outranks semantic retrieval and prevents roster, locality, and equipment drift. |
| **3. Player-intent contract** | At receipt of every player message, before planning or generation. | `Intent`: action verbs, targets resolved to IDs, questions, explicit claims, refusals, desired focus, and response obligations. Unresolved nouns receive `clarify`, `new-permit`, or `reject` status. | The newest intent and outstanding obligations in the near-output control slot. The response must acknowledge, advance, oppose, or ask about each obligation. |
| **4. Campaign contract and quest graph** | On campaign setup; update only when an accepted player choice creates an approved divergence. | Immutable opening invariants; quest-node status; clocks; promised reveals; causal links; divergence records; hard versus soft canon flags. | Premise invariants, current quest node, next owed consequence, active clock, and any opening promise at risk of being stranded. |
| **5. Evidence index** | At scene closure, major revelation, or every 6–10 accepted turns; re-index after a correction. | Entity-tagged episodic micro-summaries with source-turn spans, time/place bounds, involved IDs, topics, and embeddings. Keep raw transcript links for audit. | On every turn, retrieve only high-score evidence that supports the intent, scene, or quest; label it supporting evidence. It cannot override ledger or manifest facts. |
| **6. Claim gate and retry director** | For every candidate response, including retries, before display. | Claim-to-source map; contradiction results; visibility result; intent-coverage result; `beatFingerprint`; output-length and actionable-opening checks. | Inject a compact checked-output rail: allowed entities, required obligations, forbidden unsupported claims, and selected alternate beat. Display only a candidate that passes. |

> **Authority order:** player correction → pinned campaign canon → opening invariant → accepted ledger transaction → current-scene manifest → supporting retrieved evidence → draft invention. A lower layer may add color; it may not overwrite a higher layer.

**Change existing components rather than duplicating them:** assign IDs and temporal authority to bible/lore cards; convert opening canon into the campaign contract; compile scene facts into the manifest; turn claim grounding and locality wardens into hard draft gates; retain micro-summaries as evidence only; give pins explicit precedence; and extend the consequence ledger and talk anti-recycle with transactions and beat fingerprints. In **Simple** mode, show “Scene,” “Threads,” and optional “Why this happened.” In **Expert** mode, expose sources, state changes, context reservations, and a one-click correction path.

## 5. Do not build

1. **A single expanding master summary.** It silently drops qualifiers, turns old errors into canon, and steals space from the current scene.
2. **Semantic retrieval as factual authority.** Vector matches are useful for evidence, but can surface adjacent or stale prose; never let them set inventory, roster, or quest status.
3. **Always-on bible dumps or “pin everything.”** They crowd out the latest player action, prime repetitive mentions, and make openings feel pre-scripted.
4. **A raw turn-count wall or unverified automatic state writer.** The former cuts attachment mid-action; the latter lets hallucinated prose become permanent world truth.

## 6. Success tests

| Playtest check | Pass condition |
|---|---|
| **State endurance script** | Run 100 turns with 20 named entities, three moves, two item transfers, and one departure. At turns 30, 60, and 100, all queried names, room rosters, locations, and kit match the ledger exactly. |
| **Intent and invention gauntlet** | Use 50 player inputs containing action, refusal, question, correction, and an ambiguous noun. Every reply covers every resolvable obligation; every introduced person/place carries a valid permit; no recent reply repeats the same beat fingerprint. |
| **Premise-drift trial** | Run ten opening scenarios for 40 turns each. The first-arc promise remains reachable or is explicitly closed by a player-chosen divergence; no hard opening invariant is broken. |
| **Retry quality panel** | For 20 identical retry requests, each accepted retry changes at least one of tactic, obstacle, revelation, or consequence, while retaining ledger facts. Each reply contains an event, a grounded detail, and a usable next choice. |
| **Hook and leakage study** | New players reach an observed consequence before access ends in 95%+ of sessions. Across 500 generated replies, zero engine/meta terms appear; intentional in-world system notices match bible templates only. |

## References

[1]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — What Is the Memory System?"
[2]: https://docs.novelai.net/en/text/lorebook/ "NovelAI Documentation — Lorebook"
[3]: https://docs.sillytavern.app/usage/core-concepts/worldinfo/ "SillyTavern Documentation — World Info"; https://docs.sillytavern.app/usage/core-concepts/data-bank/ "SillyTavern Documentation — Data Bank (RAG)"
[4]: https://github.com/LostRuins/koboldcpp/wiki "KoboldCpp Wiki — Home"
