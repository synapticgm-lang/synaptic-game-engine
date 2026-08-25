# Coverage Matrix

**Pack prefix:** `SynapticGM_snapshot_eval_pack_2026-08-25`  
**Authority stamp:** `2026-08-25b`

> **EVIDENCED:** Every mission checklist item below maps to at least one concrete fixture ID. **SPECULATIVE:** Several items intentionally cite more than one row so a single accidental fixture deletion does not erase the conceptual boundary.

## Required mission checklist

| Status | Required case | Fixture IDs | Expected boundary |
|---|---|---|---|
| Complete | Last box with empty inventory and no supporting scene container | `A009` | `block`; no GM API call. |
| Complete | Last box in GM prose when props are empty | `D001` | `PW_LAST_CONTAINER_UNGROUNDED`. |
| Complete | A box or equivalent container exists as a scene prop | `A017`, `D019`, `E011` | Allow interaction; no false scrub. |
| Complete | Talk to a named NPC from the last GM line although the name is not yet in `present` | `A013`, `A014`, `C004`, `E008` | `allow`. |
| Complete | Invent a companion | `A005`, `A006`, `E006`, `E015` | `block`; no GM API call. |
| Complete | Use, draw, or wield a sword or weapon not in inventory | `A001`, `A003`, `E004`, `E012`, `E013` | `block`; no GM API call. |
| Complete | Look around | `A018`, `B005`, `E001` | `skip`. |
| Complete | Opening name/look/kit/location cover | `A019`, `B001`, `B002`, `B003`, `E009` | `skip`. |
| Complete | Layout ask: “are there doors or windows” | `A020`, `B004`, `E003` | `skip`. |
| Complete | Informational “info or option” or panel ask | `A021`, `B007`, `B008`, `C008`, `E010` | `skip`. |
| Complete | “A hundred people” when tracked `crowdSize` is small | `D002`, `D023` | `PW_CROWD_SIZE_OVERSTATE`. |
| Complete | Empty or all-alone claim when `crowd=present` | `D003`, `D024` | `PW_CROWD_ABSENCE_CONTRADICTION`. |
| Complete | Invent a crowd when `aloneArrival=true` and `crowd=none` | `D004` | **SPECULATIVE:** post-GM scrub via `PW_CROWD_PRESENCE_INVENTION`; it is not a player-claim hard gate. |
| Complete | “You step outside” while `indoor=true` | `D005` | `PW_STEP_OUTSIDE_WHILE_INDOOR`. |
| Complete | “Hours later” or festival-over retcon without tracked time advance | `D007`, `D008`, `D025` | `PW_UNTRACKED_TIME_SKIP` or `PW_EVENT_OVER_RETCON`. |
| Complete | “The hall answers your question” | `D011` | `PW_LOCATION_AS_SPEAKER`. |
| Complete | Extra invented door when the exit whitelist contains two entries | `D012` | `PW_EXIT_WHITELIST_VIOLATION`; snapshot permits only `north door` and `east passage`. |
| Complete | Gold or stat-number contradiction against the ledger | `D014`, `C006`, `C007`, `C012`, `C014` | `PW_LEDGER_NUMBER_CONTRADICTION`. |
| Complete | Flair-only sentence with legal facts | `G001`, `G002`, `G005`, `G028`, `D020` | Preserve; no scrub. |

## Hard-gate rule coverage

| Rule | Block controls | Allow boundary | Skip boundary |
|---|---|---|---|
| Missing inventory use, draw, wield, or possession | `A001`–`A004`, `B012`, `C003`, `E004`, `E012`, `E013` | `A011`, `B016` | Inventory information: `E002`. |
| Unsupported last/final/remaining container | `A009`, `A010`, `B015`, `E005`, `E016` | Grounded container: `A017`, `E011` | Room examination remains skip: `A022`. |
| Absent companion | `A005`, `A006`, `B013`, `E006`, `E015` | Grounded companion: `A012` | Companion roster information is an informational bypass where represented. |
| Ungrounded Proper Name | `A007`, `A008`, `C005`, `E007` | Present name: `A016`; last-story exception: `A013`, `A014`, `B011`, `C004`, `E008` | Roster information: `X044`. |
| Skip-only request families | Not applicable | Grounded actions: `B009`, `B010`, `B016` | Look/examine, opening cover, layout, info/options: `A018`–`A022`, `B001`–`B008`, `B017`, `B018`. |

**EVIDENCED:** A blocked row represents a real player draft and requires `api_calls=0`. **SPECULATIVE:** Allow rows include `validation_decision_emitted=true` as a neutral proof that the validator completed without taking the missing-fact block path.

## Prose-warden pattern coverage

