# SynapticGM Premium Theme Design Synthesis

**Status:** Original SynapticGM recommendation.  
**Evidence boundary:** This document translates the public research logged in the research framework and browser findings. It is not a claim about SynapticGM’s current build, competitor internals, or market-wide price averages.

> **Design thesis.** A premium kit is a recognisable **material-and-behaviour system**, not a palette. At £3.99, the player should see one coherent identity across a panel, body prose, dice, turn frame, audio preview, and Shop preview before recognising its accent hue. A kit fails if changing the accent colour makes it indistinguishable from Integration Blue.

## 1. Operating grammar

| Layer | May vary by kit | Must not vary or be obscured | Practical consequence |
|---|---|---|---|
| Surface material | Texture stack, base material, edge sheen, low-frequency atmospheric treatment | Contrast-safe content backing, semantic colour tokens, readable text | `data-sgm-texture` changes decorative layers only; a solid fallback remains. |
| Geometry | Frame-corner silhouette, divider rhythm, dice edge treatment, tray rim | Content order, tap targets, focus geometry, state-marker placement | `data-sgm-frame` changes corners and ornament positions without moving state information. |
| Typography | Display face for a title, prose face where legible, numeric treatment | Critical labels, long-form legibility, fallback metrics, text-size behavior | A kit has one display moment and a stable UI/body fall-back, never decorative mechanics. |
| Dice | Material shader recipe, rim/readout trim, cosmetic tray effect | Numerical result, roll affordance, result semantics, odds | A dice material is faceted/highlighted, not a flat colour fill. |
| Motion/audio | One bounded ambient cue, one optional excited-roll cue, Hear preview | Auto-play, controls, state notifications, motion preferences | Every effect is optional, short, muted by default in Kid Mode, and has a reduced-motion/static fallback. |
| Shop preview | Same tokens, font policy, frame, dice material, and preferences as equipped view | Price, ownership, included-content and policy clarity | The card is a real rendered slice, not promotional art on a disconnected engine. |

## 2. Theme identity architecture

The kit auto-heal routine should resolve a single declarative record to current CSS variables and data attributes. The record needs no new engine: it supplies `themeKey`, existing `texture`, existing `frame`, `uiFont`, `storyFont`, `diceMaterial`, `voiceFlavor`, and optional component availability flags. On any missing asset, `uiTheme.ts` should use a visible fallback and mark the kit **degraded**, rather than quietly reusing Integration cyan.

| Required declarative field | Existing-system routing | Failure-safe behaviour |
|---|---|---|
| `texture` | `data-sgm-texture` | Use `plain` only with that kit’s neutral base and frame, never Integration Blue cyan. |
| `frame` | `data-sgm-frame` | Use the kit’s low-ornament fallback corner; preserve focus ring and all status badges. |
| `uiFont` / `storyFont` | `--sgm-font-ui`, `--sgm-font-story` or current equivalents | Use metrically compatible legible fallback; do not delay content or change layout unpredictably. |
| `diceMaterial` | Current dice material enum | Render solid faceted neutral fallback marked in QA as a material-load failure; no gameplay change. |
| `voiceFlavor` | Existing voice selector / preview | Keep visible TTS controls and a labelled “Voice unavailable” state; do not autoplay. |
| semantic state tokens | Existing `--sgm-*` state variables | Always retain canonical meanings and non-colour markers. |

## 3. Price ladder: a completeness rule, not a power rule

| Shelf position | Minimum recognisable delta | Permitted scope | Explicitly insufficient |
|---|---|---|---|
| Free — Integration Blue | Plain/slate registrar baseline; full state semantics; stable readable UI | No artificial degradation | Withholding contrast, scale, correction visibility, or dice functionality. |
| Mid included | A coherent background/frame/type accent and one previewable cosmetic component | Membership benefit only if access/end date is clear | A transient recolour presented as ownership. |
| High included | Multiple matching surfaces plus choice/control and higher preview fidelity | Additional polish and library breadth, never authority or story advantage | More glow or animation without material identity. |
| £2.99 single | One named, complete cosmetic component such as dice, frame, or voice | Must say exactly what it changes and what it does not | A themed thumbnail that applies only an accent. |
| £3.99 kit | Texture + frame + UI/prose type + material dice + Hear voice + turn treatment across minimum surfaces | Full, visible kit and real preview/apply parity | Missing one declared component or applying only Shop chrome. |
| £7.99–£9.99 bundle | Complementary whole kits/parts with exact included list and transparent saving | A curated collection; partial ownership status shown | A bundle that hides duplicates, subscription dependency, or pre-owned item arithmetic. |

## 4. Material separation matrix

The following matrix establishes original, IP-safe material grammar. Terms are internal design directions, not player-facing licensed references.

