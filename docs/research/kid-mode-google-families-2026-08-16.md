# Kid Mode — Google Play Families bar (2026-08-16)

Live SynapticGM Kid Mode (PIN lock + filters). Not a second kids-game product. Adult mode unchanged.

## Pass / fail bar implemented

Google Play **Families Policy Requirements**: content accessible to children must be appropriate for children. Common violations plus AI/UGC rules are the checklist.

| Pass (rewrite, then show / illustrate) | Fail (block or skip before API spend) |
|---|---|
| Cartoon defeat; foe asleep / knocked out / slumped | Sexual, nude, lingerie, suggestive poses |
| Mild peril; fantasy monsters without blood | Graphic violence, gore, torture, corpse close-ups |
| Opening scene; first-dungeon victory pose | Real-world crime how-to |
| Storybook “potion” already in a bible (no new glamor) | Alcohol / tobacco / drugs as playable glamor; needles; drunk scenes |
| Fully clothed, non-romantic-sexual “stunning” offer | Hate slurs (masked, not joked) |
| Fun swear swap (fuck → feck/duck) | Gambling as a mechanic (slots, betting, casino) |

Skip rather than generate-then-hide when the only honest picture is a Fail row. Typed gore/sex/drugs/gambling in Kid Mode is rewritten before the GM and cannot become a memorable prompt as typed.

## Sources (current Google Help, 2025–2026)

- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335) — app content appropriate for children; no glamorized alcohol/tobacco/controlled substances; no real or simulated gambling; no violence/gore/shocking content not appropriate for children; no dating/sexual advice; no mature ads to children. Effective **26 Aug 2026**: anonymous chat apps must not target children.
- [Policy announcement: 15 Jul 2026](https://support.google.com/googleplay/android-developer/answer/17134731) — Families policy now prohibits anonymous chat apps targeting children; AI integrations remain the developer’s responsibility.
- [AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294) — developers must prevent offensive / child-exploitative / deceptive AI output (text, voice, image).
- [Developer Program Policy](https://support.google.com/googleplay/android-developer/answer/17190352) — Restricted Content, UGC moderation, AI-generated content, hate speech, real-money gambling.
- [Inappropriate Content](https://support.google.com/googleplay/android-developer/answer/9878810) — sexual content / profanity; hate; gratuitous violence.
- [Child Endangerment / Child Safety Standards](https://support.google.com/googleplay/android-developer/answer/14747720) — zero tolerance for CSAE/CSAM; apps that appeal to children must not carry adult themes.

## Code

Shared module: `src/game/kidModeSafety.ts`. Wired through GM post-filter, player input rewrite, memorable/comic/portrait/item/loot/director/Flux/OpenRouter image prompts, opening, auto-fight, quests, system log, choices.
