# Bolt prompt — remaining live holes (locality, kit, place harvest, turn cost)

Paste the block below into bolt.new. After it finishes, download `SGM_Remaining_Live_Holes_Dump.md` and drop it in chat. Archive as `docs/research/pack-13-remaining-live-holes-YYYY-MM-DD.md`.

This is LIVE SynapticGM only. Not WOF.

---

```
You are writing research for SynapticGM, the LIVE single-player AI GM. This is NOT WOF and NOT a later MMO. Do not write app/production code. Do not import licensed settings (no Warcraft, Pokémon, Palworld, Middle-earth, Blizzard, Wizards of the Coast product names, or official D&D monster/spell lists). Use original names or public-domain/SRD-safe generic terms only.

FILE OUTPUT (mandatory — bolt.new)
1. Create a NEW file at the project root named exactly: SGM_Remaining_Live_Holes_Dump.md
2. Put the ENTIRE dump in that file (not only in chat).
3. When done, tell the user: "Download SGM_Remaining_Live_Holes_Dump.md from the bolt.new file tree."
4. Do not split across multiple files. One markdown file only.
5. No React/Vite/Supabase implementation. Schemas, allowlists, beat contracts, do/don't rules, and copy banks only.

LOCKED (do not reopen or contradict)
- Code owns dice, HP, XP, loot, kit, room graph, mob counts, quest reveal, and choices. The LLM writes this turn's camera only (2–6 new sentences).
- Turn shape: intent → hidden-state check → code math/ledger → outcome token → writer → code warden → story first, then System chrome → choices from the committed beat.
- Dual-AI max: 1 writer + optional cheap rewrite. Warden is CODE. Do not add a third model to the happy path.
- Unique story every turn. No canned "just ahead of you" / look-around collage.
- Engine mode ⊥ visual mode. Images are PURE ART. World canon overrides art preset.
- Opening journal stays empty until name + place. First Blood / Wave are LitRPG-only.
- Never sell combat outcomes.
- Kid Mode: swear swap + PIN; slurs masked.
- D&D: SRD-safe generics only. Never "Dungeons & Dragons", "D&D", "Dungeon Master", Forgotten Realms, or licensed monster text.
- Do NOT redesign After First Blood, street NPC, salvage loop, or fight verbs — those already live in pack-11. You may reference them; do not rewrite them.

WHAT ALREADY EXISTS (do not redesign from zero)
- Opening registrar asks name, place, then clothes. materializeWornClothes / parseWornPieces splits some garments but copies the FULL appearance string onto every item.description.
- extractNamedPlaces harvests "toward X" / branded shop nouns from prose — this produced map pins named Chaos, Disbelief, Your Palm, Parse Designation, Registration, Eye Level.
- Portrait pipeline exists (paperDollPrompt) but the doll can stay "Portrait pending" after clothes are accepted.
- Happy-path turn already does: intent, ledger combat, outcome token, callGm, optional empty-story retries (up to 2), optional Graphic Novel Director if GM panels are unusable, optional choice regeneration, code warden, then sequential image jobs.
- Place name is stored (currentLocation / locationSheet). There is NO country / firearms / traffic / shop-type contract from that name.

PLAYTEST FACTS (treat as ground truth — Jax, 15 Aug 2026, UK)
- Clothes: Metallica t-shirt, baggy black jeans, Doc Martens; refused underwear as protest. Registrar looped “visual profile incomplete.”
- Equipped cards: Boots / "Tshirt Baggy Black Jeans" / "Mettalica Tshirt" each listed the whole utterance; jeans also ate backpack, phone, headphones, leatherman, keys.
- Portrait stayed “Portrait pending.”
- Local map ~1km pins: Chaos, Disbelief, Your Palm, Parse Designation, Eye Level, Registration.
- “Eye Level” is NOT a shop. It is the System panel hanging at eye height. Harvest made it the location; entering narrated “the Eye Level store.”
- Opening prose: a woman screams as her pistol jams mid-reload on a UK street. Wrong. UK civilians do not carry handguns on the pavement. A rifle or shotgun can appear on a farm, at a police station, or at an army barracks.
- Settings = second person. Writer still used “Jax steps… their grip…”
- Overlay hung several minutes on “Synthesizing next event / Weaving narrative threads.” No cancel. Refresh lost the finished store-entrance turn (back to Day 0.0 street).
- Writer repeated “the knife feels reassuring” across turns. Asked “what is the metallic glint i see” — reply: “might be nothing” + another knife line. Did not name the object.
- System showed “Tutorial: first sticky failure registered” on that look. HP still 24/24. A question is not a fail.

WHAT TO WRITE
Be specific enough to implement later. TypeScript-like interfaces where useful. Mark v1 vs later. Cite public methodology only (no licensed adventure text).

## 1) Locality / world-knowledge grounding
How the named place (player-said town, street, country) binds what the writer may put in the camera.
- Derive a LocalityToken from the place string: country/region, urban vs rural, civilian firearms norm, typical shops, vehicles, emergency services, slang register.
- UK / Ireland / AU / US / JP examples as TABLES of allowed vs forbidden street props (not a world encyclopedia).
- Firearms rule: civilian carry is NOT default. Only show a gun if the locality + scene type allows it (farm, police, barracks, licensed range) OR the ledger already has that item.
- Do not US-default a UK street (open-carry pistol, "sidewalk" gunfight, branded US chains the player did not name).
- Do not invent a Tesco / McDonald's / named chain unless the player named it or the Place record has it.
- How locality is injected: code token in the writer prompt, not "the model should remember".
- Failure modes: pistol-on-High-Street, katana-in-Peterborough, yellow-taxi-in-Manchester, dollar-prices in the UK.

## 2) Place-harvest allowlist (map pins)
Code currently scrapes noun phrases. Write the filter so pins are real places.
- ALLOW: player-named streets, shops, stations, parks, pubs, farms, barracks, "the Co-op on Lincoln Road" if they said it.
- DENY: body parts (palm, eye), camera height (“eye level”), emotions (chaos, disbelief), System/registrar words (registration, designation, parse, integration), generic "the street", quest titles, item names. “Eye level” stays description only — never a Place name or shop.
- Minimum evidence: the player typed it, OR it is on the Place record, OR it is a well-formed proper street/shop pattern (N street types, branded suffix list).
- If nothing passes: map shows "You are here" only. Do not invent 8 junk pins to fill "Places: 8".
- How this interacts with outdoor street map vs indoor fog dungeon (already locked).

## 3) Opening kit + portrait contract
How a natural clothes answer becomes inventory + a face.
- Split one utterance into discrete items: chest / legs / feet / bag extras (backpack, phone, headphones, multitool, keys).
- Each item: short name (Metallica T-shirt) + description of THAT piece only. Never paste the full sentence onto every card.
- Protest / perv / underwear refusal is NOT a missing garment and NOT an item.
- Insults are not clothes (already locked).
- When portrait generates: as soon as name + at least one garment or a look sentence exists. Do not wait for underwear. Do not stay on "Portrait pending" if a look exists.
- Icons: one prompt per item, that item only, world-canon era.
- Failure modes: "Tshirt Baggy Black Jeans" as one legs item; keys described as jeans; portrait never fires; registrar loops "visual profile incomplete".

## 4) Turn efficiency (maximise the happy path)
Goal: most turns = 1 writer call + 0 image-block on the input box. Pictures after commit.
- Happy path budget: 1 writer LLM. Optional 1 cheap rewrite ONLY for rating/Kid Mode or empty-body. Never a third text model on the happy path.
- CUT from happy path: Graphic Novel Director, choice-regeneration LLM. Code derives panels from the outcome token + 2–6 sentences. Code pads 3 choices from the committed beat.
- KEEP: empty-story retry (max 1, not 2) when there is truly no body. After that, refuse the turn (already exists) rather than a third writer call.
- Images: sequential, after commit, skip if no story. Do not hold the text box.
- What the writer must emit vs what code fills (panels, choices, system-log lines, image prompts).
- Token budget: situation packet already ~2k. Do not add a second memory model. LocalityToken + kit list + outcome token only.
- Latency table: estimate writer / retry / director / choice-regen / 1–3 images. Mark which cuts save the most time.
- Failure modes: Director 20s stall; choice regen inventing a new beat; double retry on a fact-lock that code can strip locally.
- Hung overlay: client timeout on gm-turn (none today). Cancel / Rewind must clear busy. After ~15s show diegetic “still thinking,” never an endless spinner.
- Persist the committed snapshot before the overlay can sit. Continue must not load an older cloud over a newer local. HUD shows last-saved turn.
- Writer must answer the asked beat (the glint). No leftover stock (“reassuring knife”). Honor settings.perspective (you/your when second person).
- Tutorial System lines only when the ledger actually changed (HP, condition, closed approach). Never “sticky fail” on a look with full HP.

## 5) Do not write
- After First Blood beat sheet (pack-11 already has it).
- Street named-local memory (pack-11).
- Fight verb list / stamina numbers (pack-11).
- Full D&D spell-slot / death-save / initiative UI (pack-12 later).
- WOF multiplayer, housing, auction, races, places.
- A new image pipeline from zero.
- OCR text-in-image.

END with a one-page Do Not Break checklist for these four holes only.
```
