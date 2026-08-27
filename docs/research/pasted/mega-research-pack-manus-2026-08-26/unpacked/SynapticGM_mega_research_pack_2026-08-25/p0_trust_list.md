# P0 Trust List — What Cost Controls Must Not Cut

**Status:** Product-protection checklist. These are the first promises to defend when reducing spend. A saving that violates a P0 is not a cost optimisation; it is a trust regression.

> **P0 rule:** Reduce repetition, retries, duplicate calls, unneeded context, and automatic media generation before reducing continuity, agency, disclosure, safety, or successful-turn fairness.

| P0 | Trust guarantee | Minimum observable standard | Forbidden “saving” |
| ---: | --- | --- | --- |
| 1 | **Player choice remains the cause of state change.** | A story action, binding, skill learning, offer acceptance, decline, cancellation, and quest acceptance change only after the corresponding player action. | Auto-accepting offers, silently binding relics, or advancing tasks to save a confirmation turn. |
| 2 | **Inventory truth is protected.** | The story does not place an unsupported object in hand, create an item, call an item the last one, or consume it without a grounded event. | Dropping inventory facts from context because they cost tokens. |
| 3 | **Present people are protected.** | Only present, established speakers and companions act or speak; absence and return have grounded transitions. | Removing cast-presence checks or merging people into a cheaper generic summary. |
| 4 | **Location, exit, time, and weather stay coherent.** | Indoor/outdoor state, used exit, elapsed time, active weather, and current place change only through supported turns. | Letting short prompts invent transitions so less state must be sent. |
| 5 | **Rumour, offer, and accepted quest remain distinct.** | The UI and GM copy never upgrade a rumour or soft offer into commitment. | Treating every mention as an active quest to simplify state. |
| 6 | **Failed turns do not consume the player’s allowance.** | A confirmed failure returns the player turn and restores the prior completed moment. | Charging the cap because the provider call cost money. |
| 7 | **Successful prose ends in a complete beat.** | Output does not stop mid-sentence, omit the consequences of the player’s action, or end before meaningful choice pressure. | Aggressive output-token truncation presented as normal quality. |
| 8 | **Caps and resets are described honestly.** | Remaining turns, one-time bonuses, refresh timing, and image availability match the authoritative counters and configuration. | Vague scarcity, fake countdowns, or claiming a provider refund. |
| 9 | **Model or quality changes are not disguised.** | Exact model IDs and product-tier assignments are controlled and changes are reviewed. | Silent substitution to a cheaper model while claiming the same tier behaviour. |
| 10 | **Memorable images remain opt-in and OFF by default.** | No automatic image call occurs after a dramatic moment; Free text works without image generation. | Using emotional pressure or dark patterns to drive paid image calls. |
| 11 | **Ads remain optional overflow.** | Base Free allowance does not require an ad; refusal is easy; ads never appear mid-action or in Kid Mode. | Forced ads, interstitials before a result, or selling story influence. |
| 12 | **Kid Mode is a real public gate, not a label.** | Adult rows are excluded or softened across copy, generation, ads, moderation, and data handling. | Sending the same unsafe content and merely hiding an age badge. |
| 13 | **No implementation jargon leaks to players.** | Player copy explains what changed and why in ordinary story language. | Showing model, retrieval, transaction, regex, or validation terminology to reduce copy work. |
| 14 | **No licensed-world shortcut enters prompts.** | GM-ready, player-facing, and generation prompts use original SynapticGM descriptions and generic folklore. | Buying apparent quality with “write like” or “make it look like” franchise references. |
| 15 | **Corrections are narrow and reversible.** | A repair removes only the unsupported detail and preserves the player’s valid action and surrounding scene. | Regenerating the whole turn cheaply without preserving grounded content. |
| 16 | **Retention and deletion promises are operationally true.** | Public wording matches processor behaviour, logs, backups, and deletion workflows. | Claiming deletion, privacy, or memory guarantees that are not evidenced. |

## Order of Operations During a Cost Incident

| Order | Action | Why it preserves trust |
| ---: | --- | --- |
| 1 | Stop duplicate and idempotency failures. | Removes pure waste and duplicate story events. |
| 2 | Cap retries and inspect billed failures. | Saves hidden spend while keeping the player-turn refund. |
| 3 | Remove repeated prose from prompts while retaining protected facts. | Cuts tokens without continuity loss. |
| 4 | Use proven prompt caching. | Reduces input cost without changing content. |
| 5 | Pause nonessential design-time media generation. | Keeps the live text path intact. |
| 6 | Tighten output repetition after measuring completion quality. | Targets surplus prose rather than the narrative beat. |
| 7 | Adjust Free allowance only with transparent copy and evidence. | Makes scarcity visible rather than deceptive. |
| 8 | Consider optional post-scene ad overflow for standard mode only. | Adds an opt-in path without coercion. |

If these actions are insufficient, the founder should revisit pricing, limits, or product scope openly. Do not erode P0s invisibly.
