# Pack 3 — LitRPG / System Apocalypse Player Expectations (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** First 30–60 minutes, turn quality, Tier meaning, protest turns — single-player only.

Architecture already decided: story → System chrome; code owns ledger; choices primary; dual-location memory.

---

## 1) Comparison highlights

| Feature | Source | Copy / avoid |
|---------|--------|--------------|
| Opening scene | AI Dungeon | **Copy** vivid open; **avoid** unstructured free-text from turn 1 |
| System registration | Tao Wong *System Apocalypse* | **Copy** blue-box as a *moment*; progressive reveal over 3–5 turns |
| Tutorial pacing | Dungeon Crawler Carl / LitRPG arcs | Tutorial = first T1 dungeon; learn by doing; no wall of System before first action |
| Memory | F&F / Auferet | Structured state; **avoid** LLM as fact store |
| Choices | Hidden Door | Curated primary + mediated free-text secondary |
| Always-succeed | Hidden Door (anti) | **Avoid** — failure must stick |
| Ungrounded chest | Hidden Door (anti) | **Avoid** — already blocked by hidden ledger |
| Blue boxes | LitRPG genre | System chrome after story; avoid “blue box madness” |

---

## 2) Must-have first-session moments

| # | Moment | ~Turn | Notes |
|---|--------|-------|-------|
| 1 | Awakening / registration | 1 | Minimal sheet: Name, L0, Class None, HP/SP/MP — not full attrs |
| 2 | Look-around | 2–3 | Establish location sheet |
| 3 | First threat + first roll | 4–6 | Teach code-owns-outcome loop |
| 4 | First fail that sticks | 5–8 | Wound/condition persists |
| 5 | First loot | 6–10 | T1 weights; System shows rarity |
| 6 | First quest | 8–12 | Tutorial spine: reach exit / class reward |
| 7 | First level / class | 12–20 | End of tutorial dungeon |
| 8 | First rest / full status | 10–15 | Full blue box *earned*, not dumped |

---

## 3) Information order (every turn)

1. Story beat (LLM)  
2. System chrome (code)  
3. Curated choices (+ free-text secondary)  
4–6. Journal / map / full status — **tabs**, never forced into turn flow  

Rule: player never needs a menu to understand what just happened.  
Turn 1 exception: larger registration chrome still *after* story of the box appearing.

---

## 4) Common frustrations → our prevention

| Frustration | Prevention |
|-------------|------------|
| Forgets facts | Context sheet re-inject |
| Contradicts rules / wrong dice | Code outcomes + Warden |
| Failure doesn’t stick | Conditions ledger |
| Ungrounded chests | Pre-seeded hidden state |
| Long-run drift | Timeline + quests |
| UI overload | Single column: Story→System→Choices |
| Prompt hacks | Intent parse + curated primary |
| System-only turns | Architecture + Warden reject |
| Too slow to LitRPG / too fast dump | Tutorial packs mechanics in first session; progressive reveal |
| “AI might make mistakes” | Don’t show; code owns math |

---

## 5) Tier: danger vs map scale (do not conflate)

| Axis | Name | Controls |
|------|------|----------|
| Danger | Dungeon Tier T1–T4 | Enemy stats, trap DCs, loot weights, pity, XP |
| Scale | Depth / size | Rooms, floors, branches, resource drain |
| Global | Act / story chapter | Which dungeons available — not a damage multiplier |

A small T4 = short brutal gauntlet. A large T1 = long easy grind.  
Maps to playtest: map “Tier 3 local exploration” = **map scale**, not danger.

---

## 6) Protest / “I didn’t agree”

| Approach | Verdict |
|----------|---------|
| Acknowledge in-fiction, mechanics continue | **Best** — System cold / bureaucratic |
| Protest as choice with telegraphed consequence | **Good** |
| Ignore / generic continue | **Bad** |
| Meta “you need to choose an action” | **Worst** |

Rules:
- Intent → `{action_type: "refuse"}`  
- Code consequence (free attack / timer / lost chance)  
- LLM: System notes refusal; never negotiates; never breaks fiction  
- Curated choices may include labeled refuse options  

---

## 7) Good LitRPG turn checklist

Story first · System after · never System-only · code dice · failure sticks · curated choices · hidden state respected · protest in-fiction · no invention · no ledger rewrite · pacing · tone · conditions reflected · quest known · rarity in chrome only.

---

## 8) Implementable recommendations (≤10)

1. Open with Awakening, not a menu.  
2. Progressive status reveal (full sheet after rest/level).  
3. Tutorial T1 delivers: combat, skill check, loot, sticky fail, quest, level/class — all first session.  
4. First fail by ~turn 8.  
5. Every turn: Story → System → Choices.  
6. Protest = valid action + consequence.  
7. Separate Danger Tier from Dungeon Depth.  
8. Tutorial quest by turn 8–12.  
9. First loot bias Uncommon (tutorial first-chest bonus).  
10. No “AI might make mistakes” disclaimer.

---

## First-session beat sheet (summary)

```
T1 Awakening → T2–3 Look-around → T4–6 First threat/roll
→ T5–8 First sticky fail → T6–10 First loot (Uncommon bias)
→ T8–12 First quest → T10–15 Rest/full status
→ T12–20 Boss/exit + level → Class / Act 2 hook
```

### Protest handling (data)

```
refuse → combat: free attack | quest: timer/penalty | move: timer advances
Narrate: cold System log, not sympathy
Forbidden: meta, “I understand your frustration”, “choose an action to continue”
```

### Prompt additions

- System is infrastructure, not a character  
- Protest acknowledged in-fiction; no yield  
- Never meta  
- First 3 turns story-heavy; later System ≤ ~30% of visible text  
- Reflect conditions; no rarity words in prose  
- Tutorial quest by turn 8–12  

---

## SynapticGM backlog from this pack (≤10)

1. Opening beat sheet for Integration / First Blood aligned to T1–T20.  
2. Progressive attribute reveal vs dump.  
3. Tutorial guarantees: sticky fail, Uncommon first loot, quest by T12.  
4. Enforce Story→System→Choices in UI (already targeted).  
5. `refuse` intent + consequence path.  
6. Split `dangerTier` vs `mapScale` in state/UI labels.  
7. System-only turn Warden reject (verify live).  
8. Rest moment unlocks full status panel.  
9. In-fiction System voice prompt rules.  
10. Remove any player-facing “AI may err” copy.

---

## Sources (accessed Aug 14, 2026)

- Tao Wong System Apocalypse excerpts / reviews  
- r/litrpg pacing + status screen + blue box madness  
- LitRPG story arc tutorial pacing (YouTube)  
- Auferet “hour ten is the test”  
- r/aigamedev AI RPG state  
- F&F / AI Dungeon / TableForge / Char-Gen 2026 reviews  
- Prior project competitor research notes  

---

## Delta vs current / playtest

Aligns with open playtest notes: story before System; Tier mismatch (danger vs map scale); protest as talk not physical stub; no empty System turns. Opening establishment exists — tighten to this beat sheet when implementing.
