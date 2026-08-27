# T3 — Entity Allowlist and Scrub-Scope Constitution

**Priority:** P0 for collateral safety  
**Scope:** Narrative and STATUS rendering in the live SynapticGM consumer application  
**Author:** Manus AI

## Constitutional rule

> A scrubber may suppress an untrusted disclosure, but it may not rename, generalize, delete, or substitute a game entity that is bound to authoritative state.

The 28c worst-cell summary reports `the mark` at roughly 173 hits in LitRPG s18, `nearby building` in DnD s69, `the panel` as another collateral form, and an RPG `them` regression from 26 to 52.[1] The common architectural risk is a cleanup rule operating on surface strings without a semantic boundary between prohibited material and valid world nouns. The exact rule that caused each hit cannot be proven without the scrub logs and transcripts, so the diagnosis below is a constrained root-cause model rather than a claim about unseen implementation.

## Constrained root-cause analysis

| Observed symptom | Most plausible failure class | Why the symptom fits | Evidence needed to confirm |
|---|---|---|---|
| Named or quest-relevant text becomes `the mark` | Replacement template applied to an entity-like span after identity was lost | The generic noun is grammatical but semantically unbound | Pre/post scrub text, matched rule id, entity annotations |
| Location becomes `nearby building` | Location title was treated as sensitive or unknown rather than protected world state | A specific title appears generalized to a location category | Location registry snapshot and scrub match trace |
| Object/interface term becomes `the panel` | Broad noun fallback reused across unrelated spans | Generic replacement survives prose validation while losing referent | Rule/template map and source spans |
| `them` count rises 26→52 | Whole-mention replacement or pronoun repair runs without number/gender/discourse tracking | A generic plural pronoun can replace distinct entities and degrade reference clarity | Per-turn replacements and coreference context |

The principal architectural correction is **not** to add more replacement words. It is to make scrub decisions on typed spans and, where a span must be removed, regenerate the containing sentence from safe structured facts rather than insert a generic noun.

## Protected entity constitution

An entity is protected when its identity originates in authoritative state, a current BeatContract, a receipt, or an accepted player action. Protection follows the entity id across aliases and inflections; it is not limited to one exact display string.

| Protected role | Minimum registration source | Examples in scope | Allowed scrub action |
|---|---|---|---|
| Active mob or encounter participant | Active Encounter Terminal FSM record | Pact-Hunter, Keep Wraith, current target | None on the entity mention; validate casing/alias only |
| Inventory item | Inventory ledger or accepted item-use action | Millstone Charter | None; item identity must survive item-use narration |
| Quest prop | Current quest-stage registry or BeatContract | Evidence, token, device, charter, keyed objective object | None while active or referenced by committed delta |
| Named NPC | NPC registry, topic FSM, branch record, or BeatContract | Aldous, Oskar | None; unregistered aliases may be normalized to canonical display name |
| Location title | Location registry, current/adjacent location ids, or quest/encounter target | Cape District, Thornferry, Keep title | None; preserve canonical title |
| Player-selected proper noun | Accepted character/campaign state | Character, party, custom place names | None unless a separate safety rule requires sentence regeneration |
| Bound system noun intended for players | Player-visible schema | Level, XP, quest stage, branch label | Format normalization only |

Protection is denied only when the text span is not bound to a known id or when a higher-priority safety policy requires suppression. Even then, the fallback is a safe sentence rebuilt from permitted fields, not `stranger`, `building`, `mark`, `panel`, `them`, or another generic substitute.

## Explicitly forbidden replacements

The following tokens are **never valid automatic replacements** for a protected or unresolved entity span: `stranger`, `building`, `nearby building`, `mark`, `the mark`, `panel`, `the panel`, `someone`, `something`, or a forced `they/them` substitution. These words may still appear when authored naturally and bound to a legitimate referent; the ban applies to scrub replacement output.

A replacement event must record `ruleId`, source span, output action, protected status, and decision reason in debug telemetry. The player-facing surface never receives rule identifiers or scrub markers.

## Pipeline order

The brief requires integration with `typedEntityValidator` and `proseWarden` before and after GM generation.[1] The binding pipeline is:

| Order | Component | Input | Responsibility | Failure behavior |
|---:|---|---|---|---|
| 1 | State projection | Ledgers, FSMs, BeatContract, inventory, location | Build the protected entity registry and safe player-visible fact set | Fail closed to a minimal safe fact set; do not call scrubber without protection metadata |
| 2 | `typedEntityValidator.preGM` | Prompt context and projected registry | Mark canonical entity ids, aliases, semantic roles, and non-exportable control spans | Quarantine diagnostic if a required active entity has no id |
| 3 | GM generation | Structured state and annotated context | Draft narration; it does not grant or revoke protection | Missing/invalid output routes to sealed fallback |
| 4 | `typedEntityValidator.postGM` | Draft narration plus registry | Resolve mentions back to entity ids; detect invented, ambiguous, or contradictory spans | Ambiguous bound span triggers sentence regeneration, not generic substitution |
| 5 | `proseWarden` | Typed draft | Remove prohibited disclosures and enforce player-safe prose while skipping protected spans | Rewrite the minimum sentence from safe facts |
| 6 | Entity integrity check | Wardended text plus required entity ids | Assert required bound nouns remain and no forbidden replacement event occurred | Reject render and use structured safe fallback |
| 7 | STATUS leak firewall | Structured STATUS render | Strip control metadata and validate player surface separately | Use STATUS safe fallback; retain debug-only record |
| 8 | Player renderer | Validated narrative and STATUS | Display output | Never consume raw prompt or debug log |

