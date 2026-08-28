# D9 — Loot Table Design

The authoritative tables are in [`D9_loot_tables.json`](./D9_loot_tables.json). “Loot” means any post-encounter reward with persistent value: equipment and currency in LitRPG, treasure and quest objects in DnD, favors and access in RPG, and branch-visible story state in PYOA.

## Reward Constitution

Rewards are selected only after a terminal outcome and applied through an idempotent receipt. The player sees reward **categories** before commitment, while exact procedural results may remain unknown. Bosses guarantee a build- or campaign-relevant reward; trash remains light enough to avoid inventory noise.

| Rule | Enforcement |
| --- | --- |
| Determinism | The encounter seed, table ID, roll index, and pity counter reproduce the result. |
| Context | Biome/site and enemy-family tags filter entries before weighted selection. |
| No duplicates | Unique duplicates convert to mode-specific currency or an authored alternative. |
| Pity protection | An elite rare result is guaranteed after three eligible misses. |
| Boss relevance | At least one build item or campaign-state reward is guaranteed. |
| Outcome scaling | Victory 1.00; negotiated 0.85; partial 0.65; fled 0.20; defeat 0.10. |
| Receipt integrity | Rewards are applied only once under the encounter’s aftermath commit key. |

## Tier Summary

| Mode | Trash | Elite | Boss |
| --- | --- | --- | --- |
| **LitRPG** | Small gold, biome material, minor consumable, rare weapon part | Medium gold, enemy-family material, greater consumable, rare gear, named pact core | Large gold, unique core, named weapon/armor, guaranteed build upgrade, quest relic |
| **DnD** | Contextual coins, supplies, clue object, curio | Coins, potion/scroll, uncommon magic item, route key, ally token | Hoard, major or signature magic item, campaign quest item, faction/stronghold boon |
| **RPG** | Minor favor, local intel, temporary access, cost recovery | Strong favor, verified leverage, faction access, reputation shift, protected contact | Institutional favor, decisive intel, permanent access, policy/territory change, signature relationship |
| **PYOA** | Minor callback, relationship response, scene access | Major callback, exclusive fact, ending eligibility, faction realignment | Chapter ending, world-state rewrite, epilogue callback, relationship resolution |

## LitRPG Example

A victory over the **Covenant Devourer** references `litrpg.elite.pact`. The seed produces a named pact core, 61 gold, and one greater mana tonic. If the player’s elite-rare miss counter is already three, the selection must include rare equipment and then reset that counter. The receipt also records 680 XP and seal-hall clearance, which are not optional drops.

A negotiated rebinding applies the 0.85 reward scale to procedural currency/quantity but preserves the authored faction, NPC, and quest receipts. The result is not inferior theater: it trades some physical loot for a different persistent state.

## DnD Example

Disarming the **Pendulum Chapel Trap** can reveal a reusable clockwork pin and grant one milestone unit. Triggering the trap does not create treasure from nowhere; the mechanism becomes spent and the route state is the main reward. Boss treasure is filtered by tier and site. A Cursed Keep boss cannot drop a Shattered Coast harpoon unless a template explicitly authorizes cross-biome provenance.

## RPG Example

Resolving the **Harbormaster Leverage Negotiation** grants berth access, an NPC state, and a Harbor Office delta. A favor or piece of intel is represented as a typed asset with provenance, scope, value, and consumption policy:

```json
{
  "id": "favor.harbor-office.one-voyage",
  "source": "harbormaster-oren",
  "scope": "quarantine-berth",
  "value": 2,
  "consumption": "spend-once",
  "expires": "after-next-voyage"
}
```

This prevents “favor” or “leverage” from becoming an infinitely reusable dialogue topic.

## PYOA Example

The reward for **Keep the Millstone Charter** is not currency. It is a bundle of story-state receipts: `player-holds-charter`, `hearing.player-evidence`, Miller trust, Baron hostility, and `ending.free-mills` eligibility. The later hearing must read these values even if both branches enter the same chapter scene.

## Selection Algorithm

```text
1. Read mode, tier, biome, site, enemy family, outcome, unique ownership, and pity state.
2. Hard-filter entries whose tags conflict with the encounter’s authority.
3. Add mandatory authored and guarantee entries.
4. Apply pity replacement if the threshold has been reached.
5. Use seeded weighted draws for remaining slots without illegal duplication.
6. Apply outcome quantity multiplier to procedural quantities only.
7. Convert duplicate uniques to mode currency or authored substitute.
8. Emit receipt mutations and update pity counters atomically.
```

## Balance Telemetry

| Metric | Purpose | Alert condition |
| --- | --- | --- |
| `reward_value_by_mode_tier` | Detect over- or underpayment. | Median outside configured band for 100 encounters. |
| `rare_miss_streak` | Verify pity behavior. | Any eligible streak exceeds 3. |
| `duplicate_unique_attempts` | Find table pressure and conversion frequency. | More than 10% of boss draws. |
| `wrong_biome_reward_count` | Enforce provenance. | Any value above zero. |
| `receipt_reapply_count` | Detect idempotency failure. | Any value above zero. |
| `negotiated_vs_victory_value` | Ensure alternatives remain meaningful. | Negotiated durable value below 70% after social receipts are valued. |
