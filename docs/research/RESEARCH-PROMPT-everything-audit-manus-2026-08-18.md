# Manus mega-prompt — everything left that helps SynapticGM (2026-08-18)

**Advice before you paste**

| Question | Answer |
|---|---|
| Can Manus compare us to competition? | **Yes** — if you attach a **Current Product Snapshot** (below). Without it, it reviews research fiction, not the real app. |
| Should you finish code updates first? | **Ship the continuity/vibe P0 you already planned *or* paste an honest “shipped vs planned” list.** Don’t wait weeks — Manus free window matters more than perfect polish. Do **not** delay for full comic / own GPU / WOF. |
| Can Manus “review the app”? | **Not by logging in.** It can review: screenshots, screen recording transcripts, research packs, this snapshot, demo scripts, HUD/journal copy. For a true playtest, *you* play and paste logs / failure clips. |
| What Manus is great at now | Competitive teardown, red-team continuity simulations, launch/ops checklists, claim substantiation, UX critique from screenshots, content banks, eval fixture design, money/route stress tests. |
| What Manus cannot do | Run your production build, see private player data, replace counsel, invent true competitor internal metrics, write secrets into the repo. |

**Attach to the Manus project (safe):**
1. This prompt body  
2. `docs/research/memory-cost-maxextract-brief-2026-08-18.md` (or summary)  
3. `docs/research/game-vibe-executive-scorecard-2026-08-18.md`  
4. `docs/research/own-ai-decision-memo-2026-08-18.md`  
5. `docs/research/blowaway-demos-proof-package-2026-08-18.md`  
6. `docs/research/PLAN-OF-ACTION-2026-08-17.md`  
7. 8–20 screenshots: New Game, opening, talk/protest turn, combat receipt, quest journal, HUD Why?, Settings GM voice, Memorable offer, out-of-turns (if any)  
8. Optional: one anonymized debug/event log of a bad turn  

**Do NOT attach:** `.env`, API keys, Stripe secrets, real player emails, Kid Mode PINs, production DB dumps.

---

## COPY FROM HERE INTO A NEW MANUS PROJECT