| Kit | Primary material grammar | Silhouette / frame grammar | Typography constraint | Dice read | Never-line |
|---|---|---|---|---|---|
| Integration Blue | Cold slate, plain registrar surface | Square administrative precision | Neutral sans only | Clean holo/neutral | Do not let it leak cyan into paid kit states. |
| Neon Protocol | Black-lacquer ground, bounded electric channels | Broken signal corners | Mono display only; body remains plain | Neon edge | Do not cover entire panels in glow. |
| Parchment Ledger | Warm fibrous matte, ink rules, dry edge wear | Ledger tabs and hairlines | Serif prose, neutral UI | Ivory/holo | Do not make stains obscure writable content. |
| Bone Reliquary | Ash, mineral dust, sparse bone striation | Reliquary notch / specimen label | High-legibility serif | Bone & iron | Do not turn it into saturated blue-green horror. |
| Phosphor Terminal | Near-black CRT bloom, sparse scanline | Terminal bracket / status bar | Mono body and headers | Neon / holo | Do not flicker text or status indicators. |
| Noir Crimson | Charcoal paper, white ink, one crimson interruption | Case-file corner / narrow shadow | Condensed title; readable body | Obsidian | Do not make all red imply alert. |
| Glass Spire | Frosted translucency with opaque reading well | Split glass bevel / fine fracture | Airy title plus stable UI | Frost crystal | Do not put critical copy on transparent backing. |
| Ember Depths | Charcoal rock, ember fissure, matte ash | Deep cut-stone corner | Robust serif / sans pairing | Ember | Do not make it synonymous with Infernal. |
| Wood Elf Grove | Mossy wood, leaf-shadow, living grain | Vine curl with controlled rhythm | Baskerville prose, simple UI | Wood | Do not use generic green fill as the identity. |
| Dark Elf Umbrance | Dusk velvet, black-violet thread, deep filigree | Fine filigree crescent | Cormorant prose, neutral controls | Obsidian | Do not let its airy pattern read as High Elf. |
| High Elf Spire | Ivory stone, silver line, clean vertical lift | Tall stepped corner | Cinzel is title-only | Ivory | Do not reuse Cinzel across the shelf. |
| Dwarf Forgehall | Soot stone, hammered brass, warm forge spark | Hammer head / stone-grid | MedievalSharp title only | Brass | Do not flatten to brown-orange metal. |
| Orc Warcamp | Rough iron, canvas banner, weighty matte | Broad spike/stud | Compressed display, clear body | Iron | Do not confuse with Goblin scrap. |
| Dragon Hoard | Layered scale enamel, aged gold glint | Multi-row scale corner | Decorative display in short titles only | Scale | Do not turn each UI surface into repeating scales. |
| Phoenix Ashrise | Ash paper, feather flame edge, ember-to-cream | Feather/flame taper | Playfair prose/title with sans UI | Ember | Do not make it a generic fiery red kit. |
| Cyborg Chassis | Brushed chassis, clipped circuit trace, hazard strip | Mechanical chamfer | Orbitron display only | Circuit | Do not leave default cyan as the only ‘tech’ signifier. |
| Angelic Radiance | Diffuse pearl, warm halo rim, breathable white space | Halo arc / soft radial | Cormorant title, sturdy UI | Marble | Do not reduce contrast through luminous wash. |
| Infernal Pact | Charred parchment, sulfur hotspot, seal imprint | Wax seal / broken edge | Crimson Pro prose | Sulfur | Do not copy vampire velvet or ember rock. |
| Undead Ossuary | Bone flecks, ash, cold mineral, hairline crack | Knuckle-bone corner | Special Elite title only; readable body | Bone | Do not introduce teal, velvet, or elegant lacquer. |
| Fae Glamour | Iridescent veil, twilight bloom, small prismatic shifts | Unclosed curved corner | Delicate display plus stable body | Iridescent | Do not use random rainbow noise. |
| Goblin Scrapheap | Mismatched scrap, rivet dots, oil-free dry grit | Rivet/bolt asymmetry | Scrap sans display, standard body | Scrap | Do not make it an Orc recolour. |
| Merfolk Abyss | Deep tide contour, pearl glint, blue-black depth | Tide curl / shell edge | Spectral prose, stable UI | Tide | Do not let dark water erase focus or state. |
| Vampire Nocturne | Flocked velvet, wine-glass glint, moonlit obsidian edge | Tapered gothic arch | Grenze Gotisch title only, humanist body | Velvet / Wine Obsidian | Do not use bones, wax seals, or flat maroon panels. |

## 5. Vampire Nocturne: P0 diagnostic model

### What stays

Keep the provided anchors: **Grenze Gotisch** for short display use, pointed gothic arch geometry, a velvet texture token, Wine Obsidian dice, and Nocturne TTS. Their issue is not concept absence; it is lack of coordinated surface hierarchy.

### What is likely failing

