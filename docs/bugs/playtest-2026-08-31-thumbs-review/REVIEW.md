# Thumb review — `gm_response_feedback` (2026-08-31)

Read-only. No RLS change. No ship.

**Queried:** 2026-08-29 evening (review written 2026-08-31)  
**Project:** `synapticgm` (`wzgsrpwhmgffcyohvtko`)  
**Table:** `public.gm_response_feedback` (10 rows; `log_entry_id` populated — SQL `021` is applied)

## Sources checked

| Source | Thumbs? |
|---|---|
| Supabase `gm_response_feedback` + `profiles.email` | **10 rows** — all John |
| `public.player_feedback` | 0 rows |
| `docs/bugs/playtest-2026-08-30-john-here/` (transcript + pack + ingest) | Same save; **no extra thumb objects** — comments live only in the table |
| `docs/bugs/playtest-2026-08-30-josie/` | **No thumbs.** Josie was on HUD `2026-08-30S`; thumbs were not on classic `LogRow` until 30T. `WHY-DRIFT.md` records that. |
| `docs/bugs/playtest-2026-08-30-john-here/ops-review-bundle-1788027573396.json` and `C:\Users\littl\Downloads\ops-review-bundle-1788027573396.json` | Same file. **53 auto_error moderation reports**, not thumbs. |

Classes used below: **name harvest**, **atmosphere loop**, **map**, **auto-fight**, **chrome-as-person**, **collage**, **hook flip**, **option relevance**, **other**.

Zero thumbs map to chrome-as-person, collage, or hook flip. Those are Josie verbal / dump issues, not this table.

---

## Counts

| | n |
|---|---|
| Total | **10** |
| Down (`negative`) | **10** |
| Up (`positive`) | **0** |
| With a comment | **10** |
| Testers | **1** — John Pilgrim · `little.johnp.jp@gmail.com` · staff · `d73a4d9e-278e-45b0-8ad0-597f9a85c9e2` |
| Mode / bible | LitRPG · `summoned-pact` (all) |
| Save | `6d8e0b1f-9427-48c8-ac7e-9affb67019eb` (all) |
| Window | 2026-08-29 16:21–18:11 UTC (17:21–19:11 BST) |

Tape at export: turn 12, character **Here**, XP 162/200, HUD/BUILD `2026-08-31d` / `2026-08-30w`.

---

## Every row

### 1 — T0 opening · list leak

| | |
|---|---|
| When | 2026-08-29 16:21 UTC |
| Who | `little.johnp.jp@gmail.com` (staff) |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **0** · log `agwe0d79h` |
| Thumb | **down** |
| Comment | This shouldn't be here - 1. Carefully examine the immediate surroundings for any signs of escape or useful materials. |
| Beat | Alone ruin opener: dust / decay / burnt ozone / shattered concrete. Numbered choice glued onto the last sentence. |
| Class | **option relevance** (choice list in story body) |
| Status | **Still open.** 31c `stripChoiceList` residual: numbered `1.` can still leak on opening. Not 31e / 31d. |

Player action: *(null — opening)*

---

### 2 — T2 inspect · list leak again

| | |
|---|---|
| When | 2026-08-29 16:35 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **2** · log `868njikct` |
| Thumb | **down** |
| Comment | Again shouldn't be an option in the text -1. Head through the doorway into the antechamber. |
| Beat | Inspect surroundings. Same dust/ozone essay; doorway to an antechamber; `1. Head through…` glued on. |
| Class | **option relevance** (list leak) + **atmosphere loop** |
| Status | **Still open** (list leak). Atmosphere half is 31e recycle if the next look reprints this room. |

Player: `Inspect the immediate surroundings`

---

### 3 — T3 windows · XP + atmosphere + re-search pad

| | |
|---|---|
| When | 2026-08-29 17:06 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **3** · log `yptim91t9` |
| Thumb | **down** |
| Comment | Pointless xp gain. Keeps re hashing atmosphere Description the taste and smell of the air. Option to sift through debris yet already searched room twice. |
| Beat | Asked for windows + anything useful. GM reprints dust/ozone, says no windows, rubble only. STATUS `+5` examined. Pad: *sift through the debris*. |
| Class | **atmosphere loop** + **option relevance** + **other** (unearned inspect XP) |
| Status | Atmosphere reprint → **fixed in unpushed 31e** (same-room no-delta = recycle). Re-search pad after empty → 26p residual, **still open**. `+5` examined on a look → 30S/26o skip look-around XP, but this line still paid; **still open**. |

Player: `Check the room for windows to see whats outside and anything in the room that might be useful or explain where I am`

---

### 4 — T3 scout · canned name-ask (alone)

