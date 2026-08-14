# Pack 7 — Mediated Free-Text + Content Ratings UX (2026-08-14)

**Status:** Captured for end-of-packs summary. Do not implement until John asks.  
**Scope:** Rewrite vs block vs allow; maturity ratings; diegetic System messaging; hate vs casual swears.

Aligns with Kid Mode / filterLogic already started — extend, don’t replace.

---

## 1) Comparison

| Pattern | Source | Copy / avoid |
|---------|--------|--------------|
| 3-tier AI safety | AI Dungeon | **Copy** tiers; **avoid** lumping all mature together |
| Human review of private stories | AID 2021 | **Avoid** — automated only |
| No free-text | Realms of Rapture | **Avoid** as only mode — choices primary, free-text secondary |
| Keyword → LLM-as-judge | DigitalApplied 2026 | **Copy** tiered pipeline |
| Content ratings for discovery | AID | **Copy** for future share; SP = player preference |
| Prompt injection | General | Mediate **before** LLM |

---

## 2) Input categories (default action)

| Category | Action |
|----------|--------|
| Valid game action | Allow |
| Valid + casual profanity | Allow if language toggle permits |
| OOC meta | Rewrite / clarify |
| Prompt injection | Block |
| Violence / sex above rating | Rewrite (tone / fade-to-black) |
| Hate speech | Block always |
| CSAM / minors sexualization | Block always |
| Real-world self-harm | Block + crisis resources (988) |
| Real-world violence threats | Block |
| Griefing | Rewrite / brief prompt |
| Creative unusual | Allow (likely fail narratively) |
| Contradicts game state | Rewrite to fail / alternative |

---

## 3) Messaging principles

Never lecture · never break fiction for rating rewrites · one sentence · offer path forward · never shame.

Rewrites = **diegetic** (“System interprets…”).  
Blocks = **non-diegetic** brief (“That action isn’t available.”).  
Self-harm = only case with real-world resources + soft in-world continue.

Rewrite flow: show interpreted intent → Proceed? / try else — don’t show diff of original.

---

## 4) Maturity model

**Base:** `pg13` (default) | `mature` (opt-in)

**Toggles:** violenceDetail · language · sexualContent · substanceUse · darkThemes

**Hard limits (always):** CSAM · hate speech · real-world self-harm · real-world threats · doxxing/PII

Player never directs hate speech even at 18+. LLM may depict prejudice in NPC narration at 18+ only (`darkThemes: explored`).

---

## 5) Hate vs casual swears

| Type | Action |
|------|--------|
| Casual intensifiers (fuck/shit/hell) | Language toggle |
| In-character hostility to NPCs | Allow (conflict) |
| Slurs / protected-group harassment | Block always |
| Slurs at game/AI | Block |
| NPC slur in narration | 18+ explored only; strip at PG-13 |

Code owns slur list (whole-word, not substring). Never pass list to LLM. Kid Mode silly-swap stays for casual swears.

---

## 6) Pipeline

```
Input → [1] Hard block (slurs/CSAM/self-harm/threats/injection)
     → [2] Rating compliance rewrite
     → [3] Game state validation (inventory/scene)
     → [4] Allow → LLM
     → [5] Post-filter LLM output to rating
     → [6] Story → System chrome
```

---

## SynapticGM backlog from this pack (≤10)

1. Wire maturity settings (tier + toggles) into Settings / contentMode.  
2. Pre-LLM hard-block layer (injection, hate, CSAM, self-harm, threats).  
3. Rating rewrite + confirm (“System interprets…”).  
4. Extend `groundPlayerAction` for OOC meta + state contradiction.  
5. Post-filter GM output to rating (violence/language/sex).  
6. Keep Kid Mode swear-swap for casual; hate stays mask/block.  
7. Self-harm → 988 / findahelpline + soft continue.  
8. Diegetic vs non-diegetic message templates.  
9. Whole-word slur list + false-positive allowlist.  
10. Prompt rules for rating-aware narration.

---

## Sources (accessed Aug 14, 2026)

AID content safety FAQ / Wikipedia · Realms of Rapture JAVAPRO · DigitalApplied / Musubi / EdenAI moderation · OpenAI Moderation API · r/litrpg System discussion

---

## Delta vs current

Have: `contentMode`, Kid Mode filterLogic, soft `groundPlayerAction`, Warden.  
Need: full pre/post pipeline, maturity toggles, diegetic rewrite UX, hard-block classes, injection strip.
