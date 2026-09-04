# Owner map — 4×4 T30 (`02n` tapes, `02n4x` critic)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate.  
**Real P0** = same class in **≥2 seeds of one mode** or **≥2 modes**. One-seed CAST tokens are jitter.  
**No new deny-lists. No new SNAPSHOT/CRAFT.**

Sources: `gemini-01`…`gemini-16-*-02n4x-reply.md`  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02n-4x-t30/`  
Seeds 42–45 on stamp `2026-09-02n` (packet diet).

Correction rule (same as 02l / 02k): Gemini defaults to `arcDirector` for legal Fate travel / drought combat. Those are critic misses.

| Class | Seeds / modes | Actual owner | Gemini wrong? | Real? | Ship 02o? |
|---|---|---|---|---|---|
| Hangul/Thai + conversation-log dump committed as story | RPG **s42 T10** (Hangul + `Consulting the FULL 59-line conversation log` + XML schema). 02f Han-only empty missed Hangul. | `hasHanScript` extract-empty + `isTokenSaladLeak` commit | Partial — said `proseWarden` | **YES** (≥2 modes with glued `ikuha`) | **YES** |
| Glued nonce `ikuha` (`heartikuha` / `carefullyikuha`) | LitRPG **s42** + PYOA **s43** | `isTokenSaladLeak` (02h fingerprints missed this vomit) | Partial | **YES** (≥2 modes) | **YES** (same lock) |
| Writer planning notes (`fulfill the obligations` / `Let me write prose, keep it tight`) | D&D **s43 only** | `isWriterMonologueLeak` too narrow (02m wanted `Let me write this with good prose`) | Partial — said `craft` | **NO** (one seed) | **NO** |
| Location “teleport” / scene collage / vault→street | most cells | **Legal Fate travel** + drought/combat. Same Gemini miss as 02l/02k. | **Yes** — `arcDirector` | **NO** (critic) | **NO** |
| Place-as-person (`Chapel` / `the Wren` as actor) | PYOA s44 + s45 | harvest/CAST place leftover (Thornferry class). Shipping a Chapel list is a deny-list. | Partial — said `proseWarden` | weak / PYOA | **NO** (deny-list ban) |
| `Purposeful` / `Not` as CAST names | LitRPG **s42 only** | Lock B harvest adjective | — | **NO** (one seed) | **NO** |
| Clerk invent (`the stranger clerk` / clerk falls into step) | PYOA s42/s43/s44 | 02n dropped CLAIM-GROUNDING *license* only. No pipeline block. | — | diet miss, not a new lock | **NO** |
| LAST PAD labels as narration | none in `story-narration-only` | 02n SNAPSHOT drop held | — | **held** | **NO** |
| Charter burn-then-back / ending-pad loops | PYOA mixed | Lock C + Fate `Accept the ending` pad | Partial | treadmill / one-mode residual | **NO** this batch |

## Packet diet (02n) vs salad / LAST PAD / clerk

- **LAST PAD narration:** helped. Zero `Ask a direct question` / `Press for leverage` / `Wait and watch` hits in narration-only packs.
- **Salad:** did not help. Diet thinned SNAPSHOT lectures; Free still committed Hangul+log dump and `ikuha`. That is extract/commit, not prompt fat.
- **Clerk invent:** did not help. License delete left mill-clerk / stranger-clerk prose in three PYOA seeds.

## 02o ship (this job)

1. **Hangul + Thai → empty-GM** on the live accept path (`hasHanScript` used by `extractChatCompletionText` / `gmProxy` / `aiService`).
2. **Token-salad commit** fingerprints: `Consulting the FULL`, `Respond in the following exact XML`, `ikuha`.

Writer-monologue variant, Chapel/Wren, Purposeful, clerk, travel-as-teleport, ending-pad **not** shipped. No second 16-run.