| | |
|---|---|
| When | 2026-08-29 17:10 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **3** · log `35290fa8-6daa-4642-99cb-471fe7148504` |
| Thumb | **down** |
| Comment | I'm alone so this makes no sense. No one asked me for a name |
| Beat | Scout / empty-room line. Whole GM beat is the canned cover: `They are still waiting for a name you will own.` Scene is alone. |
| Class | **name harvest** (opening cover, not a give) |
| Status | **Fixed in unpushed 31e.** Play lines defer instead of canned name-ask; `here` is on the deny-list so the later `why I'm here` harvest cannot lock **Here**. 30T only skipped inspect + send-back — this line is neither. |

Player: `If there nothing of use i. Here`

This is the one-line confirm of 31e (name = here). No extra code in this review.

---

### 5 — T3 “go next room” · stayed + list leak

| | |
|---|---|
| When | 2026-08-29 17:52 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **3** · log `6iwgmjuuq` |
| Thumb | **down** |
| Comment | I already said to go to the next room and start looking through it so waste a turn describing there is nothing in here ? |
| Beat | Asked to leave and investigate the next room / why here. GM stays in this chamber, reprints empty, offers `1. Step through the doorway…`. **Here** locks on this line (`I'm here`). Quest Unlocked: Circle’s Price. |
| Class | **atmosphere loop** + **option relevance** (travel not taken; list leak) + **name harvest** (silent lock) |
| Status | Atmosphere + name lock → **31e**. Travel ignored / list leak → **still open**. |

Player: `If there is nothing else in this room that I can make use of then move to b the next room and investigate that room as well looking again for anything of use or information about why I'm here or where I am`

---

### 6 — T7 jump · map left/right + mini XP

| | |
|---|---|
| When | 2026-08-29 17:59 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **7** · log `fo9w2kj2t` |
| Thumb | **down** |
| Comment | Not liking all the mini xp received for just changing a room map hasn't updated and the text says a heavy door to my left but on the map it would be on my right |
| Beat | Jumped the hole. New chamber, door “to your left,” numbered invite. STATUS piled `+5` studied, `+12` quest tick, `+20` daily, **+45 reason heard**, `+5` examined — no NPC, no why. |
| Class | **map** + **other** (unearned / scout XP) + **option relevance** (list leak) |
| Status | **Still open.** 31c residual: ArcDirector may still pay reason-heard on a scout. Interior camera / left-right vs floor-plan is new work. Not 31e / 31d. |

Player: `Get over the gap and check the next room thoroughly`

---

### 7 — T8 study · chest not on the pad

| | |
|---|---|
| When | 2026-08-29 18:02 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **8** · log `cfvl4yenj` |
| Thumb | **down** |
| Comment | Options following this were rubbish. Not one to check the possible chest |
| Beat | Studied for who-was-here. GM names a possible chest under wood + a metallic glint. Pad: listen / doorway-to-essay-title / study-again / search the ruin. No “check the chest.” |
| Class | **option relevance** |
| Status | **Still open.** 31c residual: ChoiceCompiler can re-offer Examine / study. Grounded-prop pad is new work. |

Player: `Study the space for any sign of who was here`

---

### 8 — T10 auto-fight · spawn + no System kill line + pile dropped

| | |
|---|---|
| When | 2026-08-29 18:05 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **10** · log `9co626nfv` |
| Thumb | **down** |
| Comment | No option re auto fighting no mention Of the system telling me the kill got xp. No mention of when that beast came from just straight to a fight. No follow up on my original respons to check whats under the pile |
| Beat | T9: pile → chest + locket, then **Encounter: Pact-Hunter Skirmisher** with flee/parley pad (no fight chip). T10: `[Auto-Fight]` three-round blur. STATUS had `+30 (combat)` + 7 gold; story never said System / XP / loot. Chest/locket never resolved. |
| Class | **auto-fight** |
| Status | **Still open.** 26p residual: auto-fight is still LLM-narrated; spawn has no provenance; loot/XP stay STATUS-only. |

Player: `[Auto-Fight] Engaging Pact-Hunter Skirmisher...`

---

### 9 — T11 System loot · no kill + atmosphere reprint

| | |
|---|---|
| When | 2026-08-29 18:09 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **11** · log `49h6apbnd` |
| Thumb | **down** |
| Comment | I just had an auto fight completed yet te.ling me no kill. Fed up of constant disliking of the atmosphere |
| Beat | Asked System to loot the kill. GM reprints the T5 threshold / dust-mote essay and writes `You note no "kill" to loot`. |
| Class | **auto-fight** (ledger deny) + **atmosphere loop** / **collage** (prefix reprint) |
| Status | Atmosphere / collage → **31e** (recycle + 30Z prefix). Kill/loot deny after a cleared encounter → **still open**. |

