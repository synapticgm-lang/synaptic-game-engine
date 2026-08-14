# Pack 6 — Long Campaign Memory Turn 80–200 (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Compression, pins, structured vs prose, context budget — no tier-gated memory. No full chat history as memory.

Architecture already decided: timeline + dual location + lore cards + dungeon ledger; code owns facts.

---

## 1) Comparison

| Approach | Source | Copy / avoid |
|----------|--------|--------------|
| Raw transcript | AI Dungeon | **Avoid** |
| Auto-memory + retrieval | F&F | **Copy** summarize; **avoid** tier-gated @mentions |
| Record-based state | DungeonsDeep | **Copy** (ours); add narrative summaries |
| Keyword World Info | AID | **Avoid** keyword-only |
| Topic-document memory | Infini Memory 2026 | **Copy** topic + consolidate |
| Structured summaries | “The Manager” 2026 | **Copy** summaries; skip quality-reward |
| Lost-in-the-middle | Liu / Pristren | Critical info at **start + end** of prompt |

---

## 2) Failures at turn 80+ (gaps vs current)

1. NPC relationship *texture* drift  
2. Location revisit atrophy (no “what happened last time”)  
3. Quest arc narrative history loss  
4. Tone drift  
5. PC personality drift  
6. Context sheet bloat → middle ignored  
7. Cleared dungeon leakage  
8. Choice consequence amnesia  

---

## 3) Compression (hybrid — recommended)

| Layer | Trigger | Content | In prompt? |
|-------|---------|---------|------------|
| 1 Per-turn | Always | Current+prev location, situation, active quests, outcome token | Always |
| 2 Location arc | Leave / 30+ turns absent | 3–5 sentences on Place | On return / quest ref |
| 3 Turn summary | Every 15 turns | 3–5 sentences | Semantic retrieve |
| 4 Campaign summary | Every 50 turns | 1 paragraph | Always |

---

## 4) Pins (no tiers)

| Type | Limit | Notes |
|------|-------|-------|
| Auto-pin | Unlimited | First meet, quest, significant choice, Uncommon+ loot, conditions |
| Player pin | 10 active | Oldest archives (not delete) |
| @mention | Unlimited | Per-turn retrieval only |
| Quest pin | Dynamic | active/revealed only |

---

## 5) Structured vs prose

- Numbers/state → structured (always exact)  
- Feeling/relationship/arc → short prose (include when relevant)  
- Timeline facts → store always; retrieve, don’t dump all  

---

## 6) Context order (~1,550 tokens, cap ~2,000)

1. System rules (primacy)  
2. Campaign summary  
3. PC personality (1–2 sentences)  
4. Current location  
5. Previous location  
6. Active/revealed quests  
7. Active conditions  
8. Outcome token  
9. Retrieved memory (middle — keep tight)  
10. Player pins  
11. Unresolved major consequences  
12. Narration directives  
13. Outcome token recap (recency)  

**Never prune:** rules, campaign summary, current location, active quests, conditions, outcome token.  
**Prune first if over budget:** retrieved memory → pins → previous location.

---

## 7) Never every turn

Full transcript · all timeline · all lore · completed quests detail · full inventory · all NPCs · dungeon layouts · raw dice math · System chrome · meta AI instructions · >~2k context dump

---

## 8) Implementable backlog (≤12)

1. Place.arcSummary on exit  
2. CampaignSummary every 50 turns (always in prompt)  
3. PC personalitySummary  
4. NPC relationshipSummary  
5. TurnSummary every 15 turns + semantic retrieve  
6. Player pins (10) + auto-pins  
7. Semantic retrieve top 3–5 facts/summaries  
8. Dungeon closedSummary  
9. Context sheet ordered for primacy/recency  
10. Hard ~2k token budget + prune order  
11. Consequence ongoing lines for major choices  
12. Never feed full chat history as memory  

---

## New data shapes (sketch)

Place: `arcSummary`, `arcStatus`  
NPC: `relationshipSummary`, `lastInteractionTurn`  
Character: `personalitySummary`  
TurnSummary / CampaignSummary / Pin / Consequence tables  
DungeonMap: `closedSummary`, `status`

---

## Prompt additions

Match campaign tone · respect personality · reflect NPC relationships · acknowledge revisit via arc summary · surface unresolved consequences naturally · retrieved memory informs, not recap dump · no inventing events not in sheet · outcome token is truth

---

## Sources (accessed Aug 14, 2026)

Zylos context management · DungeonsDeep / Tavernbound forgetfulness · Infini Memory arXiv · Lost-in-the-middle · Auferet · prior SynapticGM competitor research

---

## Delta vs current

Have: timeline, dual location, lore cards, dungeon hidden, npcMemories (thin).  
Need: location arcs, campaign/turn summaries, personality + relationship prose, pins, consequence threads, ordered budgeted context sheet, semantic retrieve (not keyword-only).
