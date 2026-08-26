# Executive Scorecard — Story Tones × GM Personality

**Author:** Manus AI  
**Decision posture:** Launch deterministic text rails first; treat art frequency and template IDs as unverified until missing pack inputs arrive.

| Tone | Free | Mid/High | Rationale |
|---|---|---|---|
| grimdark_bleak_consequence | Later; exclude from Kid Surprise-me | Launch as Expert text; art gated by rating | High severity and metaphor risk require strong gates. |
| cozy_low_stakes_comfort | Launch through `chilled-gm`/`fireside-innkeep` rails | Launch | Low implementation risk; strong broad accessibility. |
| cozy_brutal | Launch; shipped ID | Launch | Existing ID; validate violence-to-comfort balance. |
| pulp_kinetic_adventure | Later as Expert; text can pilot | Launch | Choice and scene geometry must stay factual. |
| gothic_moonlit_dread | Later; no Kid Surprise-me | Launch as Expert | Flagship visual opportunity; highest false-friend risk. |
| litrpg_system_registrar | Launch; shipped ID | Launch | Clear fit with existing systemPersonality. |
| military_procedural | Launch; shipped ID | Launch | Low ambiguity if counts and positions are authority-bound. |
| dry_wit_deadpan | Launch; shipped ID with hard humor gates | Launch | Humor requires context suppression. |
| warm_chronicle | Launch through `fireside-innkeep` | Launch | High warmth; memory claims need pinned-canon check. |
| clinical_auditor | Later as Expert rail | Launch | Useful for trust but can become jargon-heavy. |
| mythic_portent | Later as Expert; no Kid dark variant | Launch | Metaphor must not become prophecy or item property. |
| street_balladeer | Later as Expert rail | Launch | Requires anti-accent and anti-rhyme-distortion gates. |
| ashen_archivist | Later as Expert rail | Launch | History claims and ossuary imagery need controls. |
| bright_field_guide | Launch through `chilled-gm` | Launch | Strong discovery fit and Kid compatibility. |
| noir_case_file | Later; Kid mystery rewrite only | Launch as Expert | Clue and guilt inference are the main continuity hazards. |
| fae_uncanny_tale | Later; no hidden bargains | Launch as Expert after validation | Contract clarity and Kid rewrite are prerequisites. |
| hard_sf_terminal | Later as Expert | Launch as Expert | Telemetry must be evidence-bound and readable. |
| pyoa_branching_crisis | Launch for `pyoa` | Launch | Directly aligned to existing Mode DNA. |
| kid_plain_stakes | Launch as mandatory layer, not genre picker | Launch as mandatory layer | Cross-cutting constraint; never monetized as a safety upgrade. |

## Portfolio decision

The strongest immediate release set is **System Registrar, Field Procedural, Dry Deadpan, Cozy Brutal, Hearthside Comfort, Warm Chronicle, Bright Field Guide, Branching Crisis, plus the Kid Plain Stakes layer**. Dark, uncanny, archival, noir, mythic, balladeer, clinical, and hard-SF profiles should enter as Expert rails after invariant and blind-taste validation. The tone itself is inexpensive compared with generated art; Free-tier restrictions should therefore target **art frequency**, not prose identity.

The art program remains asynchronous. The Free proposal follows the provided summary’s sparse approximately-20%-of-eligible-beats direction and uses Klein 4B; Mid/High may use FLUX.2 Pro for memorable plates. Public endpoint records on 2026-08-26 showed $0.014/MP for Klein 4B and $0.03/MP for Pro, but internal cost scenarios are **INPUT REQUIRED** and pricing must be discovered at runtime.[6]

## Hard gates

No tone ships if it changes the canonical projection, turns inference into evidence, exposes hidden costs, mocks the player, weakens Kid Mode, or requires a second LLM critic. No art tier ships if it blocks the GM turn, treats pixels as ledger truth, or bakes lettering into the image.

## References

[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
