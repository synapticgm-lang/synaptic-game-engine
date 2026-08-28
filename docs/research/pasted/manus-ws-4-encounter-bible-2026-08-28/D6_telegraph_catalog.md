# D6 — Telegraph Pattern Catalog

The authoritative catalog is [`D6_telegraph_catalog.json`](./D6_telegraph_catalog.json). This companion specification explains selection, rendering, and validation.

## Selection Contract

The telegraph builder selects cues only after the biome-filtered template is committed. A normal encounter requires at least one cue; an elite requires two distinct channels; a boss requires three. Across a run, at least 80% of encounters must warn before engagement. The remaining share is reserved for templates intentionally tagged for surprise, not for missing content.

| Severity | Minimum channels | Minimum response window | Additional rule |
| --- | ---: | ---: | --- |
| Trash or ordinary crisis | 1 | 1 turn | May use one direct cue |
| Elite or major confrontation | 2 | 1 turn | Cues must add different information |
| Boss or chapter commitment | 3 | 2 turns | Must communicate threat, preparation, and consequence |
| Surprise ambush | 1 suspicion cue or immediate reaction | 0–1 turn | Opening severity no higher than moderate |

A cue is **actionable** only if it changes at least one legal choice, cost, probability, position, or timing decision. “You feel uneasy” is atmosphere; “the gulls have vanished and fresh rope fibers cross the quay; search, retreat, or proceed at disadvantage” is a telegraph.

## Channel Rendering

| Channel | UI placement | Prose role | Machine verification |
| --- | --- | --- | --- |
| `STATUS` | Fixed situation-packet block | State the rule, clock, severity, or deadline without metaphor | Presence of pattern ID and rendered variables |
| `NPC` | Dialogue or reported speech | Give intent, demand, weakness, warning, or counsel through a situated voice | Speaker exists and has location/faction authority |
| `SCENE` | Opening description | Show physical evidence, geometry, movement, absence, or escalation | Cue tags match allowed biome/site features |
| `ITEM` | Inventory/world-object callout | Link an item to counterplay, provenance, scarcity, or a fork | Item exists and action hook has a resolver |
| `FACTION` | Intel, standing, orders, public response | Forecast organized action or political cost | Faction is present or has valid reach into location |

## Full Prose Examples

### LitRPG Boss

> **SYSTEM — THREAT:** Glassback Basilisk, Tier 7 Elite-Boss. Estimated risk: severe. The first spell each round is reflected. Engagement begins when the obsidian iris opens in two turns.
>
> From the gallery, the player can see three mirror pillars, a drainage trench, and a service hatch behind the idol. The glassbuckler recovered in the prior chamber is scarred only on its mirrored face; it can absorb one reflected cast.
>
> **Available preparations:** rotate a mirror pillar, equip the glassbuckler, mark the service hatch as a flee route, or initiate early from high ground.

The example uses `status.threat-band`, `status.rule-reveal`, `scene.arena-foothold`, and `item.countermeasure-hint`. Each cue maps to a legal action and a deterministic state change.

### DnD Trap Hazard

> The corridor’s dust stops in a clean line three paces ahead. Tiny copper hooks protrude from both walls, and the torch flame leans toward a slit in the ceiling. A successful DC 13 Wisdom (Perception) check identifies the pressure seam; thieves’ tools can disable it with a DC 15 Dexterity check. Crossing without inspection triggers the blade sweep and a DC 14 Dexterity saving throw for half damage.

The scene communicates location, mechanism, available checks, and the cost of ignoring the warning. The trap is still dangerous, but it is not arbitrary.

### RPG Faction Confrontation

> Captain Vale lays the sealed arrest order on the mill table. “Give me the counterfeit ledger before midnight. Refuse, and I close the river gate.”
>
> **Mill Guild standing: +1.** Surrendering the ledger grants Watch protection but changes Guild standing by −2 and removes workshop access. Exposing Vale requires corroborating testimony; Mara’s signed statement is valid leverage and is consumed when presented.

The ultimatum, deadline, standing threshold, and leverage requirement are visible before the player chooses. Repeating “mention Mara” is impossible after the statement has been committed or discredited.

### PYOA Commitment Fork

> The Millstone Charter lies between you and the Baron’s clerk. Keeping it preserves the millers’ public claim. Surrendering it wins amnesty for the village, destroys the original evidence, and locks public arbitration. The choice will be recalled when the flood levy is judged in Chapter 3.
>
> **Choose:** **Keep the Charter** or **Surrender the Charter**.

The item is a choice token. The engine writes an exclusive fact immediately and schedules a delayed callback before paths converge.

## Surprise Exception

A surprise encounter remains fair when the player can infer that something is wrong, react after reveal, or absorb a capped opening cost. The following sequence is conformant:

> The market noise stops one stall at a time. A dropped orange rolls uphill. Before you can locate the watcher, the awnings fall and three knives flash from above.
>
> **SURPRISED:** Roll initiative with disadvantage. You may dive into the dye stall, overturn the spice cart, or sprint for the north lane before the ambushers’ second volley.

The encounter begins unexpectedly, but it does not remove agency or conceal the available escape geometry.

## Builder Pseudocode

```ts
function buildTelegraph(template, world, history): TelegraphPacket {
  const minimum = template.role === "boss" ? 3 : template.role === "elite" ? 2 : 1;
  const legal = catalog.patterns.filter((pattern) =>
    pattern.appliesTo.includes(template.mode) &&
    pattern.actionHooks.some((hook) => template.stakes.approaches.some((a) => a.id === hook)) &&
    cueFactsExist(pattern, world) &&
    !violatesRepeatLimit(pattern.id, history)
  );

  if (!template.telegraph.required) {
    assert(template.telegraph.surpriseEligible);
    assert(template.telegraph.openingSeverityCap !== undefined);
    return buildSurpriseCueOrReaction(template, legal, world);
  }

  const cues = chooseDistinctChannels(legal, minimum);
  assert(cues.length >= minimum);
  return renderAndFreeze(cues, template, world);
}
```

## Validation Rules

| Rule | Pass condition |
| --- | --- |
| Coverage | `preEngagementTelegraphed / spawned >= 0.80` |
| Actionability | Every cue references at least one action ID present in stakes |
| Truthfulness | Rendered actor, faction, item, and site exist in authoritative state |
| Diversity | No pattern appears more than twice consecutively in one run |
| Surprise fairness | Every surprise has suspicion/reaction and opening severity ≤ moderate |
| Boss clarity | Every boss has at least three distinct channels and a preparation window |
