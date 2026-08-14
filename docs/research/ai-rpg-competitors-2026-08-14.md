# AI RPG Competitors — Research Note (2026-08-14)

**Purpose:** Market / architecture intel for SynapticGM next update cycle.  
**Status:** Captured and re-confirmed 14 Aug 2026 — John continuing playtest; raise issues before implementing from this note.  
**Apps:** FableAI · Friends & Fables · Summon Worlds · AI Dungeon · Hidden Door  
**Source:** Full competitor research dump (exec summary + deep-dive Q1–Q5 + pitfalls + recommendations) archived in chat and summarized below.

---

## Quick comparison

| Feature | FableAI | Friends & Fables | Summon Worlds | AI Dungeon | Hidden Door |
|--------|---------|------------------|---------------|------------|-------------|
| Platform | iOS/Android native | Browser | iOS/Android (Ionic) | Web + mobile | Browser |
| Memory | Raw context only | Auto-memories ~5 turns + @mentions + pin | Entity graph + Bound Chat | Keyword World Info + Memory + Author's Note | Card engine + structured state |
| Lore structure | None | Relational worlds/NPCs/items/quests | Relational graph + FKs | Flat keyword WI entries | Typed cards (char/loc/item/plot) |
| TTRPG mechanics | None | Full 5e attempt — **math via LLM** | DnD stats as metadata only | None | Light stats + forgiving dice |
| Rules engine | No | No | No | No | Partial (filters + card constraints) |
| Guardrails | Provider safety | Soft @mentions; undo/edit | Bound Chat; NSFW settings | WI + Author's Note; undo/retry | Cards + huge phrase dictionary + classifier + maturity |
| Choices | Free-text only | Free-text + Continue + Attack Panel | Free-text chat | Do/Say/Story/Continue | Curated 2–3 + mediated custom |
| Multiplayer | No | Yes (≤6; friends free under host) | Collaborative worldbuilding | No | No (share highlights) |
| Creator economy | No | Shared worlds (no marketplace) | Discovery + collab publish | Scenarios library | Atlas + revenue share + partners |
| Moderation transparency | N/A | Undocumented | Undocumented “sophisticated” | Opaque / controversial history | Best documented |
| Status | Live | Early access beta | Live | Mature (2019+) | Public ~Aug 2025 |

---

## One-liners

1. **FableAI** — Cautionary: no memory architecture; forgets ~20–30 turns; no mechanics.
2. **Friends & Fables** — Most ambitious AI GM; multiplayer + worldbuilding strong; **LLM-as-rules-engine fails** (wrong dice, dead/alive).
3. **Summon Worlds** — Best lore linking (Bound Chat / entity graph); worldbuilding not live gameplay engine.
4. **AI Dungeon** — Pioneer WI keyword retrieval; flat list not relational; most prompt-hackable; best community WI docs.
5. **Hidden Door** — Most distinct (cards + human beats + filters + creator revenue); still “ungrounded” hidden state + near-always-succeed.

---

## Six common pitfalls (industry)

1. **Memory / context** — Nobody fully solved it; best = structured entities + retrieval; still hallucinate beyond store.
2. **Rules without code engine** — LLM math is unreliable; enforce dice/HP/checks in code.
3. **Ungrounded narrative** — Chest doesn’t have/not-have trap until AI decides; need hidden server state LLM can’t freely rewrite.
4. **Accessibility undocumented** — Universal gap; curated choices > free-text-only for a11y.
5. **Opaque moderation** — Only Hidden Door documents filters/ratings well; trust issue elsewhere.
6. **Free-text trap** — Prompt hacks, mobile friction, a11y; mediate custom input + prefer curated choices.

---

## SynapticGM competitive targets (match or beat)

Refined 14 Aug 2026 with John’s decisions. Goal: keep what we already own, close real gaps so we are **as good or better** than each competitor’s best idea — without copying their failures (LLM-as-rules, ungrounded chests, tier-gated memory).

### Locked product decisions
1. **Loot rarity rolls stay** — when a chest/node/loot table is seeded (dungeon load or interactable spawn), **code** rolls rarity/tier. Replay can yield better gear. LLM narrates the reveal; it does not invent the roll.
2. **Location memory = current + previous** — working context always covers **here** and **the last place left**. Not “every 5 turns of chat fluff”; place-scoped facts so leaving a room doesn’t wipe what just happened there, and arriving doesn’t forget where you came from.

---

### Point-by-point: us vs them → our bar

