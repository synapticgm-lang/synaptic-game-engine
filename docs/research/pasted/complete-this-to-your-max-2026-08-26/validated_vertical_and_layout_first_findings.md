# Validated Findings — Vertical Scroll and Layout-First Workflows

## Vertical-scroll production

Source: **Clip Studio Paint / Art Rocket — Tips for Creating Vertical Scrolling Webtoons**, https://www.clipstudio.net/how-to-draw/archives/157055, accessed 2026-08-26.

The guide documents that vertical-scroll comics are designed for smartphones, arrange panels mostly top-to-bottom, and use larger inter-panel spacing because the screen reveals only a portion of the sequence at a time. It describes spacing as a pacing tool, with large gaps providing rest, emphasis, or a scene change. It advises reducing text and simplifying art to preserve uninterrupted flow. It also documents an on-screen mobile preview, production on a long canvas, and later splitting into upload-sized images. Its example uses an 800 px by 1280 px WEBTOON upload segment, but those publication dimensions are not a requirement for SynapticGM's live DOM layout.

**Technique shape for SynapticGM:** Render webtoon mode as a true DOM stack, not one enormous generated image. Each panel remains independently generated, independently cached, and independently repairable; responsive CSS defines width, while gutter tokens (`compact`, `standard`, `pause`) define vertical separation. Mobile viewport testing is mandatory. A long pause gutter belongs only before/after a reveal, transition, or cliffhanger-like beat, never between pieces of one required action.

**Correction to unverified secondary claims:** Exact universal gutter sizes such as 100–150 px for action or 600–800 px for cliffhangers are not treated as industry standards. SynapticGM should use relative design tokens measured in viewport-aware units and validate them in usability tests.

## AI Comic Factory public architecture

Source: **jbilcke-hf/ai-comic-factory README**, https://github.com/jbilcke-hf/ai-comic-factory, accessed 2026-08-26.

The public repository describes a modular comic generator with a frontend, an LLM engine, and a rendering engine. It allows the LLM to be disabled and replaced by human-provided or static data. The rendering layer can be swapped among hosted providers or a custom endpoint. This is public evidence for separating story planning from panel rendering; it is not a recommendation to copy the code or its providers.

**Technique shape for SynapticGM:** Keep `comicScriptAdapter`/BeatSpec/layout selection independent from `generateComicImage` and the hosted `generate-image` adapter. P0 can therefore use deterministic templates while Director remains disabled. The renderer accepts a bounded PanelSpec and may fail without affecting the committed story.

## Anifusion public feature claims

Source: **Anifusion — All Features**, https://anifusion.ai/features/, accessed 2026-08-26.

The public feature page claims script-to-page breakdown, separate manga, LTR comic, and vertical-scroll modes, character design sheets, LoRA training, and editable dialogue/lettering layers. These are vendor claims rather than audited implementation evidence. They nonetheless demonstrate user-facing expectations: choose format, define recurring characters, generate/revise panels, and keep lettering editable.

**Technique shape for SynapticGM:** Separate reading-direction/layout banks from art generation; build character identity records before premium conditioning; preserve editable overlay lettering; and make panel repair local. LoRA belongs to P2+ Admin/High because it adds rights, storage, training, model-routing, and lifecycle obligations.

## Layout-first synthesis

| Effect bought | Public method | Cost/latency implication | Common failure | SynapticGM transfer |
|---|---|---|---|---|
| Mobile flow | Mostly vertical panel order with adjustable spaces and viewport preview | Layout is effectively free; more generated panels are not | Awkward pacing or text outside the visible rhythm | DOM stack plus three gutter tokens and mobile tests |
| Format clarity | Distinct page, LTR strip, and vertical-scroll modes | Template selection is negligible | One layout grammar is stretched across incompatible formats | Separate pointer-card banks sharing PanelSpec fields |
| Planner/render separation | LLM or static/human data drives a replaceable image backend | Templates avoid planner spend and reduce latency | Planner invents facts; whole-page failure couples all panels | Deterministic P0 templates; accepted tags only when valid |
| Local revision | Individual panels or intermediate stages remain editable | Re-spend only failed panel | Regeneration changes correct neighbours or lettering | Panel-level retry/repair with immutable overlay text |
| Character setup | Description, design sheet, reference, or later LoRA | Reference/LoRA raises storage and compute cost | Over-promised consistency and rights problems | Tiered consistency stack with no pixel-perfect promise |

## What must never transfer

SynapticGM must not copy protected styles, vendor asset libraries, private code, all-in-one baked pages for live play, automated lettering inside pixels, unlimited-regeneration economics that do not match per-generation COGS, or an autonomous planner that can overwrite ledger truth.
