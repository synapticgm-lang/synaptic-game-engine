# SynapticGM Competitor Research Notes

## AI Dungeon — official sources checked 2026-08-17

- Plot Components: AI Instructions, Story Summary, Plot Essentials, and Author's Note are injected every generation; Story Cards are added on keyword triggers. Source: https://help.aidungeon.com/faq/plot-components
- Memory System uses Auto Summarization plus Memory Bank.
- A Memory summarizes six past actions plus AI responses. First created at 12 actions; repeats every six actions.
- Memory Bank embeds each six-action memory and ranks memories against the most recent player action once full history no longer fits. Top relevant memories enter generation context.
- Auto Summarization updates a running whole-story summary every 15 actions; it compresses itself when long.
- Memory Bank has capacity tiers: Free 25, Champion 100, Legend 200, Mythic 400; least-used memory entries are removed once capacity is full.
- AI Dungeon says the approach differs from Voyage because it did not bring tracked stats such as health, quests, inventory, levels, and player characteristics into AI Dungeon's game state.
- AI Dungeon retains manual editability for Story Summary but historical edits are not automatically rebuilt into it; player must update the summary.

Sources:
1. https://help.aidungeon.com/faq/the-memory-system
2. https://help.aidungeon.com/faq/plot-components
3. https://help.aidungeon.com/faq/plot-essentials

Product implications: AI Dungeon has viable hybrid compression + vector retrieval and context observability. Its generic six-turn text memories, eviction strategy, keyword gating, and lack of structured game-state leave space for typed immutable ledger facts, location/roster snapshots, quest-state, and correction propagation.

## Pending research

- NovelAI Lorebook / Memory / Author's Note / Context Viewer
- SillyTavern World Info / Lorebooks, Character Cards, Chat History / summarization, vector storage and data bank
- Kobold-style (KoboldCpp / KoboldAI) World Info / Author's Note / Memory and user-controlled context
- Community-reported failure modes relevant to exact player complaints

## URLs for final citations

- [1]: https://help.aidungeon.com/faq/the-memory-system
- [2]: https://help.aidungeon.com/faq/plot-components
- [3]: https://help.aidungeon.com/faq/plot-essentials

*Notes written 2026-08-17.*

## NovelAI — official sources checked 2026-08-17

- Lorebook entries are keyed text snippets; the application scans recent story context for activation keys and inserts matching entry text. It supports regex, AND keys, always-on entries, cascading activation, and logical/step/model-based advanced activation conditions.
- Context construction is exceptionally inspectable and controllable: staged insertion, explicit token budgets/reservations, insertion order and position, and trim rules. Its Context Viewer explains each inclusion/exclusion and its reason.
- A persistent editable Memory field is always injected. Author's Note is inserted near the newest story text. Users can create scheduled, delayed, finite-duration "Ephemeral Context" tied to story steps.
- User scripts can programmatically mutate Memory, Author's Note, system prompt, and Lorebook entries.
- It offers phrase bias and banned tokens in selected models, but docs warn tokens/sequences are model-sensitive and the generator can use alternatives.

Sources:
4. https://docs.novelai.net/en/text/lorebook/
5. https://docs.novelai.net/en/text/editor/advancedsettings/
6. https://docs.novelai.net/en/scripting/story-settings-api/
7. https://docs.novelai.net/en/scripting/lorebook-api/

Product implications: NovelAI leads on power-user context transparency and explicit placement/budgeting. Its core memory remains authored or scripted untyped text, and its key-match Lorebook can insert the wrong or unnecessary material. SynapticGM should expose a readable, low-jargon "Why this scene knows this" inspector and deterministic typed context assembly, but not surface raw prompt plumbing in Simple mode.

## Pending research

- SillyTavern World Info / Lorebooks, Character Cards, Chat History / summarization, vector storage and data bank
- Kobold-style (KoboldCpp / KoboldAI) World Info / Author's Note / Memory and user-controlled context
- Community-reported failure modes relevant to exact player complaints

## URLs for final citations

- [4]: https://docs.novelai.net/en/text/lorebook/
- [5]: https://docs.novelai.net/en/text/editor/advancedsettings/
- [6]: https://docs.novelai.net/en/scripting/story-settings-api/
- [7]: https://docs.novelai.net/en/scripting/lorebook-api/

## SillyTavern — official sources checked 2026-08-17

- World Info supports global, character, persona, and chat-scoped lore; entries have keyword/regex activation, filters, deterministic priority/insertion controls, inclusion groups, vector matching, and per-entry generation-type triggers.
- It offers sticky, cooldown, and delayed entry effects measured in messages, including branch-aware state. This enables scheduled knowledge without maintaining a first-class game-state.
- Data Bank chunks scoped documents, embeds them, retrieves cross-file top chunks from recent messages, and reserves prompt space before history. It exposes score thresholds and injection placement.
- Chat vectorization embeds each message in the background; at generation it searches using the last two messages, retrieves past messages, and moves them into context. Documentation explicitly says this does not guarantee improved memory and warning that dynamic prompt sources can defeat cache reuse.
- The maintained alternative to Smart Context is Chat Vectorization; the former is explicitly unmaintained and cautions that pasted/reordered historical messages may confuse weaker models or overrun context.

Sources:
8. https://docs.sillytavern.app/usage/core-concepts/worldinfo/
9. https://docs.sillytavern.app/usage/core-concepts/data-bank/
10. https://docs.sillytavern.app/extensions/chat-vectorization/
11. https://docs.sillytavern.app/extensions/smart-context/

