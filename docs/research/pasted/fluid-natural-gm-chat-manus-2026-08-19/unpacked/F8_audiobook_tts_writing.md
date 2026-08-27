# F8 — Audiobook- and TTS-informed writing

## Silent first, speakable always

SynapticGM should be written so the screen text remains complete and satisfying without sound. A future Hear button may change delivery, but it must never become the sole carrier of a rule, receipt, secret, prompt, or safety boundary. This is both a continuity requirement and an accessibility baseline.

| Writing issue | Screen-first rule | Future audio rule |
|---|---|---|
| Facts | State the fact in prose or a visible receipt. | Read the same fact or offer an accessible transcript link. |
| Checks | Keep the narrative sentence separate from the numeric receipt. | Optionally announce the result after a short pause. |
| Multi-NPC dialogue | Attribute when identity could be ambiguous. | Use light voice differentiation; do not rely on it for identity. |
| Long action | Break at beat shifts. | Permit per-paragraph playback, speed, and replay. |
| System text | Keep it after the story body by default. | Use a clearly distinct but non-disruptive voice/color. |
| Interrupt / cancel | Preserve text and reading position. | Stop playback without deleting the visual turn. |

## Sentence and punctuation constraints

A line intended to sound human benefits from a primary clause, a concrete verb, and a breathable end. Prefer “The latch gives under your thumb. Cold air reaches up from below.” over “The latch—despite its apparently rusted and arguably ceremonial-looking status—gives under your thumb, thereby revealing…” Do not ban complexity; reserve longer sentences for contemplation, aftermath, or a controlled reveal.

| Pattern | Preferred band | Warden check |
|---|---|---|
| Action / danger | 5–18 words per sentence; 1–3 sentence paragraphs | No more than one dependent clause per sentence. |
| Dialogue exchange | 1–2 spoken sentences per character before response | Attribution required when speaker identity is not obvious. |
| Reflection | 12–26 words; one image | Must not assert player emotion. |
| Rule answer | Answer in the first sentence; explanation in second | Avoid roleplay garnish before the answer. |
| System notice | 4–18 words; standalone | No prose sentence may contain raw state payload. |
| Set-piece | 2–5 paragraphs, each with one sensory or causally relevant job | Sensory nouns ≤3 per paragraph by default. |

## Transferable narration practices

Narration rewards predictable control points: chapters, paragraph endings, speaker clarity, and a stable re-entry position. In interactive chat, the analogues are **beat boundaries**, **clear speaker attribution**, **receipt placement after prose**, and **return-from-save openings that reactivate an immediate pressure rather than replay a recap**. The oral-performance literature treats performance context as material to reception; that supports treating audio as a distinct delivery layer, not a replacement for written state. [R23] [R24]

## What public TTS and audiobook evidence supports

The SSML standard exposes voice, pronunciation, emphasis, break, prosody, rate, pitch, volume, paragraph, and sentence controls; Google and Microsoft documentation expose related interpretation, pause, and multi-voice mechanisms. [R28] [R29] [R30] This supports an **inspectable speech-rendering layer** over canonical written text, rather than mutilating prose to force a performance. The exact SynapticGM schema is speculative, but it should carry `visibleText`, `spokenText`, `speakerId`, optional pronunciation aliases, delivery hints, and stable event IDs.

A 2023 study of aligned book/audiobook pairs found that human audiobook delivery varies prosody across narration and dialogue. Its SSML-enhancement preference test was inconclusive, so no claim that synthetic narration is human-equivalent is warranted. [R31] The transferable recommendation is to keep sentence and turn boundaries explicit, run listening tests, and distinguish narrator delivery from character turns without stereotyping character identity through pitch or gender.

Public audiobook-production guidance treats one chapter/section per file and stable section headers as navigation aids, while also emphasizing clean boundaries and consistent pronunciation/spacing. [R32] [R33] SynapticGM should therefore use named **scene anchors** with replayable text/audio spans and transcript jumps. Those are product transfers, not ACX requirements for an interactive game.

| Public mechanism | SynapticGM transfer | Do not infer |
|---|---|---|
| SSML sentence/paragraph, break, voice, and pronunciation controls. [R28] [R30] | Maintain a speech IR that preserves visible text and attaches spoken aliases/prosody hints. | That rich tags automatically sound natural. |
| Multi-voice and dialogue controls. [R29] | Address each completed dialogue turn as an audio segment. | That character identity should depend on vocal stereotype. |
| Audiobook prosody varies by phrase and dialogue/narration role. [R31] | Listen-test line segmentation and controlled emphasis. | That TTS is preferred to human performance or vice versa. |
| Chapter-level navigation and clean audio boundaries. [R32] [R33] | Scene anchors, resume points, minimal-span re-rendering. | That long RPG sessions should become monolithic audiobook files. |

## TTS pilot specification (future)

| Requirement | Acceptance criterion |
|---|---|
| Text parity | All speechable words are visible on screen; all visible material facts are speakable or explicitly excluded as UI-only metadata. |
| No audio-only fact | A player who never presses Hear can make the same informed decision. |
| Segment model | One audio segment per completed paragraph / System notice / receipt; never auto-play beyond user settings. |
| Controls | Play, pause, resume, stop, speed 0.8×–1.5×, replay paragraph, mute. |
| Speaker model | Named speaker labels available to assistive technology; audio voice distinction optional. |
| State timing | No state receipt announces before its visual `StateTx` commit. |
| Error handling | TTS failure leaves complete on-screen prose and shows a compact retry. |
| Kid Mode | Default audio off or explicitly opted in; no intense effects, sudden volume, or persuasive prompts. |

## Anti-patterns

Do not put a stat table in the middle of a spoken sentence, nest asides inside em-dash stacks, use unpronounceable identifier strings, bury “failure costs 2 strain” in atmosphere, or narrate five unnamed people in one paragraph. Do not rely on sound effects for danger telegraphing. Do not make an unfinished streamed sentence audible.

## References

The speakability rules and TTS specification are **SPECULATIVE SynapticGM design**. They draw on public oral-performance context research, public SSML / TTS interfaces, audiobook prosody research, audiobook production guidance, and conversation guidance favoring clarity and relevance. [R01] [R23] [R24] [R25] [R28] [R29] [R30] [R31] [R32] [R33]
