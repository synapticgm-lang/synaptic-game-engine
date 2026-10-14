# tt-library-2 — report

Order: `docs/orders/tt-library-2-order.md` (John approved 14 Oct, 22:46). Commit **`8ed32b74`**, stamp **`2026-10-14w`** (live confirmed at https://www.synapticgm.com/version.json). Edge sync run (`--check`: edge copies match), `gm-turn` deployed, boots (OPTIONS 200).

| Item | Result |
|---|---|
| 1 OpenRouter structured outputs with Zod | **Added** |
| 2 5e-database 2024 SRD JSON | **Added** (monsters, spells, magic items); weapons, armour and conditions **skipped** |
| 3 compromise (NLP) for names | **Skipped**: it does not beat our code |
| 4 Repeated-phrase check | **Skipped**: tt-fix-10 already did it |

---

## Item 1 — OpenRouter structured outputs with Zod: added

### Model support (checked first)

Sources: the OpenRouter models endpoint (`/api/v1/models/<id>/endpoints`, `supported_parameters`), plus tiny live calls. Total live spend was about **0.011 USD**, under the 0.05 cap.

| Model | Strict `json_schema` support | Live result with the new per-turn schema |
|---|---|---|
| `deepseek/deepseek-v4-flash-0731` (OpenRouter) | Most endpoints. Not on Relace, BaseTen (×2), StreamLake, GMICloud or Novita. | Before: with no `require_parameters` the call can land on a provider that ignores the schema. After (`require_parameters: true`): Wafer obeyed. Two independent tok/id enums still let it pair `t1` with t2's id; with one schema row per REF ENUM entry it paired them correctly in 2 of 2 runs. |
| `google/gemini-2.5-flash-lite` | All Google endpoints. | Clean JSON at the real 4,096-token budget (2 of 2 with reasoning `low`, 2 of 2 with reasoning off). At a 400-token cap with reasoning `low` it ran out (`finish=length`); the game never sends that cap, so reasoning is unchanged. |
| `openai/gpt-5-mini` | OpenAI and Azure. | Before: **400 on every call**. The old schema listed `speaker_tok` but left it out of `required`, which strict mode rejects, so every turn wasted a round trip and re-posted without the schema. With `require_parameters` it also found no endpoint, because gpt-5-mini takes no `temperature`. After: clean, enum-bound JSON. |
| `anthropic/claude-haiku-4.5` (hosted Mid) | Checked as well because Mid and High use this path. | Clean, enum-bound JSON (one call went to Bedrock and took 45 s; another took 4 s on Anthropic). |
| Hosted **Free** (Fireworks DeepSeek) | Not tested: there is no Fireworks key on this machine. | Unchanged: no schema, and the old guessing still applies. Decision written to `docs/orders/needs-john.md`. |

### What changed

- **`src/game/tokenBeatSchema.ts`** (new, client only; zod never reaches the edge). This is the one wire contract.
  - `strictBeat` (`:83`) / `tokenBeatJsonSchema` (`:100`) build the per-turn strict schema with zod and `z.toJSONSchema`. Each declared ref is a union of fixed `{tok, id}` pairs, one per REF ENUM row (the rows of `compileNounAllowlist`), so a writer cannot declare a person, item or place that is not on the ledger, and cannot pair a token with another row's id. `speaker_tok` is a REF ENUM token or null.
  - `tokenBeatSchemaFor` (`:106`) builds it from `state`.
  - `readWireBeat` (`:64`) is the zod reply reader that replaces the hand coercion in `parseTokenBeat`. It also collapses a ref declared twice: DeepSeek repeated `npc:mira` 13 times under strict mode.
- **`src/game/openRouterChat.ts:315-351`** (edge-synced, plain JSON).
  - A schema request now sets `provider.require_parameters: true`, so only providers that honour the schema are used.
  - It drops `temperature`, which reasoning-only models refuse.
  - It forwards `opts.schema`.
  - The static fallback schema now has `speaker_tok` required and nullable.
- **Direct path:** `src/game/aiService.direct.ts:368` passes the schema.
- **Hosted path:** `src/game/gmProxy.ts:182` sends `tokenSchema`. `supabase/functions/gm-turn/index.ts:46-49` (`readTokenSchema`: a plain object, at most 64,000 characters) and `:430` forward it on OpenRouter turns.
- **Fallback:** the existing fallback (re-post without the schema on any non-429 error) is kept on both paths.

### What it replaces, and what it does not

- **Replaced.** `parseTokenBeat`'s hand type coercion, `LINE_FNS`, `TOKEN_USES` and `readTokenUse`; see cut log items 1-7. For OpenRouter replies, the gate's tok-first binding (`tokenProse.findEnum`) now always finds an exact row, so its id/name guessing never fires there.
- **Not replaced.**
  - The id/name fallback in `findEnum` and the use-word alias map stay, because the hosted Free writer (Fireworks) still sends free JSON.
  - The prose name gates stay: the strict schema constrains declared refs, not the prose. In a probe DeepSeek still wrote "Garrick", who was not in the enum, inside a line's text.
  - "Events" are not declared: the packet has no event list with ids to put in an enum.

### Tests

`src/game/ttLibrary2.test.ts`, item 1 groups (9 tests):
- the schema binds each tok/id row and is valid for strict mode;
- an empty enum still gets a schema;
- the request body has `require_parameters`, no temperature, and the per-turn schema is forwarded;
- the reader collapses repeated refs, reads alias words, drops bad lines, and rejects a ref with no token or a candidates list;
- `parseTokenBeat` reads a strict reply with a null speaker.

The existing Token Prose suites still pass: `playtest14aTokenProse` (apart from its baseline stamp pin), `s77RootAOneNameList`, `speechFromLines`.

---

## Item 2 — 5e-bits/5e-database 2024 SRD JSON: added in part

**Licence.** The repository is MIT ("Copyright (c) [2018-2020] [Adrian Padua, Christopher Ward]"). Its 2024 data (`src/2024/en`) is SRD 5.2.1 content under **CC-BY-4.0**; the 5e-srd-api FAQ states that the 2024 data is SRD 5.2 only. The README's OGL 1.0a line is a stale 2014 note. Pinned at commit `a6212beb4b278917c2cff41c2b04c4ef4f3e0d6f`; only that 2024 folder is used.

**Bundling.** `scripts/srdExtract.mjs` fetches the pinned files and writes `src/data/srd/srd521.json` (34 KB: 10 engine monsters, 84 spells of level 0-1, 236 magic items with a fixed rarity). Only the client rules modules import it; no edge file imports `rules/*`.

**Credits.** `src/legal/credits.ts:270-278` adds a 5e-database row with the MIT notice plus the SRD 5.2.1 CC-BY notice. Zod's row (`:205`) gains its MIT notice and the new use.

| Table | Result | Evidence |
|---|---|---|
| Monsters (`src/game/rules/srdMonsters.ts:56-87`) | **Replaced, and beats ours.** | The hand table held 2014 numbers under an SRD 5.2.1 header. Now: Giant Rat DEX 16, Perception 12, +5, 1d4+3 (was 15 / 10 / +4 / 1d4+2); Skeleton AC 14 (was 13); Shadow 27 HP, 5d8+5 (was 16, 3d8+3); Giant Spider poison 2d6 (was 2d8). Goblin Warrior's second 1d4 lands only on Advantage, so the extractor does not make it an unconditional extra. The engine overlay keeps the id, `kind` (2024 makes goblins Fey; the engine treats them as humanoid), the attack used, `match`, the ghoul's Paralyzed rider, the wolf's Prone and the zombie's Undead Fortitude. |
| Spells (`src/game/rules/spells.ts:70-135`) | **Replaced** level, classes and Concentration (they reinforce ours). | All 47 entries matched the data exactly before the cut, so behaviour is the same and the data is now the one source. Effect, dice, saves, heal and upcast stay in code: the JSON has no save abilities or heal dice and no dice for Magic Missile or Chromatic Orb, and cantrip dice are per character level. |
| Magic items (`src/game/rules/magicItems.ts:32-58`) | **Replaced** rarity and attunement for Cloak of Protection, Ring of Protection and Bracers of Defense. | Same values. Potions keep theirs: the SRD data has one "Potions of Healing — Rarity Varies" entry. |
| Weapons and armour (`srdGear.ts`) | **Skipped**: the data is wrong where ours is right. | JSON Spear 5 gp (SRD 1 gp), Sling piercing (bludgeoning), Trident 1d6 (1d8), Hand Crossbow 25 gp (75 gp), Longbow 5 gp (50 gp), and no "Half Plate Armor" under that name. |
| Conditions | **Skipped**: nothing to replace. | The engine has no hand-typed conditions table. |
| factCheck lists (`scripts/factCheck.mjs:39-55`) | **Skipped.** | ITEMS, PEOPLE and FOES are everyday prose nouns ("sword", "thug", "guard"), not rules names. Feeding SRD creature names would turn one-word SRD names (Guard, Knight, Priest) into false foes. |

**Tests.** `ttLibrary2.test.ts`, item 2 group (6 tests):
- the data is CC-BY 2024;
- the 2024 monster numbers;
- conditional extra dice;
- the engine overlay;
- spells from the data;
- magic items from the data, with potions unchanged.

---

## Item 3 — compromise (NLP): skipped

- **Bundle size.** compromise 14.18.0 (MIT) is **343 KB minified**. Even as a test it went only into node-side `scripts/factCheck.mjs`, never the client or edge.
- **Experiment.** I swapped factCheck's capitalised-phrase finder (`scripts/factCheck.mjs:352`) for `nlp(narration).match('#ProperNoun+')`, ran the checker over all 84 runs from 14 Oct, then restored the file.
  - **Before (our regex):** 0 name flags.
  - **After (compromise):** 33 name flags, **all false**. compromise tags common words as proper nouns ("clay cup", "stew", "drew steel", "walker", "moss", "curt nod", "amber", "east side"), and it cut whole names into fragments ("Barrow drew", "Greyhollow Church—", "Jax.'").
  - It caught no invented name that the regex missed.
- **turnCheck.** `src/game/turnCheck.ts` only matches known names (`mentionsName`, `placeNamed`) and finds no new names, so there is nothing for compromise to replace there.
- **Result.** The package was uninstalled; `package.json` and the lock file are unchanged. No credit row is needed.

## Item 4 — repeated-phrase check: skipped

`docs/orders/tt-fix-10.md` item 1 already rebuilt it in our own code. `src/game/turnCheck.ts:582` `fiveGrams` reads overlapping five-word runs of narration only (quoted speech masked) across the last three beats, and keeps a run only when 3 of its 5 words carry content. That is the structural replacement for a stock-phrase list. Adding an allowed list of stock phrases would grow a phrase list, which the standing brief forbids.

---

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | new RegExp | lists (entries) | fns |
|---|---|---|---|---|---|
| Before | 8566 | 865 | 90 | 22 (286) | 1048 |
| After | **8513** | **862** | 90 | **20 (274)** | **1046** |

The only counted file that changed is `src/game/tokenProse.ts`: lines 1375→1322, regex 163→160, lists 5 (30)→3 (18), fns 181→179.

The new `src/game/tokenBeatSchema.ts` is not on ruleCount's file list. To be fair to the totals, here it is on its own:
- 108 lines, 2 regex literals, 2 string lists (12 entries) and 5 functions.
- Its 16-entry use-alias map and `refEnumOf` were moved there from tokenProse, not deleted (cut log items 3 and 7).

Every deletion is in `docs/orders/tt-cut-log.md` under "tt-library-2", which records the restore point.

## Tests and gates

| Gate | Result |
|---|---|
| Vitest | 77 failing (baseline 77). The only name not in the baseline is `playtest30iFogOfWar`, a known flake; `playtest27aRepair1` "S3 talk target" now passes. No new failures. |
| Replay bank | 64 failing (baseline 64, same set). |
| tsc | 552 (limit 552). |
| Build | Green. |
| ruleCount | Down, see above. |
| Fix runs used | 1 of 2 (one zod v4 optional-key fix, one tsc cast fix, both before the full run). |
| New tests | `src/game/ttLibrary2.test.ts`, 15 tests, all passing. The stamp-pinned tests (269) pass on `2026-10-14w`. |

## Ship

| Step | Result |
|---|---|
| Commit | `8ed32b74`, step files only. Not included: `humanJudge.mjs`, any `.tmp` file, and `needs-john.md` (untracked; it holds other jobs' notes, appended locally). |
| Stamp | `2026-10-14v` → `2026-10-14w`. |
| Push | Done. |
| Edge sync | Done (`openRouterChat.ts` changed); `--check` clean. |
| gm-turn deploy | Done; OPTIONS 200. |
| Live | version.json reads `{"hud":"2026-10-14w","build":"2026-10-14w"}`. |
| needs-john | One entry: should hosted Free (Fireworks DeepSeek) get the same strict schema? Recommendation: add a Fireworks key locally so one tiny probe can decide. |

TT_DONE
