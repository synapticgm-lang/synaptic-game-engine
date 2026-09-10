# Live play — Valespire war camp rehash (2026-09-10)

Pulled from thumbs + hosted save. Do not implement until John asks for the next update.

| Field | Value |
|---|---|
| Account | little.johnp.jp@gmail.com |
| Save | `f876b00d-33b2-478d-a5c3-a76f9a905ed6` |
| Session | `ad2681eb-c546-46ed-b0dd-ed5b50b3b251` |
| When | 2026-09-10 06:40–06:51 UTC (after 10a git push) |
| Mode / bible | LitRPG · summoned-pact |
| Card | Pellane war camp beyond Valespire walls (seed `1q5m7ck5`) |
| PC | Jax (locked on the second typed line) |
| Turn at save | 3 |
| HUD on save | none (`runManifest` null) |

John’s comments (verbatim):

1. T0: “Feels like it repeats itself re the banner and the handlers over the horns. options offer names places we dont know”
2. After where/why: “This was again re hashing about the scene. Why not responde to what my action was. There should be an interaction response not going over the scene more. Again options are pointless. Offer less options if needed”
3. After name: “This is just repeating the same things over and I gave my name and the response didn't acknowledge that I had given the name. options haven't changed and still crap”

## Transcript

### T0 — New Game stitch (thumbs down `sp0abpjhc`)

No `ai_traffic`. Local page 1.

**Story:** Light, then mud and banner-smoke… Valespire walls… handlers shout over horn-calls… blue panel… Mark already an argument. Then the same camp again: mud, banner-smoke, war-camp circle, horns, handlers. Then a scribe and “What is yours?”

That is **fallback + leftover `beats[]` telegram + name ask**, not the authored `page1` paragraph in `summonedPact.ts`.

**Chips (play compiler, not Give/Refuse):**

- Travel toward Lowmarket
- Travel toward West Wall
- Check Status
- Wait and watch

### T1 — typed (no thumb)

> Question where am I and why should I give you my name

Telemetry: `sendAction` → “Unresolved or empty action narrative — resolution retry” → **`callGm` 6273ms**. Choice pipeline failed.

`applyOpeningAnswer` treats a why-name question as `deferToPlay`. Live then spent a writer call instead of answering.

**Reply:** past-tense replay of the opener (mud, horns, handlers, Mark debate). Ends “A name, if you please.” Does not say where or why.

**Chips:**

- Inspect the panel
- Read the System panel more closely
- Refuse and keep your own counsel
- Travel toward Lowmarket

`recentChoices` also held: Clear a physical path forward, Travel toward West Wall (pad-to-4 hid two).

### T2 — typed (thumbs down `o6t4b2zxn`)

> My name is Jax what your and what do you want

Telemetry: **`callOpeningGm` 4657ms**. Ledger locked `answers.name = Jax` and `complete: true`. Prose still asked “What is your name?” and quoted the **previous** line as if he had not given it.

**Chips (unchanged family):**

- Inspect the panel
- Travel toward Lowmarket
- Travel toward West Wall
- Check Status

Save `choices` after that: only `🎲 Let Fate Decide`.

## Writer / camera slip

Both hosted calls labeled provider OpenAI (Free DeepSeek via OpenRouter). Snapshot gist both times:

- HERE: Pellane war camp beyond Valespire walls (outdoor)
- lastBeat: “people are present; people are shouting; System panel is visible; **indoors**”
- presence: bystanders · crowd ~4

`completedEvent` froze on the first typed line and never absorbed “Jax”.

Circle’s Price was already `revealed: true` / active during the name cover.

## Owners (source, not sentence patches)

| Class | What failed | Owner |
|---|---|---|
| H / B | Cover-continue still called `callGm` then `callOpeningGm`. Repo 09c/10a `useGame` does not await `callOpeningGm`. Live JS did. | Client deploy / force-latest — synapticgm.com may still be pre-10a. Confirm HUD `2026-09-10a`. |
| B | Page 1 used `pickedHookFallback` + `beats[]` instead of one `page1`. `baseSceneFromCard` prefers fallback over `page1`. | `openingStitch.baseSceneFromCard` + war-camp card |
| B | Why-name / where is `deferToPlay` → writer rehash. Give-name did not change the ask. | `applyOpeningAnswer` + `stitchOpeningContinue` must stay local and answer the line |
| B | Name-cover chips were hub travel / Status / Wait | `resolveOfferedChoices` + `isOpeningEstablishmentPending` (empty pending → compiler). Never pad unknown hubs on cover. |
| B | Pad-to-count forces ≥3/4 every turn | `padChoicesToCount` — 1–2 legal chips is enough |
| D | Outdoor camp stamped `indoors` in lastBeat | `sceneFacts` / snapshot gist |

Do not paste Gemini rewrites. Do not re-enable flavor every turn.