Player: `Think to your self - if I have a system is it like a game with auto loot? System loot my kill`

---

### 10 — T12 examine · atmosphere again

| | |
|---|---|
| When | 2026-08-29 18:11 UTC |
| Who | `little.johnp.jp@gmail.com` |
| Mode / bible | LitRPG · summoned-pact |
| Save / turn | `6d8e0b1f` / **12** · log `xviz1wzd5` |
| Thumb | **down** |
| Comment | Feels repetitive. Again all about the atmosphere not much from my request to examine the room |
| Beat | Examine the room. Same damp-earth / decay / dust-mote / gloom / silence essay. Pad re-offers **Examine the room**. |
| Class | **atmosphere loop** + **option relevance** (re-offer examine) |
| Status | Atmosphere no-delta → **fixed in unpushed 31e** (BEAT DELTA + recycle). Re-offer Examine → 31c residual, **still open**. |

Player: `Examine the room`

---

## Founder summary

### Top themes (by thumb count; a row can hit more than one)

| Theme | Rows | Class |
|---|---|---|
| Atmosphere / same-room smell-light essay | 3, 5, 9, 10 (and 2 as secondary) | atmosphere loop |
| Numbered `1.` glued into story | 1, 2, 5, 6 | option relevance |
| Unearned / scout XP (mini + ArcDirector +45) | 3, 6 | other |
| Auto-fight (surprise spawn, no System kill line, loot deny, pile dropped) | 8, 9 | auto-fight |
| Pad ignores the beat (sift-after-search, no chest, travel not taken, re-examine) | 3, 5, 7, 10 | option relevance |
| Canned name-ask / **Here** lock | 4, 5 | name harvest |
| Map camera / left vs right | 6 | map |

### Already fixed vs still open

**Push 31e (unpushed this batch) — thumbs confirm it.**

- Row 4 is the one-line confirm: canned name-ask on a scout, alone, then `I'm here` → **Here**. 31e deny-list + defer play lines + Continue rev 6.
- Rows 3, 5, 9, 10: same-room atmosphere reprint with no delta. 31e recycle + SNAPSHOT BEAT DELTA after look/wait. Row 9 also matches 30Z prefix collage (`dust motes dance…`).

**31d (already pushed) does not address any thumb.** Force-latest / stale HUD is Class H. This tape was already on `2026-08-31d`.

**Still open — new work, not this review.**

1. **Numbered list leak** in prose (rows 1, 2, 5, 6). 31c residual. `stripChoiceList` misses a singleton `1.` glued to the last sentence when the label is long / not `looksLikeChoiceOffer`.
2. **Interior map** (row 6): pin/camera not updating on room change; prose “left” vs floor-plan “right.”
3. **Option relevance** (rows 3, 7, 10): grounded prop (chest) missing from pad; sift-debris after empty search; ChoiceCompiler re-offers Examine.
4. **Travel not taken** (row 5): player said move to the next room; beat stayed and described empty again.
5. **Auto-fight** (rows 8, 9): beast with no provenance; no fight chip (only flee/parley); story omits System XP/loot; next beat denies a kill after `encounterCleared`.
6. **Scout / room-change XP** (rows 3, 6): 31c residual — ArcDirector still paid reason-heard +45 on “study the space.” Look-around skip (30S/26o) did not catch “windows / thoroughly / study.”

### What to push vs what not to start

| Do | Don’t |
|---|---|
| **Push 31e** when John asks — name ≠ here + atmosphere recycle. These 10 downs are the evidence. | Do not start a new ship from this review. |
| 31d is already live; ignore it for thumbs. | Do not treat Josie chrome / crowd / hook-flip as thumb work — they are not in this table. |
| Next update (only if John asks): list leak, map left-right, chest pad, auto-fight provenance + loot receipt, scout XP. | Do not implement from this file. |

---

## Dump notes (not extra thumbs)

- **Josie** (`wyattpilgrim16@gmail.com`, save `22a4f976`) never wrote a `gm_response_feedback` row. Her breaks (crowd size, chrome-as-person / Place, hook flip, collage, inspect→name-ask on a *different* HA abort) are in `playtest-2026-08-30-josie/` and playtest-notes. Several of those already shipped as 30X / 30Y / 30Z / 31a / 31b — none of them are thumbs.
- **Ops-review bundle** is client auto-flags (`Cannot access 'At' before initialization`, etc.) on **other** saves (e.g. `7e281f31`, `db099246`). Not this tape. Not thumbs.
