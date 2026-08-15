# SynapticGM Monetization Research: Cosmetics, Audio, Themes, Dice, Ads, and IAP

**Date:** August 15, 2026
**Status:** Capture for review. Do not implement.
**Product:** SynapticGM — single-player AI LitRPG / System-apocalypse game.
**Architecture constraint:** Code owns dice, HP, loot rarity, quests, lockouts. LLM narrates only. Monetization must not let players buy win-condition power in the world ledger.

**WOF note:** This pack is live SynapticGM only. The one multiplayer chat-cosmetic line (A29) and Friends & Fables host-pays billing notes that matter for later WOF are extracted to [`wof/pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md`](./wof/pack-14-monetization-notes-from-sgm-pack09-2026-08-15.md). Do not treat this file as a WOF build ticket.

---

## A) Executive Summary (≤12 bullets)

1. **Sell capacity and cosmetics; never sell outcomes.** The single most important line: players can buy more turns, better audio, prettier dice, and more image generations — but never a better roll, a loot tier upgrade, or a quest skip. Code owns the ledger; the cash shop never touches it.
2. **The core story is free.** Charging for the core narrative loop would alienate the LitRPG/AI-RPG audience, which is steeped in anti-paywall culture (AI Dungeon's free tier, NovelAI's unlimited text, Reddit's open-source ethos). The story is the funnel; cosmetics and capacity are the product.
3. **ARPU mindset: niche, not whale-hunting.** This is a niche AI LitRPG with a text-first audience. Expect mostly "minnows" — players who spend $2–10 occasionally, not $500/month. Design for volume of small purchases, not whale extraction. Evidence: AI RPG communities (r/AIDungeon, r/litrpg) skew toward indie/anti-predatory sentiment; Friends & Fables' own pricing tops out at $39.95/mo and even that draws complaints.
4. **Phase 0 is a tip jar.** Before any SKUs ship, offer a "Support the GM" tip / supporter badge. Zero overhead, zero risk, establishes that paying is optional and appreciated. This is a proven indie pattern ( itch.io "pay what you want", Ko-fi, Patreon tip tiers).
5. **Phase 1 is cosmetics only.** Dice skins, UI themes, voice packs, portrait frames, System window skins. These have zero gameplay effect, zero ledger interaction, and high perceived value for a LitRPG audience that loves visual identity (D&D Beyond sells digital dice for $1.99–$5.99 with strong acceptance).
6. **Phase 2 is soft convenience.** Extra turns per day, more image generations, premium TTS minutes, higher memory context. These affect session friction, not rules. The line: buying turns lets you play *longer*, not *better*.
7. **Rewarded ads are acceptable for capacity, never for power.** 74% of US mobile players will watch a rewarded ad for a reward (Adapty, 2026). Offer: watch ad → +3 turns, or +1 image gen, or 1 revive. Never: watch ad → better loot. Never interstitial mid-narration.
8. **Never sell dice that imply better odds.** "Lucky dice" marketing is toxic. D&D Beyond sells purely cosmetic dice skins and explicitly states they don't affect rolls. SynapticGM must do the same — every dice skin page needs a one-line disclosure: "Cosmetic only. Does not affect roll outcomes."
9. **Premium TTS is the highest-margin SKU.** ElevenLabs Creator ($22/mo, 100k credits ≈ 100 min TTS) gives commercial-quality voices. A $4.99 voice pack sold to one player covers ~22% of a month of ElevenLabs Creator for that player's usage. If players generate ~20 min of TTS per month, the margin is positive. This is the one SKU where player price exceeds operator cost.
10. **Subscriptions should be capacity-based, not feature-gated.** AI Dungeon's subscription gates *models* (better LLM = higher tier). NovelAI gates *context length* and *Anlas* (image tokens). SynapticGM should gate *capacity* (turns/day, images/month, TTS minutes/month) — not story quality. A free player gets the same narrative quality as a paid player; the paid player just plays more.
11. **Kid Mode must block IAP and ads.** If Kid Mode / maturity settings exist, IAP and rewarded ads must be disabled within Kid Mode. This is a legal and trust requirement, not optional.
12. **Avoid Phase 3 items unless revenue demands it.** Revives, undo-turn, reroll, XP boosts, loot pity — these are the controversial zone. Document the backlash, provide safer alternatives, and only ship if Phase 1+2 revenue is insufficient.

---

## B) Competitor / Analogue Table

| Product | Model | Cosmetics Sold | Convenience Sold | P2W-ish? | Price Examples | Player Sentiment |
|---------|-------|---------------|-------------------|---------|---------------|-----------------|
| **AI Dungeon** | F2P + subscription | None (no cosmetics) | Premium models, more memory slots, image gen credits | No P2W (no gameplay) | Free (Wanderer) → $14.99 (Hero) → $29.99 (Legend) → ~$50–100 (Mythic/Ultimate) | Polarizing: free tier loved, premium pricing criticized as hard to justify. Credit system opaque — "you don't know how much play you get." (Arcanum RPGs, DungeonsDeep, 2026) |
| **NovelAI** | Subscription only | None | Image gen tokens (Anlas), longer context, higher-quality TTS voices | No P2W (no gameplay) | $10 (Tablet) → $15 (Scroll) → $25 (Opus) / month. Anlas: 1,000–10,000/mo. | Generally accepted by writing community. $10 tier is the "sweet spot." Opus ($25) for power users. Censorship-free is a selling point. (AI Tools DevPro, CheckThat.ai, 2026) |
| **Friends & Fables** | F2P + subscription | None | More turns, more players, more @mentions, credits for premium models/images | No P2W (LLM owns math — but that's a *bug*, not a feature) | Free (25 turns/day) → $19.95 (Starter) → $29.95 (Pro) → $39.95 (Legend) | Polarizing: combat burns credits 2–3x faster than narrative. Host pays all credits in multiplayer. Tier-gated memory limits criticized. (DungeonsDeep, 2026) |
| **D&D Beyond** | F2P + marketplace + subscription | **Digital dice skins** ($1.99–$5.99), themed sets, seasonal dice | Content sharing (subscription), more character slots | No P2W (tabletop companion, not a game) | Dice: $1.99–$5.99 per set. Sub: Free → $2.99/mo (Champion) → $5.99/mo (Hero). | Dice skins: generally accepted. Marketplace a la carte content: polarizing (microtransaction controversy). "Drops" program (free cosmetic drops for subs) well-received after they committed to yearly bundles. (D&D Beyond forums, 2026) |
| **Roll20** | F2P + subscription + marketplace | Marketplace assets (tokens, maps, dice themes) | Dynamic lighting, API access, more storage | No P2W | Free → $5/mo (Plus) → $10/mo (Pro). Marketplace: individual asset purchases. | Generally accepted. Pro tier ($10) seen as fair for API + lighting. Marketplace content quality varies. (GM Craft Tavern, DungeonsDeep, 2026) |
| **Foundry VTT** | One-time purchase + modules | Module marketplace (themes, dice, content) | None (self-hosted) | No P2W | ~$50 one-time license. Modules: free–$20+. | Highly accepted. One-time license model loved by community. Module marketplace thriving. (GM Craft Tavern, 2026) |
| **TaleSpire** | Early access paid + cosmetics | Dice skins, tile sets, miniatures | None | No P2W | ~$25–30 early access. Cosmetic packs: $2–10. | Accepted. Community loves the 3D aesthetic. Cosmetic packs seen as fair. |
| **Hidden Door** | F2P + subscription (planned) | Card art, world themes, modifier cards (cosmetic) | More stories, more worlds, premium narration models | No P2W | Not yet publicly priced (first release Aug 2025). | Too early to assess. Card-based cosmetics are novel. (Prior research, Aug 2026) |
| **Generic mobile RPG (gacha-light)** | F2P + IAP + ads | Character skins, UI themes, music packs | Energy refills, EXP boosts, loot boosts | **Yes — often P2W** | Energy: $0.99–$4.99 per refill. Skins: $2.99–$14.99. EXP boost: $4.99–$9.99. | Energy systems: widely hated. Rewarded ads: tolerated. Cosmetic skins: accepted. EXP/loot boosts: polarizing to hated. (StudioKrew, Adapty, 2026) |
| **Voice pack apps (e.g. Voice Dream, narrator apps)** | IAP | Voice packs (accents, languages, celebrity-style) | More voices, higher quality | N/A | $2.99–$9.99 per voice. Sub: $5–15/mo for unlimited. | Accepted. Voice quality is the product. (ElevenLabs pricing context, 2026) |

---

## C) Full Idea Catalog (≥40 ideas)

### Layer Key
- **A** = Zero gameplay effect (cosmetics / comfort)
- **B** = Soft convenience (affects session friction, not rules)
- **C** = Hard gameplay-adjacent (affects outcomes — controversial)
- **D** = Ads

| ID | Offer | Layer | Gameplay Effect | Acceptance | Sweet-Spot Price | Too Low | Too High | Notes for SynapticGM |
|----|------|-------|----------------|------------|-----------------|--------|---------|---------------------|
| **A01** | Dice skin pack — System Holo (neon holographic dice) | A | None | Generally accepted | $2.99 | $0.99 (devalues) | $7.99 (dice are cosmetic) | Must include "cosmetic only" disclosure. D&D Beyond charges $1.99–$5.99. |
| **A02** | Dice skin pack — Bone & Iron (grimdark) | A | None | Generally accepted | $2.99 | $0.99 | $7.99 | Same as above. |
| **A03** | Dice skin pack — Crystal (premium glass) | A | None | Generally accepted | $3.99 | $1.99 | $9.99 | Premium material skin, slightly higher. |
| **A04** | Dice animation pack — 3D roll with physics | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | Animation only; roll result is code-owned. |
| **A05** | UI theme — Parchment & Quill | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | Full UI reskin. Does not change fog, map, or rules. |
| **A06** | UI theme — Neon System (cyberpunk System apocalypse) | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | Fits the System-apocalypse aesthetic. |
| **A07** | UI theme — Terminal Green (retro CRT) | A | None | Generally accepted | $2.99 | $1.99 | $5.99 | Niche but loved by certain players. |
| **A08** | Turn-frame chrome pack — Ornate gold borders | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Border around each turn's narration. |
| **A09** | Turn-frame chrome pack — Glitch/static borders | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Fits System-apocalypse theme. |
| **A10** | System window skin — Cold Registrar (blue steel) | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | The "System" UI panel skin. |
| **A11** | System window skin — Ancient Rune (carved stone) | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Alternate System aesthetic. |
| **A12** | Character portrait frame — Gold laurel | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Decorative frame around character portrait. |
| **A13** | Character portrait frame — System halo (geometric) | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | System-apocalypse themed. |
| **A14** | Character paper-doll skin — Armor cosmetic override | A | None | Generally accepted | $2.99 | $1.99 | $5.99 | Visual-only; does not change stats or armor class. |
| **A15** | Map skin — Street Neon (night-city overworld) | A | None | Generally accepted | $2.99 | $1.99 | $5.99 | Overworld pin map reskin. Does not change fog or paths. |
| **A16** | Map skin — Parchment (hand-drawn fantasy) | A | None | Generally accepted | $2.99 | $1.99 | $5.99 | Classic fantasy map aesthetic. |
| **A17** | Art-style unlock — Comic preset (premium style) | A | None | Generally accepted | $4.99 | $2.99 | $9.99 | Unlocks a premium comic art style for image generation. |
| **A18** | Art-style unlock — Watercolor preset | A | None | Generally accepted | $4.99 | $2.99 | $9.99 | Alternate art style. |
| **A19** | TTS narrator voice — "Cold Registrar" (System voice) | A | None | Generally accepted | $4.99 | $2.99 | $9.99 | The iconic System voice. Highest-margin SKU. |
| **A20** | TTS narrator voice — Grizzled Mentor | A | None | Generally accepted | $4.99 | $2.99 | $9.99 | Character voice pack. |
| **A21** | TTS narrator voice — Companion (per companion) | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | One voice per companion NPC. |
| **A22** | SFX pack — Loot rarity stingers | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Sound when loot drops (common→legendary ascending fanfare). |
| **A23** | SFX pack — Combat hits & crits | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Impact sounds for combat rounds. |
| **A24** | SFX pack — UI beeps & System alerts | A | None | Generally accepted | $0.99 | $0.49 | $2.99 | Minimal UI sound pack. |
| **A25** | Music theme — Dungeon ambient (3 tracks) | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | Background music loop for dungeon exploration. |
| **A26** | Music theme — Boss encounter (2 tracks) | A | None | Generally accepted | $3.99 | $1.99 | $7.99 | Boss fight music. |
| **A27** | Loading / boot splash — Custom splash art | A | None | Generally accepted | $0.99 | $0.49 | $2.99 | Replace default loading screen. |
| **A28** | Nameplate color — Text color for player name in chat/log | A | None | Generally accepted | $0.99 | $0.49 | $2.99 | Cosmetic text color. |
| **A29** | Chat bubble style — System-apocalypse themed | A | None | Generally accepted | $0.99 | $0.49 | $2.99 | Later social/chat surface only. WOF extract: see `wof/pack-14-…`. Not a live SynapticGM build item. |
| **A30** | Journal stickers — Decorative stickers for journal entries | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | Stickers placed on story journal entries. |
| **A31** | Title / flair — Display title under player name | A | None | Generally accepted | $1.99 | $0.99 | $3.99 | "Survivor of the First Wave" etc. Cosmetic title. |
| **A32** | Supporter badge — "Backer" badge on profile | A | None | Generally accepted | $4.99 (tip) | $1.99 | $19.99 (tip) | Phase 0 tip jar. Badge is permanent. |
| **A33** | Seasonal event theme — Halloween "System Glitch" | A | None | Generally accepted | Free (event) / $2.99 (keep) | — | $5.99 | Time-limited cosmetic theme. Free during event; purchasable to keep. |
| **A34** | Save-slot cosmetic — Custom save-slot icon | A | None | Generally accepted | $0.99 | $0.49 | $2.99 | Cosmetic icon for save slots. |
| **A35** | Dice season pass — 4 themed dice packs over 3 months | A | None | Generally accepted | $9.99 | $4.99 | $19.99 | Bundle of 4 dice packs at a discount vs à la carte. |
| **A36** | Cosmetic bundle — "System Apocalypse Set" (theme + dice + frame + System skin) | A | None | Generally accepted | $9.99 | $4.99 | $19.99 | Bundle of 4–5 cosmetics at ~30% discount. |
| **B01** | Extra turns per day — +10 turns (consumable) | B | More play time, not better outcomes | Generally accepted | $0.99 | $0.49 | $2.99 | One-time purchase. Does not affect dice, loot, or quests. |
| **B02** | Turn refill — Full energy refill (consumable) | B | More play time | Polarizing (energy systems) | $1.99 | $0.99 | $3.99 | Refills daily turn allowance. Energy systems are widely hated; frame as "play more" not "energy." |
| **B03** | Priority LLM queue — Faster generation (subscription) | B | Faster responses, not better content | Generally accepted | $4.99/mo (add-on) | $2.99/mo | $9.99/mo | Skip the queue. Same model, same quality, just faster. |
| **B04** | Extra image generations — +10 images (consumable) | B | More images, not better ones | Generally accepted | $1.99 | $0.99 | $3.99 | For players who want more scene art. |
| **B05** | HD image upgrade — Higher resolution panels (subscription) | B | Better image quality, not more content | Generally accepted | $2.99/mo (add-on) | $1.99/mo | $5.99/mo | Higher-res image gen. |
| **B06** | Extended memory — More context pins / longer memory (subscription) | B | Better recall, not better outcomes | Polarizing | $4.99/mo (add-on) | $2.99/mo | $9.99/mo | More pinned memories. NovelAI gates context length by tier; players accept this but dislike it. |
| **B07** | Premium TTS minutes — +100 min TTS (consumable or sub) | B | More narration, not better story | Generally accepted | $2.99 | $1.99 | $4.99 | For players who use TTS heavily. Operator cost: ~$2.20/mo per player at ElevenLabs Creator. |
| **B08** | Cloud saves — Cross-device sync (subscription) | B | Convenience, not gameplay | Generally accepted | $2.99/mo (add-on) | $1.99/mo | $4.99/mo | Standard convenience feature. |
| **B09** | STT voice input — Premium STT (subscription) | B | Input convenience | Generally accepted | $1.99/mo (add-on) | $0.99/mo | $3.99/mo | Voice input. Operator cost: Deepgram per-minute pricing. |
| **B10** | Cosmetic season pass — Early access to cosmetic seasons | B | Early cosmetic access | Generally accepted | $9.99/season | $4.99 | $14.99 | Pay to get seasonal cosmetics early; free players get them later. |
| **C01** | Revive — Continue after death (consumable) | C | Avoids death penalty | Polarizing | $0.99 | $0.49 | $2.99 | Controversial: lets players avoid death consequences. Safer alternative: free revive on easy mode; paid only on normal+. |
| **C02** | Undo last turn — Rewind one turn (consumable) | C | Reverts last action | Polarizing | $0.99 | $0.49 | $1.99 | Controversial: reverts code-owned state. Must be code-enforced (ledger rollback), not LLM. |
| **C03** | Reroll check — Reroll one dice check (consumable) | C | Changes a roll outcome | **Widely hated** | $0.99 | — | $2.99 | **AVOID.** Directly conflicts with "code owns dice." Selling rerolls is selling RNG manipulation. |
| **C04** | XP boost — +50% XP for 1 hour (consumable) | C | Faster progression | **Widely hated** | $1.99 | $0.99 | $3.99 | **AVOID.** Pay-to-progress-faster is P2W-adjacent. |
| **C05** | Loot pity boost — Increases pity counter (consumable) | C | Better loot odds | **Widely hated** | $2.99 | — | $4.99 | **AVOID.** Directly conflicts with "code owns loot rarity." |
| **C06** | Quest skip — Skip a quest requirement (consumable) | C | Bypasses content | **Widely hated** | $1.99 | — | $3.99 | **AVOID.** Pay-to-skip is pay-to-win in a story game. |
| **C07** | Reveal full sheet early — See hidden stats before unlock | C | Information advantage | Polarizing | $0.99 | — | $1.99 | Minor, but gives paying players information advantage. Avoid. |
| **D01** | Rewarded ad — Watch ad for +3 turns | D | More play time | Generally accepted | Free (ad-funded) | — | — | 74% of US players will watch rewarded ads (Adapty, 2026). |
| **D02** | Rewarded ad — Watch ad for +1 image generation | D | More images | Generally accepted | Free (ad-funded) | — | — | Same principle. |
| **D03** | Rewarded ad — Watch ad for 1 revive | D | Avoid death penalty | Polarizing | Free (ad-funded) | — | — | Less offensive than paid revive, but still lets players avoid consequences. |
| **D04** | Rewarded ad — Watch ad for 1 cosmetic trial (24h) | D | Temporary cosmetic | Generally accepted | Free (ad-funded) | — | — | Try a cosmetic for 24h. If they like it, they buy it. |
| **D05** | Interstitial ad — Between sessions (never mid-narration) | D | None | Polarizing | Free (ad-funded) | — | — | Only between sessions, max 2–3 per 15 min (Adapty guideline). Never mid-narration. |
| **D06** | Banner ad — Static banner in free tier | D | None | Widely hated | Free (ad-funded) | — | — | **AVOID.** Kills immersion in a story-first RPG. |

---

## D) Acceptance Deep-Dive

### What Players Don't Mind Paying For

| Category | Evidence |
|----------|---------|
| **Cosmetic dice** | D&D Beyond sells digital dice at $1.99–$5.99 with general acceptance. Players understand dice skins are cosmetic. Forum complaints focus on marketplace *content* (books, monsters), not dice. (D&D Beyond forums, 2026) |
| **UI themes** | Roll20 and Foundry VTT module marketplaces sell themes and UI assets. Foundry's one-time license ($50) is beloved. TaleSpire cosmetic packs ($2–10) accepted. (GM Craft Tavern, 2026) |
| **Voice packs** | Voice apps (Voice Dream, narrator apps) sell voice packs at $2.99–$9.99. Accepted because voice quality is the product. (ElevenLabs pricing context, 2026) |
| **Capacity (turns/images/TTS minutes)** | AI Dungeon and Friends & Fables sell turns/credits. NovelAI gates image gen tokens (Anlas). Players accept paying for *more* usage, not *better* content. (DungeonsDeep, 2026) |
| **Rewarded ads for capacity** | 74% of US mobile players will watch a rewarded ad for a reward. Rewarded ads "respect player choice" and are "one of the safest monetization tools." (Adapty, StudioKrew, 2026) |
| **Tip jar / supporter badge** | Indie game culture (itch.io, Ko-fi, Patreon) normalizes voluntary support. itch.io's "pay what you want" model is well-established. |

### What Players Will Watch Ads For

| Reward | Acceptance | Notes |
|--------|------------|-------|
| +3 turns | High | Most accepted. Players want more play time. |
| +1 image gen | High | Players want more scene art. |
| 1 cosmetic trial (24h) | Medium-High | Try-before-you-buy. Good conversion to purchase. |
| 1 revive | Medium | Less offensive than paid revive, but still lets players dodge consequences. |
| Skip interstitial | N/A | Players watch to *avoid* ads, not to get a reward. |

### What Players Hate Paying For

| Category | Evidence / Sentiment |
|----------|----------------------|
| **Energy systems** | "Energy-based progression" is listed as a hybrid-casual monetization tactic that works for revenue but is widely disliked by core gamers. (StudioKrew, 2026). Mobile RPG energy refills are a top complaint in Reddit RPG communities. |
| **RNG manipulation (rerolls, loot boosts)** | Directly conflicts with "code owns dice." LitRPG culture is built on the integrity of the System — the idea that the System is fair and code-owned. Selling rerolls would violate the genre's core fantasy. r/litrpg threads on "pay to win mechanics" show strong anti-P2W sentiment. (r/litrpg, 2025) |
| **Quest skips / content bypass** | In a *story* game, skipping content is skipping the product. Players who want to skip are telling you the content is boring — fix the content, don't charge to bypass it. |
| **Feature-gated story quality** | AI Dungeon gates better LLM models behind higher tiers. Reviews criticize this: "premium pricing difficult to justify" and "you don't know how much play you get." (Arcanum RPGs, DungeonsDeep, 2026). NovelAI is preferred because *all* tiers get unlimited text — only *context length* and *image tokens* are gated. |
| **Banner ads in immersive experiences** | Banner ads kill immersion in story-first experiences. Interstitials between sessions are tolerable; banners during narration are not. |
| **Opaque credit systems** | AI Dungeon's credit system is criticized as "genuinely hard to parse" — players don't know how much play they get for their money. (DungeonsDeep, 2026). SynapticGM should price in clear units (turns, images, minutes), not opaque "credits." |

### LitRPG / AI-Dungeon Specific Culture Notes

- **Anti-paywall story culture:** The AI RPG community (r/AIDungeon, r/litrpg, NovelAI users) expects the core narrative to be accessible. Gating story behind paywalls triggers backlash. NovelAI's model (unlimited text, gated capacity) is the accepted pattern.
- **Anti-RNG cash shop:** LitRPG is *about* the System being fair. The System's rolls, loot tables, and rules are sacred. Selling rerolls or loot boosts would be seen as corrupting the System — the one thing the genre holds sacred. This is not just a monetization issue; it's a *lore* issue.
- **Indie / open-source ethos:** AI RPG communities skew toward indie and open-source values. Predatory monetization triggers disproportionate backlash relative to mainstream mobile gaming. The audience will punish anything that smells like gacha or whale-hunting.
- **"Pay for more, not for better":** The accepted principle across AI narrative apps is: paying gives you *more* (turns, images, context, voices), not *better* (story quality, roll outcomes, loot). NovelAI, Friends & Fables, and AI Dungeon all follow this — even AI Dungeon's model gating is about *speed/quality of generation*, not *story access*.

---

## E) Pricing Psychology

### Charm Prices (USD, 2025–2026)

| Price Point | What It's For | Psychology |
|-------------|--------------|------------|
| $0.99 | Single small cosmetic (nameplate, sticker, splash) | Impulse buy. "Less than a dollar." |
| $1.99 | Single cosmetic (dice pack, frame, SFX pack) | Standard microtransaction. Still impulse. |
| $2.99 | Premium single cosmetic (themed dice, UI theme) | "A couple bucks." Common app store price. |
| $3.99 | Higher-tier cosmetic (3D dice animation, music pack) | Premium cosmetic. |
| $4.99 | Voice pack, art-style unlock, supporter badge | "Five bucks." The ceiling for impulse buys. |
| $7.99 | Large cosmetic bundle (3+ items) | Bundle territory. |
| $9.99 | Season pass, cosmetic mega-bundle | "Ten dollars." Standard indie game price tier. (Steam indie pricing data, 2026) |
| $14.99 | Premium subscription tier | AI Dungeon Hero tier. |
| $19.99 | Top subscription tier | Friends & Fables Legend. NovelAI Opus is $25. |
| $29.99 | Deluxe bundle / founder's pack | "Thirty dollars." Premium indie game price. |
| $49.99 | Founder's pack / lifetime cosmetic unlock | High-end. Only for dedicated fans. |

### Subscription Bands for AI Narrative Apps (Monthly)

| Band | Price | What's Included | Examples |
|------|-------|---------------|----------|
| **Free** | $0 | Limited daily turns, basic TTS, basic art style, standard memory | AI Dungeon Wanderer, Friends & Fables free (25 turns/day), NovelAI Paper (free trial) |
| **Entry** | $5–10/mo | Unlimited or high turn cap, standard models, basic image gen | NovelAI Tablet ($10), Roll20 Plus ($5) |
| **Mid** | $15–20/mo | More images, more pins/context, premium TTS, priority queue | NovelAI Scroll ($15), Friends & Fables Starter ($19.95), AI Dungeon Hero ($14.99) |
| **Premium** | $25–40/mo | Best models, most images, longest context, voice cloning | NovelAI Opus ($25), Friends & Fables Legend ($39.95), AI Dungeon Legend ($29.99) |
| **Whale** | $50–100/mo | Everything + concierge features | AI Dungeon Mythic/Ultimate (~$50–100). Widely criticized. |

### SynapticGM Subscription Recommendation

| Tier | Price | What's Included |
|------|-------|---------------|
| **Free** | $0 | 20 turns/day, standard TTS voice, 3 images/day, standard memory (10 pins), standard art style |
| **Adventurer** | $9.99/mo | Unlimited turns, 10 images/day, 20 pins, all free art styles, standard TTS |
| **Hero** | $19.99/mo | Everything in Adventurer + 30 images/day, 50 pins, priority queue, 100 TTS min/mo, HD images |
| **Legend** | $29.99/mo | Everything in Hero + 50 images/day, 100 pins, 300 TTS min/mo, 1 premium voice pack included/mo, early cosmetic access |

### Consumable Turn Packs vs Unlimited Sub

| Model | Pros | Cons | Recommendation |
|-------|------|------|----------------|
| **Consumable turn packs** | No commitment. Players buy when they want more. Good for casual players. | Unpredictable revenue. Players feel nickeled-and-dimed. | Offer as an option, not the primary model. |
| **Unlimited sub** | Predictable revenue. Players feel they're getting a deal. | High monthly cost for operator (LLM tokens). Need to cap the heaviest users. | Primary model. Daily turn cap on free tier prevents abuse; paid tiers get high or unlimited turns. |
| **Hybrid** | Sub for core + consumables for extras (images, TTS minutes). | Complexity. | **Recommended.** Sub covers turns; consumables cover images and TTS minutes. |

### Regional / Steam Sale Norms

- Steam indie pricing in 2026: $4.99 for short narrative games (1–3h), $9.99–$14.99 for standard indie, $19.99–$24.99 for premium indie. (Steam Page Analyzer, gtstu.com, 2026)
- Launch discounts: 10% off for launch week is standard. Data shows "pricing higher and offering a launch discount outperforms pricing low from the start." (Steam Page Analyzer, 2026)
- Regional pricing: essential for non-US markets. Steam provides regional pricing tools. For a web-first product, consider PPP (purchasing power parity) pricing for key markets.
- Sales: Steam sales norms are 20–30% off after 3–6 months, 50%+ after 12 months. For cosmetics, seasonal sales (Halloween, winter) are expected.

### Whale vs Minnow Mix for This Niche

**This niche is mostly minnows.** Evidence:

- AI RPG communities skew indie/open-source. The audience is not the gacha-mobile audience.
- Friends & Fables' top tier ($39.95) draws complaints — the audience resists high prices.
- NovelAI's most popular tier is Tablet ($10), not Opus ($25). (AI Tools DevPro, 2026)
- AI Dungeon's top tiers ($50–100) are "difficult to justify" per reviewers. (Arcanum RPGs, 2026)
- LitRPG readers spend on *books* and *audiobooks* (Audible credits), not on gacha mechanics. The spending pattern is frequent small purchases, not whale dumps. (r/litrpg threads, 2025–2026)

**Implication:** Design for a high volume of $1.99–$9.99 purchases, not for $50+ whale packs. The subscription sweet spot is $9.99–$19.99/mo. Do not build whale-extraction mechanics (time-limited loot boxes, FOMO cosmetics, power creep).

---

## F) Risk & Trust

### Disclosure: Cosmetics Never Change Odds

Every dice skin, art style, and cosmetic product page must include a one-line disclosure:

> **"Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes."**

This is non-negotiable. D&D Beyond does this implicitly (dice are clearly cosmetic in a tabletop context). In a video game context, it must be explicit. Without this disclosure, players will assume "premium dice" roll better — and when they discover they don't, trust collapses.

### Kid Mode / Age Gates for IAP and Ads

| Requirement | Implementation |
|-------------|---------------|
| Kid Mode disables IAP | When Kid Mode is active, the cash shop is hidden. No purchase buttons. |
| Kid Mode disables ads | No rewarded ads, no interstitials, no banners in Kid Mode. |
| Age gate for IAP | Platform-level (App Store / Google Play / Steam) age gates apply. SynapticGM should not implement its own age gate for IAP — rely on platform. |
| Age gate for 18+ content | The maturity rating system (PG-13 / 18+) is separate from IAP. 18+ content is a *content* setting, not a *purchase* setting. Do not gate 18+ behind a paywall. |
| Parental controls | If the product is on mobile app stores, parental controls are platform-level. On web, consider a simple PIN lock for IAP in account settings. |

### Refund and "Bought Turns Unused" Norms

| Scenario | Norm | Recommendation |
|----------|------|----------------|
| Player buys turns and doesn't use them | No industry standard for refunding unused consumable turns. Most platforms treat consumables as non-refundable once used. | **Policy:** Unused consumable turns are refundable within 14 days if *none* have been used. If any have been used, no refund. This is stricter than some platforms but builds trust. |
| Player subscribes and cancels mid-month | Standard: subscription remains active until end of billing period. No prorated refund. | Follow standard. |
| Player buys a cosmetic and wants a refund | Cosmetics are generally non-refundable on most platforms. However, EU law requires a 14-day withdrawal right for digital content *unless* the player has explicitly consented to waive this right by starting the download/stream. | **Policy:** 14-day refund on cosmetics if the player hasn't equipped/used the cosmetic. Once equipped, no refund (EU waiver). |
| Player's child makes unauthorized IAP | Platform-level (App Store / Google Play) handles this. | Follow platform norms. Ensure Kid Mode blocks IAP to prevent this. |
| Double-charged | Standard: refund the duplicate. | Automated detection + manual review. |

### Conflict with Code-Owned Dice

**The single most important risk:** selling anything that touches the dice/loot/quest ledger.

| Item | Risk | Mitigation |
|------|------|-----------|
| Dice skins | Players assume premium dice roll better. | Disclosure on every dice product page. Code never reads the skin ID when rolling. |
| "Lucky" dice marketing | Implies RNG bias. | **Never use the word "lucky" in dice marketing.** Use "themed," "styled," "cosmetic." |
| Rerolls | Directly sells RNG manipulation. | **Never sell rerolls.** If undo-turn is offered (C02), it must revert the *entire turn* (action + roll + outcome), not just the roll. And it must be code-enforced. |
| Loot pity boost | Sells better loot odds. | **Never sell pity boosts.** The pity system is code-owned and invisible to the cash shop. |
| XP boost | Sells faster progression. | **Avoid.** If progression boost is ever considered, make it a *free* weekend event for all players, not a paid consumable. |
| Quest skip | Sells content bypass. | **Avoid.** If a quest is boring, redesign it. Don't charge to skip it. |

---

## G) SynapticGM Phased Recommendation

### Phase 0 (Trust): Free Core Story + Optional Tip/Supporter

| SKU | Price | Description |
|-----|-------|-------------|
| **Supporter Badge** | $4.99 (tip) | Permanent "Backer" badge on profile. No gameplay effect. |
| **"Buy the GM a Coffee"** | $2.99 (tip) | One-time tip. No reward except a thank-you message. |
| **Tip Jar (custom amount)** | $1–50 | Let players set their own amount. itch.io model. |

**Rationale:** Before selling anything, let players who want to support do so. This establishes that paying is optional and appreciated, not required. It also tests payment infrastructure.

### Phase 1: Cosmetics Only (Top 8 SKUs + Prices)

| # | SKU | Price | Why First |
|---|-----|-------|-----------|
| 1 | **Dice skin pack — System Holo** | $2.99 | Highest-demand cosmetic in tabletop apps. Easy to implement (visual only). |
| 2 | **UI theme — Neon System** | $3.99 | Full UI reskin. Fits the game's aesthetic. High perceived value. |
| 3 | **TTS narrator voice — Cold Registrar** | $4.99 | Highest-margin SKU. The "System voice" is iconic. Players will pay for this. |
| 4 | **System window skin — Cold Registrar** | $1.99 | Pairs with the voice. Low price, high attachment. |
| 5 | **Turn-frame chrome — Glitch borders** | $1.99 | Cheap to produce, fits the aesthetic. |
| 6 | **Character portrait frame — System halo** | $1.99 | Personal identity cosmetic. |
| 7 | **SFX pack — Loot rarity stingers** | $1.99 | Audio feedback for loot. Enhances the dopamine moment. |
| 8 | **Cosmetic bundle — "System Apocalypse Set"** (theme + dice + frame + System skin) | $9.99 | Bundle at ~30% discount. Best value for completionists. |

**Phase 1 total potential spend:** $9.99 (bundle) or ~$22 à la carte for all 8.

### Phase 2: Soft Convenience + Rewarded Ads

| # | SKU | Price | Type |
|---|-----|-------|------|
| 1 | **Adventurer subscription** | $9.99/mo | Unlimited turns, 10 images/day, 20 pins, all free art styles |
| 2 | **Hero subscription** | $19.99/mo | + 30 images/day, 50 pins, priority queue, 100 TTS min, HD images |
| 3 | **Legend subscription** | $29.99/mo | + 50 images/day, 100 pins, 300 TTS min, 1 voice pack/mo, early cosmetic access |
| 4 | **Extra turns — +10 turns** | $0.99 | Consumable |
| 5 | **Extra images — +10 images** | $1.99 | Consumable |
| 6 | **Premium TTS minutes — +100 min** | $2.99 | Consumable |
| 7 | **Extended memory — +50 pins** | $4.99/mo | Add-on to any sub |
| 8 | **Rewarded ad — +3 turns** | Free (watch ad) | Ad-funded |
| 9 | **Rewarded ad — +1 image** | Free (watch ad) | Ad-funded |
| 10 | **Rewarded ad — 1 cosmetic trial (24h)** | Free (watch ad) | Ad-funded |

### Phase 3: Only If Needed — Controversial Items and Safer Alternatives

| Item | Price | Controversy | Safer Alternative |
|------|-------|------------|-------------------|
| Revive | $0.99 | Lets players avoid death consequences. | **Free revive on Easy mode.** On Normal+, death has consequences (checkpoint restart, item loss). No paid revive. If a paid revive is ever added, limit to 1 per encounter and only on Normal (not Hard). |
| Undo turn | $0.99 | Reverts code-owned state. | **Free undo on Easy mode** (1 per session). On Normal+, no undo. If paid undo is added, limit to 1 per session and revert the *entire turn*, not just the roll. |
| Reroll check | $0.99 | **Never.** Sells RNG manipulation. | No alternative. Never ship this. |
| XP boost | $1.99 | Pay-to-progress-faster. | **Free XP weekend events** for all players. Never a paid consumable. |
| Loot pity boost | $2.99 | **Never.** Sells loot odds. | No alternative. Never ship this. |
| Quest skip | $1.99 | Pay-to-skip content. | **Redesign the quest.** If players want to skip it, it's not fun. |

---

## H) Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|--------------|
| AI Dungeon Review 2026 (Arcanum RPGs) | https://arcanumrpgs.com/blog/ai-dungeon-review | Aug 15, 2026 | Subscription tiers ($14.99–$100), premium pricing criticism, memory handling |
| AI Dungeon Review 2026 (DungeonsDeep) | https://dungeonsdeep.ai/blog/ai-dungeon-review-2026 | Aug 15, 2026 | Credit system opacity ("hard to parse"), free Wanderer tier, plan-to-playtime mapping problem |
| NovelAI Pricing 2026 (AI Tools DevPro) | https://aitoolsdevpro.com/ai-tools/novelai-guide | Aug 15, 2026 | Subscription tiers ($10/$15/$25), Anlas credits, context length gating, TTS voice quality by tier |
| NovelAI Pricing 2026 (CheckThat.ai) | https://checkthat.ai/brands/novelai/pricing | Aug 15, 2026 | Anlas bundling, image gen tokens, unlimited text model |
| Friends & Fables Review 2026 (DungeonsDeep) | https://dungeonsdeep.ai/blog/friends-and-fables-review-2026 | Aug 15, 2026 | Pricing tiers ($19.95–$39.95), combat burns credits 2–3x, tier-gated memory limits |
| AI Realm vs Friends & Fables (DungeonsDeep) | https://dungeonsdeep.ai/blog/ai-realm-vs-friends-and-fables | Aug 15, 2026 | Turn-sharing in multiplayer, friends-play-free model, pricing psychology |
| D&D Beyond Marketplace — Digital Dice | https://www.dndbeyond.com/tag/digital-dice | Aug 15, 2026 | Dice skin pricing ($1.99–$5.99), seasonal/themed sets, marketplace model |
| D&D Beyond Forums — Microtransactions | https://www.dndbeyond.com/forums/d-d-beyond-general/general-discussion/158989-watch-out-all-microtransactions-are-on-their-way | Aug 15, 2026 | Player sentiment on a la carte content vs dice cosmetics |
| D&D Beyond Drops Update (June 2026) | https://www.dndbeyond.com/posts/2187-d-d-beyond-drops-update-on-the-program | Aug 15, 2026 | Drops program (free cosmetic drops for subs), yearly bundle commitment, player trust recovery |
| Foundry vs Roll20 vs Owlbear 2026 (GM Craft Tavern) | https://gmcrafttavern.com/foundry-vs-roll20-owlbear-2026 | Aug 15, 2026 | Roll20 sub tiers ($5–10/mo), Foundry one-time license, marketplace models |
| VTT Dice Compared 2026 (DungeonsDeep) | https://dungeonsdeep.ai/blog/virtual-tabletop-dice-systems | Aug 15, 2026 | Dice are free on Roll20/Foundry/Owlbear; cosmetic dice marketplace patterns |
| Mobile Game Monetization 2026 (StudioKrew) | https://studiokrew.com/blog/mobile-game-monetization-models-2026 | Aug 15, 2026 | Rewarded ads (player-chosen, respect choice), energy-based progression, hybrid monetization |
| Top 7 Mobile Game Monetization 2026 (Adapty) | https://adapty.io/blog/mobile-game-monetization | Aug 15, 2026 | 74% of US players watch rewarded ads, interstitial frequency caps (2–3 per 15 min), natural break placement |
| ElevenLabs Pricing 2026 (Cekura) | https://www.cekura.ai/blogs/elevenlabs-pricing | Aug 15, 2026 | TTS pricing: Free (10k credits), Starter ($5/30k), Creator ($22/100k ≈ 100 min), Pro ($99/500k) |
| ElevenLabs Pricing 2026 (BigVu) | https://bigvu.tv/blog/elevenlabs-pricing-2026-plan-worth | Aug 15, 2026 | Creator plan details, professional voice cloning, 192kbps audio quality |
| Steam Pricing Strategy 2026 (Steam Page Analyzer) | https://www.steampageanalyzer.com/blog/steam-pricing-strategy | Aug 15, 2026 | Indie price tiers ($4.99–$24.99), launch discount strategy, regional pricing |
| Indie Game Pricing on Steam 2026 (gtstu) | https://gtstu.com/steam-indie-game-pricing-strategy | Aug 15, 2026 | $14.99–$19.99 sweet spot for polished indie, $7.99–$9.99 for short games, common pricing mistakes |
| r/litrpg — Pay to win mechanics discussion | https://www.reddit.com/r/litrpg/comments/1c9ttln/what_are_some_pay_to_win_mechanics_that_would_be | Aug 15, 2026 | Anti-P2W sentiment in LitRPG community |
| r/litrpg — General community | https://www.reddit.com/r/litrpg | Aug 15, 2026 | LitRPG audience culture, spending patterns (Audible/books, not gacha) |
| Existing project research: AI_RPG_Research_Intel_and_Summary.md | (project file) | Aug 15, 2026 | Competitor architectures, Friends & Fables credit burn rate, Hidden Door card cosmetics |
| Existing project research: AI_RPG_Technical_UX_Research_Report.md | (project file) | Aug 15, 2026 | SynapticGM architecture (code owns dice/HP/loot), TTS/STT/art-style hooks, Kid Mode |

---

## I) Implementable Backlog Items (≤12, ordered)

1. **Supporter Badge — $4.99 tip** (Phase 0). Permanent profile badge. No gameplay effect. Tests payment infrastructure.
2. **Dice Skin Pack: System Holo — $2.99** (Phase 1). Neon holographic dice. "Cosmetic only" disclosure on product page. Code never reads skin ID when rolling.
3. **UI Theme: Neon System — $3.99** (Phase 1). Full UI reskin (System-apocalypse aesthetic). Does not change fog, map paths, or rules.
4. **TTS Narrator Voice: Cold Registrar — $4.99** (Phase 1). The iconic System voice. Highest-margin SKU. Operator cost: ~$0.22 per player/month at ElevenLabs Creator (assuming ~20 min TTS usage/mo).
5. **SFX Pack: Loot Rarity Stingers — $1.99** (Phase 1). Sound for common→legendary loot drops. Audio feedback only.
6. **Cosmetic Bundle: System Apocalypse Set — $9.99** (Phase 1). Theme + dice + frame + System skin at ~30% discount.
7. **Adventurer Subscription — $9.99/mo** (Phase 2). Unlimited turns, 10 images/day, 20 pins, all free art styles, standard TTS.
8. **Hero Subscription — $19.99/mo** (Phase 2). + 30 images/day, 50 pins, priority LLM queue, 100 TTS min/mo, HD images.
9. **Extra Turns Consumable: +10 turns — $0.99** (Phase 2). One-time purchase. More play time, not better outcomes.
10. **Rewarded Ad: Watch for +3 turns — Free** (Phase 2). Player-initiated. Never mid-narration. 74% acceptance rate per Adapty data.
11. **Rewarded Ad: Watch for 1 cosmetic trial (24h) — Free** (Phase 2). Try-before-you-buy. Drives cosmetic conversion.
12. **Disclosure line on every cosmetic product page: "Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes."** (Phase 1, mandatory). Builds trust. Prevents "lucky dice" assumption.

---

## J) UK / GBP shelf prices (no separate research needed)

**Do not commission a new UK report.** Player acceptance (cosmetics OK, P2W hated, rewarded ads OK) is the same in the UK. What changes is **shelf price**, not the product thesis.

**FX anchor (mid-Aug 2026):** ~**£1 ≈ $1.35** (GBP/USD ≈ 1.35) → rough `$ ÷ 1.35 ≈ £`.  
**Do not list pure FX** (e.g. $2.99 → £2.21). Snap to **UK charm prices** shops already use: £0.79 / £0.99 / £1.99 / £2.99 / £3.99 / £4.99 / £7.99 / £8.99 / £9.99 / £14.99 / £19.99 / £24.99 / £29.99.

Steam / App Store / Google Play also set regional prices; treat the table below as **intent**, then let the store localize if you enable it.

### Charm-price map (USD research → recommended GBP)

| USD (Pack 9) | Rough FX (£) | **Recommended UK shelf** | Typical use |
|--------------|--------------|--------------------------|-------------|
| $0.99 | ~£0.73 | **£0.79** or **£0.99** | Small cosmetic / +10 turns |
| $1.99 | ~£1.47 | **£1.99** | Frame, SFX, System skin |
| $2.99 | ~£2.21 | **£2.99** | Dice pack, map skin |
| $3.99 | ~£2.96 | **£2.99** or **£3.99** | UI theme, music (prefer £2.99 if parity with dice) |
| $4.99 | ~£3.70 | **£3.99** or **£4.99** | Voice pack, supporter tip (voice → **£4.99**) |
| $9.99 | ~£7.40 | **£7.99** or **£8.99** | Bundle / Adventurer sub (prefer **£8.99** if matching “ten quid” feel, or **£7.99** for value) |
| $14.99 | ~£11.10 | **£11.99** / **£12.99** | Mid sub (if used) |
| $19.99 | ~£14.81 | **£14.99** or **£17.99** | Hero sub |
| $29.99 | ~£22.21 | **£22.99** or **£24.99** | Legend sub |
| $49.99 | ~£37.03 | **£39.99** | Founder / lifetime (rare) |

### Phase SKUs in GBP (recommended shelf)

| Phase | SKU | USD | **GBP** |
|-------|-----|-----|---------|
| 0 | Supporter tip / badge | $4.99 | **£4.99** |
| 1 | Dice — System Holo | $2.99 | **£2.99** |
| 1 | UI theme — Neon System | $3.99 | **£3.99** |
| 1 | TTS — Cold Registrar | $4.99 | **£4.99** |
| 1 | System window / frames / SFX | $1.99 | **£1.99** |
| 1 | Apocalypse cosmetic bundle | $9.99 | **£7.99** (or £8.99) |
| 2 | Adventurer sub | $9.99/mo | **£8.99/mo** |
| 2 | Hero sub | $19.99/mo | **£14.99/mo** or **£17.99/mo** |
| 2 | Legend sub | $29.99/mo | **£24.99/mo** |
| 2 | +10 turns | $0.99 | **£0.99** |
| 2 | +10 images | $1.99 | **£1.99** |
| 2 | +100 TTS min | $2.99 | **£2.99** |

**VAT note (UK):** Consumer prices are usually **VAT-inclusive**. Platform cuts (Steam/Apple/Google) still apply on top of your net. Operator costs (LLM, ElevenLabs) are often invoiced in USD — budget margin in USD even if the shop shows £.

**Revisit FX** only if GBP/USD moves a long way (e.g. outside ~1.25–1.45) before you ship the shop; then re-snap charm prices, don’t rewrite the acceptance research.

---

**Speculation markers:**
- TTS margin estimate assumes ~20 min TTS usage per player per month at ElevenLabs Creator rates ($22/mo ÷ 100 min = $0.22/min). Actual usage may vary. If players use more TTS, margin shrinks — consider a TTS minute cap even on paid tiers.
- Subscription pricing assumes LLM token costs of ~$0.01–0.02 per turn at GPT-4o Mini rates. If SynapticGM uses a more expensive model (GPT-4o, Claude Sonnet), the Hero/Legend tiers may need higher prices or tighter turn caps to maintain margin.
- The "mostly minnows" argument is based on community culture observation, not revenue data. SynapticGM does not have revenue data yet. The recommendation is conservative by design.
- GBP shelf table uses ~1.35 USD per GBP (Aug 2026). Charm snaps are product judgment, not store-enforced list prices.