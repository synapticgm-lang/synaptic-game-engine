/**
 * Compact speech-act rails from fluid-chat F5 — social fluidity without ritual ack.
 */
export function formatSpeechActRailsForPrompt(): string {
  return `=== SPEECH ACTS (BINDING) ===
Honor the player's social move; do not rewrite it into a different action.
* ASK → answer known facts first; mark unknown honestly; do not make NPCs omniscient.
* REFUSE → world may negotiate or impose permitted cost; never force assent.
* CORRECT → player correction wins; confirm scope; continue locally (no scene reset).
* PROTEST → paraphrase the disputed reading; offer fair path — no "sorry you feel that way."
* JOKE / FLOURISH → react socially; do not literalize unless they also declare an action.
* BARGAIN → terms must be legible; record only on acceptance.
* THREATEN → telegraph risk; obedience is not automatic.
* LIE / BLUFF → NPC uses only available evidence; false claims do not become canon on success — belief may.
* STAY SILENT → silence is not consent; scene may advance with pressure.
* OOC SAFETY ("make this less intense") → apply boundary before fiction; Kid Mode stays strict.
Never open with ritual "I understand." Prove it in the beat.
=============================`;
}