Product implications: SillyTavern is strongest in composability, exact context controls, source scoping, and timed effects. However it supplies flexible prompt primitives rather than a coherent GM state model, and it warns that vector results are unpredictable. SynapticGM should use semantic search only to propose supporting evidence after deterministic state facts and local scene facts are reserved; it must never let retrieved prose override typed current state.

## Pending research

- Kobold-style (KoboldCpp / KoboldAI) World Info / Author's Note / Memory and user-controlled context
- Community-reported failure modes relevant to exact player complaints

## URLs for final citations

- [8]: https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- [9]: https://docs.sillytavern.app/usage/core-concepts/data-bank/
- [10]: https://docs.sillytavern.app/extensions/chat-vectorization/
- [11]: https://docs.sillytavern.app/extensions/smart-context/

## Kobold-style — official KoboldCpp wiki checked 2026-08-17

- KoboldCpp presents persistent stories, editing, save formats, Memory, World Info, Author's Note, characters, and scenarios in one local UI.
- The wiki defines Author's Note as similar to Memory but injected near the end of the prompt rather than the start. Its continuity model is therefore user-authored positional prompt context.
- Kobold-style tools’ edge is ownership and control: users can choose local models, write/edit exact persistent fields, and retain story data locally. They do not provide a first-class typed RPG ledger or reliable automatic state reconciliation.

Source:
12. https://github.com/LostRuins/koboldcpp/wiki

Product implications: Compete by preserving user agency (editable canon and visible evidence), not by exposing a large prompt-control console. A GM needs typed, checkable state rather than only permanently injected prose.

## URLs for final citations

- [12]: https://github.com/LostRuins/koboldcpp/wiki

## SynapticGM design decisions

### Priority assessment

| Priority | Change | Rationale |
|---|---|---|
| P0 | Convert the existing ledger into typed, attributable state transactions and compile a current-scene manifest. | Directly prevents wrong names, places, kit, and room roster. |
| P0 | Add an input-intent contract and claim/provenance validator that can reject a draft. | Addresses ignored player actions, recycled dialogue, and unauthorized people/places. |
| P0 | Add a campaign-contract graph over opening canon and quests. | Prevents silent premise drift while preserving explicitly chosen player divergence. |
| P0 | Use a diegetic renderer and leakage linter with content visibility classes. | Makes engine data unavailable to narrative prose; preserves intentional in-world LitRPG system messages. |
| P1 | Make retry a controlled alternate branch using beat signatures and response-completeness gates. | Eliminates samey retries and empty outputs rather than merely increasing sampling variation. |
| P1 | Replace a raw free-turn wall with a one-time onboarding arc milestone entitlement. | Prevents a paywall while the player’s first chosen consequence is unresolved. |

### Recommended hierarchy

1. **Truth layer:** Canonical IDs, scalar state, relationship edges, inventory and quest transactions with source turns, status, and supersession links.
2. **Now layer:** A reserved current-scene manifest compiled from the truth layer: location, present actors, active objects, exits, threats, constraints, and player-observable equipment.
3. **Intent layer:** Parsed player action / question / stated constraint plus response obligations and explicit entity-resolution status.
4. **Campaign layer:** Opening promises, active and dormant quest nodes, causal commitments, allowed divergence policy, and approved scene seeds.
5. **Evidence layer:** Entity-tagged episodic micro-summaries and semantic retrieval as optional support only; factual conflict loses to the truth/now layer.
6. **Output-control layer:** Draft claims must cite player input, campaign canon, current scene, or an authorized new-introduction permit. Completion and non-repetition tests apply to drafts and retries.

### Rules for existing components

- **Bible + lore cards:** Retain as authorial canon; assign entity IDs, aliases, temporal validity, and authority class. Do not use plain keyword activation as the final authority.
- **Opening canon:** Convert to a campaign contract containing invariants, non-negotiable promises, first-arc goals, and explicitly permitted divergence routes.
- **Scene facts + locality warden:** Compile into an immutable manifest per accepted turn. Change the warden from an advisory instruction into a no-unsupported-person/place gate.
- **Claim grounding:** Upgrade from a preference to a hard drafting validator with per-claim provenance. No source means revise, ask, or seed a permitted unknown.
- **Micro-summaries:** Keep only as event evidence with entity IDs, time/location bounds, and source spans; summaries can never mutate state themselves.
- **Pins:** Convert to user-owned hard constraints; make precedence explicit: player correction > published campaign canon > accepted ledger transaction > retrieved prose.
- **Consequence ledger:** Use append-only actions with `before`, `after`, source turn, observer/knowledge scope, and a correction/supersession record.
- **Talk anti-recycle:** Store semantic beat signatures for all narrative replies, not dialogue only; retries require material change in event, information, obstacle, or tactic.
- **Perspective/locality wardens:** Retain, but validate output against manifest and visibility/knowledge edges, not a prose instruction alone.
- **Story-start free + honeymoon turns:** Entitle through first closed loop: player identity, first consequential choice, and observed consequence or scene transition. Never cut a turn with an unresolved player action.
- **Simple/Expert custom:** Simple shows player-facing "Scene", "Threads", and optional "Why it happened"; Expert exposes sources, reservations, claim proofs, manual corrections, and test logs.
