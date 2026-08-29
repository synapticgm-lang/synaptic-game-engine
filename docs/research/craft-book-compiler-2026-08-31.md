# Craft-book compiler — 2026-08-31g

**Status:** Shipped Path A (ledger compiles the book). Mid writer OFF. No critic LLM. Full D2 stays research-only.

The Manus WS-STORY constitution is a **library**. Flash Lite ignores long mandate piles (27w). The live writer sees **one page**.

## Where the book lives

Typed rules in `src/game/craftBookCompiler.ts` (`CRAFT_RULES`):

- **id**, **mode** (`litrpg` / `dnd` / `rpg` / `pyoa`)
- **when:** `opening` | `inspect` | `talk` | `travel` | `combat` | `wait`
- **authority** ≤200 chars
- optional **boostOn** flags: collage / atmosphere / name_deny / pad_irrelevant / hook_contradiction

About **12 rules per mode** (48 total), thinned from D2 AUTHORITY candidates + anti-repetition + choice grammar in `docs/research/story-craft-guides-ingest-2026-08-30.md`. The four 30S MODE AUTHORITY sentences remain the **fallback** page when no specific drought matches.

## How a turn picks a page

Pre-GM, `formatCraftSnapshotLines` (wired in `situationPacket` SNAPSHOT; fate-autoplay uses the same packet):

1. Classify last player intent (opening covers still pending → `opening`).
2. Score matching rules: when-match + drought (inspect-again, same-room atmosphere, Wait/no-fork) + persisted boosts.
3. Emit **at most 1–2** `CRAFT:` lines.
4. If a more specific rule applies, **replace** the static MODE AUTHORITY sentence — do not stack.

Fluid rails still carry the one mode sentence (session DNA). SNAPSHOT is the turn page.

## How “learning” works (no new LLM)

After commit, `applyGovernanceCommit` reads flags already owned by code:

- collage / atmosphere reprint (`semanticLoopDetector`)
- deny-list name (`pcNameAuthority`)
- stall-pad clone (inspect/wait pad repeat)
- hook contradiction (`hookLock`)

Matching rules get a **boost** on `GameState.craftLedger`. Next turn those ids win the compile. Boosts decay by 1 each turn. Thumbs-down comments are not required.

`LogEntry.craftApplied` stores the ids for Debug / Download play.

## Residual

- Full D2 do/don’t, worked examples, D6 ranking, and D9 critic gates stay in `docs/research/pasted/manus-story-craft-guides-2026-08-30/`.
- Flash Lite can still ignore two lines; ledgers (inspect exhaustion, PYOA branch lock, NPC tactic) remain the hard owners.
- Edge: run `node scripts/sync-gm-edge-shared.mjs` then deploy `gm-turn` so SNAPSHOT CRAFT matches the client.

**Stamp:** HUD `2026-08-31g` / BUILD `2026-08-30z`. Vitest `playtest31gCraftBook`.
