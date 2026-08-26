# Playtest ingest — 2026-08-25 (Jax / Summoned Pact / Android)

**When:** Session `2026-08-25T16:07:46.613Z` → export `2026-08-25T17:44:08.456Z`  
**Device:** Android Chrome, viewport 384×693, Free tier, Phoenix Ashrise, second-person, `fastSetupChips: false`  
**sessionId:** `a81b65f0-8393-41f1-9b7d-efc70492046a`  
**deviceId:** `0d4efcbc-ad46-4ddc-917a-b9ef095b6f68`  
**Campaign:** Summoned Pact — PC **Jax**, cathedral infirmary → Valespire street  

## Files (verbatim)

| File | Notes |
|---|---|
| `synaptic-debug-latest.json` | Full event-log export (77 events, 33 ERROR, 25 WARN) |
| `synaptic-debug-session-a81b65f0.json` | **Byte-identical** to latest (same SHA256) — not a second session |

Screenshots + WhatsApp notes lived in Cursor workspace assets / chat (not re-copied here). Issues mapped in `.cursor/rules/playtest-notes.mdc` Open section (batch 2026-08-25/26).

## Build inference

- Export has no `HUD_BUILD_STAMP` field. Production stack in errors: `https://www.synapticgm.com/assets/index-DzwlyQPU.js`.
- Settings include `fastSetupChips: false` + full-session soft-cap policy (25e+).
- UI shows working **Hide options / Show options** toggle (25f Hide fix). **Hide text** visible while text is shown is expected (label = action to hide, not current state).
- Repo source stamp at ingest time: `2026-08-25f`. Treat playthrough as **25f-class** (or late 25e with Hide fix if CDN lagged).

## Class A evidence (from eventLog)

Repeated GM transport failures on Free/DeepSeek path:

| Pattern | Count (approx) | Classification bug |
|---|---|---|
| `"The System is still compiling…"` | several; auto-retry with `kind: timeout` (75s early / 30s later) | OK as timeout |
| `"The AI provider returned no content."` | many `sendAction failed` | Classified **`kind: unknown`**, `transportRetriesUsed: 0` — **not** matched by `classifyTurnFailure` (`empty content\|empty response` regex misses `"no content"`) so **no empty auto-retry** |
| Resolution retry WARN | several “Unresolved or empty action narrative” | Soft path; not the hanging bubble |
| Choice regeneration failed | ≥2 WARN | Pads fall through to generic / leaky labels |

**Screenshot “Falling to load response”** = turn 12 player line  
`Have a look around and ask some one where you can get work…`  
logged at `17:41` with empty-GM fail → player bubble kept, no GM reply (matches shot). Later retries also timeout/exhausted.

**Note:** Barrel-haul + “wipes your hands” screenshots are **after** this export’s `recentTurns` (log ends mid turn-12 fail). Still valid from screenshots; a later export would help for those turns.

## Continuity / prose highlights in `recentTurns`

- Turn 3: `"half an moments later"`; `"He shrugs, the motion barely moving your shoulders"` (NPC motion → player body).
- Turn 8→9: gate registrar speaking / name ask → next beat opens on `"The cot-bound sleeper never stirs"` then splices name/chirurgeon (awake speaker → sleeper continuity break).
- Turn 12 STATUS: `[Perception check: SUCCESS — no mechanical changes]` (noise; dice-noise filters don’t match this phrase).
- Perspective over-rewrite pattern also in other turns: `"tilts your head"`, `"raises your face"`, `"weight behind your eyes"` (NPC acts on “your” body).

## Do not ship from this ingest

Review-only per John (“check them over”). Tickets only — no code batch until next-update ask.
