# Part T4 — Implementation Banks and File Contracts

**Author:** Manus AI

| Required bank | Format | Cardinality | Primary consumer | Validation |
|---|---|---:|---|---|
| `tone_catalogue.csv` | CSV | 19 tone rows | Expert picker, documentation | Required T1 fields non-empty; exact IDs; Kid delta. |
| `tone_to_gm_rails.csv` | CSV | 19 tone rows | Renderer configuration | Existing lever names only; shipped primary IDs. |
| `tone_theme_image_matrix.csv` | CSV | 19 tone rows | Theme suggestion and prompt builder | All 22 kits covered; negative prompt; Kid rewrite. |
| `tone_fluid_rail_snippets.md` | Markdown | 19 blocks | Prompt assembly | Firewall header on every tone. |
| `tone_choice_pad_banks.json` | JSON | 19 × 4 × 10 patterns | `choiceTierRules` presentation | Bound placeholders; no promised success. |
| `tone_status_chrome_templates.json` | JSON | 19 × 6 templates | Status/why/repair renderer | Exact source values; humor disabled in critical contexts. |
| `tone_never_lines.csv` | CSV | 14 rules per tone | Deterministic warden and QA | Allowed YES/NO and Kid flag present. |
| `tone_eval_fixtures.json` | JSON | 24 fixtures × 3 renders | Vitest and review harness | Same canonical hash across tones. |
| `tone_blind_taste_protocol.md` | Markdown | One protocol | UX research | Deterministic preflight precedes preference. |
| `p0_p1_p2_implementation_board.md` | Markdown | One board | Product/engineering | Dependencies and acceptance criteria. |
| `unknowns_and_evidence_gaps.md` | Markdown | One register | Founder/research | Missing sources and safe default. |

## Import behavior

CSV and JSON files use UTF-8 and stable snake-case identifiers. Pipe-separated values inside CSV cells are arrays for import convenience; normalize them to arrays in the application layer. JSON banks include a `schema_version`. Placeholder values in choice and status templates are declarative and must bind only to pre-authorized values. Unknown placeholders cause the choice or message to be suppressed, not guessed.

## Source priority

The task brief is the only attached source. Its product-law statements are treated as binding **PROVIDED SUMMARY**. Public sources verify tone dimensions, plain-language principles, regression-test mechanisms, error-copy principles, public-domain caveats, and current OpenRouter image endpoints. Missing internal files remain **INPUT REQUIRED**.
