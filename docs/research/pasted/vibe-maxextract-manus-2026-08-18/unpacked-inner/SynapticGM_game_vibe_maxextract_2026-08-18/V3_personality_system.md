# V3 — Shippable Story Personality: Narrator and System Voice

## Architecture: truth first, voice second

Personality is a **rendering contract**, not a game-state policy. The pipeline is:

```text
Authority resolver → permitted outcome + StateTx + evidence labels
→ SceneManifest compiler → semantic response skeleton
→ narrator/system renderer → presentation and accessibility layer
```

Every response segment carries: `speaker_class`, `authority_tier`, `state_tx_ids`, `evidence_status`, `invention_flag`, `style_profile_id`, and `render_equivalence_hash`. A test must prove that switching profiles preserves intent, facts, game math, permits, inventory, quest status, and causal ordering. Persona and factual consistency need independent testing: plausible speech can still contradict established facts. [1]

## Matrix

The narrator axis changes literary delivery; the System/chrome axis changes UI notices. Neither changes truth.

| Preset | Narrator axis | System/chrome axis | May change | Must never change |
|---|---|---|---|---|
| **Cold Registrar** | Sparse, observational, precise. | Formal record, terse deltas. | Sentence length, metaphor scarcity, notice form. | Facts, difficulty, state deltas. |
| **Sarcastic Patch** | Dry, self-aware, never mocking the player. | Wry diagnostics; low-volume humor. | Asides and cadence. | Error meaning, safety language, correction outcome. |
| **Army Brief** | Concrete verbs, operational pacing. | Clear status blocks and objectives. | Tactical framing, brevity. | Combat math, hidden information. |
| **Chilled GM** | Conversational, welcoming, scene-sensitive. | Friendly, short guidance. | Warmth, optional flavor. | Canon, permits, active action interruption rule. |
| **Dry Wit** | Understated humor, emotional restraint. | Deadpan but readable notices. | Figurative phrasing and tempo. | Tone on safety/error notices, factual labels. |
| **Warm Chronicle** | Reflective, character-aware, earned callbacks. | Gentle milestone notices. | Sentiment, sensory framing. | Player emotion attribution without cue; state truth. |
| **Clinical Auditor** | Neutral, clear, causally explicit. | Evidence-first receipts. | Detail density and vocabulary. | Becoming a substitute judge or changing outcome. |
| **Jester** | Playful misdirection only in fictional flavor. | Bright but optional chrome. | Rhythm and harmless comic contrast. | Humiliation, ambiguity in consequential information. |
| **Velvet Oracle** | Measured, portentous, concise. | Symbolic but labelled notices. | Imagery and foreshadowing. | Presenting invention as prediction or evidence. |
| **Street Balladeer** | Kinetic, colloquial, character-facing. | Punchy status cues. | Slang band and pulse. | Accessibility, safety clarity, facts. |
| **Ashen Archivist** | Somber, historiographic, restrained. | Timestamped records. | Retrospective texture. | New history, false permanence, dead-character changes. |
| **Bright Field Guide** | Curious, practical, optimistic. | Helpful but not intrusive. | Explanatory framing at safe beats. | Mid-action soft offers or unearned certainty. |

Tone works better as bounded dimensions—formal/casual, serious/funny, respectful/irreverent, matter-of-fact/enthusiastic—than as an unconstrained roleplay instruction. [2] The UI voice must remain concise, direct, and consistent, while narrative voice has broader expressive license. [3]

## New Game picker

| Layer | Simple setup | Expert setup | Persistence |
|---|---|---|---|
| Narrator | Four picks: **Plain**, **Dramatic**, **Warm**, **Tense**. | Full narrator preset plus intensity slider. | Campaign-level default; scene override only at safe break. |
| System chrome | Four picks: **Clear**, **Wry**, **Tactical**, **Diegetic**. | All matrix options and receipt density. | Campaign-level; accessibility can override. |
| Surprise me | Chooses an allowed pair from CampaignContract/theme. | Shows selected pair after first scene; easy change. | Locks for opener, then player may change. |
| Themes / TTS | Separate visual/audio cosmetic cards. | Individual font, cue, speech, and ambience controls. | Never coupled to narrator semantics. |

**No profile selector accepts an imitation request tied to a protected franchise or character.** The UI expresses original traits, not licensed names.

## Opening hook deck logic

`HookArc` chooses an original opener family before writing: **System Arrival**, **Debt Under Glass**, **Signal in the Fog**, **Borrowed Oath**, **Under-City Audit**, or **The Door That Knows You**. The CampaignContract supplies genre, constraints, content bounds, and stakes. Personality changes the **camera**, not the deck’s facts:

| Opener family | Cold Registrar | Chilled GM | Ashen Archivist |
|---|---|---|---|
| System Arrival | A verified anomaly report. | A startling rule with a human anchor. | An entry in a history that begins to revise itself. |
| Debt Under Glass | Terms, collateral, and deadline. | A difficult favor with a readable choice. | An old promise come due. |
| Signal in the Fog | Coordinates and an unconfirmed source. | A strange call that asks for courage. | A remembered voice where none should be. |

## Eval protocol

**Blind taste test.** Randomize 2–3 profile renderings of the same ledger-resolved scene. Ask participants what happened, what changed, what they expect next, what voice fits, and which version they would continue. Score appeal separately from factual recall and accessibility.

**Continuity regression.** Run every canonical fixture through all profile pairs. Compare `render_equivalence_hash`, entity/property assertions, numeric outcome, evidence labels, and permitted action set. A stylistic success never offsets a semantic failure. Include adversarial fixtures: a dramatic failure, uncertain evidence, a player correction, a sensitive Kid Mode prompt, and a refusal during combat.

**SPECULATIVE:** Preset names and the exact four simple picks are implementation hypotheses. Test comprehension, not only preference.  
**COUNSEL:** Tone boundaries for mature content and real-world targeting must be scoped before exposing customization.

## References

[1]: https://aclanthology.org/2021.eacl-main.44/ "Improving Factual Consistency Between a Response and Persona Facts"
[2]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "NN/g — The Four Dimensions of Tone of Voice"
[3]: https://m3.material.io/foundations/content-design/style-guide/word-choice "Material Design 3 — Word Choice"
[4]: https://aclanthology.org/2025.sigdial-1.31/ "Beyond Simple Personas"
