# WOF — Multiplayer memory (deploy-ready design)

**Project:** World of Fantasy only. Do **not** implement into live SynapticGM (`src/`, `supabase/`, live prompts).  
**Sources:** Pack 11 §G + §J items 11–13; Gemini MP notes; SP Pack 11 wave shipped 2026-08-15.  
**Prep code:** `wof/src/engine/memory.ts` + scope types in `wof/src/types.ts` (`npm run wof:check`).  
**Status:** Design + isolated stubs. Ready to wire when MP deploy is greenlit.

---

## Locked product rules (never tier-gate)

1. **Code owns truth** — shared server ledger for HP, inventory, quests, room graph, NPC disposition flags.
2. **LLM renders** — per-player or Mode C shared prose only; never invents mechanical outcomes.
3. **Per-player LLM budget** — no host-pays (F&F failure mode). Combat round = 1 turn, same as hub beat.
4. **Memory quality is never tier-gated** — capacity (turns/day) is the monetization lever, not retrieval quality.
5. **Narrative scoped; facts shared** — prose/dialogue stay in player/party/instance/hub scopes; disposition/quest flags live on the shared ledger.

---

## A) Design principles

1. **Single shared world ledger.** Mechanical truth once on the server. All players in scope see the same facts.
2. **Per-player narrative memory stores.** Episodic summaries, pins, PC notes, private conversations — per player.
3. **Every memory entry is scoped:**

```typescript
type MemoryScopeType = 'global' | 'instance' | 'hub' | 'party' | 'player';

interface MemoryScope {
  scopeType: MemoryScopeType;
  scopeId: string;
  // global: rare major world events
  // instance: this dungeon/raid instance (combat, room prose)
  // hub: this hub Place (atmosphere, public NPC lines)
  // party: this party (shared travel / lockstep)
  // player: this player only (solo talk, private thoughts, personal pins)
}
```

---

## B) Private-to-public leak (biggest MP failure mode)

```
Player A private talk with NPC:
  - Prose → Player A memory (scope: player)
  - Disposition change → NPC record on shared ledger (code-owned)
Player B talks to same NPC:
  - Sees fact: "NPC is friendly to another survivor" (if relevant)
  - Does NOT get Player A's transcript in context
```

**Rule:** shared ledger = FACTS. Per-player memory = PROSE.

Prep helper: `wof` `assertNoPrivateLeak(writerPrompt, foreignPlayerProse)` — foreign private lines must not appear.

---

## C) Free-text contradiction → code authority

```
A: "I set the tavern on fire."  B: "I'm sitting peacefully."

1. Intent classify A's action
2. Code checks: fire source? flammable? rules allow?
3. If approved → mechanical FIRE on hub state; ALL hub players get outcome token
4. B's writer gets FIRE_STARTED; narrates accordingly
5. LLM never arbitrates between players
```

Same intent → code check → outcome token pipeline as SP.

---

## D) Prompt layers (per player, Mode A)

When assembling writer prompt for Player X in Instance Y:

