from pathlib import Path
import csv, json, shutil, textwrap

P = "SynapticGM_premium_themes_price_tiers_maxextract_2026-08-19"
ROOT = Path("/home/ubuntu") / P
ROOT.mkdir(parents=True, exist_ok=True)

def write(name, body):
    (ROOT / f"{P}_{name}").write_text(textwrap.dedent(body).strip() + "\n", encoding="utf-8")

def table(headers, rows):
    return "| " + " | ".join(headers) + " |\n|" + "|".join(["---"] * len(headers)) + "|\n" + "\n".join("| " + " | ".join(str(x).replace("\n", "<br>") for x in r) + " |" for r in rows)

# Catalog supplied in the brief. The asset/tooling assertions below are original requirements, not claims of current build state.
kits = [
    ("integration-blue", "Integration Blue", "plain", "square registrar", "system sans", "system sans", "holo", "Cold Registrar", "Free"),
    ("neon-protocol", "Neon Protocol", "neon", "broken signal", "Optic Mono", "system sans", "neon", "Street Chronicler", "£3.99"),
    ("parchment-ledger", "Parchment Ledger", "parchment", "ledger tab", "Libre Baskerville", "Libre Baskerville", "ivory", "Grizzled Mentor", "£3.99"),
    ("bone-reliquary", "Bone Reliquary", "bone", "reliquary notch", "Special Elite", "system serif", "bone", "Grizzled Mentor", "£3.99"),
    ("phosphor-terminal", "Phosphor Terminal", "phosphor", "terminal bracket", "Optic Mono", "monospace", "neon", "Cold Registrar", "£2.99"),
    ("noir-crimson", "Noir Crimson", "noir", "case-file corner", "Grenze Gotisch", "system sans", "obsidian", "Street Chronicler", "£3.99"),
    ("glass-spire", "Glass Spire", "glass", "split glass bevel", "Cinzel", "system sans", "frost", "Cold Registrar", "£3.99"),
    ("ember-depths", "Ember Depths", "ember", "cut-stone", "Crimson Pro", "system sans", "ember", "Forge Deep", "£3.99"),
    ("wood-elf-grove", "Wood Elf Grove", "moss", "vine", "Libre Baskerville", "Libre Baskerville", "wood", "Grove Whisper", "£3.99"),
    ("dark-elf-umbrance", "Dark Elf Umbrance", "dusk", "filigree", "Cormorant", "Cormorant", "obsidian", "Under-Realm", "£3.99"),
    ("high-elf-spire", "High Elf Spire", "ivory", "ivory step", "Cinzel", "system serif", "ivory", "Lofty Court", "£3.99"),
    ("dwarf-forgehall", "Dwarf Forgehall", "soot", "hammer / stone grid", "MedievalSharp", "system sans", "brass", "Forge Deep", "£3.99"),
    ("orc-warcamp", "Orc Warcamp", "banner", "spike / stud", "Impact-class", "system sans", "iron", "Warcamp", "£3.99"),
    ("dragon-hoard", "Dragon Hoard", "scale", "multi-row scale", "Cinzel Decorative", "system serif", "scale", "Hoard Rumble", "£3.99"),
    ("phoenix-ashrise", "Phoenix Ashrise", "ember", "feather-flame", "Playfair", "system sans", "ember", "Ashrise", "£3.99"),
    ("cyborg-chassis", "Cyborg Chassis", "circuit", "mechanical chamfer", "Orbitron", "system sans", "circuit", "Chassis Synth", "£3.99"),
    ("angelic-radiance", "Angelic Radiance", "halo", "halo arc", "Cormorant", "system sans", "marble", "Radiance", "£3.99"),
    ("infernal-pact", "Infernal Pact", "sulfur", "wax seal / broken edge", "Crimson Pro", "Crimson Pro", "sulfur", "Pact Heat", "£3.99"),
    ("undead-ossuary", "Undead Ossuary", "bone", "knuckle-bone", "Special Elite", "system serif", "bone", "Ossuary", "£3.99"),
    ("fae-glamour", "Fae Glamour", "glamour", "unclosed curved corner", "Twilight Serif", "system sans", "iridescent", "Glamour", "£3.99"),
    ("goblin-scrapheap", "Goblin Scrapheap", "scrap", "rivet / bolt", "Scrap Sans", "system sans", "scrap", "Scrap Cackle", "£2.99"),
    ("merfolk-abyss", "Merfolk Abyss", "tide", "tide curl", "Spectral", "Spectral", "tide", "Abyss Tide", "£3.99"),
    ("vampire-nocturne", "Vampire Nocturne", "velvet", "pointed gothic arch", "Grenze Gotisch", "humanist sans", "velvet", "Nocturne", "£3.99"),
]
kit_by_key = {x[0]: x for x in kits}