| Pattern ID | Positive scrub fixtures | Leave-alone controls |
|---|---|---|
| `PW_LAST_CONTAINER_UNGROUNDED` | `D001` | `D019`, `G012` |
| `PW_CROWD_SIZE_OVERSTATE` | `D002`, `D023` | `G003`, `G009` |
| `PW_CROWD_ABSENCE_CONTRADICTION` | `D003`, `D024` | `G006`, `G013` |
| `PW_CROWD_PRESENCE_INVENTION` | `D004` | `G014` |
| `PW_STEP_OUTSIDE_WHILE_INDOOR` | `D005` | `G015` |
| `PW_ENTER_BUILDING_WHILE_OUTDOOR` | `D006` | `G016`, `G029` |
| `PW_UNTRACKED_TIME_SKIP` | `D007`, `D025` | `G017` |
| `PW_EVENT_OVER_RETCON` | `D008` | `D021`, `G018` |
| `PW_UNGROUNDED_PAST_RETCON` | `D009` | `G008`, `G030` |
| `PW_TENSION_DROP_CONTRADICTION` | `D010`, `D026` | `G019` |
| `PW_LOCATION_AS_SPEAKER` | `D011` | `D022`, `G007`, `G011` |
| `PW_EXIT_WHITELIST_VIOLATION` | `D012`, `D027` | `G002`, `G020` |
| `PW_INVENTORY_FACT_CONTRADICTION` | `D013`, `D028` | `G010`, `G021`, `G028` |
| `PW_LEDGER_NUMBER_CONTRADICTION` | `D014`, `C006`, `C007`, `C012`, `C014` | `G022`, `G027` |
| `PW_PRESENCE_ROSTER_CONTRADICTION` | `D015` | `G004`, `G023` |
| `PW_LOCATION_FACT_CONTRADICTION` | `D016` | `G024` |
| `PW_WEATHER_FACT_CONTRADICTION` | `D017` | `G005`, `G025` |
| `PW_QUEST_FACT_CONTRADICTION` | `D018`, `C001`, `C002`, `C010`, `C016` | `G026` |

## Snapshot-authority coverage

| Authoritative field | Representative fixtures | Required invariant |
|---|---|---|
| Current location | `D016`, `G024` | No untracked transition or renamed current place. |
| Crowd state and size | `D002`–`D004`, `D023`, `D024`, `G003`, `G006`, `G009`, `G013` | Presence and tracked approximation remain consistent. |
| Exits | `D012`, `D027`, `G002`, `G010`, `G020` | No invented navigable route; exact whitelisted exit strings remain. |
| Props and containers | `A009`, `A017`, `D001`, `D019` | Unsupported uniqueness is rejected or scrubbed; established props remain usable. |
| Present characters and companions | `A005`–`A008`, `A012`–`A014`, `D015`, `G004`, `G023` | No absent named participant is promoted to fact. |
| Inventory | `A001`–`A004`, `A011`, `C003`, `D013`, `D028`, `G010`, `G021`, `G028` | Names and possession match the snapshot. |
| Time of day and event continuity | `D007`, `D008`, `D025`, `G017`, `G018` | No unsupported elapsed-time or completion claim. |
| Indoor/outdoor | `D005`, `D006`, `G015`, `G016`, `G029` | No untracked boundary crossing. |
| Tension | `D010`, `D026`, `G019` | Renderer prose cannot lower tracked danger or combat. |
| Weather | `D017`, `G005`, `G025` | Tracked weather remains; compatible texture is preserved. |
| Ledger and quest facts | `C001`–`C016`, `D014`, `D018`, `G022`, `G026`, `G027` | Supplied numbers, targets, counts, and status remain exact. |

## Chrome coverage

| UI contract | Block fixtures | Assertion token |
|---|---|---|
| Repair banner visible | `E004`–`E007`, `E012`, `E013`, `E015`, `E016` | `repair_banner=visible` |
| Player draft restored exactly | Same block set | `draft_restored=exact` |
| “Look around” option available | Same block set | `options_include=Look around|Check what you carry` |
| “Check what you carry” option available | Same block set | `options_include=Look around|Check what you carry` |
| Cancel enabled | Same block set | `cancel=enabled` |
| No hosted GM API call | Same block set | `api_calls=0` |
| No text-turn spend | Same block set | `text_turn_delta=0` |

## Adversarial boundary coverage

The adversarial corpus contains 41 `allow`, 5 `scrub`, and 4 `skip` rows. It covers container polysemy (`X001`–`X007`, `X030`, `X031`, `X036`), companion-label contexts (`X008`–`X010`, `X039`), “last” as verb/surname/idiom (`X011`, `X012`, `X035`, `X037`), depicted doors and windows (`X013`–`X015`, `X038`), outside/time/safe/crowd ambiguity (`X016`–`X020`, `X032`–`X034`, `X040`, `X041`), metaphor and personification (`X021`–`X024`, `X029`, `X034`), and quote/negation/hypothetical/joke handling (`X025`–`X028`). True, context-grounded scrub boundaries are `X046`–`X050`; direct skip prompts are `X042`–`X045`.

## Validation evidence

**EVIDENCED by deterministic local validation:** `validation_report.json` reports 100 scenario rows, 30 good-prose rows, 50 adversarial rows, all 18 pattern IDs present, 55 distinct scenario locations, no schema or JSON failures, and no warnings. **SPECULATIVE:** Distinct-location count is a diversity signal, not a gameplay requirement.

## References

This matrix cites only fixture IDs within the pack and the user-supplied product-law brief; there are no external sources.
