# Live story do / don’t (2026-08-30S)

**What the GM actually sees (live):**

| Surface | Path | Role |
|---|---|---|
| AUTHORITY + PROSE LICENSE | `src/game/situationPacket.ts` (`formatSceneSnapshotForPrompt`) | Fact lock + one recycle rule |
| MODE AUTHORITY | `fluidProseRails.MODE_STORY_AUTHORITY` (one sentence per mode) | Thin craft: LitRPG / tabletop / story RPG / PYOA |
| Fluid rails | `src/game/fluidProseRails.ts` | Diction / beat shape / **NO RECYCLE** bullet |
| Voice NEVER-LINES | `src/game/gmVoiceProfile.ts` | Personality chrome, not craft |
| Quality governance | `src/game/qualityGovernance.ts` | Ledger: clone reject, stall-pad drop |

**Exact recycle rule (AUTHORITY, live — do not restack):**

> Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate.

**Mode sentences (live, one per `engineMode`):** LitRPG beat-then-earned System; tabletop situation + fair ruling + spotlight; story RPG leverage / tactic / two futures; PYOA lock the fork and offer distinct choices.

Full D2 do/don’t constitution stays research-only (`docs/research/story-craft-guides-ingest-2026-08-30.md`). Commission: `docs/research/MANUS-PROMPT-story-craft-guides-2026-08-30.txt`.