refs_common = """
## References

[1]: https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ "Discord, Shop FAQ — accessed 2026-08-19"
[2]: https://legal.epicgames.com/store/refund-policy "Epic Games Store, Refund Policy — accessed 2026-08-19"
[3]: https://store.steampowered.com/steam_refunds/ "Steam, Refunds — accessed 2026-08-19"
[4]: https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d "D&D Beyond, character sheet customization — accessed 2026-08-19"
[5]: https://blog.roll20.net/posts/introducing-the-new-roll20-dungeons-dragons-character-sheet/ "Roll20, character-sheet redesign — accessed 2026-08-19"
[6]: https://foundryvtt.com/packages/ "Foundry Virtual Tabletop, package directory — accessed 2026-08-19"
[7]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C, Understanding SC 1.4.3 — accessed 2026-08-19"
[8]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html "W3C, Understanding SC 1.4.11 — accessed 2026-08-19"
[9]: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color "W3C, Understanding SC 1.4.1 — accessed 2026-08-19"
[10]: https://www.w3.org/WAI/WCAG22/Understanding/reflow "W3C, Understanding SC 1.4.10 — accessed 2026-08-19"
[11]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN, prefers-reduced-motion — accessed 2026-08-19"
[12]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image "MDN, background-image — accessed 2026-08-19"
[13]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display "MDN, font-display — accessed 2026-08-19"
[14]: https://web.dev/articles/animations-guide "web.dev, high-performance CSS animations — accessed 2026-08-19"
"""

