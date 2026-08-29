# Playtest 2026-08-30 — hook why flip (Class D / opening contract)

## Symptom

Josie session contradicted its own summon-why.

**First committed why** (dump `docs/bugs/playtest-2026-08-30-josie/`, Turn 2 / “Ask what is going on”):

> "The ritual... it has gone awry," they stammer, their voice raspy. "The Sevenfold Circle is supposed to be a place of sanctuary, a nexus point... but the bombardment... it has fractured the veil. You have been pulled through from... elsewhere. And so have others."

The dump transcript ends at turn 6 and never writes an explicit “wrong hero instead of the intended.” The first lockable why on the tape is **rite gone awry / pulled through** (accident class).

**Later reversal** (screenshot of a later beat — not in the turn-6 dump):

> "You were **bought** here," he states flatly, his voice rough, "as a **piece**. A **pawn for Pellane's game against the court**."

Same save family, no player or ledger event that sold her as a pawn.

## Why it slipped

29e WORLD MAP AUTHORITY locks geography. 30d `sealedManifest` / `validateProseAgainstManifest` catch enemy resurrection and quest reverse. Neither owns **why you are here**.

`openingHooks` cards carry `summonIntent`, and `normalizeOpeningHookCard` stuffs it into `pickedHook` as “Why this happened: …”. That string is a writer pointer. Nothing classified it, nothing persisted a nature, nothing bound SNAPSHOT, nothing wardened a flip.

ArcDirector commits quest stages and drought beats — not summon-why. Harvest wrote NPCs and crowd, not hook nature.

## Site-wide rule

`src/game/hookLock.ts` is the single why-owner for **all modes**, opening + later turns, client `useGame`, fate-autoplay, and edge (synced `hookLock` → `situationPacket` / `bindingConstraints` / `sceneFacts` / `narrativeHarvest`).

- **Natures:** accident / intended / bargain / pawn. First committed claim wins (hook card `summonIntent` if classifiable, else first GM harvest).
- **Persist:** `sceneFacts.hookLock` (live) + `openingEstablishment.hookLock` (seed). Continue backfills from picked hook + GM log (`applyErrorRepairs` rev 5).
- **SNAPSHOT:** `HOOK WHY (BINDING):` one locked line. Later prose cannot reverse it unless the **player** asserts a new why or a ledger `reviseHookLock` fires.
- **Warden:** `scrubHookReversals` — accident lock rewrites pawn/piece/bought-as-intended claims; pawn lock rewrites “wrong person by accident.” Optional: `bought here` → `brought here`.
- **Manifest:** required fact + forbidden reversal; `validateProseAgainstManifest` flags the clash. Default: NPCs do not silently rewrite canon. A modeled lie would need an explicit ledger flag (not shipped).

Not a Pellane/Summoned Pact special case.

## Residual

Opening GM can still invent a why **before** harvest on page 1 if the hook card did not classify. After that beat commits, later turns cannot flip accident ↔ pawn without a player or ledger revise. NPCs can still *claim* a lie only if we later model lies; default is they don’t.

## Stamp

HUD `2026-08-31a` / BUILD `2026-08-30t` for this feature (parallel chrome work may already show HUD `2026-08-31b` / BUILD `2026-08-30u`). Mid writer OFF. Vitest `playtest31aHookLock`.
