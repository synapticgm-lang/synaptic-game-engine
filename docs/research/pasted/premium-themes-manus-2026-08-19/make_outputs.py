from pathlib import Path
import csv, json, textwrap

P='SynapticGM_premium_themes_price_tiers_maxextract_2026-08-19'
R=Path('/home/ubuntu')/P
R.mkdir(parents=True, exist_ok=True)

def w(n,s):
    (R/f'{P}_{n}').write_text(textwrap.dedent(s).strip()+'\n',encoding='utf-8')
def tbl(h,rows):
    return '| '+' | '.join(h)+' |\n|'+'|'.join('---' for _ in h)+'|\n'+'\n'.join('| '+' | '.join(str(x).replace('\n','<br>') for x in r)+' |' for r in rows)

REFS='''\n## References\n\n[1]: https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ "Discord Shop FAQ — accessed 2026-08-19"\n[2]: https://legal.epicgames.com/store/refund-policy "Epic Games Store Refund Policy — accessed 2026-08-19"\n[3]: https://store.steampowered.com/steam_refunds/ "Steam Refunds — accessed 2026-08-19"\n[4]: https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d "D&D Beyond customization article — accessed 2026-08-19"\n[5]: https://blog.roll20.net/posts/introducing-the-new-roll20-dungeons-dragons-character-sheet/ "Roll20 sheet redesign — accessed 2026-08-19"\n[6]: https://foundryvtt.com/packages/ "Foundry package directory — accessed 2026-08-19"\n[7]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C SC 1.4.3 — accessed 2026-08-19"\n[8]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html "W3C SC 1.4.11 — accessed 2026-08-19"\n[9]: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color "W3C SC 1.4.1 — accessed 2026-08-19"\n[10]: https://www.w3.org/WAI/WCAG22/Understanding/reflow "W3C SC 1.4.10 — accessed 2026-08-19"\n[11]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN prefers-reduced-motion — accessed 2026-08-19"\n[12]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-image "MDN background-image — accessed 2026-08-19"\n[13]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display "MDN font-display — accessed 2026-08-19"\n[14]: https://web.dev/articles/animations-guide "web.dev CSS animation guide — accessed 2026-08-19"\n'''

kits=[
('integration-blue','Integration Blue','plain','square registrar','system sans','system sans','holo','Cold Registrar','Free'),
('neon-protocol','Neon Protocol','neon','broken signal','Optic Mono','system sans','neon','Street Chronicler','£3.99'),
('parchment-ledger','Parchment Ledger','parchment','ledger tab','Libre Baskerville','Libre Baskerville','ivory','Grizzled Mentor','£3.99'),
('bone-reliquary','Bone Reliquary','bone','reliquary notch','Special Elite','system serif','bone','Grizzled Mentor','£3.99'),
('phosphor-terminal','Phosphor Terminal','phosphor','terminal bracket','Optic Mono','monospace','neon','Cold Registrar','£2.99'),
('noir-crimson','Noir Crimson','noir','case-file corner','Grenze Gotisch','system sans','obsidian','Street Chronicler','£3.99'),
('glass-spire','Glass Spire','glass','split glass bevel','Cinzel','system sans','frost','Cold Registrar','£3.99'),
('ember-depths','Ember Depths','ember','cut-stone','Crimson Pro','system sans','ember','Forge Deep','£3.99'),
('wood-elf-grove','Wood Elf Grove','moss','vine','Libre Baskerville','Libre Baskerville','wood','Grove Whisper','£3.99'),
('dark-elf-umbrance','Dark Elf Umbrance','dusk','filigree','Cormorant','Cormorant','obsidian','Under-Realm','£3.99'),
('high-elf-spire','High Elf Spire','ivory','ivory step','Cinzel','system serif','ivory','Lofty Court','£3.99'),
('dwarf-forgehall','Dwarf Forgehall','soot','hammer / stone-grid','MedievalSharp','system sans','brass','Forge Deep','£3.99'),
('orc-warcamp','Orc Warcamp','banner','spike / stud','Impact-class','system sans','iron','Warcamp','£3.99'),
('dragon-hoard','Dragon Hoard','scale','multi-row scale','Cinzel Decorative','system serif','scale','Hoard Rumble','£3.99'),
('phoenix-ashrise','Phoenix Ashrise','ember','feather-flame','Playfair','system sans','ember','Ashrise','£3.99'),
('cyborg-chassis','Cyborg Chassis','circuit','mechanical chamfer','Orbitron','system sans','circuit','Chassis Synth','£3.99'),
('angelic-radiance','Angelic Radiance','halo','halo arc','Cormorant','system sans','marble','Radiance','£3.99'),
('infernal-pact','Infernal Pact','sulfur','wax seal / broken edge','Crimson Pro','Crimson Pro','sulfur','Pact Heat','£3.99'),
('undead-ossuary','Undead Ossuary','bone','knuckle-bone','Special Elite','system serif','bone','Ossuary','£3.99'),
('fae-glamour','Fae Glamour','glamour','unclosed curved corner','Twilight Serif','system sans','iridescent','Glamour','£3.99'),
('goblin-scrapheap','Goblin Scrapheap','scrap','rivet / bolt','Scrap Sans','system sans','scrap','Scrap Cackle','£2.99'),
('merfolk-abyss','Merfolk Abyss','tide','tide curl','Spectral','Spectral','tide','Abyss Tide','£3.99'),
('vampire-nocturne','Vampire Nocturne','velvet','pointed gothic arch','Grenze Gotisch','humanist sans','velvet','Nocturne','£3.99')]
K={x[0]:x for x in kits}

w('T1_premium_theme_constitution.md',f'''# T1 — Premium Theme Constitution

> **Mandatory store line:** “Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”

A SynapticGM theme is a **state-language skin**, not a mechanics switch. It may alter material, frame, type, motion, dice treatment, and audio flavour. It may never hide, remap, or make ambiguous player correction, pinned canon, StateTx, evidence, or invention. Content order, hit targets, result semantics, ownership semantics, and dice odds remain unchanged.

Premium means **materials over hue**. A £3.99 kit is a coherent rendered system: distinctive material, recognisable corner silhouette, restrained typography pairing, faceted dice material, optional Hear voice, and turn chrome across required surfaces. It fails if, with accent colour blurred, it could be mistaken for Integration Blue.

| Rule | Operational definition | Gate |
|---|---|---|
| Materials > hue | At least three non-hue cues: surface, frame, type, dice | 4/5 blurred-accent raters identify family |
| Complete kit | Texture, frame, font policy, dice, voice, turn treatment resolve | Zero missing required components |
| Honest Shop | Preview and play use same tokens and preference branch | Parity checklist passes |
| Semantic continuity | Labels/icons/patterns supplement colour | Greyscale and forced-colours pass |
| Accessible luxury | Effects are progressive enhancement | Contrast, reflow, reduced-motion gates pass |
| Kid Mode restraint | No pressure, autoplay, or decorative overload | Calm, readable default passes |

Public stores distinguish preview, ownership, subscription access, and bundle state; SynapticGM should disclose the equivalent accurately [1]. Refund conditions are product and payment-route specific, so no external policy is adopted here [2] [3]. **COUNSEL / payment-owner review** is required for any live purchase wording.

No parallel engine is authorized. Extend `SHOP_CATALOG`, `RACE_THEME_KITS`, `--sgm-*`, `data-sgm-texture`, `data-sgm-frame`, and kit auto-heal in `uiTheme.ts`. A load failure falls back to the kit’s neutral surface, not Integration cyan.
{REFS}''')