The validator must run on both sides of generation. Pre-GM typing constrains context construction; post-GM typing validates what the model actually wrote. `proseWarden` operates only after post-GM typing so it can distinguish a protected world entity from an unbound or prohibited phrase.

## Protected registry shape

```json
{
  "runId": "run-42",
  "turn": 9,
  "registryVersion": 1,
  "entities": [
    {
      "entityId": "keep-wraith",
      "role": "activeMob",
      "canonicalDisplay": "Keep Wraith",
      "aliases": ["the wraith"],
      "source": "encounter:enc-7",
      "protection": "mustPreserveIdentity"
    },
    {
      "entityId": "millstone-charter",
      "role": "inventoryItem",
      "canonicalDisplay": "Millstone Charter",
      "aliases": ["the Charter"],
      "source": "inventory",
      "protection": "mustPreserveIdentity"
    }
  ]
}
```

The runtime should pass ids or opaque span markers internally and render canonical display names only at the player boundary. If prompt format requires readable names, the annotation must remain out-of-band or use a channel guaranteed not to leak into prose.

## Scrub decision algorithm

For each candidate span, the scrubber follows this decision order:

1. If the span resolves to a protected entity id, preserve the identity and allow only canonical formatting.
2. If it matches a non-exportable control tag, remove it and record the removal in debug telemetry.
3. If it expresses a prohibited disclosure but the sentence also contains protected facts, regenerate that sentence from the safe fact set.
4. If it is an unbound invented entity that conflicts with state, reject or regenerate the sentence.
5. If it is ordinary prose, leave it unchanged.
6. After all actions, verify that required entity ids still have a readable mention where the terminal receipt or beat requires one.

Regex-only matching is insufficient for decisions 1, 3, and 4. Regex may detect candidate control tags, but semantic authority comes from registry ids and typed spans.

## Pronoun and coreference policy

The `them` regression is handled as a reference-integrity problem, not as a banned-word count. Pronouns may remain only when the antecedent is unambiguous within the configured discourse window and number is consistent. When ambiguous, rerender the smallest phrase with the canonical name; do not replace every entity with `them`.

| Condition | Player-facing action |
|---|---|
| Single unambiguous antecedent | Preserve natural pronoun |
| Multiple candidate antecedents | Use canonical short name |
| Group entity registered | Use registered group display or valid plural pronoun |
| Antecedent removed by safety rewrite | Rebuild sentence and restore safe canonical referent |
| Resolver confidence below threshold | Prefer canonical name; emit debug diagnostic |

## Acceptance metrics by worst cell

All targets apply to reruns using the same seeds and equivalent run configuration referenced in the brief. Because raw transcripts were not attached, baseline counts other than those explicitly reported must be recomputed from the artifacts.[1]

| Worst cell | Reported collateral symptom | 29a target | Additional integrity assertion |
|---|---|---:|---|
| LitRPG s18 | `the mark` approximately 173 hits | **0 scrub-generated hits** | Every active mob, item, quest prop, named NPC, and location required by receipts remains addressable by canonical id/name |
| DnD s69 | `nearby building` scrub | **0 scrub-generated hits** | Keep Wraith and registered location titles survive from spawn through clear |
| RPG s137 | `them` 26→52 regression | **0 scrub-generated pronoun substitutions** and no increase over validated 28c source baseline | Cape District and leverage/feed referents remain unambiguous across topic commit |
| PYOA s188 | Branch/item nouns at risk, exact count not supplied | **0 scrub-generated `mark/panel/building/stranger` hits** | Millstone Charter and locked branch label survive item-use and branch receipt rendering |
| All cells | `the panel` named as collateral token | **0 scrub-generated hits** | Any natural occurrence must have a valid bound referent and `replacement=false` telemetry |

The acceptance metric is tied to **scrub-generated events**, avoiding false failures when a word is legitimately present in source content. A secondary raw-string scan remains useful as a triage signal, but it is not the authority.

## Tests

| Test name | Assertion |
|---|---|
| `entity_scrub_preserves_active_mob_identity` | Active encounter participant mention cannot be generalized or removed |
| `entity_scrub_preserves_inventory_item_identity` | Millstone Charter remains canonical through item-use narration |
| `entity_scrub_preserves_quest_prop_identity` | Active quest prop remains bound after wardening |
| `entity_scrub_preserves_named_npc_identity` | Aldous/Oskar aliases resolve to canonical ids and are not replaced |
| `entity_scrub_preserves_location_title` | Cape District/Thornferry titles survive safety cleanup |
| `entity_scrub_never_uses_generic_substitute` | A scrub action cannot output forbidden generic replacements |
| `entity_scrub_ambiguous_sentence_regenerates` | Ambiguous or prohibited mixed sentence is rebuilt from safe facts |
| `entity_scrub_pronoun_requires_antecedent` | Ambiguous `them` becomes a canonical short name, not another generic pronoun |
| `entity_integrity_required_mentions_survive` | Receipt-required entities are present in final player prose |
| `entity_scrub_debug_trace_is_run_scoped` | Every scrub event carries run, seed, turn, rule, and source-span hashes |
| `entity_scrub_cross_run_registry_rejected` | Registry from a different run cannot authorize a span |

## Rollout rule

Deploy in report-only mode first, comparing current output with typed-policy output on the same seed and action stream. Enforcement may begin only when all current protected roles are populated from real state. If registry coverage is incomplete, prefer sealed fallback prose over returning to broad generic substitution.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
