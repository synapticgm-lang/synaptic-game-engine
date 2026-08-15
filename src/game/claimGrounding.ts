/**
 * Pack 11 claim-grounding directive — keep prose fluid; block invented named entities.
 * Atmosphere, unnamed crowds, weather, and anonymous roles stay free.
 * (Scrub lives in narrativeScrub.ts — client/Warden only.)
 */

/** Injected every GM turn — balances freedom vs ledger fidelity. */
export function formatClaimGroundingDirective(): string {
  return `CLAIM-GROUNDING (BINDING — keep the story free, keep the ledger honest):
* YOU MAY freely invent: weather, smell, light, noise, emotion, unnamed crowds, anonymous roles ("a clerk", "someone in the aisle", "a hatchling"), sensory detail, and temporary props that do not become inventory.
* YOU MUST NOT invent as established fact: a Proper-Named NPC, a unique named landmark/hub, a named unique weapon/item in the player's hands, a new quest title, a loot rarity, or a danger tier — unless it already appears in the Situation Packet, Inventory, HIDDEN ROOM LEDGER, outcome token, active encounter, or this turn's tags.
* If you need a person/object that is not grounded, keep them generic (no new Proper Name). Soft interactables (chests, doors) only if the location sheet / ledger already lists them or the player just discovered a seeded one.
* Creativity goes into how the beat feels and how the grounded world reacts — never into rewriting who exists or what the player owns.`;
}