ladder=[
('Free default','Stable slate baseline; full state language','Try-on sample','Artificial degradation','Default feels broken','Integration Blue — Free'),
('Mid-included','Material/frame/type accent; entitlement visible','Choice rotation','Hidden expiry','Temporary access looked permanent','Future included shelf; disclose terms'),
('High-included','Broader library; complete preview controls','Audio-lite polish','Glow marketed as premium','No coherent material delta','Future High shelf; no advance promise'),
('£2.99–£3.99','Complete part or full kit; in-play preview','Before/after; Hear; dice close-up','Hue-only swap','Recolour tax; missing part','Phosphor/Goblin £2.99; listed kits £3.99'),
('£7.99–£9.99','Complementary contents; count and saving shown','Collection try-on','Hidden duplicate arithmetic','Overlap or false bundle value','Ancestry Sampler £9.99; verify live math')]
w('T2_price_ladder_matrix.md',f'''# T2 — Price Ladder Matrix

The price bands are **SPECULATIVE SynapticGM shelf policy**, not a stated market average. The matrix transfers public disclosure patterns for previews, membership access, bundles, and partial ownership [1].

{tbl(['Tier','Must-have visual deltas','Nice-to-have','Anti-patterns','Player regret triggers','Shelf mapping'],ladder)}

At checkout, show included components, price, ownership mode, subscription dependency, fallbacks, and the applicable policy. Public refund labels demonstrate clarity patterns; they do not determine SynapticGM’s policy [2] [3].
{REFS}''')

# T3 — full surface coverage map
surfaces=[
('Palette','Material neutrals and restrained cosmetic accents','Canonical state meanings; labels/icons/patterns','--sgm-* palette','Audit state inventory','No cyan leak; contrast passes'),
('Panel textures','Tokenized texture stack and solid base','Content backing/state text','data-sgm-texture','Audit gradient/mask fallback','Removed texture still leaves readable panel'),
('Page/background atmosphere','Low-frequency field, vignette, edge treatment','Reading well/navigation landmarks','--sgm-* surface vars','Audit root selector','Background never carries meaning'),
('Typography — UI','Display face in short headings only','Controls, labels, mechanics','--sgm-font-ui','Audit var/loading','200% text has no clip/overlap'),
('Typography — story prose','Legible prose face','StateTx/correction/evidence differentiation','--sgm-font-story','Audit prose coverage','Story font applies and remains readable'),
('Frames/filigree','Corner family and divider rhythm','Focus ring/hit area/badge geometry','data-sgm-frame','Audit mobile rules','Two signature cues visible at 320px'),
('Dice + tray FX','Faceted material; restrained tray rim','Numbers, odds, roll control','diceMaterial enum','Audit renderer props','Not flat fill; reduced motion works'),
('TTS / voice','Named selection and user-invoked Hear','Mute, volume, availability state','Existing voice selector','Audit preview state','No autoplay; unavailable is explicit'),
('Turn chrome','Frame/marker/tone around turn container','Turn order and active-state meaning','--sgm-* + frame','Audit component','Active turn survives greyscale'),
('HUD accents','Small material trims/icons','Correction/canon/evidence/invention semantics','--sgm-*','Audit HUD scope','Markers remain label+shape based'),
('Shop/Themes preview','Same material/font/dice/frame/voice render','Price, ownership, entitlement','SHOP_CATALOG + vars','Audit preview parity','Zero missing required kit parts'),
('Adventurer card','Material backing and portrait/frame harmony','Identity/status/controls','texture + frame','Audit card root','Never appears as default skin'),
('Paper-doll / sheet','Sheet material, header ornament, dividers','Field order, inputs, roll actions','vars + font','Audit roots','No control displacement'),
('Journal','Prose face, paper, tabs/dividers','Pinned canon/correction/evidence/invention','vars + texture','Audit journal','State language survives print/forced colours'),
('Inventory / drawers','Material drawer face and handles','Counts, actions, filters','--sgm-*','Audit portals','Counts/focus read on dark kits'),
('Map chrome','Border, legend panel, controlled edge effect','Map controls, pins, labels','vars + frame','Audit overlay','No loss of marker clarity'),
('Salvage / System','Small material identity, frame header','System messages/actions/severity','--sgm-*','Audit modal/portal','Semantic severity is unchanged'),
('Settings hubs','Equipped sample, texture/frame swatch','Accessibility controls, ownership, apply action','SHOP_CATALOG + uiTheme','Audit settings','Honest preview with preference mode')]
w('T3_full_surface_coverage_map.md',f'''# T3 — Full Surface Coverage Map

Every row is a **SPECULATIVE SynapticGM implementation requirement**, constrained to the existing engine. Decorative CSS background layers must not carry essential information because assistive technology does not announce them [12].

{tbl(['Surface','What changes per kit','What stays Integration / semantic','Existing hook','Gap to audit','Acceptance criterion'],surfaces)}
{REFS}''')
with (R/f'{P}_T3_full_surface_coverage_map.csv').open('w',newline='',encoding='utf-8') as f:
    q=csv.writer(f); q.writerow(['surface','what_changes_per_kit','what_stays_semantic','existing_hook','gap_to_audit','acceptance_criterion']); q.writerows(surfaces)

# T4 — scorecard: names are research-source labels, never player-facing content-bank names.
score=[
('Discord Shop','Shop cosmetics / bundle','Layered profile effect, ownership, preview','N/A','N/A','Preview and permanent/subscription distinction','Published price/membership states','Truthful ownership and partial-bundle labels','Do not copy UI or naming','[1]'),
('Epic Store policy','Digital purchase disclosure','N/A','N/A','N/A','Refundability status labels','Policy/status signal','Visible policy route','Do not adopt its policy text','[2]'),
('Steam refunds','Bundles / purchase rights','N/A','N/A','N/A','Usage and bundle conditions','Policy signal','Define product-specific rules clearly','Do not claim Steam rules apply','[3]'),
('D&D Beyond sheet customisation','Layered sheet decoration','Portrait/frame/backdrop/theme layers','N/A','Digital dice as separate cosmetic selection','Cross-device fallback disclosed','Subscription/perk context','Layered controls; fallback disclosure','No artwork/layout/trade-dress copying','[4]'),
('Roll20 sheet redesign','Responsive information sheet','N/A','Density modes, retained actions','N/A','Usability tests / collapsed panels','Product context','Test time-on-task and misclicks','No sheet layout copying','[5]'),
('Foundry directory','Modular marketplace','Package categories','N/A','Visual effects as category','Metadata and compatibility','Premium/module labels','Explicit compatibility metadata','No modules/assets copied','[6]'),
('WCAG 2.2 contrast','Accessibility benchmark','N/A','Readable type hierarchy','N/A','Contrast requirements','N/A','4.5:1 normal text, 3:1 important UI','Do not use decorative exceptions for mechanics','[7] [8]'),
('WCAG use of color','State semantics','N/A','N/A','N/A','Non-colour state cues','N/A','Labels/icons/patterns as second channel','No colour-only ownership/status','[9]'),
('W3C reflow','Small-screen use','N/A','Text scaling/reflow','N/A','320 CSS px / 200% text testing','N/A','Phone + zoom acceptance gate','No desktop-only frames','[10]'),
('MDN background-image','CSS material layers','Gradient/layer capability','N/A','N/A','Background is nonsemantic','N/A','Material as decoration over solid fallback','No information in texture','[12]'),
('MDN font-display','Web-font resilience','N/A','Fallback loading policy','N/A','Fallback/swap choices','N/A','Explicit readable fallback','No invisible or shifting critical text','[13]'),
('web.dev animation guide','Motion restraint','N/A','N/A','Opacity/transform approach','Profiled, bounded animation','N/A','Small named-property effects','No blanket transition/all or needless will-change','[14]')]
w('T4_competitive_teardown_scorecard.md',f'''# T4 — Competitive Teardown Scorecard

**Research use only.** Product/domain names in this scorecard are citations, not SynapticGM content-bank labels. “Steal” means an IP-safe pattern; “refuse” means a prohibited transfer. Each row is limited to a public mechanism described by the cited source.

{tbl(['Product / domain','Trope overlap','Material vs recolour','Typography','Frames','Dice/chrome','Preview honesty','Price signal','Steal','Refuse','Citation'],score)}
{REFS}''')

