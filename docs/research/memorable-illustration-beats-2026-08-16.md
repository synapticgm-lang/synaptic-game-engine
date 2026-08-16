# Memorable illustration beats — when art should fire (16 Aug 2026)

**Status:** Research + recommendation only. Do **not** implement until John asks. Live game (not WOF).

**Question:** When should Classic Text “memorable moment” splashes appear — not every turn, but reliably enough that the toggle actually pops? Is the first scene a good one?

**Short answer:** Yes — an opening establishing splash is the most widely shared convention across comics, webtoons, illustrated novels, CYOA chapter plates, LitRPG/isekai arrival art, and D&D session-start boxed text. Current live SynapticGM does **not** guarantee that beat. Art only fires if the writer emits `<milestone-event>`, New Game often starts with memorable **off**, and the prompt says “use rarely.”

---

## 1) Live behaviour today (code + prior research)

### What actually generates a splash

| Layer | What it does |
|-------|----------------|
| Writer prompt | `PUBLISHING_ENGINE_INSTRUCTIONS` in `src/game/systemPrompt.ts`: emit `<milestone-event prompt="…"/>` for a “major, book-worthy story beat (a boss reveal, a huge discovery, a turning point).” **“Use this rarely — not every turn.”** Opening scene is not listed. |
| Parser | `eventsToMilestone()` in `src/game/parser.ts` — at most one tag per turn. |
| Gate | `allowsImageGeneration()` in `src/game/comicImagePrompt.ts` — classic mode only if `classicMemorableImages` **and** kind is `milestone-illustration`. |
| Turn pipeline | `useGame.ts` enqueues the splash only when that tag exists **and** the turn has a story body. |
| Caps | `subscriptionTiers.ts`: memorable **5 / 20 / 40 per week** (Free / Mid / High). `capacityLedger.ts` burns `memorable` on splash. Pack-12b: memorable is **not sold** as a pack — it rides on a text turn. |

There is **no code-owned “this is a first scene / first kill / death” list**. If the writer stays quiet, the player gets **zero** art even with the toggle on.

### Defaults conflict (why it often never pops)

| Place | `classicMemorableImages` |
|-------|--------------------------|
| `src/game/defaults.ts` | **true** (settings default) |
| `src/components/NewGameModal.tsx` | `useState(false)` — New Game checkbox **starts off** |
| Settings copy | “milestones, first kills, and legendary drops” |

A player who picks Classic Text and never ticks the box never sees a splash. A player who ticks it still depends on the writer noticing a “book-worthy” beat.

### Pack 12 already specified a richer list — not wired

From `docs/research/pack-12-visual-tabletop-dump-2026-08-15.md`:

- Classic memorable: **0–1 image per turn**, **5–10 splashes per session**.
- Session budget (speculative): 15 min → 1–2; 45 min → 3–5; 90 min → 5–8.
- Milestone table: first kill, level up, boss start/defeat, death, quest complete, new location, rest, key NPC, rare item, nat 20 (D&D), Integration/Wave (LitRPG), climax/reveal (story RPG).
- **Opening scene is missing from that classic table.** Comic mode *does* say “Opening: 1 establishing panel.” Classic memorable never got the equivalent.

Pack 12 vs live prompt: pack 12 is a **typed event list**; live is **writer judgement + “rarely.”**

---

## 2) What other formats do

Consensus across media: **art is punctuation, not wallpaper.** Rarity is the point. The first page / first chapter / first session is the one place almost everyone *does* spend a picture.

### Almost always (ranked)

| Beat | Who uses it | Why |
|------|-------------|-----|
| **Opening / establishing shot** | Comics splash page 1; webtoon episode hook; illustrated-novel ch.1 plate; CYOA chapter-start image; Questas “every episode opens with a wide establishing still”; D&D boxed read-aloud at session start; isekai summon-circle key art | Teaches the world before the player has a mental picture. |
| **First appearance of an important character** | VN event CG (“first encounters”); CoG forum: show NPC art **when they first appear**, not later; Questas character intros | Locks a face before imagination hardens the wrong way. |
| **Climax / ending / death / confession** | VN CGs; comic end-of-issue splash; webtoon cliffhanger oversized panel; Folio plates at emotional peaks | The image is the souvenir of the story. |
| **Chapter / session open** | Illustrated chapter books (vignette at each chapter); CoG `*text_image` chapter headers; Foundry Segue / scene cards | A rhythm the reader can trust without illustrating every paragraph. |