| Layer | Content | Scope |
|-------|---------|--------|
| 0 | Engine / world / claim-grounding rules | shared |
| 1 | X's HP/inventory/conditions + shared instance combatants/rooms | player + instance |
| 2 | Situation packet (Place + public NPCs) | instance/hub |
| 3 | X's campaign summary | player |
| 4 | X's unresolved consequences + instance conditions | player + instance |
| 5 | Retrieved episodic: `player(X) + instance(Y) + party(X.party)` — **not** other players' private stores | scoped |
| 6 | X's pins | player |
| 7 | Outcome token (X's action, or shared round in Mode C) | — |

**Never retrieve:** `player_memory(other)` or hub memory for a hub X is not in.

---

## E) Modes & cost (who pays)

### Mode A — personalized (5-man)

- 1 writer call per player per round
- Each player spends 1 turn from **their** TurnLedger
- ~2.5k input + ~500 out each ≈ ~15k tokens / round for 5

### Mode C — shared narration (10-man raid)

- 1 writer call per round; actions summarized
- ~3.5k in + ~800 out ≈ ~4.3k / round (much cheaper per seat)
- Still: no host-pays; accounting can split or meter from each seat's pool per product call

### Gemini companion note (reconcile)

Gemini suggested hub “shared paragraph” to cut desync. **WOF pick:** Mode A personalized for 5-man feel; Mode C shared for raids. Hub can use a **shared atmosphere line** (hub-scoped memory) plus per-player action paragraphs without merging private stores.

### Scaling

- Mechanical state: O(N)
- Episodic: O(N × T) — still small; retrieve scoped
- Prompt assembly: per-player; does not grow with whole shard population

---

## F) Lessons from Friends & Fables

| F&F pattern | WOF pick |
|-------------|----------|
| Auto-memories ~5 turns | Copy — micro summary every 5 turns / location change |
| Retrieval | Copy — **never** tier-gate quality |
| Host pays | Avoid — per-player TurnLedger |
| @mentions | Later v2 for directed actions |
| Combat burns 2–3× credits | Avoid — 1 turn per lockstep round |
| FK world graph | Later — lightweight NPC–Place–Quest edges |

---

## G) SP → MP port map (shipped SP, port when MP deploys)

Live SynapticGM SP (2026-08-15) already has the patterns. WOF MP reuses ideas in `wof/` only — **no live imports**.

| SP (live) | MP (WOF) |
|-----------|----------|
| Claim-grounding directive | Layer 0 shared; scrub per-player output; never invent named entities outside scoped packets |
| Lossless pins before compress | Pins stay **player**-scoped; shared facts → ledger edges |
| Micro summary / 5 turns + location | Player episodic + **instance** arc summaries on room clear / wipe |
| Campaign summary / 50 turns | Per-player campaign paragraph |
| Unresolved consequence ledger | Player threads + **instance** timers (boss phase, fire, doors) |
| Warden invent scrub | Run after each writer call; Mode C scrub against shared instance allowlist |

---

## H) MP-ready backlog (quarantined until MP greenlight)

| # | Item | Notes |
|---|------|--------|
| MP-1 | **MemoryScope on every entry** | Types stubbed in `wof` |
| MP-2 | **Scoped retrieve + prompt assembly** | `assembleMpTruthStack` stub |
| MP-3 | **Shared ledger vs narrative stores** | EncounterLedger already code-owned; narrative stores separate |
| MP-4 | **Leak tests** | Private prose of A absent from B's stack |
| MP-5 | **Mode A / Mode C writers** | Fan-out vs single shared paragraph (see pack-09) |
| MP-6 | **Episodic RAG later** | Tag + semantic; still never tier-gate |
| MP-7 | **Knowledge graph edges** | Code writes on structured events only |
| MP-8 | **Eval: MP leakage rate &lt; 1%** | Golden two-player scripts |

---

## I) Architecture diagram

```
                    +------------------------------+
                    |   SERVER (authoritative)     |
                    |  SHARED WORLD LEDGER         |
                    |  HP, inventory, quests,      |
                    |  encounter, rooms, NPC flags |
                    +------+---------------+-------+
                           |               |
                    +------v------+ +------v------+
                    | INSTANCE    | | HUB MEMORY  |
                    | MEMORY      | | (atmosphere)|
                    +------+------+ +------+------+
                           |               |
         +-----------------+---------------+-----------------+
         |                 |               |                 |
    +----v-----+     +-----v----+     +----v-----+
    | PLAYER A |     | PLAYER B |     | PLAYER C |
    | episodic |     | episodic |     | episodic |
    | campaign |     | campaign |     | campaign |
    | pins     |     | pins     |     | pins     |
    +----+-----+     +-----+----+     +----+-----+
         |                 |               |
         +--------+--------+-------+-------+
                  |                |
           PROMPT ASSEMBLY (per player)
           Layers 0–7, scoped retrieve only
```

---

## J) Related WOF packs

- [pack-09-text-multiplayer-dungeons-raids-2026-08-14.md](./pack-09-text-multiplayer-dungeons-raids-2026-08-14.md) — instances, fan-out, cost
- [pack-12-realtime-group-sync-2026-08-15.md](./pack-12-realtime-group-sync-2026-08-15.md) — lockstep vs wall clock
- [pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md](./pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md) — per-seat billing
- Live source: `docs/research/pack-11-long-memory-antihallucination-sp-mp-2026-08.md` §G

**Do not** copy this into live SynapticGM until a dedicated WOF MP wave.