# T5 — fourteen requested one-page deep dives.
deep=[
('Vampire / Nocturne','Vampire Nocturne','flocked velvet, wine-glass glint, moonlit obsidian edge','tapered gothic arch, slender vertical interruption','velvet / Wine Obsidian','flat maroon, bone residue, ubiquitous crimson, decorative type in dense controls','near-black plum reading well; oxblood only at select edges; cool rim; one title-only Gothic moment','Infernal Pact, Undead Ossuary, Noir Crimson','Do not use skulls, corpse cracks, wax seals, or heat fissures.'),
('Undead / Ossuary / Bone','Undead Ossuary; Bone Reliquary','dry bone, cold ash, mineral dust, quiet cracks','knuckle-bone and reliquary notch','bone / Bone & Iron','teal bleed, clean velvet, saturated glow, generic red-black horror','bone-white flecks on ash; brittle hairlines; specimen-tag dividers; cold moonlit edge','Vampire Nocturne, Bone Reliquary','Do not use velvet, wine accents, or elegant lacquer.'),
('Dwarf / Forge','Dwarf Forgehall','soot stone, hammered brass, warm forge spark','hammer head, stone grid, heavy divider','brass','brown-orange fill with no surface change','low-frequency stone grain; hammered bands; narrow brass edge; ember micro-accent only','Orc Warcamp, Goblin Scrapheap, Ember Depths','Do not make every panel look molten or use generic ‘fantasy runes’.'),
('Elf — wood / dark / high','Wood Elf Grove; Dark Elf Umbrance; High Elf Spire','moss wood / dusk thread / ivory stone','vine / fine filigree / tall stepped corner','wood / obsidian / ivory','same green or purple recolour for all three','separate organic grain, midnight textile, and vertical mineral grammar; title type varies per kit','Fae Glamour, Angelic Radiance','Do not reuse a single display serif as the whole family identity.'),
('Orc','Orc Warcamp','rough iron and weathered canvas','broad spike, stud rhythm, heavy block','iron','generic brown metal or chaotic hazard pattern','weighty matte surfaces; sparse banner dots; broad compressive border; low gloss','Goblin Scrapheap, Dwarf Forgehall','Do not become scrap, rivet clutter, or forge brass.'),
('Goblin','Goblin Scrapheap','mismatched dry scrap, rivets, repaired plates','asymmetric bolt / rivet corner','scrap','same heavy metal and red accent as Warcamp','offset plate seams, small rivet cadence, a single playful mismatch, readable neutral base','Orc Warcamp, Cyborg Chassis','Do not use oil-slick texture that lowers contrast or generic hazard stripes everywhere.'),
('Merfolk / Abyss','Merfolk Abyss','deep tide contour, pearl glint, blue-black depth','tide curl, shell-edge cadence','tide','dark blue fill or animated waves behind copy','subtle caustic overlay outside reading well; pearl edge; sparse bioluminescent point; static default','Glass Spire, Fae Glamour','Do not obscure labels, focus, or map pins with water effects.'),
('Cyborg','Cyborg Chassis','brushed chassis, clipped circuit trace, signal line','mechanical chamfer, limited hazard strip','circuit','Integration cyan tech recolour or full-panel glow','graphite hardware base; one bounded emissive channel; circuit only at edges; crisp mono display','Neon Protocol, Phosphor Terminal','Do not make cyan, flash, or skull marks the sole technology cue.'),
('Angelic','Angelic Radiance','diffuse pearl, warm halo rim, airy paper','soft halo arc, open spacing','marble','white wash that destroys contrast or generic gold trim','opaque reading wells; pearl only outside text; warm rim at frame; quiet marble dice','High Elf Spire, Glass Spire','Do not use light alone as a state marker.'),
('Infernal','Infernal Pact','charred parchment, sulfur hotspot, seal wax','broken edge, wax seal imprint','sulfur','flat red-black, generic flames, Vampire-like wine surface','localized heat/crazing; dry char; dense seal mark; sulfur dice with pale faces','Vampire Nocturne, Ember Depths','Do not use flock velvet, moonlight, or broad lava animation.'),
('Fae','Fae Glamour','iridescent veil, twilight bloom, restrained prismatic shift','unclosed curve, light asymmetry','iridescent','random rainbow noise or low-contrast sparkle','two or three controlled luminance shifts; translucent ornament outside content; static fallback','Merfolk Abyss, Angelic Radiance','Do not make shimmer mandatory for recognition.'),
('Parchment','Parchment Ledger','fibrous warm matte, dry ink, archive edge','ledger tab, hairline rule','ivory / holo','yellow background and faux stains','broad off-axis paper tone; faint fibre; dark ink rules; clean field inputs','Bone Reliquary, Noir Crimson','Do not copy a specific printable sheet layout, crest, or art treatment.'),
('Neon','Neon Protocol','black lacquer, electric channel, controlled scan','broken signal, split bracket','neon','full surface glow, rapidly animated interference','one high-luminance channel; static scanline at low opacity; bright edge limited to action frame','Phosphor Terminal, Cyborg Chassis','Do not use flashing or make colour the only state cue.'),
('Noir / Phosphor / Glass','Noir Crimson; Phosphor Terminal; Glass Spire','charcoal paper / CRT bloom / frosted plane','case-file / terminal bracket / glass bevel','obsidian / neon / frost','one generic dark mode or translucent illegible panels','separate matte shadow, monochrome emissive, and opaque-backed translucency; each has a visible material test','Vampire Nocturne, Neon Protocol, Merfolk Abyss','Do not let dark ambience turn into missing focus or low-contrast text.')]

