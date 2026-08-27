# WOF Shared Engine & Theme Kits

## Shared engine contract

One engine owns dice/checks, HP/bond/heat/score/hull/steadfast state, item catalogs, gold, cosmetic tokens, quest ticks, instance seeds, lockouts and personal-loot awards. State commits first; prose renders afterward. Overworld presence is shared-hub Tier 3 with nearby race labels only; combat is instanced for parties of 2–5. Ten-person instances are reserved for combat skins that need them. Lockstep rounds, weekly per-character boss lockouts, friends-first finder, personal loot and checkpoint-on-wipe are universal defaults. A world cannot claim open-world PvP, auction trading, global guild banking or massive scale until the separate platform gates are completed.

## Two-wallet contract

| Wallet | Source | May buy | Must never buy |
|---|---|---|---|
| `gold` | Code-resolved quests, vendor sales, capped contracts, personal instance loot. | Repairs, title-local vendor goods, travel, noncompetitive crafting. | Cosmetic-token goods, real-money value, power rerolls, lockout skips. |
| `cosmetic_tokens` | Direct disclosed purchase, earned non-power seasonal recognition where stated. | Theme kit, appearance, emotes, profile frame, title-local capacity/world unlock. | Damage, HP, bond success, catch rate, score, raid clear, random power pack, competitive advantage. |

Premium purchase copy must state the actual shipped mode: “solo,” “private co-op,” or “limited online region.” Premium currency never mixes with gold. Randomised cosmetic distribution is avoided; when any chance-based cosmetic is proposed, it requires separate legal, age and disclosure review before release.

## Theme-kit specification

