# Path A ship — 2026-08-30S mode craft AUTHORITY

**Stamp:** HUD `2026-08-30S` / BUILD `2026-08-30l`  
**Prior:** `2026-08-30R` / BUILD `2026-08-30k`  
**Mid writer:** OFF. No new LLM critic. No WOF. No Continuity-Warden.

## Shipped this batch

| Item | Where |
|---|---|
| One AUTHORITY sentence per mode (SC-001) | `fluidProseRails.MODE_STORY_AUTHORITY` → SNAPSHOT + fluid rails |
| Shared recycle rule | Unchanged (do not restack) |
| Anti-repeat + play dump | 30R ledger (clone reject, stall-pad, Download play) |
| Unearned look-around / bearings XP | `isLookAroundAction` + B045 skip |
| TTS play/pause + voice dropdown | `useVoice` + Settings |
| Vitest | `playtest30sStoryCraft` (+ 30R / XP / TTS tests) |

Mode sentences are the WS-STORY pack thin: LitRPG beat-then-System, tabletop situation+spotlight, story RPG leverage/interiority, PYOA lock-and-fork. Full D2 do/don’t stays research-only.

## Redeploy

Client + `gm-turn` (SNAPSHOT / fluid rails on edge copies). Hard refresh after Vercel lands.

```
npx supabase functions deploy gm-turn
```