def dive(t):
    title,k,mat,frame,dice,cheap,upgrade,false,never=t
    return f'''# T5 — {title}

**Classification:** **SPECULATIVE SynapticGM transfer.** This is original, trope-level design guidance. It uses no protected names, art, crests, layouts, or lookalike UI. Public sources establish only the broader mechanisms that layered customisation, responsive fallbacks, and material effects can be treated as separate cosmetic components [4] [5] [6] [12].

## Premium reference pattern

The intended kit family is **{k}**. Its recognition should begin with **{mat}**, then continue through **{frame}**, title restraint, and a **{dice}** dice read. A paid kit earns its price when these cues agree across background, raised panel, prose, turn chrome, dice tray, Shop preview, and the settings sample. The kit never buys new outcomes: all results, state labels, and interaction geometry remain stable.

A surface should be materially persuasive at phone and desktop size without adding semantic work. Use a solid, contrast-tested base as the reading field. Put low-frequency texture and edge treatment in a background or pseudo-element; retain a non-texture fallback because background images are decorative to assistive technology [12]. Limit motion to one optional, quiet ambient behaviour. Use a static or opacity-only replacement under `prefers-reduced-motion` [11] [14]. The visual signature must remain when motion, audio, and high-chroma accent are removed.

## Cheap recolour failure modes

The family collapses when it becomes **{cheap}**. That diagnosis is not aesthetic nit-picking: it signals that the player is paying for a hue rather than a coherent system. It also makes false-family comparison impossible. The high-risk neighbours are **{false}**. Test those simultaneously with the accent blurred; the rater should identify material and frame rather than merely “dark,” “bright,” “metal,” or “fantasy.”

Typography can deepen the material read but must not become the information architecture. Apply the kit display face only to a short title or chapter marker. Controls, tables, StateTx, correction evidence, and long prose use the declared body/UI fallback. The decoration must survive 200% text resizing and 320-CSS-pixel reflow without overlap or loss of action [10]. Normal text must meet 4.5:1 contrast, and significant non-text controls/indicators 3:1 [7] [8].

## Specific CSS-variable-compatible upgrade recipe

Route the work through the existing texture/frame attributes and `--sgm-*` tokens. Set a kit neutral `--sgm-surface-base`, `--sgm-surface-raised`, `--sgm-surface-reading`, `--sgm-ink-primary`, `--sgm-ink-muted`, and a narrow cosmetic accent token. Give the selected/owned/locked states their existing semantic token roles and use an icon, label, outline, or pattern as a second channel [9]. Use a `data-sgm-texture` recipe that places the opaque reading field below content and ornament outside the text field. Use `data-sgm-frame` to apply **{frame}** on outer corners only. Render **{dice}** as at least three faceted planes plus readable faces, not a flat coloured hex.

The concrete direction is: **{upgrade}**. {never} The Shop’s thumbnail must be rendered by the same theme path as the equipped screen and show the actual font policy, dice material, corner coverage, and optional Hear control. It cannot show animation or textile depth that the kit fails to render in play.

## Completion checklist

{tbl(['Check','Pass condition'],[
('Material','At least two visible surface cues beyond hue remain with accent desaturated.'),
('Frame','The {frame} silhouette is visible at 320 CSS px without covering focus or labels.'),
('Type','Display use is short; UI/body fallback passes 200% text and spacing override.'),
('Dice','{dice} is identified by 4/5 raters from a closed material set; values remain legible.'),
('False friends','{false} do not collapse in five-rater blurred-accent review.'),
('Honesty','Shop preview and equipped screenshot match on all required components.'),
('Accessibility','Normal text ≥4.5:1; significant control/indicator ≥3:1; no colour-only state.')])}
{REFS}'''
for i,d in enumerate(deep,1): w(f'T5_{i:02d}_{d[0].lower().replace(" / ","_").replace(" ","_")}_deep_dive.md',dive(d))

# T6 — Vampire rescue brief
w('T6_vampire_nocturne_rescue_brief.md',f'''# T6 — Vampire Nocturne Rescue Brief — P0

## Objective

John’s reported outcome—“still generic dark maroon”—is a **P0 identity failure**. The remedy is not a brighter red or more Gothic decoration. It is a distinct material hierarchy: **velvet flock**, a subtle **wine-glass glint**, a **moonlit obsidian edge**, and aristocratic night that remains original and non-franchise-specific. The kit must be recognisable before its accent hue is visible.

## Keep, because the concept is already valuable

{tbl(['Current anchor','Keep?','Reason','Constraint'],[
('Grenze Gotisch','Yes','Strong short-form title signature','Title/chapter marker only; never dense controls or state text.'),
('Pointed gothic arch','Yes','Useful outer-frame silhouette','Outer corners only; preserve focus/interaction geometry.'),
('Velvet texture token','Yes','Right material family','Use flock direction and low-gloss edge, not a maroon flat fill.'),
('Wine Obsidian dice','Yes','Natural dice-material anchor','Use faceted black-plum planes, pale numerals, restrained wine rim.'),
('Nocturne TTS','Yes','Audio differentiator','Hear is user-invoked; no autoplay; visible mute/availability state.')])}

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
[data-sgm-texture="velvet"][data-theme="vampire-nocturne"] {{
  --sgm-surface-base: #171018;
  --sgm-surface-raised: #22131f;
  --sgm-surface-reading: #1c1720;
  --sgm-ink-primary: #f4e9ec;
  --sgm-ink-muted: #c9b5bb;
  --sgm-accent-wine: #8d2746;
  --sgm-edge-moon: #c8bfd7;
  --sgm-texture-opacity: .18;
}}
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
{REFS}''')

# T7 — table-top sheet patterns
sheet_patterns=[
('Material reading field','Use textured outer surface and opaque writing/reading well','D&D Beyond publicly separates backdrop/theme from sheet content; public mobile limitation shows fallbacks matter [4].','Do not copy art, sheet layout, branded labels, or crest.'),
('Header ornament','One controlled title band, thin material divider, small kit corner','Digital sheets can keep stable information structure while varying decoration [4].','Do not turn a header into a critical state container.'),
('Section hierarchy','Body face, numeric alignment, repeated section labels, content density control','Roll20 describes testing collapsible information and card/list density [5].','Do not copy field names/placement or proprietary UI patterns.'),
('Frame family','Use kit corner grammar around sheet groups, not every field','Foundry publicly distinguishes sheets/modules/visual effects as composable categories [6].','Do not replicate a marketplace module’s art/chrome.'),
('Printable variant','Remove texture, retain ink rules and status text','Public sheet resources include printable/fillable paths [4].','Do not promise print output until implemented.'),
('Device fallback','Keep all information when backdrop/frame is unavailable','Public documentation identifies a mobile backdrop limitation [4].','Do not hide controls or critical content on narrow screens.'),
('Preview fidelity','Show actual compact and full sheet sample','Public store/help mechanisms establish preview and device contexts [1] [4].','Do not use marketing-only mockups.')]
w('T7_tabletop_sheet_theme_pattern_library.md',f'''# T7 — Tabletop Sheet Theme Pattern Library

This is a **pattern library**, not a visual-copy exercise. The public sources establish layered customisation, stable sheet information, and responsive density mechanisms [4] [5] [6]. All transfer recipes below are **SPECULATIVE SynapticGM design recommendations**.

{tbl(['Pattern','Transferable recipe for Adventurer card / paper-doll / journal','Verified public mechanism','IP fence'],sheet_patterns)}

## Definition: premium sheet

A premium sheet feels complete when it has a material outer field, an opaque readable working surface, a restrained title moment, section dividers with a repeated rhythm, aligned numeric/action areas, a visible frame family, and a matching dice/turn language. It is not a premium sheet if a texture hides a value, display type replaces legible UI text, fields move by theme, or a narrow viewport loses the same surface identity.

### Transfer checklist

- [ ] Keep navigation, fields, player correction, pinned canon, StateTx, evidence, and invention in the same semantic order.
- [ ] Apply texture outside or behind an opaque reading field; include print/high-contrast fallback.
- [ ] Keep one display face for headings and one legible body/UI family.
- [ ] Use card/list density or progressive disclosure without hiding primary action.
- [ ] Snapshot phone, tablet, desktop, print, forced colours, and 200% text.
{REFS}''')

