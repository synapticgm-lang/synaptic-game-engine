# T6 — Vampire Nocturne Rescue Brief — P0

## Objective

John’s reported outcome—“still generic dark maroon”—is a **P0 identity failure**. The remedy is not a brighter red or more Gothic decoration. It is a distinct material hierarchy: **velvet flock**, a subtle **wine-glass glint**, a **moonlit obsidian edge**, and aristocratic night that remains original and non-franchise-specific. The kit must be recognisable before its accent hue is visible.

## Keep, because the concept is already valuable

| Current anchor | Keep? | Reason | Constraint |
|---|---|---|---|
| Grenze Gotisch | Yes | Strong short-form title signature | Title/chapter marker only; never dense controls or state text. |
| Pointed gothic arch | Yes | Useful outer-frame silhouette | Outer corners only; preserve focus/interaction geometry. |
| Velvet texture token | Yes | Right material family | Use flock direction and low-gloss edge, not a maroon flat fill. |
| Wine Obsidian dice | Yes | Natural dice-material anchor | Use faceted black-plum planes, pale numerals, restrained wine rim. |
| Nocturne TTS | Yes | Audio differentiator | Hear is user-invoked; no autoplay; visible mute/availability state. |

## What is failing and P0 repair

| Likely failure | In-play symptom | P0 repair | Acceptance test |
|---|---|---|---|
| Flat-maroon panel | Screenshot reads “red dark mode.” | Near-black plum base; flock only in raised panels; oxblood limited to selected edge; cool moonlit outer rim. | Accent-blurred naming: 4/5 call Nocturne. |
| Integration leak | Cyan badge/focus/edge survives equip. | Audit all theme-owned visual tokens and portal roots; use compliant neutral focus treatment plus canonical non-colour state marks. | Cyan bleed inventory = zero unless semantically mandated and labelled. |
| Font overreach | Labels look theatrical; hierarchy collapses. | Grenze Gotisch at title scale only; humanist UI plus stable prose fallback. | 200% text and spacing override have no overlap. |
| Flat dice | ‘Velvet’ reads as a burgundy hex. | Three dark faceted planes, one low-gloss diagonal, pale faces, wine rim at ≤10% surface area. | 4/5 material selection; values readable. |
| Preview inflation | Shop has flock/shine, play does not. | Preview renders the identical token stack, same frame, dice and motion preference. | Zero mandatory components missing in comparison. |

## Concrete token backlog direction

```css
/* Map these roles into existing --sgm-* tokens; this is not a new engine. */
[data-sgm-texture="velvet"][data-theme="vampire-nocturne"] {
  --sgm-surface-base: #171018;
  --sgm-surface-raised: #22131f;
  --sgm-surface-reading: #1c1720;
  --sgm-ink-primary: #f4e9ec;
  --sgm-ink-muted: #c9b5bb;
  --sgm-accent-wine: #8d2746;
  --sgm-edge-moon: #c8bfd7;
  --sgm-texture-opacity: .18;
}
```

The values are **SPECULATIVE design targets**, not passed values; every text/control combination must be measured in its actual composited context. Use a solid reading base, then add two low-contrast diagonal/repeating gradient layers and a static edge vignette. Any ambient glint is opacity-only, one cycle ≥12 seconds, disabled by reduced motion, and absent in Kid Mode. Background imagery cannot carry state [12].

## Before / after acceptance sequence

| Test | Before is failing when | After passes when |
|---|---|---|
| Integration side-by-side | Only accent changes; HUD or Sheet looks default. | Background, panel, prose, frame, dice, turn, and Shop sample share the Nocturne grammar. |
| Undead comparison | Both are black-red/bone horror. | Nocturne is intact velvet/moonlight; Ossuary is brittle bone/ash/cold crack. |
| Infernal comparison | Both use red and dark panels. | Nocturne uses wine/velvet/cool rim; Pact uses dry char/sulfur/local heat/seal. |
| Noir comparison | Both become dark maroon paper. | Noir is matte case-file with a red interruption; Nocturne is textile/lacquered night. |
| Accent-blurred | Raters answer generic “dark maroon.” | 4/5 correctly identify Nocturne family; ≤1 false friend. |
| Shop parity | Preview seems more premium than play. | Exact material/frame/font/dice/voice components render after equip. |

### P0 checklist

- [ ] Token audit finds and removes unintended Integration cyan on every listed surface.
- [ ] Nocturne uses title-only Grenze Gotisch and a loaded/fallback body policy.
- [ ] Velocity and opacity budget pass reduced-motion and Kid Mode.
- [ ] Dice renderer exposes faceted velvet construction, not a flat fill.
- [ ] Theme card contains an in-play sample, a texture close-up, a dice close-up, and a user-invoked Hear control.
- [ ] Screenshot evidence records all five comparison tests before release.

## References

[1]: https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ "Discord Shop FAQ — accessed 2026-08-19"
[2]: https://legal.epicgames.com/store/refund-policy "Epic Games Store Refund Policy — accessed 2026-08-19"
[3]: https://store.steampowered.com/steam_refunds/ "Steam Refunds — accessed 2026-08-19"
[4]: https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d "D&D Beyond customization article — accessed 2026-08-19"
[5]: https://blog.roll20.net/posts/introducing-the-new-roll20-dungeons-dragons-character-sheet/ "Roll20 sheet redesign — accessed 2026-08-19"
[6]: https://foundryvtt.com/packages/ "Foundry package directory — accessed 2026-08-19"
[7]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C SC 1.4.3 — accessed 2026-08-19"
[8]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html "W3C SC 1.4.11 — accessed 2026-08-19"
[9]: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color "W3C SC 1.4.1 — accessed 2026-08-19"
[10]: https://www.w3.org/WAI/WCAG22/Understanding/reflow "W3C SC 1.4.10 — accessed 2026-08-19"
[11]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN prefers-reduced-motion — accessed 2026-08-19"
[12]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image "MDN background-image — accessed 2026-08-19"
[13]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display "MDN font-display — accessed 2026-08-19"
[14]: https://web.dev/articles/animations-guide "web.dev CSS animation guide — accessed 2026-08-19"
