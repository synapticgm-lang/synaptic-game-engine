# OpenRouter Image API Verification Notes

## VERIFIED from public documentation on 2026-08-26

OpenRouter documents a dedicated `POST /api/v1/images` endpoint, a model-discovery endpoint at `GET /api/v1/images/models`, and per-model endpoint records that expose supported parameters and price lines. Capability checks must be made at runtime because each endpoint can expose a subset of the model-level parameter union. Images are returned as base64 with a media type when detectable. Provider routing and provider-specific options are supported. Image billing is documented as all-or-nothing: a completed generation is billed in full; a failed or cancelled generation is not billed. Source: [OpenRouter Image Generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation).

## VERIFIED from live model discovery on 2026-08-26

The public image-model catalogue returned the exact slugs `black-forest-labs/flux.2-klein-4b` and `black-forest-labs/flux.2-pro`. Endpoint records showed that both currently support one image per request, PNG or JPEG output, seeds, and the aspect ratios `1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, `21:9`, and `auto`; neither endpoint reported streaming. Klein 4B accepted up to four reference images and reported **$0.014 per output megapixel**. Pro accepted up to eight reference images and reported **$0.03 per output megapixel**. These are point-in-time provider records and must remain runtime-discovered rather than frozen as contractual constants.

## INPUT REQUIRED / UNKNOWN

The absent `validated_openrouter_image_api.md` is still required to confirm the product’s approved tier mapping, internal aliases, host path, latency assumptions, error handling, and budget envelopes. The task specification’s direction—Klein 4B for Free/comic-lite/icons and Flux Pro for Mid/High memorable plates—is retained as **PROVIDED SUMMARY**. Public discovery confirms that the named model slugs exist, but it does not verify SynapticGM’s commercial policy or unit economics.

## Implementation consequence

Use a runtime capability probe and config table rather than hard-coding aspect ratios, resolution, `n`, streaming, or prices. Keep image work off the GM turn timeout path. Treat art as asynchronous presentation output and never as ledger evidence.

## Citation-ready reference

[6]: https://openrouter.ai/docs/guides/overview/multimodal/image-generation "Image Generation — OpenRouter Documentation"