# T8 — acceptance protocol and printable score CSV
checks=[
('R01','Accent-blurred naming','Five independent raters; remove/neutralise accent hue; show material/frame/type/dice screenshot','≥4/5 intended-family answers; ≤1 false friend','No','Kit identity'),
('R02','Greyscale state language','Monochrome screenshot of selected/owned/locked/correction/canon/evidence/invention','≥4/5 recover every state from label/icon/pattern/shape','No','Semantics'),
('R03','Preview parity','Compare Shop preview and equipped play on listed required components','0 missing required components; same motion preference branch','No','Honesty'),
('R04','Font completeness','Disable cache / inspect loading and fallback; exercise story prose','UI and story face resolve or labelled fallback; no reflow break','No','Completeness'),
('R05','Phone frame','320 CSS px and 200% text','Two signature corner cues visible; no label/focus obstruction','No','Responsive'),
('R06','Dice material','Normal-size dice shown to five raters from closed set','≥4/5 material choice; numeric face legible','No','Completeness'),
('R07','Contrast','Measure actual composited text/control states','Normal text ≥4.5:1; significant non-text UI ≥3:1','No','Accessibility'),
('R08','Non-colour semantics','Remove colour / inspect selected, warning, owned, active','No essential meaning dependent on hue alone','No','Accessibility'),
('R09','Text scale/reflow','200% text; 320 CSS px; spacing override','No clip, overlap, loss, or two-axis UI scroll except justified canvas','No','Accessibility'),
('R10','Reduced motion','`prefers-reduced-motion: reduce` plus Kid Mode','No looping shimmer/parallax/essential motion; identity still recognisable','No','Accessibility'),
('R11','Forced colours','`forced-colors: active` / platform high contrast','Focus, selected, locked, action states remain clear','No','Accessibility'),
('R12','Voice / Hear','Navigate kit cards muted and unmuted','No autoplay; Hear works or clearly reports unavailable','No','Accessibility'),
('R13','False friends','Compare Nocturne/Infernal/Noir/Bone Reliquary/Ossuary','No pair collapses for ≥4/5 raters','No','Differentiation'),
('R14','Auto-heal','Simulate missing font/frame/dice/voice','Kit neutral fallback is shown; no cyan leak; diagnostic exposed','No','Resilience')]
w('T8_recognition_and_acceptance_test_suite.md',f'''# T8 — Recognition and Acceptance Test Suite

The suite operationalises the supplied recognition rule and accessibility gates. W3C publishes 4.5:1 normal-text and 3:1 large-text thresholds; important non-text UI requires 3:1 [7] [8]. Colour must not be the only state channel [9]. Reflow and motion preferences require real device/preference tests [10] [11].

## Protocol: “name it with accent blurred”

Prepare a 1080px and a phone-width screenshot for each kit showing background, raised panel, title, prose, frame corner, dice tray, and active-turn segment. Create an accent-neutral version by desaturating only the named cosmetic accent while retaining luminance/contrast. Recruit five independent raters who have not seen the answer key; randomise screenshots; give a closed set of kit-family labels plus “cannot tell.” Do not coach. A kit passes at four correct answers, with no more than one false-friend answer. Record the image filename, build SHA, preference mode, rater answers, and raw comments.

{tbl(['ID','Test','Method','Pass bar','Hard stop','Area'],checks)}

## Shop chip delta

**Defined X = zero missing mandatory components.** A Shop chip may be simplified, but the expanded preview must match equipped play in texture, frame, UI font policy, story font policy, dice material, voice preview state, turn chrome, and motion preference. Pixel-perfect equality is not required across breakpoint; a missing material or a marketing-only effect is a failure.
{REFS}''')
with (R/f'{P}_T8_printable_score_sheet.csv').open('w',newline='',encoding='utf-8') as f:
    q=csv.writer(f); q.writerow(['test_id','kit_id','build_sha','device_viewport','preference_mode','rater_or_tester','expected','observed','pass_fail','evidence_path','defect_id','notes']);
    for c in checks:
        q.writerow([c[0],'[enter themeKey]','[enter SHA]','[enter viewport]','default / greyscale / reduced-motion / forced-colors','[name or ID]',c[3],'','', '', '', ''])

# T9 — implementation backlog
backlog=[
('P0-01','P0','Repair Vampire Nocturne material hierarchy and remove flat-maroon default','cosmeticCatalog.ts; index.css; uiTheme.ts','R01,R03,R05,R06,R13','M','Token audit complete'),
('P0-02','P0','Theme auto-heal reports and neutral-fallbacks for missing texture/frame/font/dice/voice','uiTheme.ts; cosmeticCatalog.ts','R04,R14','M','Component availability map'),
('P0-03','P0','Eliminate unintended Integration cyan/teal in paid-kit roots, portals and dice','index.css; uiTheme.ts','R02,R07,R13,R14','M','Semantic token inventory'),
('P0-04','P0','Make expanded Shop preview use equipped renderer/token path','cosmeticCatalog.ts; index.css; uiTheme.ts','R03','L','Preview component audit'),
('P0-05','P0','Declare and validate complete kit parts in catalog records','cosmeticCatalog.ts','R03,R04,R06,R12','S','Catalog schema review'),
('P1-01','P1','Fill Journal, map, sheet, inventory, System and Settings surface coverage gaps','index.css; uiTheme.ts','R03,R05,R07,R09','L','Surface selector audit'),
('P1-02','P1','Finish material dice and tray render recipes for every enum','index.css; cosmeticCatalog.ts','R06,R10','M','Dice renderer hook'),
('P1-03','P1','Font loading/fallback telemetry and no-layout-shift policy','index.css; uiTheme.ts','R04,R09','M','Font asset manifests'),
('P1-04','P1','Accessibility preference matrix: reflow, forced-colours, reduced-motion, Kid Mode','index.css; uiTheme.ts','R07-R12','M','QA device matrix'),
('P1-05','P1','Theme preview disclose component fallbacks/device limitation','cosmeticCatalog.ts; index.css','R03,R14','S','Preview metadata'),
('P2-01','P2','Bundle shelf polish: partial ownership, live saving, compatible components','cosmeticCatalog.ts; uiTheme.ts','R03','M','Commerce facts / counsel'),
('P2-02','P2','Seasonal cosmetic rotations with expiry/access copy','cosmeticCatalog.ts','R03,R12','M','Entitlement model'),
('P2-03','P2','Audio-lite stingers, only user-invoked and preference-aware','index.css; uiTheme.ts','R10,R12','M','Audio policy'),
('P2-04','P2','Advanced ambient motion after profiling','index.css','R10,R11','M','Performance profile')]
w('T9_implementation_backlog.md',f'''# T9 — SynapticGM Implementation Backlog

This backlog is deliberately constrained to `cosmeticCatalog.ts`, `index.css`, and `uiTheme.ts`. It does not propose a parallel theme engine. Effort is directional: **S** ≤1 focused day, **M** 2–4 focused days, **L** multi-surface / cross-component work; validate against the actual repository.

{tbl(['ID','Priority','Item','Likely files','Acceptance test IDs','Effort','Depends on'],backlog)}

### Delivery order

Start P0-05 and P0-02 together so the catalog can declare components and auto-heal can make failures visible. Then execute P0-01/P0-03 with actual screenshots. P0-04 comes before charging for or promoting any kit whose preview cannot prove parity. Do not schedule advanced animation before P1 accessibility preferences and P1 surface coverage are closed.
{REFS}''')

