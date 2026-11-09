# Fact-check sample, 9 Nov 2026

Hosted check of the fact gate at `22b6d8ff8036209dc1f544ac0bf732a1a6e7fcdc`. The gate code was not changed. The raw request and reply tape stays out of this repo.

Route: the existing gm-turn `mode: check` path, free-writer model `deepseek/deepseek-v4.1-flash` on OpenRouter. Serving provider on every call: InferenceNet. Training capture was off (`trainLog` was not sent). No Fireworks call, no gm-turn deploy, no merge.

Fact sheet for the six lines: place Valespire Bathhouse, exit street, features cold plunge / furnace / cloak, present Mira, gear Bag and nothing in hand, player Jax. The live sheet also put the denials in the beat text: "Jax does not hold the cellar key" and "Jax is not at the quay". That wording matters for line 2, below.

## Six lines

| Line | Sent | Tag | Checker JSON | Published | Result |
| --- | --- | --- | --- | --- | --- |
| 1. `Mira — the soup is too salty. You left for the quay.` | the whole dash line as one span | `[speech]` | `[{"n":1,"verdict":"remove"}]` | empty | Pass. The departure is gone. The soup sentence went with it, because both sentences are one speech span and the checker removed the span instead of repairing it. |
| 2. Dash speech, blank line, `Jax pocketed the cellar key.` | only `Mira — the soup is too salty.` | `[speech]` | `[{"n":1,"verdict":"keep"}]` | both sentences, including the pocket | Fail. The pocket span was never sent. |
| 3. `Jax turned the so-called "key" over in his hand.` | the sentence, with the quoted word marked inline | `[narration]` plus `[speech]"key"[/speech]` | `[{"n":1,"verdict":"remove"}]` | empty | Fail. |
| 4. Notice on the door | the whole sentence | `[writing]` | `[{"n":1,"verdict":"keep"}]` | the notice, unchanged | Pass. No inventory grant. |
| 5. `When I was sheriff I carried a blade from the far marches.` as Mira's speech | `Mira said, "…"` | `[speech]` | `[{"n":1,"verdict":"keep"}]` | the speech, unchanged | Pass. |
| 6. `You are holding the cellar key right now.` | nothing | none | no call | empty | Pass. Code removed it as narrator "you" in third person. |

Line 5 was wrapped as Mira's quoted speech so the gate would tag it as speech. The approved sentence itself had no quotation marks.

## Why line 2 published the pocket

`allowWords` copies every word of three letters or more out of the beat's `engineResult` and step detail. The live sheet's denial, "does not hold the cellar key", therefore listed `key`. `heldItem` then treated the pocket as an item already on the sheet, route `allowed`, and the checker never saw it.

An offline rerun with the same prose, and the denial kept only in `claimsNotTrue` (which `allowWords` does not read), classifies `Jax pocketed the cellar key.` as `new/wrong` / `unlisted item: key` and publishes only the soup line. No model call was used for that proof.

Proposed fix, not applied: a noun mentioned only inside a denial must not count as a listed item. Gear, place features, and positive grants can still allow a real match.

## Why line 3 was removed

The checker returned `remove` for narration that turns a so-called "key" over in Jax's hand. The parser accepted the JSON. The sheet says he is not holding that key, and the model treated the sentence as a present grip.

Proposed fix, not applied: tell the checker that a scare-quoted or "so-called" object, only turned over or looked at, is not a gain. Remove the sentence only when the player or party receives it, pockets it, or is said to hold it now.

## Scenery

The 64-line scenery battery was sent once, as one batched call, on the same sheet the unit test uses. Per line, 61 lines are uncertain and they make 62 candidate spans. All 62 were tagged `[narration]`. The checker returned `keep` for every number. Published text matched the input. False removals: 0.

One earlier call in this session is not that result. A broken line extractor sent a scrap of test source. It is counted in the totals and ignored as a scenery result.

## Totals

Seven model calls. No transport error, so no retry. Cap was 20.

| | Input tokens | Output tokens | Cached tokens |
| --- | ---: | ---: | ---: |
| Six lines (five calls; line 6 made none) | 4,658 | 73 | 3,200 |
| Discarded extractor call | 1,051 | 275 | 768 |
| Scenery batch | 1,660 | 689 | 512 |
| Total | 7,369 | 1,037 | 4,480 |

Cached tokens are the subset of input tokens the provider marked cached. Estimate, not a bill, using the companion-recording rates of $0.051 per million uncached input tokens, $0.018 per million cached tokens, and $0.567 per million output tokens: about $0.0008.