# T1
write("T1_premium_theme_constitution.md", f"""
# T1 — Premium Theme Constitution

**Decision document.** This constitution applies to all SynapticGM cosmetics, free and paid. It is grounded in the supplied product law and in verified public patterns for previewed, owned, and subscription-gated cosmetics [1]. It is not a pricing forecast or legal opinion.

> **Mandatory store line:** “Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”

## The non-negotiable laws

A SynapticGM theme is a **state language skin**, not a mechanics switch. It may alter material, frame, type, motion, dice treatment, and audio flavour; it may never hide, remap, or render ambiguous player correction, pinned canon, StateTx, evidence, or invention. Content order, hit targets, result semantics, ownership semantics, and dice odds remain unchanged.

Premium means **materials over hue**. A £3.99 kit is a coherent, rendered system: a distinctive material surface, recognisable corner silhouette, restrained typography pairing, faceted dice material, optional Hear voice, and turn chrome across the required product surfaces. Its identity must remain recognisable when accent colour is blurred. A flat panel plus a new accent is not a kit; it is an unsupported recolour.

The free default is fully usable, accessible, and complete. Paid cosmetics buy expression, not baseline legibility, information access, responsiveness, motion control, or semantic clarity. Public storefronts distinguish permanent purchases, subscription-dependent access, ownership, and bundle state; SynapticGM must disclose equivalent facts accurately rather than imply them [1]. Refund labels and policies vary by seller and payment route, so SynapticGM must show its own accurate terms beside purchase rather than inherit anyone else’s policy [2] [3].

| Constitutional rule | Operational definition | Release gate |
|---|---|---|
| **Materials > hue** | At least three non-hue recognition channels: material stack, frame silhouette, type hierarchy, or dice construction. | Five-rater blurred-accent test passes at 4/5. |
| **Complete kit** | Texture, frame, UI/story font policy, dice material, voice preview, and turn treatment resolve on equip. | No required component is missing or silently falls back to Integration cyan. |
| **Honest Shop** | Preview and equipped play use the same tokens, font loading policy, asset availability, and motion preference. | Screenshot parity checklist passes; all contents/price/ownership are visible. |
| **Semantic continuity** | Canonical states use labels/icons/patterns in addition to colour. | Greyscale and forced-colours smoke tests pass. |
| **Accessible luxury** | Effects are progressive enhancement; text, focus, controls, and results retain contrast/reflow. | 4.5:1 normal-text, 3:1 significant-control gates and preference tests pass [7] [8]. |
| **Kid Mode restraint** | No pressure loops, autoplay, rapid shimmer, or decorative overload. | Reduced-motion, muted, high-contrast defaults remain recognisable. |

## Price promise

The £2.99 shelf sells a clearly bounded, complete cosmetic part. The £3.99 shelf sells a full kit. The £7.99–£9.99 shelf sells a transparent, complementary bundle whose components and partial-ownership treatment are visible before purchase. Each offer must say what changes, what does not, whether access is permanent or conditional, and where the applicable product policy is found. These are **SPECULATIVE SynapticGM product rules** informed by public shop disclosure patterns, not a legal conclusion [1] [2].

## Implementation covenant

No parallel theme engine is authorized. All work extends `SHOP_CATALOG`, `RACE_THEME_KITS`, existing `--sgm-*` variables, `data-sgm-texture`, `data-sgm-frame`, and auto-heal in `uiTheme.ts`. A component failure must degrade to the kit’s neutral fallback—not to Integration Blue—and it must be observable in QA.
{refs_common}
""")

# T2
ladder_rows = [
    ("Free default", "Stable slate baseline; readable state system; plain surface", "Optional sample/try-on only", "Withholding a11y, missing dice, dark-pattern upsell", "Free UI looks deliberately inferior or hides features", "Integration Blue — Free"),
    ("Mid-included", "Material/frame/type accent and visible entitlement badge", "Periodic choices, one optional ambient detail", "Expiry hidden; permanent-looking temporary access", "Subscription cosmetic vanishes or preview differs", "Future included cosmetics; state access/expiry explicitly"),
    ("High-included", "Broader choice set, complete preview control, cross-surface polish", "Audio-lite stingers, collection routing", "More glow treated as ‘premium’", "High tier provides no recognisable material delta", "Future High tier; do not promise before scope is real"),
    ("£2.99–£3.99 kit", "Named, complete component or full kit; real in-play preview", "Before/after, Hear voice, material dice close-up", "Hue-only swap; opaque price; no ownership badge", "‘Recolour tax’; a featured component is absent after equip", "Phosphor Terminal / Goblin Scrapheap £2.99; named £3.99 kits"),
    ("£7.99–£9.99 bundle", "Complementary complete contents, exact count, transparent saving", "Try collection, owned/partial-owned resolver", "Duplicate concealment; fictional saving; unclear access basis", "Buyer discovers overlap or less value than singles", "Ancestry Sampler £9.99; price math must be live-verified"),
]
write("T2_price_ladder_matrix.md", f"""
# T2 — Price Ladder Matrix

The price bands below are **SPECULATIVE SynapticGM shelf policy**. They are not an asserted market average. Public storefronts document preview, permanent-versus-subscription use, member pricing, bundle composition, and partial ownership as distinct concepts [1]. The matrix therefore treats disclosure and completeness as value signals.

{table(["Tier", "Must-have visual deltas", "Nice-to-have", "Anti-patterns", "Player regret triggers", "SynapticGM shelf mapping"], ladder_rows)}

## Shelf implementation note

At checkout, the card and confirmation state should name the included assets, price, ownership mode, any membership condition, compatibility/fallback status, and the applicable product policy. Public digital-store policies use explicit refundability/status labels but their policy details do not automatically apply to SynapticGM [2] [3]. **COUNSEL / payment-owner review** is required before adopting refund wording or a purchase trigger.
{refs_common}
""")