refuse=[
('Integration leakage','Teal / Integration cyan bleeding into paid kits, especially Undead, Merfolk, Cyborg','It destroys kit identity and implies a broken auto-heal path.'),
('Display-face monoculture','Cinzel-everywhere or any single display face across unrelated kits','It collapses recognition and makes content harder to scan.'),
('Hue-only theme','An accent swap without new material, frame, type/dice or surface coverage','It creates recolour-tax regret.'),
('Incomplete sold kit','Missing dice, voice, font, or frame after equip','It is a preview-honesty failure.'),
('Marketing-only premium','Shop preview looks richer than equipped play','It is a high-risk regret/refund trigger.'),
('Flat material dice','Flat hex fill marketed as wood, bone, brass, velvet, etc.','It fails material recognition and completeness.'),
('Mechanics-as-decoration','Decorative type, texture, or colour encodes critical mechanics','It breaches semantic state continuity.'),
('Licensed lookalike','Licensed franchise name, crest, art, or distinctive UI lock-in','It breaches the content fence.'),
('A11y exception','Premium effect lowers contrast, fails greyscale, ignores reduced motion','Premium does not override accessibility.'),
('Kid Mode pressure','Autoplay, countdown pressure, noisy motion, ad-like prompts','It conflicts with Kid Mode product law.'),
('Untracked fallback','Silent asset failure falls back to default cyan','It hides defects and breaks recognition.'),
('False-family collapse','Nocturne, Infernal, Noir, Bone, Ossuary look alike','It invalidates material-based pricing.')]
w('T10_hard_refuse_anti_list.md',f'''# T10 — Hard-Refuse Anti-List

These are **release-blocking future-pass bans**. A design may be visually attractive and still be refused if it violates one row.

{tbl(['Ban','Refuse this','Why it is hard-refuse'],refuse)}

The first check in design review is not “does it look premium?” It is “does it preserve the state language, a truthful preview, material identity, and preference-resilient readability?” Public accessibility criteria reinforce the contrast, non-colour-state, reflow, and motion constraints [7] [8] [9] [10] [11].
{REFS}''')

material_words={'plain':'cold slate registrar','neon':'black lacquer and bounded electric channel','parchment':'warm fibrous matte and archival ink','bone':'ash, mineral dust and dry bone','phosphor':'near-black CRT bloom and quiet scanline','noir':'matte charcoal paper and a single crimson interruption','glass':'frosted plane with opaque reading well','ember':'charcoal rock and restrained ember fissure','moss':'mossy wood and leaf-shadow','dusk':'dusk textile and dark thread','ivory':'ivory stone and silver line','soot':'soot stone and hammered brass','banner':'rough iron and weathered canvas','scale':'layered scale enamel and aged-gold glint','circuit':'brushed chassis and clipped circuit trace','halo':'diffuse pearl and warm rim','sulfur':'charred paper and local sulfur heat','glamour':'iridescent veil and twilight bloom','scrap':'dry scrap plates and rivet cadence','tide':'deep tide contour and pearl glint','velvet':'flocked velvet, wine edge and moonlit obsidian'}
never_words={'plain':'Do not treat cyan as a paid-kit fallback.','neon':'Do not make the whole panel glow or flash.','parchment':'Do not stain or texture writable content.','bone':'Do not add teal or clean velvet.','phosphor':'Do not flicker text, dice numbers, or semantic indicators.','noir':'Do not turn every crimson cue into an alert.','glass':'Do not put critical copy on translucency.','ember':'Do not make it indistinguishable from Infernal.','moss':'Do not use generic green fill as identity.','dusk':'Do not make it a High Elf or Fae recolour.','ivory':'Do not reuse its display face across the shelf.','soot':'Do not flatten it to brown-orange metal.','banner':'Do not confuse rugged mass with scrap clutter.','scale':'Do not tile scales across every field.','circuit':'Do not let Integration cyan become the only tech cue.','halo':'Do not wash out contrast with light.','sulfur':'Do not use velvet/wine or broad lava animation.','glamour':'Do not use random rainbow noise.','scrap':'Do not become a Warcamp recolour.','tide':'Do not erase focus or pins with water effects.','velvet':'Do not use bone, wax seal, or flat maroon panels.'}
kit_bank=[]
for key,name,tex,frame,uif,story,dice,voice,price in kits:
    kit_bank.append((name,f'{material_words[tex]}; {frame} silhouette; {dice} dice; {voice} voice.',never_words[tex]))
recipes=[
('plain','Plain','Solid slate base; very low-contrast linear lift; no noise; square inset border.'),
('moss','Moss','Dark moss base; two radial leaf-shadow layers outside reading well; 3% fibre noise; vine-corner mask.'),
('dusk','Dusk','Blue-black textile base; diagonal thread gradient at 4% opacity; deep vignette; filigree corner mask.'),
('soot','Soot','Charcoal base; broad ash gradient; 2% mineral speckle; stone-grid corner mask.'),
('ivory','Ivory','Warm ivory base; vertical mineral band; sparse silver hairline; stepped-corner mask.'),
('banner','Banner','Canvas matte base; muted warp/weft repeat; narrow shadow fold; broad-stud corner mask.'),
('scale','Scale','Deep enamel base; repeating offset arcs at low opacity; aged-gold edge glint; multi-row corner mask.'),
('ember','Ember','Charcoal rock base; one narrow orange fissure gradient; soot vignette; cut-stone or feather mask.'),
('circuit','Circuit','Graphite base; repeating orthogonal lines; one clipped emissive trace; chamfer mask.'),
('halo','Halo','Opaque pale base; large warm radial rim outside text; subtle marble vein; halo-arc mask.'),
('sulfur','Sulfur','Dry char base; local ochre hotspot; hairline crack overlay; broken-edge/seal mask.'),
('bone','Bone','Ash base; off-white fleck layer; restrained crack line; knuckle/reliquary corner mask.'),
('glamour','Glamour','Twilight base; two soft hue-shift gradients at low saturation; faint prism line; open-curve mask.'),
('scrap','Scrap','Dry neutral plates; offset seam gradients; sparse rivet dots; asymmetric bolt mask.'),
('tide','Tide','Blue-black base; low-amplitude radial caustic; pearl rim; tide curl mask.'),
('velvet','Velvet','Plum-black base; two diagonal flock gradients; moonlit rim; tapered arch mask.'),
('parchment','Parchment','Warm matte base; broad off-axis shade; 2% fibre microstripe; ledger-tab mask.'),
('phosphor','Phosphor','Near-black base; static green scanline at ≤4%; restrained bloom; terminal bracket mask.'),
('neon','Neon','Black lacquer base; one bright edge channel; static noise at ≤3%; broken signal mask.'),
('glass','Glass','Opaque reading field; frosted outer gradient; thin edge highlight; split-bevel mask.')]
w('T11_content_design_banks.md',f'''# T11 — Original Content / Design Banks

**Original-only bank.** All entries are trope-level SynapticGM directions; none is a licensed name, crest, place, series, or asset request. CSS gradients and background layers are technically available, but background imagery remains decorative and needs a solid fallback [12]. Use named-property transitions and a reduced-motion branch; prefer opacity/transform and profile effects [11] [14].

## Per-kit material line and never-line

{tbl(['Kit','Material one-liner','Never-line'],kit_bank)}

## Twenty CSS-safe texture recipe sketches

{tbl(['Existing ThemeTexture token','Recipe name','Layer stack: base → material → vignette/mask'],recipes)}

## Font pairing do / do not

| Kit grouping | Do | Do not |
|---|---|---|
| High Elf / Dragon | Keep Cinzel/Cinzel Decorative to short display titles; use system serif/sans for dense UI. | Use decorative caps for rules, counts, or buttons. |
| Dwarf / Undead / Nocturne | Use MedievalSharp, Special Elite, Grenze Gotisch for occasional headings only. | Make them the default UI/body face. |
| Parchment / Wood / Merfolk | Let Libre Baskerville/Spectral carry prose with a neutral UI. | Reduce body contrast or line spacing for ‘mood’. |
| Dark Elf / Angelic / Infernal / Phoenix | Pair Cormorant, Crimson Pro, Playfair with simple controls. | Allow expressive serif to alter numeric alignment. |
| Circuit / Neon / Phosphor | Reserve Orbitron/mono display for labels that remain short. | Use monospaced display face for long narrative prose. |
| Goblin / Orc | Use display emphasis sparingly and a stable system body. | Encode severity or ownership via font personality. |

## Dice material FX — Excited roll mode (cosmetic only)

| Material group | Static read | Excited-roll cue | Reduced-motion / Kid Mode |
|---|---|---|---|
| Wood / bone / ivory / marble | Three visible facets, diffuse edge, high-legibility face | 120–180ms opacity highlight; soft tray shadow | Static highlight only |
| Brass / iron / scale / scrap | Faceted directional specular, controlled rim | One short opacity/transform settle, no shake | No movement; rim contrast step |
| Ember / sulfur / neon / circuit / phosphor | Dark body and one bounded bright channel | Single ≤250ms pulse, no repeat | Static luminance tier; no flash |
| Velvet / tide / iridescent / frost / holo | Material gradient and a readable face plane | One slow 150–220ms edge reveal | Static edge reveal |

The dice never change numerical result, timing, odds, loot, stats, or story outcome. No effect may be required to distinguish success/failure; use the normal semantic state system.
{REFS}''')

