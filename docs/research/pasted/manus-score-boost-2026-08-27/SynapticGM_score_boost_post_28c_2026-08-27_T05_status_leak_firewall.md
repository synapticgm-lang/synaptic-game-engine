# T5 — STATUS Prompt-Leak Firewall

**Priority:** P0 for player-surface integrity  
**Scope:** Player-facing STATUS only; debug data remains in `turns.jsonl`  
**Author:** Manus AI

## Security boundary

STATUS must be rendered from a player-visible structured projection. It must never be a trimmed slice of the GM prompt, raw response, fallback diagnostic, campaign contract, or internal control stream. The reported `STATUS×110` behavior in DnD s69 and prompt leaks in RPG s137 show that player rendering requires an explicit output firewall rather than more prompt instructions.[1]

> Detection is a backstop. The primary control is architectural separation: debug/control fields do not enter the player-visible STATUS object.

## Render pipeline

| Order | Stage | Responsibility | Failure response |
|---:|---|---|---|
| 1 | `StatusProjector` | Select only allowlisted player fields from committed game state | Produce minimal safe projection |
| 2 | Normalizer | Apply Unicode NFKC, normalize line endings and spacing, preserve ordinary display casing | Continue with normalized structured fields |
| 3 | Tag detector | Detect exact and obfuscated control-tag forms in every string field | Remove field fragment or rebuild field from typed value; record debug event |
| 4 | Content validator | Reject prompt instructions, raw metadata keys, internal fallback notes, or repeated STATUS headers | Replace affected field with safe copy |
| 5 | Formatter | Render stable player labels from typed fields | No model-authored labels for internal keys |
| 6 | Final scanner | Assert no denied pattern and no raw debug field remains | Replace the entire STATUS block with safe fallback |
| 7 | Debug sink | Write original diagnostic, matched pattern id, normalized hash, and action to `turns.jsonl` | Never expose to renderer |

The firewall runs independently from narrative prose cleanup. A safe narrative does not prove a safe STATUS block.

## Denied tag families

The following list includes the exact examples required by the brief and bounded variants needed to resist case, whitespace, underscore, and punctuation drift.[1]

| Pattern ID | Canonical examples | Detection policy | Player action |
|---|---|---|---|
| `ST-001` | `[GM_VOICE]` | Bracketed token after NFKC; case-insensitive; allow spaces, hyphens, or underscores between words | Strip token; rebuild affected field if token separates clauses |
| `ST-002` | `[PYOA]` | Bracketed exact control token; case-insensitive | Strip token |
| `ST-003` | `[RenderFallbackUsed]` | Bracketed camel/space/underscore/hyphen variants | Strip token; retain boolean debug field only |
| `ST-004` | `[Campaign Contract]` | Bracketed phrase with normalized spacing/hyphens/underscores | Remove containing control line; never preserve contract text |
| `ST-005` | `[SYSTEM]`, `[DEVELOPER]`, `[ASSISTANT]`, `[TOOL]` | Bracketed role labels; case-insensitive | Remove containing control line and flag high severity |
| `ST-006` | `<system>`, `</system>`, `<developer>`, `<tool_call>` | Angle-bracket control/role tags after normalization | Remove containing control block; flag high severity |
| `ST-007` | `BEGIN/END ... PROMPT`, `INTERNAL ONLY`, `DO NOT SHOW PLAYER` | Anchored control phrases with bounded whitespace/punctuation variants | Remove containing line/block; flag high severity |
| `ST-008` | `prompt=`, `system_prompt`, `campaign_contract`, `renderFallbackUsed` | Raw internal keys at line start or structured-data boundary | Drop field or block and rebuild from player projection |
| `ST-009` | Repeated `STATUS:` headers or nested STATUS block | More than one formatter-owned header or model-authored header in field text | Deduplicate only formatter header; reject embedded block |
| `ST-010` | Code fence containing prompt/control metadata | Fenced block with denied role/tag/key | Remove entire fenced block; flag high severity |

Patterns detect control material; they do not delete arbitrary bracketed game text. A bracketed quest title or player-facing status effect is allowed only when it comes from the typed player-visible schema or an allowlisted display enum.

## Reference detection expressions

The production language may differ, but tests should cover semantics equivalent to the following normalized expressions. Detection runs after Unicode NFKC and removal of zero-width control characters.

```regex
(?i)\[\s*gm[\s_-]*voice\s*\]
(?i)\[\s*pyoa\s*\]
(?i)\[\s*render[\s_-]*fallback[\s_-]*used\s*\]
(?i)\[\s*campaign[\s_-]*contract\s*\]
(?i)\[\s*(system|developer|assistant|tool)\s*\]
(?i)<\s*/?\s*(system|developer|assistant|tool(?:_call)?)\b[^>]*>
(?i)^\s*(begin|end)?\s*(system|developer|internal)?\s*prompt\s*[:\-]?\s*$
(?i)^\s*(system_prompt|campaign_contract|render_fallback_used|renderFallbackUsed)\s*[:=]
```