### Often

| Beat | Who |
|------|-----|
| New significant location | Imagina turn-images examples; aiga_ “new location”; Questas establishing stills; D&D scene boxed text |
| First combat / boss entrance / boss fall | Pack 12; Foundry cinematic cut-ins (boss intro, victory); Friends & Fables “boss kills, dramatic reveals” |
| Major reveal / turning point | VN “revelations that reframe the story”; Questas midpoint shift; Imagina “dramatic reveal” |
| LitRPG Integration / first System window / isekai arrival | Genre key-art (summon circle, HUD-as-moment). In-repo: `docs/research/opening-starts-by-genre-2026-08-15.md` — street first, then the box as a *moment*; isekai: arrive in the circle |

### Rarely / do not

| Beat | Who says no |
|------|-------------|
| Every line / every turn | VN Paths: “a CG every few scenes quickly loses impact”; Imagina: “handful of illustrated moments, not one per turn”; aiga_: Storybook/periodic beat every-event |
| Mid-conversation reaction shots | VN sprites handle this; CGs are for the special frame |
| Routine loot, rest, travel, planning | Questas: light nodes = text + reuse; aiga_: dialogue/combat exchanges shouldn’t wait on art |
| Player-character portrait as the *only* art | CoG authors: MC portraits clash with self-insert; prefer NPC / scene / silhouette |

### Density benchmarks (not every-turn)

