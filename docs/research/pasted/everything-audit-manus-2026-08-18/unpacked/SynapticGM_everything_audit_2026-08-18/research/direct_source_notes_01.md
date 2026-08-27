# Direct Source Notes 01 — Core Competitors

**Access date:** 2026-08-18 (GMT+1)

| Target | Publicly evidenced behavior | Audit implication |
|---|---|---|
| AI Dungeon | Its Memory System uses auto-summarization and a Memory Bank; memories summarize six prior actions, are ranked by vector relevance, and are inserted subject to context capacity. It says historic edits that affect summaries require manual summary updating. Memory-bank capacity varies by membership tier. | **Verified competitive contrast:** SynapticGM should demonstrate a correction that produces an accepted StateTx and survives save/reload, rather than relying on regenerated summary incorporation. Do not claim this is AI Dungeon failure in all cases; the manual-update limitation is documented. |
| Friends & Fables | It documents player/AI context blocks, automatic research over lore/memories/entities, semantic search over long-term memories, user-editable priorities, and block expiration. It explicitly says long-term-memory search is less reliable than lore/entities and says players may need to inspect/edit context when the GM takes an odd direction. | **Verified competitive contrast:** SynapticGM’s product language should distinguish a truth ledger from optional contextual retrieval. The UI must show canonical fact, source StateTx, active scene obligation, and an actual correction action; hiding all decisions behind “memory” cedes clarity. |
| Hidden Door | It describes a structured game-engine layer that stores characters, items, locations, states, and uses structured plot beats/rules plus ML/LLM tasks. It has light stats, rolls for difficult actions, deck/cards, authored worlds, content ratings/warnings, and a PG-13 baseline. | **Verified competitive threat:** Strong structured-state storytelling is credible market territory. SynapticGM must beat it on free-form player invention, durable causal explanation, and longer campaign transparency—not merely say “we have structured data.” |
| Quest Portal | It publicly frames AI as assistance for human GMs/players: drafting NPCs and descriptions, materializing assets, and reducing friction. It states AI will not replace a player or GM. | **Positioning distinction:** Quest Portal is evidence of an AI-augmented tabletop workflow rather than a direct single-player autonomous-GM promise. SynapticGM should not benchmark it as though it makes equivalent continuity claims. |

## Verbatim Evidence Worth Citing

> “If you make changes earlier in your adventure, and those changes would have an impact on the summary, you’ll need to update the Story Summary manually.” — AI Dungeon, *All About the Memory System* [1]

> “Long Term Memories… [semantic] search is less reliable than lore/entities because there can be hundreds of thousands of memories in a campaign with similar text content.” — Friends & Fables, *Working Context Blocks* [2]

> “We have a game engine layer that stores each character, item, or location in the world, and its state.” — Hidden Door, *FAQ* [3]

## Sources

[1]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — All About the Memory System (accessed 2026-08-18)"
[2]: https://help.fables.gg/articles/8560008-working-context-blocks "Friends & Fables — Working Context Blocks (accessed 2026-08-18)"
[3]: https://www.hiddendoor.co/help/faq "Hidden Door — FAQ (accessed 2026-08-18)"
[4]: https://www.questportal.com/ai "Quest Portal — AI (accessed 2026-08-18)"
