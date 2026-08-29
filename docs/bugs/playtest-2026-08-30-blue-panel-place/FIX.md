# Playtest 2026-08-30 — blue panel / Place (Class D + Class B)

## Symptom

Josie (Summoned Pact, stamp `2026-08-30l`, save `22a4f976-fc6f-467c-9af7-6927eaefd5d5`) at T5:

> the blue panel, Place, remains at the threshold, his posture tense.

Options later included **Call out to Place** / **Ask Place what this room is** (raw GM) and **Examine the blue panel**.

Dumps: `docs/bugs/playtest-2026-08-30-josie/` (play transcript + debug pack). Screenshot in this folder.

## Why it slipped (not a missing phrase)

Two hops, both site-wide:

1. **Cover slot harvested as a person.** Hook cards write `Place: ${location}` into `pickedHook`. `extractNamesFromHookText` Title-Case harvests **Place** (not on the stop list). `ensureOpeningNpcPinned` puts it on `sceneFacts.present`. SNAPSHOT Presence then tells the writer Place is here. Raw GM: *“The official, Place, remains at the threshold, his posture tense.”* Choices: *Ask Place* / *Call out to Place*.
2. **Official → panel used chrome as the person slot.** `seedOpeningSceneFacts` / `extractSceneFacts` also put **blue panel** on `present[]`. `personSlotFromScene` took `present[0]` = blue panel. `scrubOfficialPlaceholder` rewrote *the official* → *the blue panel*. Committed prose: *“the blue panel, Place, … his posture tense.”* Same hop turned *you push it open* into *you push the blue panel*.

21b only scrubbed *the speaker* furniture. 24e only scrubbed location-as-speaker verbs. Map pin deny already blocked Eye Level / Registration as *places*, not as NPC names. Crowd 30X treated blue panel as a non-count token but still left it on `present[]` for SNAPSHOT / art / harvest.

## Site-wide rule

`src/game/chromeAuthority.ts` is the single owner: **UI chrome and opening cover slots are not people.** All modes, opening + later turns, client + fate-autoplay + edge (`chromeAuthority` synced; named `scrubChromeAsPerson` on both wardens).

- **Never harvest or pin as NPCs:** blue panel, panel, System, Registration, official (bare UI slot), Eye Level, Your Palm, cover labels (Place, Name, Look, Kit, …).
- **`present[]`:** `filterChromeFromPresent` on extract / merge / seed / crowd harvest / load repair. Panel stays a **prop**.
- **Warden:** `scrubChromeAsPerson` rewrites `[ui chrome], [slot name],` + posture/voice/he/she to a real present person, or drops the clause. Also *push the blue panel* when the beat is a door, and *the blue panel men*.
- **Speaker tags (31b):** `rewriteChromeSpeakerTags` — chrome may hum/hang; it must never `states` / `says` / `asks` / `their voice` or `has need` / wants. Reattribute to a named present person, or the role “the handler” when handlers are in the beat, or drop the tag and keep the quoted line. Never use the aggregate token `handlers` as the speaker name.
- **Pads:** `isChromeTalkChoice` drops talk/ask/call-out-to Place (inspect/scan the panel stays).
- **SNAPSHOT:** `COVER CHROME (BINDING)` — panel may hum; never speak or want. Manifest / locality / hook labels say `Location:` not `Place:`.
- **Art lock:** chrome tokens never go into `PRESENCE:`.
- **Old saves:** Error Repair Warden rev 4 strips chrome from `present[]`, opening pins, and harvest NPC rows.

## Residual

A writer can still *say* “blue panel” as a hanging UI (hum, glow, hang — that is correct). Inspect/scan-the-panel pads stay. A real NPC who is actually named Place would be blocked (cover-slot lock wins). Opening GM can still invent a dummy name before the first harvest; after commit the lock and warden hold. Aggregate “handlers … steps / Their face” grammar is not rewritten here.

## Stamp

HUD `2026-08-31b` / BUILD `2026-08-30u`. Mid writer OFF. Vitest `playtest30yChromePerson`. Redeploy: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn` (SNAPSHOT binding + edge warden).