| Format | Typical density |
|--------|-----------------|
| VN event CGs | Adult titles ~15–25 CGs **per whole game**; indie “a handful”; DDLC 10 major CGs. Lemma Soft: one CG per route/ending is a player-expected floor. |
| Illustrated chapter book | ~1 illustration per 4–6 pages; **4–8 full-page plates per book**; vignette at chapter start (DesignKompanie). Adult Folio: e.g. Neverwhere 9 colour illos + chapter headings; Clash of Kings 6 full-page + 2 spreads **per volume**. |
| CYOA / Hosted Games | No required *in-story* art. Authors who add it: **chapter start or ~4 per “issue”**, spaced evenly, at text breaks — not mid-paragraph ([CoG forum](https://forum.choiceofgames.com/t/illustrations-in-games/23763)). Store **splash screens** are a launch asset, not gameplay. |
| AI story games | Imagina: AI picks beats (first meeting, reveal, new location) + **cooldown ~1 image / 2 turns**; typical journey = a handful. aiga_: Text-only / Storybook / Periodic / Every-event. Questas micro-adventure: **1 opening still + 2–3 medium + 1 climax loop**. Friends & Fables: **player-triggered** snapshots (any time), not auto every turn. AI Dungeon “See”: **player-requested**, not automatic. |
| Pack 12 (us) | 5–10 / session; 3–5 in a 45-min sit. Weekly caps 5/20/40. |

---

## 3) Is the first scene standard? **Yes.**

John’s instinct matches the majority:

1. **Comics.** Denny O’Neil (via Sequart): the splash is **page one** — title, setting, mood, hook. Later “splash anywhere” exists, but the original job is the open. Jack Kirby pushed *starting the story on page one* rather than a flash-forward teaser ([News From ME](https://www.newsfromme.com/2018/02/12/ask-me-42/)).
2. **Webtoons.** Episode 1’s first panels are the hook; slow setup loses readers by panel 5 ([Comicory](https://www.comicory.com/blog/how-to-make-a-webtoon)). WEBTOON handbook: vertical format is cinematic — first impression sells the story.
3. **Illustrated novels.** Chapter 1 plate + optional character lineup; later plates at climaxes, not every page.
4. **CYOA.** Chapter-open scene plates are the most-liked placement; “under the chapter title, before body text” for settings ([CoG thread](https://forum.choiceofgames.com/t/illustrations-in-games/23763)).
5. **LitRPG / isekai.** The arrival / summon circle / first System window **is** the poster. In-repo openings research: drop into the crisis; weave the box as a moment — that moment is exactly splash-worthy.
6. **Tabletop.** Modules open with boxed read-aloud (a verbal splash). Foundry modules add intro cinematics, scene cards, location reveals — not every chat line.

**Caveat (conflict):** Some CYOA readers actively hate in-story art because it overwrites imagination ([poison_mara](https://forum.choiceofgames.com/t/illustrations-in-games/23763) on that thread). That is why memorable should stay a **toggle**, defaulting on for players who opted into Classic+memorable, off for pure-text. Scene/setting plates at the open are less contentious than locking the player’s face.

**When not to splash the “first scene”:** if the opening is still a covering question with no visual (name/look not yet written). Wait until `sceneWritten` / a real location exists — same rule as current “skip images with no story body.”

---

## 4) Recommended SynapticGM set

Goal: **not every turn**, but if Memorable is on, the **first hour always proves it**.

### Hard rules (code should own these — writer cannot forget)

Fire at most one splash per turn, respect weekly cap, skip if no story body.

| # | Beat | Why hard |
|---|------|----------|
| 1 | **Opening scene** — first GM turn that actually writes the world (after covering, once there is a place/look to draw) | Universal establishing shot; proves the feature. |
| 2 | **Character death** (PC down / campaign-ending death) | VN + pack 12 high; once-per-life. |
| 3 | **Ending / climax plate** (campaign complete, PYOA honest ending) | VN ending CG; comic last-page splash. |
| 4 | **First Legendary+ drop** | Already a separate `loot-video` path; still counts as a memorable. |

Engine flavour on the **same** opening splash (don’t add extra images):

- LitRPG: street + first System window as one composition (chrome stays out of the art — overlay later).
- Isekai: circle / arrival.
- PYOA / mystery: the crisis already in progress (body on the rug, bulkhead failing).
- D&D: the boxed-read-aloud room.

### Soft rules (writer tag **or** code hints, budget-gated)

After the opener, remaining weekly budget (Free has **4 left** after the open):

| Priority | Beat | Notes |
|----------|------|--------|
| High | First named NPC (the one who will recur) | Show **when they appear**, not three chapters later (CoG consensus). |
| High | First combat / first kill | Pack 12 high; skip trash-only if budget is tight. |
| High | Boss start **or** boss fall (pick one per boss, not both unless High tier) | Foundry cut-in analogue. |
| High | LitRPG Integration / Wave; D&D nat-20 only if nothing else fired this session | Pack 12. |
| Medium | New significant location (first time, named, not “the street again”) | Imagina / aiga_. |
| Medium | Quest complete / story reveal / confession | VN punctuation. |
| Low | Rest, rare item, “pretty sunset” | Only if budget leftover; pack 12 already marked these low. |

### Cadence so it “pops” without becoming comic mode

| Constraint | Value | Source |
|------------|--------|--------|
| Per turn | 0 or 1 | Already live (`MAX_MILESTONE_IMAGES_PER_TURN`) |
| Cooldown | **No splash on the next 2–3 story turns** after one fires (except death/ending) | Imagina ~1 / 2 turns |
| First session | **Opener + one more** (NPC or first fight) | Questas 1 open + 2–3 medium; pack 12 15-min = 1–2 |
| Standard session (~45 min / ~12–20 turns) | **2–4** total | Pack 12 3–5; keep Free week (5) honest |
| Weekly | Honour 5 / 20 / 40 | Already live |

Free-tier maths: 12 text turns/day × 7 ≈ 84 turns/week, **5 splashes** ≈ one every ~17 turns. That is VN-like punctuation. The opener spends 1 of 5 immediately so the feature is visible on New Game night.

### Writer vs code (don’t rely on “rarely” alone)

Live prompt examples are **boss / discovery / turning point** — the model will skip the opening because it does not sound “epic” yet.

Recommendation when implementing later:

1. **Code-forced opener** (and death/ending).
2. Keep `<milestone-event>` for soft beats.
3. Optionally inject a one-line hint: “If this turn is the first named NPC or first fight and no splash this session, emit the tag.”
4. Do **not** ask the writer to illustrate every location change.

---

## 5) How this compares to live

| | Pack 12 spec | Live now | This note |
|--|--------------|----------|-----------|
| Who decides | Typed milestone list | Writer tag only | Hard code list + writer soft tags |
| Opening splash | Comic establishing panel only; **classic list omits it** | Not mentioned in prompt | **Always**, once the scene exists |
| New Game toggle | — | Checkbox **defaults off** | If memorable is the product of Classic, default **on** (or match `defaults.ts`) |
| Density | 5–10 / session | Whatever the writer feels + weekly cap | Opener + cooldown; 2–4 / session; cap still 5/20/40 |
| Failure mode | — | Toggle on, **zero images** all night | Impossible if opener is hard |

---

## 6) Conflicts (don’t hide them)

- **CYOA purists vs VN/comic readers.** Some Hosted Games players refuse character art. Scene-open plates are the compromise; keep the off switch.
- **Show NPC at first appearance vs after description.** CoG: Jacic — show early or it jars; ruhenri — scenery before text is fine, **characters after** the prose so imagination goes first. For SynapticGM, splash **with** the introducing paragraph (image under the prose, as now), not a silent splash before any text.
- **AI Dungeon / NovelAI / F&F** mostly use **player-requested** “See” / snapshot. Auto-Storybook (Imagina, aiga_, pack 12) is closer to what John wants. Don’t copy “press See every time you want a picture” as the default — that’s another product.
- **Pack 12 rest scenes / nat 20 as milestones** vs VN “CGs only for the unrepeatable instant.” Treat rest/nat-20 as **low** so they don’t eat the Free week.

---

## 7) Sources

### In-repo

| File | Used for |
|------|----------|
| `docs/research/pack-12-visual-tabletop-dump-2026-08-15.md` | Milestone table, 5–10/session, comic opening panel, classic = prose between splashes |
| `docs/research/RESEARCH-PROMPT-visual-tabletop-bolt.md` | Classic memorable-only vs comic every turn |
| `docs/research/pack-12-subscription-tiers-models-2026-08-16.md` | Weekly 5/20/40 |
| `docs/research/pack-12b-capacity-packs-2026-08-16.md` | Memorable included on milestone turns, not sold |
| `docs/research/opening-starts-by-genre-2026-08-15.md` | LitRPG box-as-moment; isekai circle; CYOA drop-into-crisis |
| `src/game/systemPrompt.ts` | `PUBLISHING_ENGINE_INSTRUCTIONS` rare writer tag |
| `src/game/useGame.ts`, `parser.ts`, `comicImagePrompt.ts` | Tag → job → gate |
| `src/components/NewGameModal.tsx` | Memorable default **false** |
| `src/game/defaults.ts` | Settings default **true** |
| `src/game/subscriptionTiers.ts`, `capacityLedger.ts` | Caps |

### Web (accessed 16 Aug 2026)

| Source | URL | Takeaway |
|--------|-----|----------|
| VN Paths — What CG stands for | https://vnpaths.com/what-does-cg-stand-for-in-visual-novels/ | CGs = punctuation; first meetings, confessions, climaxes, deaths; too many = none special |
| VNDev Wiki — Event CG | https://vndev.wiki/Event_CG | First kisses, high-stakes action, first encounters; reserved for special events |
| Fuwanovel — Event CGs anatomy | https://forums.fuwanovel.moe/blogs/entry/4209-event-cgs-an-anatomy-of-visual-novels/ | Infrequency is the impact; camera tricks reuse one CG |
| Lemma Soft — how many CGs | https://lemmasoft.renai.us/forums/viewtopic.php?t=37987 | Indie: handful; player floor ~1 CG per ending |
| Gitnux VN stats | https://gitnux.org/visual-novel-industry-statistics/ | Adult VNs ~15–25 CGs per title |
| CoG Hosted Games writer guide | https://www.choiceofgames.com/looking-for-writers/write-a-hosted-game/ | Required **store** splashes; in-game art optional |
| CoG — Illustrations in games | https://forum.choiceofgames.com/t/illustrations-in-games/23763 | Chapter start / ~4 per issue; even spacing; NPC art at first appearance; some players hate art |
| ChoiceScript `*image` | https://www.choiceofgames.com/make-your-own-games/important-choicescript-commands-and-techniques/ | Images sit in the main narrative |
| DesignKompanie chapter books | https://www.designkompanie.com/services/childrens-chapter-book-illustration | Vignette per chapter; 4–8 plates; climax plate |
| Folio Society (Neverwhere, Clash of Kings, etc.) | e.g. https://www.foliosociety.com/usa/neverwhere | Sparse colour plates + chapter ornaments, not every page |
| Sequart — Art of the Hook | http://sequart.org/magazine/6146/the-art-of-the-hook/ | Splash = first page, mood + setting |
| News From ME — Splash pages | https://www.newsfromme.com/2018/02/12/ask-me-42/ | Splash originally page-one hook; later any full-page panel |
| Splash Pages club | https://splashpagescomicbookclub.com/comic-book-guides/what-is-a-splash-page-in-a-comic-book/ | Intro + cliffhanger; first appearance; don’t overuse |
| Comicory webtoon guide | https://www.comicory.com/blog/how-to-make-a-webtoon | Cold open; first 40 panels land the incident |
| WEBTOON creator handbook | https://webtoons-static.pstatic.net/creator101/en/pdf/Creators-Resource-Handbook-Updated.pdf | First impression / thumbnail sells the story |
| Imagina — turn images | https://playimagina.com/help/turn-images | First meeting / reveal / new location; cooldown; handful per journey; **off by default** |
| aiga_ illustrated AI RPGs | https://www.aiga.io/blog/ai-art-interactive-fiction | Storybook vs every-event; art at reveal, new location, intro |
| Questas visual pacing | https://blog.questas.co/show-dont-tell-using-ai-images-and-short-video-loops-to-pace-your-questas-story-beats | 1 visual per 1–3 key beats; **always an opening still**; loops only at turning points |
| Friends & Fables scene gen | https://help.fables.gg/articles/5067807-in-game-scene-image-generation | Player snapshot for bosses/reveals — not auto every turn |
| AI Dungeon See | https://help.aidungeon.com/faq/how-do-i-create-pictures-in-ai-dungeon | Player-requested, not milestone-auto |
| Foundry Cinematic Cut-ins | https://foundryvtt.com/packages/cinematic-cut-ins | Boss intro, combat start, victory — triggered moments |
| Foundry Segue | https://foundryvtt.com/packages/foundry-vtt-segue | Location / chapter / combat-scene transitions |
| Anifusion isekai style notes | https://anifusion.ai/style/isekai-anime-style-generator/ | Summon-circle composition as the opening cut (genre convention, not a licensed work) |

---

## 8) Implement later (not this pass)

Only if John asks:

1. Code-force opening splash when memorable is on and the first real scene is written.
2. Default New Game memorable **on** (or inherit settings), copy that says “first scene, then big beats — not every turn.”
3. Cooldown + remaining pack-12 high list as soft tags.
4. Leave weekly 5/20/40 as the money gate.

No WOF changes. No live code in this research pass.

---

## 9) John’s live rule vs other games (same day, later)

**His current policy (implementing separately):** no auto pic for ordinary NPC meets (shopkeeper / guard / companion / first named person); auto splash only for first **king/ruler audience** (conservative titles); if prose calls someone stunning/beautiful, **offer** a picture (player yes/no, no auto-spend); opening / death / legendary still auto when Memorable is ON; toggle **defaults OFF**.

**Honest score:** conservative auto-spend, industry-normal on *splashes*, **stricter than most games on first important character** because Classic has no cheap sprite/portrait layer.

| His beat | Industry analogue | Stricter / looser / match |
|----------|-------------------|---------------------------|
| No splash for shopkeeper / guard / random named | VN: sprite not CG. BG vanilla: no unique portrait. Foundry: token only. CoG: usually no art | **Match** for full-art. Disco *does* paint speaking shopkeepers (Plaisance, Roy) as dialogue portraits — he is stricter than Disco |
| No splash for companion / first named person | VN: first meeting is a **sprite** (always on). Persona: Confidant intro + portrait. BG: companion portrait on recruit. Imagina: “first meeting” is a listed auto-beat. CoG authors: show NPC art **when they first appear** | **Stricter.** Most games *do* show the first important face; he only auto-splashes rulers. Caveat: those games have a cheap always-on portrait. His splash is a metered CG, so skipping is defensible — but the player never gets a face at all |
| Auto king/ruler audience | Foundry Boss Splash / Herald / Cinematic Cut-ins: splash for bosses/royalty, not every token | **Match** (VTT / JRPG VIP intro) |
| Offer on stunning/beautiful | Otome/romance VN: beauty/confession **are** the CG budget ([VN Paths](https://vnpaths.com/what-does-cg-stand-for-in-visual-novels/)). AI Dungeon See + Friends & Fables snapshot: **player spends** | **Match hybrid.** Timing = otome CG. Spend control = AI story games. Looser than VNs (they auto-show the CG); stricter on wallet |
| Opening / death / legendary auto | Comics splash p.1; Questas opening still; VN death/ending CG | **Match** |
| Toggle default OFF | Imagina turn-images **off by default**; CoG readers want an art-off switch | **Match** (and correct for a cap of 5/20/40) |

**Verdict:** Reasonable premium-toggle policy — it spends the weekly cap like a VN CG budget, not like Disco portraits or Imagina first-meetings.

### Extra sources (this pass)

| Source | URL |
|--------|-----|
| VN Paths — CG vs sprite; otome CGs at confession/beauty | https://vnpaths.com/what-does-cg-stand-for-in-visual-novels/ |
| VNDev Wiki — Event CG (first kisses, first encounters, reserved) | https://vndev.wiki/Event_CG |
| Baldur’s Gate portraits (companions; vanilla extras often none) | https://baldursgate.fandom.com/wiki/Portraits |
| Disco Elysium character portrait files (named speakers, including shopkeepers) | https://discoelysium.wiki.gg/wiki/Category:Characters |
| CoG — illustrations optional; NPC art at first appearance; some hate character art | https://forum.choiceofgames.com/t/illustrations-in-games/23763 |
| Imagina — first meeting is an auto beat; **off by default** | https://playimagina.com/help/turn-images |
| AI Dungeon See — player-requested | https://help.aidungeon.com/faq/how-do-i-create-pictures-in-ai-dungeon |
| Friends & Fables — player snapshot, not auto | https://help.fables.gg/articles/5067807-in-game-scene-image-generation |
| Foundry Boss Splash — splash for bosses, not every token | https://foundryvtt.com/packages/boss-splash |

---

## 10) Would people pay for extra one-off illustrations? (16 Aug 2026)

**Question:** Shop SKU like “buy one extra Memorable pic” — would it actually convert? John wants player cost **and** his API cost down. Memorable is already included (not a pack). Caps 5 / 20 / 40. Auto: opening, death, first dungeon final boss. Offers: beauty, ruler, writer tags.

**Short answer: sometimes — not as a £0.99 souvenir SKU.** People pay for *image capacity* (sub, credit pack, “unlimited at High”, watch-ad +1). They rarely pay £0.99 for one unseen AI roll. Pack-12b already said don’t sell +20 splashes as a dump; this pass agrees.

### Verdict

| | |
|--|--|
| Would they pay? | **Sometimes.** Heavy image users and romance collectors pay. Casual Classic players mostly wait a week, watch an ad, or upgrade the **sub**. |
| Who | Romance/otome (known-face CGs); a thin collector slice; Mid/High already paying who binge past the week; **not** most Free who hit 5. |
| What sells | Credit **packs**, images **bundled in a higher tier**, player-requested “draw this beat” against a meter, battle-pass-style value, Steam **finished** art books. |
| What doesn’t | Shop “one extra illustration”; +20 dump; £0.99 for a pic they haven’t seen; CoG-style illustration DLC (almost nobody sells it). |
| Margin | API is cheap (schnell ~$0.003; flux-dev ~$0.01–0.03). **Conversion and retries**, not Flux, are the problem. Selling extras **raises** his spend. |
| Rec | **Skip the shop SKU.** Ship Pack 12 **Free +1 Memorable via rewarded ad**. Keep offers on the weekly cap. If paid overflow ever: only a **cap-hit** small pack (£2.99 / 5, never expire) — not £0.99 one-shot. |

### Who pays (and who doesn’t)

| Segment | Pays for extra pics? | Why |
|---------|----------------------|-----|
| Romance / otome | **Yes, a lot** — for *known* CGs of a face they already love | Gacha/pass unlocks finished intimacy art, not a random Flux. Love & Deepspace pity can run ~$163 for one 5★ memory card ([pity calculator](https://pitycalculator.com/love-and-deepspace/pity-calculator)). Passes that list “5 CGs” convert better than blind pulls ([otome.com](https://otome.com/2025/06/21/gacha-or-season-pass-monetisation-model-value/)). SynapticGM one-shot is not that product. |
| Collectors | **Yes, a few %** of people who already bought | Steam art-book median attach: **1.62%** (Diamond $1M+) / **8.4%** (Gold) of *base-game buyers* ([How To Market A Game](https://howtomarketagame.com/2026/03/03/benchmark-how-much-money-can-you-make-from-dlc/)). That’s a PDF of finished plates, not in-run gen. |
| Mid / High already | **Sometimes top-up; more often they want unlimited** | AI Dungeon Journey $14.99 / Legend $29.99: credits come with the sub; Legend gets **unlimited default images**. Latitude built Shadow/Ultimate tiers because whales were **buying credit packs** and asked to stop nickel-and-diming ([Shadow Tiers](https://help.aidungeon.com/faq/about-shadow-tiers)). NovelAI: Tablet/Scroll 1,000 Anlas; Opus $25 **unlimited standard gens** — extra Anlas exists, guides say **upgrade Opus** if you keep topping up ([docs](https://docs.novelai.net/en/subscription/)). High already has **40/week**. |
| Free who hit 5 | **Mostly no cash** | Character.AI implied c.ai+ conversion **~2%** of MAU ([Axis](https://axis-intelligence.com/character-ai-statistics/)); Imagine Gallery is **inside** the $9.99 sub, not per pic. Generic IAP install-to-purchase **1–2%** ([UXCam](https://uxcam.com/blog/mobile-app-conversion-rate/)); one-off IAP **1–5%** of actives vs battle pass **8–20%** ([MWM](https://mwm.ai/glossary/battle-pass)). Free overflow converts as **ads** (extra-life opt-in **40–70%**, completion 90%+ — [RevenueFlex](https://revenueflex.com/tg/blog/rewarded-video-ads-mobile-game-monetization/), [Audiencelab](https://audiencelab.ai/blog/rewarded-video-ads-optimization)). |

### What sells vs what doesn’t

**Sells (industry pattern):**

- **Capacity, not souvenirs.** AID: buy credit *bundles* (App Store listed **80 Credits ~€0.99**, 6,500 / $49.99, 14,000 / $99.99 — [Apple](https://apps.apple.com/ee/app/ai-dungeon-rpg-story-maker/id1491268416), [help](https://help.aidungeon.com/faq/what-are-image-credits)); 1 default image ≈ 1 credit, so even the cheap SKU is a *stack*, not one plate. NovelAI: Paid Anlas, 20% off for subs. F&F: Image Studio + scene gen on **credits**; packs from **$5**, subs grant 100/300/600/mo ([patch 25.48](https://fables.gg/patch-notes/patch-notes-2548-credits-image-studio-scene-generation-and-premium), [25.49](https://fables.gg/patch-notes/patch-notes-2549-credit-packs-background-removal-seedream-45-and)). Imagina: daily pool **or** credit packs ([pricing](https://playimagina.com/pricing)). Midjourney: extra Fast **$4/hour** (dozens of gens), requires an active sub ([docs](https://docs.midjourney.com/hc/en-us/articles/33570952624141-Purchasing-Extra-Fast-Time)).
- **Images inside a higher sub.** AID Legend unlimited default; NovelAI Opus unlimited standard; C.AI Imagine on c.ai+.
- **Player-requested snapshot of a beat they just lived** (AID See, F&F scene gen) — spends a meter they already own. SynapticGM already has this as **offers** against 5/20/40.
- **Finished CG / art-book DLC** of characters they know. Attach is low-single to high-single digits, launch-bundled.

**Doesn’t sell (for this product):**

- **£0.99 “one extra illustration” on the shop shelf.** Impulse IAP is 1–5%; the pic is unseen; Flux miss → retry or refund eats the take. Apple/Google keep **15–30%** ([SBP](https://developer.apple.com/app-store/small-business-program/)); £0.99 leaves ~£0.69–0.84 **before** VAT/Stripe/support.
- **+20 Memorable dump.** Pack-12b lock; AID’s own lesson was to fold whales into a higher sub, not endless à la carte.
- **CoG illustration add-ons.** Hosted Games: in-story art optional, not a DLC line ([forum](https://forum.choiceofgames.com/t/game-art-in-hosted-games/93880)). Heart’s Choice sells **bonus stories** $0.99–$7.99, explicitly **no graphics** ([CoG](https://www.choiceofgames.com/2021/11/new-dawnfall-bonus-stories/)). One indie CYOA (“To the Edge of the Sky Premium”) bundled extra scenes *and* illustrations — not a CoG-scale signal.
- **Gacha “buy this CG.”** Converts for otome whales; wrong ethics and audience for Classic Memorable.

### Price vs his API cost (honest)

| | Player pays | John keeps (approx) | His Flux cost | Net |
|--|-------------|---------------------|---------------|-----|
| Schnell (live OpenRouter path) | — | — | **~$0.003** / image ([Atlas](https://www.atlascloud.ai/de/models/black-forest-labs/flux-schnell), fal ~$0.003/MP) | — |
| flux-dev / BFL Klein 4B | — | — | **~$0.01–0.03** / **$0.014** first MP ([BFL](https://docs.bfl.ml/quick_start/pricing)) | — |
| £0.99 one-shot (SBP 15%) | £0.99 | ~£0.84 | £0.002–0.02 even with 2–3 retries | Looks **fat** on paper |
| £0.99 (store 30%) | £0.99 | ~£0.69 | same | Still fat **if it sells and they don’t refund** |
| £4.99 pack of 5 | £4.99 | ~£3.50–4.25 | 5× schnell ~£0.01 | Fine *if* they use all 5 |
| Free +1 ad | £0 | rewarded eCPM often ~$4–15 / mille → **~$0.004–0.015 per completed view** | schnell ~$0.003 | **Roughly covers schnell**; flux-dev may lose a few cents |
| Do nothing (wait for weekly reset) | £0 | £0 | **$0** | Best for **his** cost |

**Margin is not the blocker. Conversion is.** A £0.99 unseen gen also invites “that’s not my character” retries (2–3× API) and chargebacks that wipe a 69p take. Selling extras **increases** his bill vs keeping auto tight. Ads are the only overflow that can **offset** schnell.

### Recommendation for SynapticGM Classic Memorable

1. **Skip a shop SKU** (“buy one extra illustration” / +20 dump). Matches pack-12b and AID/NovelAI: extra pics ride a **meter or a higher tier**, they are not a souvenir aisle.
2. **Ship Pack 12 Free +1 Memorable via rewarded ad** when they hit 5. Opt-in ads convert an order of magnitude better than £0.99 IAP; eCPM can pay for schnell; Mid/High stay ad-free.
3. **Do not add £0.99 one-shot.** Operationally toxic (retries, refunds, store floor). If paid overflow is ever needed after ads exist and Free still rage-quits at 5: a **cap-hit-only** pack (**£2.99 for 5**, never expire) — pack psychology like Spark, not one pic. Don’t put it on the main shelf next to text packs.
4. **Keep auto spend tight** (opener / death / first dungeon final boss) and **offers on the weekly cap**. That is the actual “his cost down” lever. Beauty/ruler/writer-tag yes is spending *included* budget, not a second wallet.
5. **If High ever needs more art, sell unlimited-at-High or a higher sub**, not à la carte — same move AID made with Legend / Shadow.

No shop SKUs in this pass. No WOF. No live code.

### Sources (this pass)

| Source | URL |
|--------|-----|
| AID credits / images | https://help.aidungeon.com/faq/what-are-image-credits |
| AID memberships (credits by tier) | https://help.aidungeon.com/memberships-benefits |
| AID Shadow Tiers (credit-pack whales → sub) | https://help.aidungeon.com/faq/about-shadow-tiers |
| AID App Store credit SKUs | https://apps.apple.com/ee/app/ai-dungeon-rpg-story-maker/id1491268416 |
| NovelAI subscriptions / extra Anlas | https://docs.novelai.net/en/subscription/ |
| C.AI conversion ~2%; Imagine in sub | https://axis-intelligence.com/character-ai-statistics/ |
| Midjourney extra Fast $4/hr | https://docs.midjourney.com/hc/en-us/articles/33570952624141-Purchasing-Extra-Fast-Time |
| F&F credits + $5 packs | https://fables.gg/patch-notes/patch-notes-2548-credits-image-studio-scene-generation-and-premium |
| F&F credit packs live | https://fables.gg/patch-notes/patch-notes-2549-credit-packs-background-removal-seedream-45-and |
| Imagina pricing / packs | https://playimagina.com/pricing |
| Steam DLC / art-book attach | https://howtomarketagame.com/2026/03/03/benchmark-how-much-money-can-you-make-from-dlc/ |
| Battle pass 8–20% vs IAP 1–5% | https://mwm.ai/glossary/battle-pass |
| Install-to-purchase 1–2% | https://uxcam.com/blog/mobile-app-conversion-rate/ |
| Rewarded extra-life opt-in 40–70% | https://revenueflex.com/tg/blog/rewarded-video-ads-mobile-game-monetization/ |
| Apple Small Business 15% | https://developer.apple.com/app-store/small-business-program/ |
| BFL Flux pricing | https://docs.bfl.ml/quick_start/pricing |
| Schnell ~$0.003/image | https://www.atlascloud.ai/de/models/black-forest-labs/flux-schnell |
| CoG game art (optional, not DLC) | https://forum.choiceofgames.com/t/game-art-in-hosted-games/93880 |
| Heart’s Choice bonus *stories* $0.99 | https://www.choiceofgames.com/2021/11/new-dawnfall-bonus-stories/ |
| Otome pass vs gacha CGs | https://otome.com/2025/06/21/gacha-or-season-pass-monetisation-model-value/ |