| Failure hypothesis | Observable symptom | P0 correction |
|---|---|---|
| Flat-maroon dominance | A blurred screenshot still reads “dark red skin.” | Replace broad maroon fills with a near-black plum ground, low-frequency flock, narrow oxblood only at selected edges, and cool moonlit rim. |
| Integration chrome leak | Cyan focus/selected/badge remains visible after equip. | Audit semantic tokens separately from cosmetic accent; set kit-specific neutral focus treatment at compliant contrast, but preserve canonical state names and non-colour marks. |
| Decorative font misuse | Dense labels look theatrical or shift layout. | Restrict Grenze Gotisch to 1–2 level titles, use a humanist/sans UI fallback for controls and a legible prose face. |
| Unmaterial dice | Dice are a burgundy/black flat hex. | Add faceted velvet-black planes, a thin wine edge, pale face numerals, low-gloss highlight and a static tray shadow. |
| Preview inflation | Shop shows velvet/lens light not present in play. | Render preview from the same theme variables and same frame/dice components; use an in-play mini scene plus before/after toggle. |
| False-family collapse | Nocturne resembles Infernal or Ossuary at a glance. | Conduct the false-friend test with velvet/arch/moonlight vs sulfur/seal/heat vs bone/crack/ash. |

### P0 token direction

```css
/* Original direction; map these values into existing --sgm-* variables rather than a new engine. */
[data-theme="vampire-nocturne"] {
  --sgm-surface-base: #171018;
  --sgm-surface-raised: #22131f;
  --sgm-surface-reading: #1c1720;
  --sgm-ink-primary: #f4e9ec;
  --sgm-ink-muted: #c9b5bb;
  --sgm-accent-wine: #8d2746;
  --sgm-edge-moon: #c8bfd7;
  --sgm-frame-shadow: #08060b;
  --sgm-texture-opacity: .18;
}
```

The palette is illustrative and must be contrast-tested per final UI context. It is not a licence to encode state by wine versus moonlight.

## 6. Recognition protocol thresholds

| Test | Pass bar | Failure meaning |
|---|---|---|
| Accent-blurred naming | At least 4 of 5 independent raters identify the intended kit family from a prepared, accent-desaturated screenshot; no more than one false-friend label. | Material, frame, type, dice, and surface grammar are not distinctive enough. |
| Greyscale | At least 4 of 5 raters distinguish selected/owned/locked/correction/pinned/canon/evidence/invention with labels/shapes, not colour. | State semantics depend on hue or decoration. |
| Preview parity | The application screenshot and Shop preview match on required material, frame, UI font, story font, dice, voice controls, and turn chrome; no required component may be absent. | Preview lied or auto-heal is incomplete. |
| Phone-width frame | At 320 CSS px and 200% text, at least two signature corners or edge treatments remain visible without covering labels or focus. | Frame is ornamental rather than responsive. |
| Dice material | At least 4 of 5 raters choose the declared material from a closed set at normal size; values remain legible. | Flat fill or excessive effect dominates material read. |
| Reduced motion / Kid Mode | All recognition tests remain passable with shimmer, parallax, auto-audio, and non-essential particle motion disabled. | Identity depends on sensory pressure rather than material system. |

## 7. Surface policy

A complete £3.99 kit must restyle the **background/page atmosphere**, panels, UI/title and story typography, frames, dice/tray, TTS selector/preview, turn chrome, HUD accents, Shop preview, Adventurer card, character sheet/paper-doll, journal, inventory/drawers, map chrome, Salvage/System windows, and Settings theme hubs. It does not need maximum ornament everywhere: an identity can use expressive primary surfaces and restrained secondary surfaces. But no listed surface may silently snap to Integration Blue.

## 8. Accessibility constraints baked into material recipes

Material stacks remain **progressive enhancement**. They sit behind readable surfaces and are not required to decode a result. Critical normal-size text needs at least 4.5:1 contrast and significant controls/indicators at least 3:1 against adjacent colours; colour is never the sole state marker. These thresholds derive from W3C’s published criteria [1] [2]. At 200% text scale and the 320 CSS-pixel reflow condition, a kit’s content and controls stay accessible; non-essential movement responds to `prefers-reduced-motion` [3] [4]. Background imagery does not communicate essential information because it is not announced to screen readers [5].

## References

[1]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C, Understanding SC 1.4.3: Contrast (Minimum), accessed 2026-08-19"
[2]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html "W3C, Understanding SC 1.4.11: Non-text Contrast, accessed 2026-08-19"
[3]: https://www.w3.org/WAI/WCAG22/Understanding/reflow "W3C, Understanding SC 1.4.10: Reflow, accessed 2026-08-19"
[4]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN, prefers-reduced-motion, accessed 2026-08-19"
[5]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image "MDN, background-image, accessed 2026-08-19"