# T3
surfaces = [
    ("Palette", "Kit material neutrals, restrained cosmetic accents, kit-specific neutral focus treatment", "Canonical semantic meanings; labels/icons/patterns", "--sgm-* palette tokens", "Audit gap: exact semantic token inventory", "No Integration cyan leak; text/control contrast passes."),
    ("Panel textures", "Tokenized material stack and solid fallback", "Content backing and state text", "data-sgm-texture", "Audit mask/gradient fallback", "Texture removed still leaves readable panel."),
    ("Page/background atmosphere", "Low-frequency atmospheric field, vignette, edge treatment", "Reading well and navigation landmarks", "--sgm-* surface vars", "Audit root background selector", "No background image carries meaning."),
    ("Typography — UI", "Kit display face in short headings only", "Controls, labels, mechanics, fallback stack", "--sgm-font-ui", "Audit current var name/load path", "200% text has no clipping or overlap."),
    ("Typography — story prose", "Kit prose face where legible", "StateTx/correction/evidence differentiation", "--sgm-font-story", "Audit prose component coverage", "Prose face applies on journal/story and remains readable."),
    ("Frames/filigree", "Corner family and divider rhythm", "Focus ring, hit area, state badge geometry", "data-sgm-frame", "Audit phone breakpoint rules", "Two signature cues remain at 320 CSS px."),
    ("Dice materials + tray FX", "Faceted material, restrained tray rim/shadow, optional excited effect", "Roll result, odds, controls, numeric faces", "Existing diceMaterial enum", "Audit dice renderer props", "Material is not a flat fill; reduced motion works."),
    ("TTS/voice flavour", "Named voice selection and user-invoked Hear preview", "Mute, volume, transcript/control availability", "Existing voice selector", "Audit preview availability state", "No autoplay; unavailable state is explicit."),
    ("Turn chrome", "Kit frame/marker/tone around turn container", "Turn order and active-state meaning", "--sgm-* + data-sgm-frame", "Audit turn component", "Active turn remains evident in greyscale."),
    ("HUD accents", "Small kit material trims and icons", "Correction/pinned/canon/evidence/invention semantics", "--sgm-*", "Audit HUD scopes", "All semantic markers remain label+shape based."),
    ("Shop/Themes preview", "Same render recipe, font, dice, frame, voice controls", "Price, ownership, entitlement, policy disclosure", "SHOP_CATALOG + vars", "Audit preview renderer parity", "Chip-to-play delta checklist has zero missing required parts."),
    ("Adventurer card", "Material backing, portrait/frame harmony", "Identity, status, controls", "data-sgm-texture/frame", "Audit card root", "Card never looks like a separate default skin."),
    ("Paper-doll / character sheet", "Sheet paper/material, header ornament, section dividers", "Field order, editable inputs, roll actions", "--sgm-* + font vars", "Audit sheet and paper-doll roots", "No layout lock-in or control displacement."),
    ("Journal", "Prose type, paper/ledger texture, tabs/dividers", "Pinned canon, correction, evidence, invention", "--sgm-* + data texture", "Audit journal selectors", "State language survives print/forced colours."),
    ("Inventory/drawers", "Material drawer face, handles, frame trim", "Counts, item actions, filters", "--sgm-*", "Audit drawer portal roots", "Dark kits retain readable counts/focus."),
    ("Map chrome", "Border, legend panel material, controlled edge effect", "Map controls, pins, labels", "--sgm-* + frame", "Audit map overlay / portal
