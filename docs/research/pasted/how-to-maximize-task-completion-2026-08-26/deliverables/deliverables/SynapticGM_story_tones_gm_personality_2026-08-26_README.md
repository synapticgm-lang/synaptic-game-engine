# SynapticGM Story Tones × GM Personality × Theme and Image Pairing

**Author:** Manus AI  
**Build date:** 2026-08-26  
**Scope:** Live SynapticGM consumer app only.

## What this bundle contains

This omnibus defines nineteen tone records, maps each tone to the shipped GM/System personality IDs and existing rendering levers, pairs tones with all twenty-two existing theme-kit keys, provides append-only image-prompt deltas, and supplies deterministic implementation banks and regression fixtures. It does **not** introduce a parallel personality engine, second LLM critic, theme-derived authority, or every-turn comic mode.

> **Non-negotiable authority order:** player correction → pinned canon → StateTx → SceneManifest → evidence → invention. Tone starts only after the permitted result exists.

## Cursor import order

| Order | File | Purpose |
|---:|---|---|
| 1 | `SynapticGM_story_tones_gm_personality_2026-08-26_README.md` | Scope, evidence labels, and navigation. |
| 2 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_contract_reference.ts` | Reference types, render firewall, and art-gate order. |
| 3 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_catalogue.csv` | Canonical tone definitions and shipped-overlap map. |
| 4 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_to_gm_rails.csv` | Existing-lever configuration. |
| 5 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_fluid_rail_snippets.md` | Copy-paste additive rails. |
| 6 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_choice_pad_banks.json` | Mode-DNA label patterns. |
| 7 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_status_chrome_templates.json` | Ledger-honest status/why/repair copy. |
| 8 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_never_lines.csv` and `SynapticGM_story_tones_gm_personality_2026-08-26_tone_prose_warden_rules.json` | Deterministic prohibitions and validators. |
| 9 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_eval_fixtures.json` and schema | Authority-equivalence corpus. |
| 10 | `SynapticGM_story_tones_gm_personality_2026-08-26_vitest_tone_contract_template.ts` | Adapter scaffold for the live renderer. |
| 11 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_theme_image_matrix.csv` | Cosmetic kit suggestions and image deltas. |
| 12 | `SynapticGM_story_tones_gm_personality_2026-08-26_Part_T3_themes_images.md` | False friends, prompt assembly, and cost gates. |
| 13 | `SynapticGM_story_tones_gm_personality_2026-08-26_tone_blind_taste_protocol.md` | UX validation after deterministic checks. |
| 14 | `SynapticGM_story_tones_gm_personality_2026-08-26_p0_p1_p2_implementation_board.md` | Sequenced delivery backlog. |
| 15 | `SynapticGM_story_tones_gm_personality_2026-08-26_unknowns_and_evidence_gaps.md` | Missing inputs and safe defaults. |

## Evidence labels

| Label | Meaning |
|---|---|
| VERIFIED | Checked against a public source or live public endpoint. |
| PROVIDED SUMMARY | Stated in the attached master brief but underlying source file absent. |
| SPECULATIVE | Product recommendation requiring test or integration validation. |
| INPUT REQUIRED | A named attachment or live schema is missing. |
| COUNSEL | Legal, commercial, age, or rights review is required. |
| UNKNOWN | Evidence was not available and no safe inference was made. |

## Pack map

The narrative explanation is split into `Part_T1_tone_catalogue.md`, `Part_T2_GM_application.md`, `Part_T3_themes_images.md`, `Part_T4_implementation_banks.md`, `Part_T5_implementation_plan.md`, and `Part_T6_scorecard_founder_decisions.md`. The one-page founder view is `executive_scorecard.md`. Machine-readable assets use CSV or JSON and are summarized in `manifest.json` after validation.

## Critical limitations

Only `pasted_content.txt` was attached. The named MEGA, Comic Maximizer, Premium Themes, and Prior Vibe files were not present. This bundle therefore does not claim to quote or fully ingest them. Template 01–20 assignments, exact master suffixes, prior score thresholds, internal model aliases, and internal COGS remain blocked. See the unknowns register.

## Public-source method

The bundle uses NN/g for tone dimensions and testing, W3C and Digital.gov for plain-language/accessibility, Vitest for parameterized and snapshot-test mechanisms, the U.S. Copyright Office and Project Gutenberg for rights caveats, and OpenRouter documentation plus live endpoint discovery for current image API facts.[1] [6] [7] [10] [14]

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
[7]: https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/ "Use Clear and Understandable Content — W3C WAI"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[14]: https://www.copyright.gov/help/faq/faq-duration.html "How Long Does Copyright Protection Last? — U.S. Copyright Office"