| World | Theme kit / chrome | UI token palette & material | Dice / voice / ambient loop | Default fashion |
|---|---|---|---|---|
| Ash Compact | **Coalglass Ledger** | ash, wick-amber, tide-blue, stone; hammered iron and oiled canvas | carved river-stone d8; patient local voice; mill wheel and rain reeds | patched coats, wick pins, work boots. |
| First-Song | **Oathchord Almanac** | moss, copper, moon-cream; woven bark and bell bronze | reed-bone d12; formal lyric voice; distant chimes and wind grass | layered cloaks, braided cords, court brooches. |
| Isekai Gate | **Gateglass Register** | pearl gray, signal teal, ember warning; translucent tile | prism d10; calm procedural voice; soft portal hum | practical jackets, route sashes, stamped gloves. |
| Bonded Menagerie | **Trailbond Journal** | leaf green, shell blue, pollen gold; stitched field paper | acorn d6; warm guide voice; creek and meadow insects | ranch scarves, field vests, padded boots. |
| Circuit Arc | **Sparkboard** | lacquer red, brass, ink black; tournament placards | ceramic d20; excitable announcer voice; drums and crowd claps | sleeveless jackets, ribbon belts, wrist wraps. |
| Halo Term | **Lumen Register** | sky white, navy, brass; school slate | brass d12; clear mentor voice; courtyard bells | tailored coats, shoulder pins, practice gloves. |
| Hollow Term | **Marginbook** | ink violet, candle gold, vellum; annotated paper | glass d8; hushed librarian voice; page turns and rain | long cardigans, charm cords, ink-stained sleeves. |
| Starwake | **Starboard Atlas** | midnight, ion blue, warm brass; brushed alloy | magnetic d10; clipped ship voice; engine choir | utility jackets, pressure scarves, rank tabs. |
| Lanceyard | **Yardplate Console** | kiln orange, steel gray, chalk; scuffed enamel | steel d12; mechanic voice; fans and hydraulic clacks | coveralls, heat wraps, frame crew patches. |
| Quarry Pact | **Carver’s Mark** | flint, lichen, rust; carved stone | knucklebone d8; field captain voice; quarry wind | reinforced leathers, tool belts, dust hoods. |
| Sect Ascension | **Cloudstep Codex** | jade smoke, rice paper, silver; lacquered wood | jade d10; measured elder voice; bamboo and distant bells | travel robes, knot cords, soft shoes. |
| Gridrun | **Streetline Terminal** | electric blue, asphalt, magenta; scratched screens | metal d6; street-radio voice; rain on awnings | layered jackets, luminous trims, utility bags. |
| Blackwake | **Tideworn Chart** | tar black, sail cream, storm green; salt wood | whale-bone d12; salt-rough narrator voice; rigging and gulls | oilskins, broad belts, weathered scarves. |
| Night Charter | **Velvet Docket** | wine, charcoal, silver; sealed letters | obsidian d8; intimate court voice; clock ticks and rain | formal coats, gloves, veils, signet jewelry. |
| Badge Circuit | **Civic Signal Board** | beacon yellow, blue, concrete; enamel badges | bright d10; radio dispatcher voice; city siren far-off | practical capes, jackets, street shoes. |
| Dust Line | **Railwrit Ledger** | clay, sage, brass; stamped paper | wooden d12; dry frontier voice; wind and telegraph | dust coats, brim hats, work shirts. |
| Veil Watch | **Steadfast Folio** | lamp gold, peat brown, fog gray; worn notebooks | blackwood d6; cautious witness voice; distant surf and bell | rain cloaks, satchels, lantern straps. |
| Crew Score | **Job Slate** | soot, emerald, paper white; waxed folders | poker-chip d8; brisk planner voice; train rattle | fitted coats, quiet shoes, tool rolls. |
| Hearth Season | **Hearthbook** | apple red, flour cream, garden green; glazed clay | seed d6; cheerful neighbour voice; bees and kettle | aprons, sweaters, garden gloves. |
| Stage Light | **Showbook** | marigold, midnight, mirror silver; velvet cards | star d10; gentle stage-manager voice; tuning instruments | bright jackets, layered skirts, polished shoes. |
| Pitch League | **Matchboard** | grass green, chalk white, sunset orange; stitched leather | stitched d6; upbeat coach voice; crowd murmur | jersey layers, scarves, training shoes. |
| Route Lantern | **Heartroad Map** | candle peach, night blue, paper cream; hand-painted postcards | lantern d8; kind travel voice; footsteps and crickets | soft coats, satchels, ribbon pins. |
| Card Vein | **Foldbook** | ink blue, copper, parchment; embossed card stock | card-cut d10; friendly dealer voice; shuffling paper | vests, sleeves, badge chains, patterned scarves. |

## Kid / teen / mature matrix

| Maturity | Worlds | Social/contents rules |
|---|---|---|
| All-ages | Bonded Menagerie, Hearth Season, Stage Light, Pitch League, Route Lantern, Card Vein. | No sexual content, gore spectacle, drugs, gambling, public stranger chat or paid power. Kid route uses canned phrases/emotes and parent-safe discovery defaults. |
| Teen | Ash Compact, First-Song, Isekai Gate, Circuit Arc, Halo Term, Hollow Term, Starwake, Lanceyard, Quarry Pact, Sect Ascension, Blackwake, Badge Circuit, Dust Line, Crew Score. | Stylised danger and local stakes allowed; no graphic gore or sexual content; report/mute and friends-first co-op. |
| Teen+ | Gridrun, Night Charter, Veil Watch. | Tense crime, court pressure and psychological horror may be implied, never eroticised or gratuitously graphic; no minors exposed to adult social surfaces. |

## Global anti-P2W tests

- [ ] A purchase cannot alter combat, a bond, a collection completion, score, loot rarity, lockout or competitive result.
- [ ] Every premium item maps only to cosmetic/capacity/world-unlock entitlement.
- [ ] Gold and cosmetic-token ledger entries cannot convert to each other.
- [ ] Each shop item has a visible fixed price, entitlement ID, refund path and original-art rights record.
- [ ] Each age mode disables disallowed social/commerce features by server policy, not client UI only.
