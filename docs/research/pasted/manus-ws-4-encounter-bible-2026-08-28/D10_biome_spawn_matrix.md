# D10 — Biome-Appropriate Spawn Matrix

The authoritative matrix is [`D10_biome_spawn_matrix.csv`](./D10_biome_spawn_matrix.csv). It defines legal encounter families and actor provenance for each bible, biome, and site. The filter is **hard**: drought pressure, dramatic preference, and GM narration cannot override it.

## Candidate Predicate

```ts
export function isLegalCandidate(candidate: EncounterTemplate, context: SpawnContext): boolean {
  return candidate.mode === context.mode
    && candidate.bibleId === context.bibleId
    && candidate.biomeFilter.allow.includes(context.biomeId)
    && intersects(candidate.biomeFilter.siteTags ?? [], context.siteTags)
    && withinTier(context.tier, candidate)
    && requiredFactionsReachSite(candidate, context)
    && candidate.biomeFilter.exclude.every((tag) => !context.tags.has(tag))
    && prerequisitesSatisfied(candidate, context.world)
    && cooldownExpired(candidate.id, context.history)
    && densityRoleAvailable(candidate.role, context.density);
}
```

Every positive constraint must pass and every exclusion must remain absent. If a template names a faction, creature family, or environmental feature, the world map authority must prove that it exists at the current site or has an authored reach rule.

## Drought Picker

```text
1. Build candidates from the exact mode and bible.
2. Hard-filter biome, site, tier, faction reach, prerequisites, exclusions, cooldown, and density role.
3. Prefer an under-target role for the current location or turn window.
4. Score variety, unresolved hooks, telegraph availability, and recent repetition.
5. Select deterministically from the highest score band using the run seed.
6. If empty, choose the matrix row’s legal drought fallback.
7. If the fallback is also unavailable, emit a content-gap receipt; do not borrow from another bible.
```

| Empty-set fallback | Allowed behavior | Forbidden behavior |
| --- | --- | --- |
| Valid environmental event | Spawn a biome-native hazard or discovery with a full lifecycle. | Reskin an unrelated boss as weather. |
| Valid social/discovery beat | Advance a local faction rumor, warning, or deadline. | Import an actor whose faction has no reach. |
| Content-gap receipt | Record bible, biome, role need, and rejected candidate reasons. | Ask the GM to invent an ungoverned encounter. |
| No spawn | Preserve world consistency when no content is legal. | Override the matrix because a drought timer fired. |

## Wrong-Bible Examples

| Rejected spawn | Context | Rejection reason | Legal replacement |
| --- | --- | --- | --- |
| Keep Wraith | Summoned Pact, Shattered/ordinary coast | Actor belongs to Cursed Keep and lacks coastal authority. | Contract anomaly, coastal pact scavenger, or content-gap receipt |
| Unbound Chimera | Cape District council hall | Wandering elite is incompatible with a civic social site. | Vote deadline, exposure threat, or faction confrontation |
| Dock Union picket | Cursed Keep heart room | Faction and site are both incompatible. | Oath-brazier hazard or Hollow Castellan telegraph |
| Vesper registrar | Erebus-9 life support | Cross-bible identity actor lacks station provenance. | Chief Rhee, Doctor Voss, or a system-failure crisis |

## Matrix Governance

The CSV is versioned independently from templates. Adding a template does not make it spawnable until a matrix row permits its encounter family and actor provenance. Conversely, removing a matrix permission prevents new encounters but does not invalidate active encounter snapshots.

| Change | Required verification |
| --- | --- |
| Add biome | At least one legal fallback and one test proving wrong-bible rejection |
| Add actor family | Provenance/faction reach rule and at least one site tag |
| Add boss permission | Authored boss gate, arena/site authority, and density budget |
| Add drought fallback | Full lifecycle, terminal bound, and receipt policy |
| Relax exclusion | Regression test for the exact previously forbidden combination |

## Telemetry

The picker records both selected and rejected candidates. A rejected record contains template ID and normalized reasons such as `bible_mismatch`, `biome_not_allowed`, `site_tag_missing`, `faction_out_of_reach`, `tier_out_of_range`, `cooldown_active`, `density_role_full`, or `exclusion_hit`.

The quality gate is absolute: **wrong-bible spawn count must remain zero**. Content scarcity is reported as an authoring gap rather than concealed by an incoherent substitute.