| # | Competitor idea | SynapticGM bar (match or beat) | Status |
|---|-----------------|--------------------------------|--------|
| **1** | Hidden Door “cards exist” but chests ungrounded | **Pre-seed dungeon/interactable truth in ledger**: layout from templates + AI fill of rooms/mobs/mini-boss/boss/secrets/paths; each lootable gets a **code rarity roll** + contents/trap/secret flags **before** open. GM only narrates. Beats Hidden Door ungrounded state + F&F LLM loot. | Partial (blueprints/nodes/tags exist; pre-rolled loot/trap/secret + rarity dice not closed) |
| **2** | Summon Worlds Bound Chat | **Scene packet + location sheets + lore cards**, plus inject **current location sheet/entities and previous location sheet/entities** every turn. Beat flat AI Dungeon WI by using structured place memory, not keyword-only. | Partial (situation packet + cards; dual-location inject + richer room entity links still open) |
| **3** | F&F auto-memory / AID Memory field | **Place-scoped memory**: timeline facts tagged by location; prompt always gets **current + last location** blocks (NPCs, interactables, exits, recent facts there). Global timeline remains; no tier-gated @mentions. Beats F&F tier limits and FableAI raw-context forget. | Partial (timeline exists; dual-location working set not explicit yet) |
| **4** | Hidden Door mediated custom input | Keep **choices primary**; free-text soft-grounded (`groundPlayerAction`) + **Warden on GM writes**. Next step: consistent block/rewrite of invent-powers / contradict inventory / teleport — without Hidden Door’s inconsistent mediation. | Partial (ground + Warden; full mediation polish later) |
| **5** | FableAI / empty System turns | **Story beat first, then System chrome.** Empty/bridge → GM retry; never canned collage; never System-only. Already patched morning of 14 Aug — playtest verifies. | Done (verify in playtest) |
| **6** | Hidden Door near-always-succeed / F&F LLM dice | **Code owns checks**: d20 + relevant mod (STR now; later skills/practiced moves/professions). Failures narrated with real cost when appropriate; no silent random HP. Beats both “always win” and “Franz rolled a d4.” | Skeleton (fixed DC / STR); skills→DC + sticky costs open |
| **7** | Human beats (Hidden Door) + rails | **Campaign bibles / premades / quest reveal / scene focus** — already stronger open-world LitRPG scaffolding than pure chat apps. Keep densifying beats only where playtest needs it. | Done / ongoing content |
| **8** | A11y gap (all five) | Choice buttons + log structure + portrait alt-text — document lightly when we ship a pass. Differentiator, not blocking dungeon work. | Later |
| **9** | Creator economy / moderation (HD, Summon) | Defer until publishing exists; Kid Mode + filters already started. | Later |

---

### Next-update build order (after playtest issues)

1. **Dungeon / interactable authority** — ✅ implemented 14 Aug 2026: `dungeonSeed.ts` seeds traps/loot/secrets/mobs on enter; **code rarity rolls** by tier; GM narrates via HIDDEN ROOM LEDGER; `item-gain` rarity clamped to seed.
2. **Dual-location memory** — ✅ implemented: `previousLocationSheet` + situation packet CURRENT/PREVIOUS inject + place-scoped facts.
3. **Check math depth** — ✅ skeleton upgraded: `checkMath.ts` maps intent → attr/skill/profession DC (no longer fixed STR/DC12). Sticky HP still via `<damage>` tags only.
4. **Free-text mediation polish** — deferred until playtest shows remaining prompt-hacks.
5. A11y / creator — backlog only.

Do **not** chase: multiplayer-first (F&F), flat WI-only (AID), card-table UX rebuild (HD), raw-context storytelling (FableAI).

---

## SynapticGM — already owned (do not rebuild)

- Code rolls / HP tags / Warden / timeline / situation packet / world ledger
- Campaign bibles + premades + quest reveal / scene focus / action resolution
- GM proxy (`gm-turn`); choices + free-text; turn mandate / anti-hijack
- Story-first / no empty-bridge path (verify live)

---

## Playtest hold

John continuing to play and will raise further issues **before** the next update that implements from this note.

Loot-rarity rolls + current/last location memory are **locked design** for that update. Other rows above wait for playtest priority.

---

## Deep-dive highlights (by app)

### FableAI
- Mobile native; undisclosed LLM; freemium turns + image gen.
- **No** structured lore / RAG / keyword memory — raw context only → forget after ~20–30 turns.
- No sheets, dice, HP, inventory, choices, community, creator economy.
- Cautionary: raw-context-only architecture.

### Friends & Fables
- Browser AI GM “Franz”; multi-model; deepest feature set.
- Memory: auto every ~5 turns + pin + @mentions (tier-gated) + lore dump; still drifts.
- Attempts full 5e **via LLM math** → documented wrong dice / dead-alive bugs; combat unstable.
- Multiplayer ≤6 (friends free under host) = strongest differentiator; combat burns credits hard.
- Worldbuilding suite free/exportable; UI dense; no a11y docs.
- Upcoming “Craft” for power users; F&F stays entry product.

### Summon Worlds
- Ionic mobile; **entity graph + Bound Chat** = best lore injection pattern for LitRPG consistency.
- Stats are metadata only — not a live rules engine.
- Real-time multi-creator worldbuilding + discovery feed.
- Soft Bound Chat / NSFW settings; free-text only; no curated choices.
- Strong perf/cost claims; no a11y docs; mobile-only.

### AI Dungeon
- Pioneer (2019); keyword **World Info** + Memory + Author’s Note; community WI research is deepest public tech doc in set.
- Keyword-only (not semantic); context budget triage; flat list not relational graph.
- Pure freeform; no mechanics; most prompt-hackable; undo/retry/edit.
- Scenarios library; moderation history controversial/opaque.

### Hidden Door
- Not a chatbot: cards + human-authored beats + ML combine + LLM tasks.
- Strongest guardrails: curated choices + mediated custom input + phrase dictionary + classifier + maturity ratings.
- Creator Atlas + revenue share + IP retained by creators + explore highlights.
- Design review (Bicking 2025): **ungrounded** (no hidden properties), near-always success, character over-indexing, flitting scenes, inconsistent mediation, latency.
- Most relevant **card/guardrail** model; still doesn’t fully solve hidden state.

---

## Pricing snapshot (where known)

| App | Model |
|-----|--------|
| FableAI | Freemium turns + sub for unlimited / premium images |
| Friends & Fables | Free 25 turns/day → ~$20–$40/mo; credits for premium models; host pays MP |
| Summon Worlds | Subscription tiers |
| AI Dungeon | Free limited → premium tiers (models, unlimited, images) |
| Hidden Door | Platform sub + creator revenue share (details not fully extracted) |