# T12 — monetization honesty
w('T12_monetization_honesty_brief.md',f'''# T12 — Monetization Honesty Brief

> **Legal note.** I’m an AI, not a lawyer — this is a working product-analysis draft, not formal legal advice; have qualified counsel review before relying on it. This brief deliberately does not choose a legal policy or assert that another platform’s policy applies to SynapticGM.

## The honest offer

A theme card sells a clearly named cosmetic outcome. It must identify the price, whether the item is permanent or subscription-dependent, exactly which components are included, the currently available fallback if a component cannot load, and the fact that it is cosmetic only. Public storefronts describe preview, ownership, subscription-only use, bundle composition, partial ownership, and refundability/status labels as separate concepts [1] [2] [3]. The SynapticGM transfer is **SPECULATIVE**: surface those concepts in plain language without copying external UI or policy text.

| Moment | Say / show | Do not say / imply | Owner |
|---|---|---|---|
| Card | Price, kit name, material one-line, exact included texture/frame/fonts/dice/voice/turn elements, ownership badge | “Premium experience” without a component list | Product / design |
| Expanded preview | In-play panel, type sample, material dice, turn chrome, user-invoked Hear, accessibility/preference state | Marketing-only asset, soundtrack, animation, or lighting not present after equip | Design / engineering |
| Bundle | All included SKUs, individual equivalence, live saving, owned/partial-owned treatment | Saving that ignores previous ownership or conditional access | Product / commerce |
| Checkout | Price/currency/tax as applicable, ownership/subscription status, product policy link, non-functional statement | Borrowed refund window, permanent access if entitlement ends, urgency unsupported by fact | Commerce / **COUNSEL** |
| Post-purchase | Equipped/owned confirmation, restore/manage route, clear fallback diagnosis | “Unlocked” if a required component failed to apply | Engineering / support |

### Low-regret copy patterns

- “Includes: velvet surface, arch frame, title/prose font policy, Wine Obsidian dice, Nocturne voice preview, and turn chrome.”
- “Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”
- “Preview reflects the equipped kit at your current motion and accessibility preferences.”
- “You own this” or “Included while your membership is active,” only when those statements are factually true.
- “Some decorative effects are simplified in reduced-motion, high-contrast, or narrow-screen modes; the kit’s material and state language remain intact.”

### Hard restrictions

Do not claim that a theme improves rolls, story, personalization intelligence, survival, access to canonical facts, or any result. Do not write “best value” unless supported by live, reproducible arithmetic. Do not use dark-pattern urgency, hidden expiry, concealed duplicates, or a preview that exceeds applied quality. Do not promise refund rights, cancellation rights, tax treatment, consumer-law compliance, or cross-platform access without review.

### Counsel / payment-owner decisions

- [ ] Final product classification and jurisdiction-specific disclosures.
- [ ] Refund, cancellation, withdrawal, and digital-content-consent wording.
- [ ] Subscription entitlement, expiry, grace period, and restoration copy.
- [ ] VAT/GST/pricing and currency-display logic.
- [ ] Gift, bundle, partial-ownership, and duplicate-purchase treatment.
- [ ] Age/Kid Mode purchase controls and parental-consent mechanics.
- [ ] Voice/audio rights, availability, and accessibility obligations.
{REFS}''')

# T13 — JSON harness. Every catalog kit has required tokens; allow supplied standalone/race names without inventing new engine fields.
all_surfaces=[x[0] for x in surfaces]
gates={}
for key,name,tex,frame,uif,story,dice,voice,price in kits:
    gates[key]={
      'name':name,'price_displayed':price,
      'required_tokens':{'texture':tex,'frame':frame,'ui_font':uif,'story_font':story,'dice_material':dice,'voice_flavour':voice},
      'required_surfaces':all_surfaces,
      'required_tests':['R01','R02','R03','R04','R05','R06','R07','R08','R09','R10','R11','R12','R14'],
      'false_friend_set':['vampire-nocturne','infernal-pact','noir-crimson','bone-reliquary','undead-ossuary'] if key in ['vampire-nocturne','infernal-pact','noir-crimson','bone-reliquary','undead-ossuary'] else [],
      'required_state_semantics':['player_correction','pinned_canon','StateTx','evidence','invention'],
      'pass_fail_rule':'All required component tokens resolve; all required surfaces render kit-neutral fallback rather than Integration cyan; every required test passes.'}
harness={'schema_version':'1.0','generated_for':'SynapticGM','generated_date':'2026-08-19','scope_note':'Cosmetic QA only; no mechanic, odds, loot, quest, HP, permit, or story-outcome behaviour may be modified.','engine_constraint':['SHOP_CATALOG','RACE_THEME_KITS','--sgm-*','data-sgm-texture','data-sgm-frame','uiTheme.ts auto-heal'],'global_gates':{'normal_text_min_contrast':'4.5:1','significant_non_text_ui_min_contrast':'3:1','text_scale':'200% without loss','reflow':'320 CSS px vertical-content equivalent','motion':'prefers-reduced-motion supported','colour_only_state':'forbidden','shop_preview_delta':'zero missing mandatory components','accent_blurred_recognition':'4 of 5 intended-family; <=1 false friend'},'kits':gates}
(R/f'{P}_T13_eval_harness.json').write_text(json.dumps(harness,indent=2)+'\n',encoding='utf-8')
w('T13_eval_harness_notes.md',f'''# T13 — Evaluation Harness Notes

`{P}_T13_eval_harness.json` is the machine-readable gate file. It maps every supplied catalog theme key to declared material tokens, all required surfaces, state semantics, and test IDs. Values are an **original QA contract** inferred from the supplied catalog, not a statement that those components already resolve in the live build.

## Interpretation

- A kit fails if any required asset/token is absent, even if the panel has a new accent.
- A kit fails if it falls back to Integration cyan rather than its own neutral fallback.
- A kit fails if a semantic state becomes colour-only, is hidden by ornament, or moves from its canonical location.
- A kit fails if the Shop preview does not render the same required set as equipped play.
- A kit fails if required accessibility/preference tests fail; premium content receives no exception.

The contrast/reflow/motion gates reflect public W3C and MDN guidance [7] [8] [9] [10] [11].
{REFS}''')

