# Validated Findings — Reference Images, Seeds, and Prompt Weighting

Official Midjourney documentation is used here only as public evidence for **technique shapes**. SynapticGM does not use Midjourney as its live player path, and the documented flags must not be presented as OpenRouter or Flux capabilities.

## Omni/reference conditioning

Source: **Midjourney Help Center — Omni Reference**, accessed 2026-08-26, https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference

The public documentation describes a reference-image conditioning mode that can carry a character, object, vehicle, or non-human creature into a new generation. It accepts one reference image, requires an accompanying text prompt, exposes a reference-strength control, and can be combined with a separate style reference. Documented constraints include double GPU time versus ordinary V7 generation, incompatibility with several fast/edit modes, unpredictable results at excessive reference strength, and imperfect preservation of intricate details such as freckles or clothing logos. It also states that users must have rights to external images.

**SynapticGM transfer:** Store a rights-cleared reference portrait or sheet and submit it only where the selected hosted endpoint explicitly supports image input. Keep textual appearance, equipment, place, and action locks in the prompt because image conditioning does not replace them. Budget a premium multiplier and expect compatibility trade-offs. Never promise exact identity or use an external image without rights.

## Style conditioning

Source: **Midjourney Help Center — Style Reference**, accessed 2026-08-26, https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference

The documentation separates style conditioning from subject conditioning: the style reference transfers broad visual properties such as colour, medium, texture, and lighting rather than objects or people. It recommends simple content prompts, warns that conflicting style language can interfere, supports strength control, and notes that model/version changes can alter results.

**SynapticGM transfer:** Use a small, original, rights-cleared technique board or an internal technique token bundle to stabilize palette, medium, line treatment, and lighting. Do not treat a style reference as a character lock, and do not use protected comic pages or living-artist work as the source.

## Seeds

Source: **Midjourney Help Center — Seeds**, accessed 2026-08-26, https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds

The documentation defines a seed as an initial noise state useful for controlled prompt experiments. It explicitly says seeds cannot save a style, character, or appearance across different prompts, may not remain stable across sessions, have little impact relative to prompt/model/settings changes, and can be unreliable in faster modes.

**SynapticGM transfer:** Persist any supported seed for auditability, retry experimentation, and same-contract regeneration. Never market or test it as an identity lock. If the hosted endpoint does not expose or honour a seed, omit it without weakening the core pipeline.

## Prompt segmentation and weights

Source: **Midjourney Help Center — Multi-Prompts & Weights**, accessed 2026-08-26, https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights

The documentation shows that distinct prompt concepts can receive relative positive or negative weights. Syntax is model-specific, but the broader public technique is stable: structure prompt concepts and make importance explicit.

**SynapticGM transfer:** Compile a model-adapter-neutral prompt contract whose semantic sections have priorities: canonical roster and kit first, beat/action and place next, camera/negative-space constraints next, original style technique last, plus a hard negative set for text, logos, watermarks, extra people, unsafe Kid framing, and duplicate limbs. A provider adapter may translate priorities into supported syntax; unsupported weights must degrade to ordered plain text rather than leaking foreign flags.

## Evidence-to-decision table

| Technique | What it buys | Cost/latency implication | Failure mode | SynapticGM decision |
|---|---|---|---|---|
| Subject/reference conditioning | Better recurring-subject resemblance | Often slower and more expensive; endpoint compatibility required | Clothing, small details, and multi-character identity may drift | Mid/High experiment after live endpoint verification |
| Separate style conditioning | More stable palette/medium/lighting | Additional conditioning and rights/storage overhead | Can conflict with content text and vary by model version | Use only original, rights-cleared technique references |
| Seed persistence | Controlled experiments and retry traceability | Negligible if supported | Mistaken for identity lock; unstable across changes | Store opportunistically, never promise identity |
| Structured priorities | Better adherence to canonical nouns and negatives | Negligible compiler cost | Provider-specific syntax or over-weighting can distort output | Keep semantic priorities provider-neutral, translate per endpoint |
