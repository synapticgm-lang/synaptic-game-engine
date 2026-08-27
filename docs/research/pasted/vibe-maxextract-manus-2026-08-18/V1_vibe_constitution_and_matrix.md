# V1 — Vibe Constitution and Matrix

## Constitution: the laws of SynapticGM feel

**1. The player’s words are game input, not decoration.** A protest, bargain, joke, correction, or question is handled as an intentional act in the current scene. The game must either honor it, clarify it locally, explain a real boundary, or visibly defer it. Generic apologies, topic pivots, and menu-only fallback language are failures of recognition.

**2. Authority is visible when it matters.** Facts resolve in the published order: **player correction → pinned canon → StateTx → SceneManifest → evidence → invention**. The game may keep this machinery quiet during ordinary play, but it must make the outcome explainable upon challenge. Retrieval and summaries are labelled derived context, never truth.

**3. Consequence is felt before it is catalogued.** The prose first makes the change emotionally and tactically legible; a compact receipt then makes it inspectable. A relationship cools in dialogue before its trust state appears. A failed attempt changes the room before a quest marker explains it.

**4. No invisible substitutions.** Do not silently turn “I negotiate” into “I attack,” an uncertain clue into certainty, or a correction into a suggestion. The player’s intention can fail; it cannot be silently rewritten.

**5. The world does not flatter the player dishonestly.** Failure, refusal, and loss are allowed when telegraphed and attributable. Fairness means the player can reconstruct the causal path and take a next meaningful action—not that every action succeeds. [1]

**6. Style never changes truth.** Personality affects rhythm, diction, metaphor, notice templates, and warmth. It never affects permits, combat math, inventory, roster, HP, canon, or StateTx semantics. The factual resolver runs before the renderer.

**7. Warm callbacks earn their space.** A recalled detail must create a payoff: altered access, changed relationship, reframed evidence, cost, or option. Repeating a prior line merely to demonstrate memory is anti-vibe.

**8. The System is a characterful interface, not a chatbot.** It is concise, contextual, and visibly connected to gameplay. It avoids generic assistant speech, long process narration, and content that feels like a detached help desk.

**9. Offers wait for safe beats.** No “Would you like help?” or recap salesmanship in the middle of danger, dialogue escalation, or unresolved action. HookArc owns invitations. Natural breaks own optional depth.

**10. Kid Mode is stricter by design, not only shorter.** It uses plainer language, conservative invention, explicit stakes, reversible paths where possible, high-clarity chrome, no ads, and no pressure mechanics. Children’s best interests and avoidance of manipulative nudges are baseline design constraints. [2]

## Engine matrix

| Engine | Vibe goal | Failure smells | Never-lines |
|---|---|---|---|
| **LitRPG** | The world’s rules feel discoverable, impartial, and integrated into identity and stakes. | Random notices; unearned rewards; opaque numbers; “system says no.” | “The numbers don’t matter”; “the system changed it because it sounded cool.” |
| **Story RPG** | The player is an active protagonist whose choices change relationships, information, and pressure. | Collage prose; cosmetic choices; forced emotional interpretation. | “Your character feels X” without player cue; “nothing changes either way.” |
| **Tabletop fantasy** | A fair facilitator turns intent into adjudication, uncertainty, and shared imagination. | Hidden rolls with unexplained losses; rules lectures; railroading dressed as lore. | “You cannot try that”; “the roll is irrelevant.” |
| **PYOA** | Each presented path is a truthful lens on a live situation, with consequences that persist beyond the button. | Four paraphrases of one outcome; false finality; spoiler-heavy labels. | “Every choice changes everything”; “this is the only logical choice.” |

## Maturity matrix

| Dimension | Kid | Adult PG-13 | Adult mature | Never changes |
|---|---|---|---|---|
| Tone | Clear, reassuring, low ambiguity. | Genre-forward, dramatic, bounded. | More tonal range subject to policy and consent. | Respectful, non-shaming dialogue. |
| Chrome | Large, plain labels; no urgency. | Thematic but readable. | Fuller theme expression with accessibility fallback. | State provenance and easy correction. |
| Stakes | More recoverable paths; explicit previews. | Meaningful setbacks, visible causality. | Broader emotional and narrative tension under consent controls. | Ledger honesty; fair loss; no hidden coercion. |
| Invention | Conservative and signposted. | Bounded genre invention. | Bounded genre invention under the same authority order. | Invention never outranks evidence or state. |

## Competitive distinction

AI Dungeon’s official documentation describes a context-bounded architecture that combines summarization, retrieval, story components, and editable memories. [3] Friends & Fables foregrounds structured RPG objects and mechanics, while Hidden Door exposes authored entities and narrative relationships. [4] [5] SynapticGM should not claim its model is magically immune to the long-context problem. It should **prove a different contract**: player-correctable canonical state; origin-labelled claims; state diffs; and personality that remains semantically locked to the ledger.

| Rival category | Vibe it can plausibly signal | What SynapticGM must prove instead |
|---|---|---|
| AI text adventure | Freeform surprise and open action. | The surprise has an auditable causal home. |
| Structured AI GM | Game objects and mechanics. | Those objects cannot drift when prose changes. |
| Authored story roleplay | Strong setting and relationship flavor. | Player corrections and live state remain sovereign. |
| Generic chat roleplay | Responsive conversational flexibility. | Conversation directly becomes permitted, ledger-safe play. |

**SPECULATIVE:** The exact display density of state proof should be tested. The default should remain subtle; the audit path must be one interaction away.  
**COUNSEL:** Mature-content policy, consent design, and age gates require product-specific review before implementation.

## References

[1]: https://gamestudies.org/1901/articles/stang "Stang — Interactivity and Player Agency"
[2]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "UK ICO — Age Appropriate Design Code"
[3]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — All About the Memory System"
[4]: https://fables.gg/ "Friends & Fables"
[5]: https://www.hiddendoor.co/help/faq "Hidden Door FAQ"