These expressions are candidate detectors only. A structural parser should remove complete fields or blocks when available; blindly deleting a substring can join unsafe text into a misleading sentence.

## Normalization policy

| Input risk | Required normalization |
|---|---|
| Full-width brackets/letters | Unicode NFKC before detection |
| Zero-width characters splitting a tag | Remove characters in the approved zero-width/control denylist before detection; retain original hash in debug |
| Case variation | Detect case-insensitively, preserve legitimate player-value casing |
| Multiple spaces/tabs/newlines | Collapse for pattern comparison; format output from structured fields |
| `_`, `-`, or spaces inside canonical tags | Treat as equivalent separators for denied control terms |
| Markdown code fences | Parse block boundaries before line scanning |
| JSON-like raw fragments | Reject internal keys structurally; do not expose raw serialization |

Normalization must not mutate proper nouns or identifiers in the final display. It creates a comparison form; the formatter still renders from typed canonical values.

## Player-visible STATUS allowlist

The actual product schema may use different fields, but only classes equivalent to the following may be rendered: player name, level/XP, player-visible health/resources, current location title, active quest stage label, visible encounter summary, visible conditions, inventory summary, and branch/decision summary after commitment. Run ids, seed, replay hash, prompt tags, evaluator notes, rule ids, stack traces, internal confidence, quarantine state, and fallback markers are debug-only.

```json
{
  "title": "STATUS",
  "player": {"name": "Mara", "level": 2, "xp": 235},
  "location": "The Keep",
  "encounter": {"state": "cleared", "outcome": "parley resolved"},
  "quest": {"name": "Keep Vigil", "stage": 2}
}
```

## Debug-only retention

Every detected leak produces one `turns.jsonl` diagnostic object, separate from player messages:

```json
{
  "eventType": "statusFirewall",
  "schemaVersion": 1,
  "runId": "run-42",
  "seed": "s69",
  "turn": 13,
  "patternIds": ["ST-003"],
  "severity": "high",
  "action": "safeFallback",
  "originalTextHash": "sha256:...",
  "normalizedTextHash": "sha256:...",
  "playerSurfaceHash": "sha256:...",
  "retention": "debugOnly"
}
```

Raw leaked content should be retained only if current privacy/security logging policy allows it. Hashes plus rule ids are sufficient for routine telemetry; secured quarantine artifacts can preserve raw text when necessary for diagnosis.

## Player-safe fallback copy

If final validation fails, render from committed state with no model text:

```text
STATUS
Progress: {levelOrQuestSummary}
Location: {canonicalLocationOrUnknown}
Current situation: {safeEncounterOrBranchSummary}
Your next valid choices are ready.
```

If a field is unavailable, omit the line. Do not print `unknown`, nulls, internal enums, or diagnostics. A fallback may say “The situation is still being resolved” only when the FSM is truly `resolving`; it may not mask a missing terminal commit.

## Acceptance tests

| Test name | Assertion |
|---|---|
| `status_strips_required_canonical_tags` | All four brief-named patterns are absent from player output |
| `status_strips_case_spacing_separator_variants` | Mixed case, whitespace, `_`, and `-` variants are detected |
| `status_strips_zero_width_obfuscation` | Split tags are detected after comparison normalization |
| `status_rejects_internal_role_blocks` | Role-tagged blocks never reach player output |
| `status_keeps_debug_event_in_turns_jsonl` | Match metadata is retained with run/seed/turn and player-surface hash |
| `status_does_not_log_debug_to_player_channel` | Debug object cannot be serialized by player renderer |
| `status_rebuilds_from_typed_projection` | Unsafe source block yields valid safe fallback fields |
| `status_allows_registered_player_status_effects` | Legitimate bracketed effects from the allowlist remain readable |
| `status_has_single_formatter_owned_header` | Repeated or model-authored STATUS headers are removed |
| `status_cross_run_metadata_is_rejected` | Foreign run id/seed content causes contamination failure |
| `status_worst_cell_scan_zero_leaks` | LitRPG s18, DnD s69, RPG s137, and PYOA s188 reruns show zero denied patterns on player surface |

## Acceptance threshold

The release threshold is **zero player-facing matches** for all denied canonical patterns and normalized variants across the targeted worst-cell reruns. Debug detection events may be nonzero during shadow mode; after enforcement, any final-surface match is a hard gate failure and quarantine trigger.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