# T14 — known unknowns
unknowns=[
('Live screenshots/video','Whether each listed surface currently restyles; exact appearance of teal bleed and flat-maroon failure','Before/after capture at desktop/phone with default, greyscale, reduced-motion, forced-colours','John / design'),
('Repository access','Actual variable names, root selectors, portals, dice renderer, font manifest, voice API','Read-only code review of cosmeticCatalog.ts, index.css, uiTheme.ts','Engineering'),
('Commerce facts','Actual GBP display, VAT/GST, Stripe/payment route, refund/cancellation terms, entitlement model','Approved source of truth and legal/commercial review','Product / finance / counsel'),
('Metrics','Conversion, attach, refund, chargeback, preview engagement, kit usage, churn','Instrumented event definitions and a privacy review','Analytics / product'),
('Voice facts','Voice availability, rights, latency, transcript/caption support, Kid Mode behaviour','Audio feature inventory and rights/accessibility review','Audio / counsel'),
('Accessibility validation','Actual contrast compositing, keyboard order, screen-reader labels, browser/device support','Manual assistive-tech and device testing plus automated checks','Accessibility QA'),
('User research','Whether material recognition works with target players; which false friends are common','Five-rater test per kit, diverse accessibility needs included','Research / John'),
('Asset provenance','Whether every font/dice/texture is licensed and available in all deployment contexts','Asset manifest and licence evidence','Production / counsel'),
('Bundle mathematics','Live individual prices, ownership handling, currency rounding, discounts','Live commerce calculation test','Commerce'),
('Policy decisions','Subscription inclusion, expiry, gifting, restorative access, regional availability','Written product/policy decisions approved before copy','Product / counsel')]
w('T14_unknowns_and_evidence_request.md',f'''# T14 — What Manus Still Cannot Know

The public research and supplied catalog are enough to make a strong original design and QA plan; they cannot prove the current product state, legal/commercial facts, or player reaction. The following are explicit unknowns, not invented findings.

{tbl(['Unknown','Why it cannot be inferred','Evidence required','Owner'],unknowns)}

## Minimum evidence pack for John tonight

1. Ten screenshots per target kit: Shop expanded preview, equipped panel, Sheet, Journal, Map, dice tray, active turn, Settings, 320px view, and 200%-text view.
2. A current theme token dump from `cosmeticCatalog.ts`, `index.css`, and `uiTheme.ts`, including all auto-heal states.
3. A one-minute mute/unmute/Hear capture for each voice and the Kid Mode/reduced-motion behaviours.
4. A current, approved table of pricing, entitlement, policy, tax, and bundle rules.
5. Five-rater raw responses using the included CSV for Nocturne, Infernal, Noir, Bone Reliquary, and Ossuary first.

> **Rule:** Do not turn an unknown into a design claim. Attach the evidence, update the harness, then promote a recommendation to implementation.
''')

# README: final index.
readme=f'''# SynapticGM Premium Themes, Price Tiers & Maximum Extract — 2026-08-19

**Deliverable package:** research-grounded, IP-safe, cosmetics-only design dossier for SynapticGM. **All original recommendations are labelled SPECULATIVE where they transfer beyond public evidence.** The supplied product law is preserved throughout.

> **Mandatory store line:** “Cosmetic only. Does not affect dice rolls, loot, stats, or story outcomes.”

## Start here

| Priority | File | Use |
|---|---|---|
| P0 decision | [T1 Constitution](./{P}_T1_premium_theme_constitution.md) | Non-negotiable product laws |
| P0 rescue | [T6 Vampire Nocturne](./{P}_T6_vampire_nocturne_rescue_brief.md) | Immediate repair brief |
| QA tonight | [T8 test suite](./{P}_T8_recognition_and_acceptance_test_suite.md) and [printable CSV](./{P}_T8_printable_score_sheet.csv) | Five-rater + accessibility test protocol |
| Engineering | [T9 backlog](./{P}_T9_implementation_backlog.md) and [T13 harness](./{P}_T13_eval_harness.json) | Existing-engine work plan and machine gates |
| Evidence limits | [T14 unknowns](./{P}_T14_unknowns_and_evidence_request.md) | Screenshot/code/commercial request list |

## Complete deliverable index

| Part | Deliverable |
|---|---|
| T1 | [Premium Theme Constitution](./{P}_T1_premium_theme_constitution.md) |
| T2 | [Price Ladder Matrix](./{P}_T2_price_ladder_matrix.md) |
| T3 | [Surface Coverage Map](./{P}_T3_full_surface_coverage_map.md) and [CSV](./{P}_T3_full_surface_coverage_map.csv) |
| T4 | [Competitive Teardown Scorecard](./{P}_T4_competitive_teardown_scorecard.md) |
| T5 | [14 trope deep dives](#t5-deep-dives) |
| T6 | [Vampire Nocturne Rescue Brief](./{P}_T6_vampire_nocturne_rescue_brief.md) |
| T7 | [Tabletop Sheet Pattern Library](./{P}_T7_tabletop_sheet_theme_pattern_library.md) |
| T8 | [Recognition & Acceptance Suite](./{P}_T8_recognition_and_acceptance_test_suite.md) and [Printable Score Sheet CSV](./{P}_T8_printable_score_sheet.csv) |
| T9 | [Implementation Backlog](./{P}_T9_implementation_backlog.md) |
| T10 | [Hard-Refuse Anti-List](./{P}_T10_hard_refuse_anti_list.md) |
| T11 | [Original Content / Design Banks](./{P}_T11_content_design_banks.md) |
| T12 | [Monetization Honesty Brief](./{P}_T12_monetization_honesty_brief.md) |
| T13 | [Evaluation Harness JSON](./{P}_T13_eval_harness.json) and [Notes](./{P}_T13_eval_harness_notes.md) |
| T14 | [Unknowns & Evidence Request](./{P}_T14_unknowns_and_evidence_request.md) |

## Research record

| File | Role |
|---|---|
| [Research framework](./{P}_research_framework.md) | Scope, evidence taxonomy, source families |
| [Browser-verified findings](./{P}_browser_verified_findings.md) | Directly reviewed official pages |
| [Design synthesis](./{P}_design_synthesis.md) | Original material-system reasoning |

## T5 deep dives

'''
for i,d in enumerate(deep,1):
    slug=d[0].lower().replace(' / ','_').replace(' ','_')
    readme+=f'- [T5.{i:02d} — {d[0]}](./{P}_T5_{i:02d}_{slug}_deep_dive.md)\n'
readme+='''\n## Boundaries

This package does **not** ship protected assets or endorse copying any cited product’s art, type lockup, slogan, layout, or UI chrome. Research-source names are confined to citations/research discussion, not player-facing pack naming. Price/refund/cancellation content is a product-analysis brief, not formal legal advice; counsel and the payment owner must approve live policy and checkout copy.
'''
w('README.md',readme)

# Preserve a compact raw research artifact in the delivered directory when present.
src=Path('/home/ubuntu/research_synapticgm_theme_evidence.json')
if src.exists(): (R/f'{P}_research_workstreams_raw.json').write_text(src.read_text(encoding='utf-8'),encoding='utf-8')
print(f'Built dossier in {R}')