```text
NEW PROJECT. Unlimited run. Bigger is better. Prefer many complete downloadable files over chat summaries. Empty sections = failure.
Filename prefix: SynapticGM_everything_audit_2026-08-18
Live SynapticGM ONLY. No WOF. No hybrid climate. No patent. No MMO networking redesign.

You are a ruthless product + systems auditor for SynapticGM — a single-player ledger-first AI GM (LitRPG / Story RPG / tabletop / PYOA) aiming to blow away AI RPG rivals on continuity, “it heard me,” fair consequences, and solvent Free→paid economics.

# PRODUCT LAW (do not contradict)

Authority order: player correction → pinned canon / opening invariant → accepted StateTx → SceneManifest → supporting evidence → draft invention.

Already built or building (treat as CURRENT unless the attached Snapshot says otherwise):
- StateTx, SceneManifest, IntentContract + obligation coverage, IntroductionPermit, CampaignContract
- beatFingerprint, HookArc soft-offer guard, leak scanner, ledger revision + speculative retries
- GM voice profiles; quest what-next/provenance; combat receipt; HUD Why?
- Story-start honeymoon turns; Memorable Moments (Classic splash — full comic No-Go near-term)
- Kid Mode filters; ops kill switches; Stripe foundation (not necessarily live Shop)
- Research complete enough: memory/cost maxextract, vibe omnibus, own-AI decision memo, blowaway demos

North star: one visible causal chain — intent → adjudicated outcome → StateTx → scene/HUD → save/entitlement — that holds at 100–500+ turns and feels fluid in chat.

Business: solo founder; save inference money; Free adult web first; Mid/High no ads; Kid ads off; AppLixir only with written OK.

# YOUR MISSION — MAXIMUM EXTRACT (Parts E1–E12)

Produce an omnibus so large and concrete that SynapticGM can stop “more architecture research” and only build + content + counsel.

## E1 — Current vs competition scorecard (PRIMARY)

Compare SynapticGM to at least: AI Dungeon, Friends & Fables, Hidden Door, Summon Worlds, NovelAI/adventure-adjacent if relevant, and 2–3 strong “tabletop AI GM” or LitRPG apps if public info exists.

For EACH competitor and for SynapticGM (from Snapshot + research):
| Dimension | Them | Us (claimed) | Us (evidenced by Snapshot) | Gap | Copy / Avoid / Beat |

Dimensions MUST include: long-campaign continuity, inventory/kit truth, “heard me” dialogue, correction durability, invention control, combat/check fairness, quest clarity, first hour, personality/style, images, monetization fairness, Kid/safety posture, cost-to-serve honesty.

Rules:
- No invented competitor metrics. Cite public docs/help/pages with access dates.
- Separate marketing claims vs evidenced behavior.
- Output a 1-page “can we win?” verdict with the 5 killer differentiators we must prove on camera.

## E2 — Fresh app review (from Snapshot + screenshots)

Act as an outside player + systems designer who has never seen the pitch.

1. First 60 seconds / first 10 turns critique (friction, vibe, trust).
2. Where the UI fails to show the ledger moat (if truth exists but is invisible, we still lose).
3. UX smells: menu-speak, System-as-ChatGPT, recycled beats, soft offers mid-action, jargon leaks.
4. Accessibility / readability Musts for web launch.
5. Prioritized fix list: P0 ship-blockers vs P1 delight vs P2 polish.
6. “If I had 7 days before a closed beta, I would only do X” plan.

## E3 — Continuity red-team simulations (50+ scenarios)

Write executable simulation scripts (tables), not vibes:

- 50-input invention gauntlet
- Correction → session return → still true
- Open ask ignore / soft-reset
- Kit contradiction
- Retry novelty / same-beat resample
- Concurrent stale revision
- Summary/RAG poison attempt (must fail closed)
- Kid Mode escalation
- Personality change without fact change

Each scenario: setup, player inputs, expected StateTx/manifest/obligation outcomes, fail symptoms, automated assert ideas.

## E4 — Playtest protocol John can run tonight

A 90-minute human playtest script across LitRPG + one other mode, with score sheet, failure taxonomy, and what to film for proof clips (align to blowaway demos research).

## E5 — Monetization + cost stress test

Using prior cashflow conclusions (API narrator stays; Warden GPU only later):
- Free cohort economics at 100 / 1k / 10k
- Abuse vectors (retry spam, image spam, honeymoon farming)
- Soft-offer fairness vs rage
- What to measure in CostEvent before any GPU purchase

## E6 — Launch / trust / legal-shaped checklist (COUNSEL flags)

Privacy, Kid Mode public gate, ads, refunds, substantiation of marketing claims, incident kill switches. Mark COUNSEL wherever a lawyer must decide. Do not invent legal advice as settled law.

## E7 — Content & vibe banks (original only)

- Personality notice templates (all profiles × engines) — diction only, no fact mutation
- Opening hook families for Hero Awakening + System Integration-shaped (NO licensed titles)
- Repair/clarification line banks that preserve vibe
- Never-lines per engine

## E8 — Eval harness design

CI-oriented fixture pack outline: golden StateTx traces, prompt-manifest budgets, warden shadow labels, screenshot checklist for release gates.

## E9 — Competitive teardown deep dives

For the top 3 rivals: “how their memory actually works from public info,” failure modes at turn 50–200, and exact SynapticGM counters already in our stack vs still missing.

## E10 — “What Manus still cannot know”

Explicit list of questions that require live telemetry, playtest, or counsel — stop researching those.

## E11 — Master build backlog merge

Merge prior P0s (memory-cost Part G + vibe V10 + Warden MVP) into ONE ranked backlog with dependencies and “done-when” tests. Deduplicate. No WOF.

## E12 — Founder action board (this week / 30 days / 90 days)

Concrete calendar. Include: what to film, what to code, what to buy (nothing GPU until gates), what to ask counsel.

# OUTPUT FORMAT

1. Executive “win conditions” memo (≤2 pages)
2. Files for E1–E12 (markdown) + support CSV/JSON where useful
3. Competitor citation appendix with URLs + access dates
4. Anti-hallucination note: mark SPECULATIVE / COUNSEL / UNVERIFIED
5. Self-check: no WOF; no RAG-as-truth; no “build your own ChatGPT narrator now”; personality cannot override ledger

# CURRENT PRODUCT SNAPSHOT (John fills before upload — keep honest)

```
Date:
Build / commit or “local main”:
Public URL or “local only”:

ENGINES LIVE: litrpg / rpg / dnd / pyoa (yes/no each)
CONTINUITY SHIPPED: StateTx / SceneManifest / IntentContract / CampaignContract / HookArc / beatFingerprint / Why? / combat receipt / leak scanner / GM voice (yes/partial/no)
IMAGES: classic memorable on/off default; comic mode status
AUTH / PAY: Google; tiers free/mid/high; Stripe live? ads live?
KNOWN BROKEN / PLAYTEST PAIN (bullet list from John):
WHAT WE WANT PLAYERS TO SAY AFTER 10 TURNS:
WHAT WE WANT PLAYERS TO SAY AFTER 100 TURNS:
```

Begin maximum research and file generation now. Prefer completeness over brevity.
```

---

## END PROMPT

### After Manus returns
Drop the zip in chat. We’ll ingest under `docs/research/pasted/` and merge into the plan — same as today’s packs.
