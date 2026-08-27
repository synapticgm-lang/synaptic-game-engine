# Validated Findings — Comic Reading Order, Closure, and Modular Generation

## Reading order

Source: **Cohn and Campbell, “Navigating Comics II: Constraints on the Reading Order of Comic Page Layouts,” Applied Cognitive Psychology 29(2), 2015**, https://doi.org/10.1002/acp.3086; public abstract at https://research.tilburguniversity.edu/en/publications/navigating-comics-ii-constraints-on-the-reading-order-of-comic-pa/

The study reports that readers normally expect an LTR/downward Z-path, but separation, overlap, blockage, and departures from a grid predictably push them away from that path. Increasing spatial irregularity decreases reliance on the conventional order.

**SynapticGM decision:** P0/P1 layouts should be deliberately boring in their reading order: simple rows, columns, or stacked vertical panels with numbered/debuggable order in data. Avoid overlapping panels, right-side blockers, extreme staggering, inset panels, and decorative border breaks until comprehension testing proves they work. Optional RTL is a distinct later bank; it is not an automatic mirror of the LTR bank because lettering zones and visual entry points must also change.

## Closure and multimodal understanding

Source: **Iyyer et al., “The Amazing Mysteries of the Gutter: Drawing Inferences Between Panels in Comic Book Narratives,” CVPR 2017**, https://openaccess.thecvf.com/content_cvpr_2017/html/Iyyer_The_Amazing_Mysteries_CVPR_2017_paper.html

The paper defines **closure** as the reader's inference of unseen movement or change between panels. The COMICS dataset contains more than 1.2 million panels paired with automatic textbox transcriptions. The authors report that neither text nor image alone was sufficient for the tested narrative tasks and that their models underperformed human baselines.

**SynapticGM decision:** Do not ask generated art to determine what happened between panels. The accepted text and ledger must encode the state change. A two-panel strip should depict only approved boundary states such as action/reaction or approach/reveal, with overlays supplying accepted dialogue and captions. If image generation omits or misreads the bridge, play remains correct because the text/ledger already committed the transition.

## Layered visual-narrative generation

Source: **Chen and Jhala, “A Customizable Generator for Comic-Style Visual Narrative,” arXiv:2401.02863v1, 2023/2024**, https://arxiv.org/html/2401.02863v1

The paper presents a modular generator that separates sequence-level narrative function, individual-panel composition, panel-to-panel transition, graphical layers, and rendering. Its demonstrated process determines panel count, associates panels with narrative roles, composes objects using spatial rules, selects inter-panel transitions, and adds graphical overlays. It identifies five visual-narrative roles: Establisher, Initial, Prolongation, Peak, and Release. The authors also separate backgrounds, foregrounds, entities, positions, relations, parameters, and the renderer.

**SynapticGM decision:** Borrow the modular structure, not its sample assets or its content-selection autonomy. SynapticGM already has committed story truth, so deterministic templates should map accepted beats to a smaller practical set: establishing, action, reaction, reveal, aftermath, dialogue, and transition. Sequence role selects a layout card and camera suggestion; it never chooses new actions or entities. Overlay symbols should come from accepted ActionOverlay data, not image pixels.

## Practical rules established by the evidence

| Evidence | Product rule |
|---|---|
| Irregular layouts redirect reading order | P0/P1 use explicit monotonic LTR or top-to-bottom order; no overlap/blockage |
| Gutters require reader inference | Keep the state transition in accepted text/ledger; art shows boundary states only |
| Text and image are complementary | Overlay lettering remains separate and authoritative; image-only comprehension is never required |
| Modular generators separate sequence, panel, and render layers | Compile BeatSpec → pointer card → PanelSpec → pure-art prompt → overlay, with local repair |
| Narrative roles can guide composition | Role selects among bounded templates; it cannot invent story content |
