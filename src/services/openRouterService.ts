import { COMIC_STYLES } from '../config/comicStyles';
import { debugLogger } from '../game/debugLogger';
import {
  NEGATIVE_ART_PROMPT,
  PURE_ART_DIRECTIVE,
  WORLD_GENRE_PRESERVATION_DIRECTIVE,
} from '../game/comicImagePrompt';
import {
  getStyleSpec,
  getColorVariantDirective,
  getEffectiveNegativePrompt,
  KID_MODE_STYLE_DIRECTIVE,
} from '../styles/styleSpecs';
import type { Settings } from '../game/types';
import { prepareKidSafeImagePrompt } from '../game/visualCanon';
import { generateFluxImage } from './fluxDirect';
import { resolveFluxImageModel } from '../game/subscriptionTiers';
import { canSpend, spendCapacity } from '../game/capacityLedger';
import {
  BYOK_IMAGE_KEY_REQUIRED,
  canConfigurePlayerAiKeys,
  isByokTierWithoutHostedKeys,
  resolveByokImageSpendKey,
  resolveClientImageApiKey,
  resolveClientTextApiKey,
} from '../game/distributionChannel';
import { invokeImageProxy } from '../game/gmProxy';

const OPENROUTER_API_KEY = ''; // Provider keys must come from Settings / edge secrets — never VITE_*.
const BASE_URL = 'https://openrouter.ai/api/v1';

export const PRIMARY_IMAGE_MODEL = 'black-forest-labs/flux-schnell';
export const HERO_IMAGE_MODEL = 'black-forest-labs/flux-dev';
const DEFAULT_IMAGE_GEN_TIMEOUT_MS = 25_000;
const DEFAULT_VIDEO_GEN_TIMEOUT_MS = 90_000;
const HERO_IMAGE_TRIGGER = /\b(?:milestone|splash(?:\s+page|\s+image)?|full[- ]page|boss(?:\s+(?:fight|battle|encounter))?|raid boss|final boss|world boss)\b/i;

function withPureArtDirective(prompt: string): string {
  const trimmed = prompt.trim();
  return trimmed.includes(PURE_ART_DIRECTIVE)
    ? trimmed
    : `${trimmed}\n\n${PURE_ART_DIRECTIVE}`;
}

/**
 * Thrown when an image-generation endpoint returns HTTP 200 but no base64/URL image
 * could be extracted from the response (malformed payload, empty message, etc). Distinct
 * from `ImageModerationError` (safety-filter text refusal) so callers can tell "the model
 * refused" apart from "the response shape was unusable" — both degrade to the error
 * placeholder in the UI, but only the former is worth retrying with a softened prompt.
 */
export class ImageGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}

/** Moved here (from game/imageGen.ts) so the detection that throws it lives next to the fetch logic. */
export class ImageModerationError extends Error {
  rejectedPrompt: string;
  constructor(message: string, rejectedPrompt: string) {
    super(message);
    this.name = 'ImageModerationError';
    this.rejectedPrompt = rejectedPrompt;
  }
}

const TEXT_REFUSAL_PATTERNS = [
  /\bi\s*(cannot|can't|can not|won't|will not)\s+(fulfill|create|generate|produce|comply|help|assist)/i,
  /\bi'?m\s+(sorry|unable)\b/i,
  /\bas an ai\b/i,
  /\b(against|violates?)\s+(our|the)?\s*(content|usage)\s*polic/i,
  /\bsafety\s+(filter|guideline|polic)/i,
  /\bcontent\s+policy\b/i,
  /\bnot\s+able\s+to\s+(create|generate|produce)\b/i,
  /\bcan not\s+assist\b/i,
];

/** finish_reason / native_finish_reason values that mean "the safety filter ate the response",
 *  as opposed to a normal completion — these arrive with `message.content: null` and NO images,
 *  so there's nothing in the content string to pattern-match against at all. */
const CONTENT_FILTER_FINISH_REASONS = ['content_filter', 'safety'];
const CONTENT_FILTER_NATIVE_REASON_PATTERN = /safety/i; // e.g. "IMAGE_SAFETY"

/**
 * OpenRouter's image API occasionally returns HTTP 200 with either (a) a plain-text refusal
 * instead of an image — e.g. "I cannot fulfill this request." — or (b) a HARD safety-filter
 * response where `message.content` is `null`/empty and `finish_reason`/`native_finish_reason`
 * carries the refusal signal instead (e.g. `finish_reason: "content_filter"`,
 * `native_finish_reason: "IMAGE_SAFETY"`). Case (b) used to slip past a content-only check and
 * fall through to a generic error that skipped the softened-prompt retry entirely. Detecting
 * both here lets the caller throw `ImageModerationError` (triggers the retry) instead of a
 * fatal, un-retried crash.
 */
function isModerationRefusal(params: {
  content: unknown;
  finishReason?: string | null;
  nativeFinishReason?: string | null;
}): boolean {
  const { content, finishReason, nativeFinishReason } = params;

  if (finishReason && CONTENT_FILTER_FINISH_REASONS.includes(finishReason.toLowerCase())) return true;
  if (nativeFinishReason && CONTENT_FILTER_NATIVE_REASON_PATTERN.test(nativeFinishReason)) return true;

  if (typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (!trimmed) return false;
  // A real image response never comes back as a short plain-English sentence with no
  // image markers at all — cap the length so we don't misclassify long, unrelated captions.
  if (trimmed.length > 400) return false;
  return TEXT_REFUSAL_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Generate a comic panel image via OpenRouter's /v1/chat/completions endpoint
 * using the `modalities: ["image", "text"]` parameter.
 *
 * Everything routes strictly through OpenRouter — no direct provider APIs,
 * no third-party fallbacks. Supports BYOK via the `apiKey` and `imageModel`
 * parameters passed from the game settings.
 */
export const fetchComicPanel = async (
  basePrompt: string,
  mode: 'kid' | 'adult' | 'unrestricted',
  styleKey: string = 'western',
  apiKey?: string,
  imageModel?: string,
  options?: { useRawPrompt?: boolean; signal?: AbortSignal }
): Promise<string> => {
  let workingBase = basePrompt;
  if (mode === 'kid') {
    const prepared = prepareKidSafeImagePrompt(basePrompt, { skipIfUnsalvageable: true });
    if (prepared.skip) {
      throw new ImageModerationError(
        'Kid Mode skipped a Families-bar image before the API call.',
        basePrompt,
      );
    }
    workingBase = prepared.prompt;
  }

  const resolvedApiKey = apiKey || OPENROUTER_API_KEY;
  const resolvedModel = imageModel
    || (HERO_IMAGE_TRIGGER.test(workingBase) ? HERO_IMAGE_MODEL : PRIMARY_IMAGE_MODEL);

  if (!resolvedApiKey) {
    debugLogger.record('ERROR', 'Image generation skipped — no OpenRouter API key available', {
      envKey: !!OPENROUTER_API_KEY,
      byokKey: !!apiKey
    });
    throw new Error('No OpenRouter API key configured for image generation.');
  }

  const style = COMIC_STYLES[styleKey] || COMIC_STYLES.western;
  const composedPrompt = options?.useRawPrompt
    ? workingBase
    : `${workingBase}, ${style.promptSuffix}`;
  let finalPrompt = withPureArtDirective(composedPrompt);

  if (!options?.useRawPrompt) {
    if (mode === 'kid') {
      finalPrompt += ', safe for work, mild cartoon violence only, absolute age 7+ rating, clean visual';
    } else if (mode === 'adult') {
      finalPrompt += ', detailed lighting, epic fantasy art';
    }
    finalPrompt += '. IMPORTANT: Do NOT include any text, words, letters, or speech bubbles in the image. The image must be purely visual with zero text.';
  }

  const payload = {
    model: resolvedModel,
    modalities: ['image', 'text'],
    messages: [
      {
        role: 'user',
        content: finalPrompt
      }
    ]
  };

  debugLogger.record('API_REQUEST', 'Image generation request to OpenRouter', {
    url: `${BASE_URL}/chat/completions`,
    model: resolvedModel,
    modalities: payload.modalities,
    prompt: finalPrompt.slice(0, 200),
    mode,
    styleKey,
    usingByokKey: !!apiKey,
    usingEnvKey: !apiKey && !!OPENROUTER_API_KEY,
    payload
  });

  const startTime = performance.now();
  // `fetchComicPanel` is exported and still used directly by background-image helpers, so
  // enforce a local timeout when the caller has not already supplied a queue-owned signal.
  const localController = options?.signal ? null : new AbortController();
  const requestSignal = options?.signal ?? localController?.signal;
  const localTimer = localController
    ? setTimeout(() => localController.abort(), DEFAULT_IMAGE_GEN_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resolvedApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'LitRPG Adventure App'
      },
      body: JSON.stringify(payload),
      signal: requestSignal
    });

    const latency = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errBody = await response.text();
      debugLogger.record('ERROR', `Image API returned ${response.status} in ${latency}ms`, {
        status: response.status,
        statusText: response.statusText,
        latency,
        body: errBody.slice(0, 500),
        model: resolvedModel,
        prompt: finalPrompt.slice(0, 200)
      });
      throw new Error(`OpenRouter image API error ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const finishReason: string | null | undefined = choice?.finish_reason;
    const nativeFinishReason: string | null | undefined = choice?.native_finish_reason;

    debugLogger.record('API_RESPONSE', `Image API returned ${response.status} in ${latency}ms`, {
      status: response.status,
      latency,
      model: resolvedModel,
      hasMessage: !!message,
      messageKeys: message ? Object.keys(message) : [],
      hasImages: !!message?.images,
      imagesLength: message?.images?.length ?? 0,
      contentPreview: typeof message?.content === 'string' ? message.content.slice(0, 200) : null,
      finishReason,
      nativeFinishReason,
    });

    // OpenRouter returns generated images in the `message.images` array
    const images = message?.images;

    if (images && Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      const imageUrl = firstImage?.image_url?.url || firstImage?.url;

      if (imageUrl) {
        debugLogger.record('STATE_UPDATE', 'Image URL extracted from message.images', {
          imageUrlPrefix: imageUrl.slice(0, 50),
          imageUrlLength: imageUrl.length,
          source: 'message.images[].image_url.url'
        });
        return imageUrl;
      }
    }

    const content = message?.content;

    // Detect a moderation refusal BEFORE falling through to the generic "no extractable
    // image" error, so it can be retried with a softened prompt. Covers both a plain-text
    // refusal string AND a hard safety-filter response where `content` is null/empty and the
    // refusal only shows up in finish_reason/native_finish_reason (e.g. "content_filter",
    // "IMAGE_SAFETY") — the content-type check alone previously missed the latter, which
    // fell through to a fatal, un-retried error instead of the moderation retry loop.
    if (isModerationRefusal({ content, finishReason, nativeFinishReason })) {
      debugLogger.record('WARN', 'Image API returned a moderation/safety-filter refusal instead of an image', {
        latency,
        model: resolvedModel,
        finishReason,
        nativeFinishReason,
        refusalText: typeof content === 'string' ? content.slice(0, 200) : null,
      });
      throw new ImageModerationError(
        typeof content === 'string' && content.trim()
          ? `Image request was refused: "${content.slice(0, 150)}"`
          : `Image request was refused by the safety filter (${nativeFinishReason || finishReason || 'content_filter'}).`,
        finalPrompt
      );
    }

    // Fallback: some models return base64 or URL in content
    if (typeof content === 'string') {
      // Check for data URI
      const dataUriMatch = content.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (dataUriMatch) {
        debugLogger.record('STATE_UPDATE', 'Image URL extracted from content data URI', {
          imageUrlPrefix: dataUriMatch[0].slice(0, 50),
          source: 'content data URI'
        });
        return dataUriMatch[0];
      }

      // Check for markdown image syntax: ![alt](url)
      const mdImageMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (mdImageMatch) {
        debugLogger.record('STATE_UPDATE', 'Image URL extracted from markdown image syntax', {
          imageUrl: mdImageMatch[1].slice(0, 100),
          source: 'content markdown image'
        });
        return mdImageMatch[1];
      }

      // Check for raw URL
      const urlMatch = content.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp|gif))/i);
      if (urlMatch) {
        debugLogger.record('STATE_UPDATE', 'Image URL extracted from content raw URL', {
          imageUrl: urlMatch[1].slice(0, 100),
          source: 'content raw URL'
        });
        return urlMatch[1];
      }
    }

    // Fallback: check for multi-part content array
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === 'image_url' && part?.image_url?.url) {
          debugLogger.record('STATE_UPDATE', 'Image URL extracted from content array', {
            imageUrlPrefix: part.image_url.url.slice(0, 50),
            source: 'content array image_url'
          });
          return part.image_url.url;
        }
      }
    }

    debugLogger.record('ERROR', 'Image API returned 200 but no image could be extracted', {
      latency,
      model: resolvedModel,
      rawResponse: JSON.stringify(data).slice(0, 500)
    });
    throw new ImageGenerationError('OpenRouter image API returned no extractable image in the response.');
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - startTime);
    if (localController?.signal.aborted) {
      const timeoutError = new ImageGenerationError(
        `OpenRouter image generation timed out after ${DEFAULT_IMAGE_GEN_TIMEOUT_MS}ms`
      );
      debugLogger.record('ERROR', timeoutError.message, {
        latency,
        model: resolvedModel,
        prompt: finalPrompt.slice(0, 200),
      });
      throw timeoutError;
    }
    debugLogger.record('ERROR', `Image generation failed after ${latency}ms`, {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      latency,
      model: resolvedModel,
      prompt: finalPrompt.slice(0, 200)
    });
    throw err;
  } finally {
    if (localTimer) clearTimeout(localTimer);
  }
};

/**
 * Runs `fn` with an AbortSignal that fires after `ms` milliseconds, guaranteeing the
 * underlying fetch is actually cancelled (not just abandoned) instead of hanging the
 * background image queue indefinitely.
 */
async function withAbortTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      throw new ImageGenerationError(`${label} timed out after ${ms}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function toDataUri(base64: string, mimeType = 'image/png'): string {
  return base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
}

/**
 * Dedicated image generation via an OpenAI-compatible `/images/generations` endpoint
 * (e.g. DALL-E 3, or any self-hosted server implementing the same contract).
 */
async function fetchOpenAIImage(
  prompt: string,
  settings: Settings,
  signal: AbortSignal
): Promise<string> {
  const base = (settings.imageBaseUrl?.trim() || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const apiKey = settings.imageApiKey || settings.openrouterApiKey || settings.geminiApiKey || undefined;
  const model = settings.imageModel?.trim() || 'dall-e-3';

  const payload = {
    model,
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json',
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  debugLogger.record('API_REQUEST', 'Dedicated OpenAI-compatible image request', {
    url: `${base}/images/generations`,
    model,
    prompt: prompt.slice(0, 200),
  });

  const response = await fetch(`${base}/images/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI-compatible image API error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return toDataUri(item.b64_json);
  if (item?.url) return item.url;
  throw new ImageGenerationError('OpenAI-compatible image API returned no extractable image.');
}

/**
 * Dedicated image generation via an Automatic1111 (Stable Diffusion WebUI) `/sdapi/v1/txt2img` endpoint.
 */
async function fetchAutomatic1111Image(
  prompt: string,
  settings: Settings,
  signal: AbortSignal,
  negativePrompt: string = NEGATIVE_ART_PROMPT
): Promise<string> {
  const base = (settings.imageBaseUrl?.trim() || 'http://127.0.0.1:7860').replace(/\/+$/, '');

  const payload = {
    prompt,
    negative_prompt: negativePrompt,
    steps: 24,
    width: 768,
    height: 1024,
    cfg_scale: 7,
    sampler_name: 'DPM++ 2M Karras',
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.imageApiKey) headers.Authorization = `Bearer ${settings.imageApiKey}`;

  debugLogger.record('API_REQUEST', 'Dedicated Automatic1111 image request', {
    url: `${base}/sdapi/v1/txt2img`,
    prompt: prompt.slice(0, 200),
  });

  const response = await fetch(`${base}/sdapi/v1/txt2img`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Automatic1111 API error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const base64 = data?.images?.[0];
  if (!base64) throw new ImageGenerationError('Automatic1111 API returned no image data.');
  return toDataUri(base64);
}

/**
 * Dedicated image generation via ComfyUI's queue-based `/prompt` + `/history` API using a
 * minimal default checkpoint -> CLIP encode -> KSampler -> VAE decode -> SaveImage workflow.
 * The checkpoint filename is taken from the "Model" field in image settings.
 */
async function fetchComfyUIImage(
  prompt: string,
  settings: Settings,
  signal: AbortSignal,
  negativePrompt: string = NEGATIVE_ART_PROMPT
): Promise<string> {
  const base = (settings.imageBaseUrl?.trim() || 'http://127.0.0.1:8188').replace(/\/+$/, '');
  const ckpt = settings.imageModel?.trim() || 'sd_xl_base_1.0.safetensors';
  const clientId = `synapticgm-${Math.random().toString(36).slice(2)}`;

  const workflow = {
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: ckpt } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width: 768, height: 1024, batch_size: 1 } },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: negativePrompt, clip: ['4', 1] } },
    '3': {
      class_type: 'KSampler',
      inputs: {
        seed: Math.floor(Math.random() * 1_000_000_000),
        steps: 24,
        cfg: 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'synapticgm', images: ['8', 0] } },
  };

  debugLogger.record('API_REQUEST', 'Dedicated ComfyUI image request', {
    url: `${base}/prompt`,
    ckpt,
    prompt: prompt.slice(0, 200),
  });

  const queueResponse = await fetch(`${base}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    signal,
  });

  if (!queueResponse.ok) {
    const errBody = await queueResponse.text();
    throw new Error(`ComfyUI queue error ${queueResponse.status}: ${errBody.slice(0, 300)}`);
  }

  const queueData = await queueResponse.json();
  const promptId = queueData?.prompt_id;
  if (!promptId) throw new Error('ComfyUI did not return a prompt_id.');

  while (!signal.aborted) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const historyResponse = await fetch(`${base}/history/${promptId}`, { signal });
    if (!historyResponse.ok) continue;

    const historyData = await historyResponse.json();
    const entry = historyData?.[promptId];
    const images = entry?.outputs?.['9']?.images;
    if (images?.length > 0) {
      const img = images[0];
      const params = new URLSearchParams({
        filename: img.filename,
        subfolder: img.subfolder || '',
        type: img.type || 'output',
      });
      return `${base}/view?${params.toString()}`;
    }
  }

  throw new Error('ComfyUI generation was aborted before an image was produced.');
}

export interface GenerateComicImageOptions {
  useRawPrompt?: boolean;
  timeoutMs?: number;
  /** Explicitly route milestone/splash artwork to the higher-fidelity hero model. */
  hero?: boolean;
  /** When true, classic text mode may still generate a memorable-moment splash. */
  memorableMoment?: boolean;
}

/**
 * Dedicated image generation entry point.
 * Default: Flux via OpenRouter (tier → model map). Later: set imageProvider to
 * `flux-direct` + fluxApiKey to hit BFL with the same tier endpoints — callers unchanged.
 */
export async function generateComicImage(
  prompt: string,
  mode: 'kid' | 'adult' | 'unrestricted',
  settings: Settings,
  options?: GenerateComicImageOptions
): Promise<string | null> {
  if (settings.visualMode === 'classic') {
    const allowMemorable = Boolean(options?.memorableMoment && settings.classicMemorableImages);
    if (!allowMemorable) {
      console.log('[ImageService] Skipping image generation for classic text mode.');
      return null;
    }
    if (!canSpend('memorable')) {
      console.log('[ImageService] Memorable image quota exhausted.');
      return null;
    }
  } else if (settings.visualMode === 'comic') {
    if (!canSpend('illustrated')) {
      console.log('[ImageService] Illustrated image quota exhausted.');
      return null;
    }
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_IMAGE_GEN_TIMEOUT_MS;
  const provider = settings.imageProvider || 'flux';

  let workingPrompt = prompt;
  if (mode === 'kid') {
    const prepared = prepareKidSafeImagePrompt(prompt, {
      skipIfUnsalvageable: true,
    });
    if (prepared.skip) {
      console.log('[ImageService] Skipping kid-unsafe memorable prompt before API call.');
      return null;
    }
    workingPrompt = prepared.prompt;
  }

  const styleSpec = getStyleSpec(settings.artStylePreset);
  const effectiveNegativePrompt = getEffectiveNegativePrompt(styleSpec, mode);
  const kidDirective = mode === 'kid' ? `${KID_MODE_STYLE_DIRECTIVE}\n\n` : '';
  const colorVariantDirective = getColorVariantDirective(styleSpec, settings.colorVariant);
  const visualPrompt = withPureArtDirective(workingPrompt);
  const styledPrompt = [
    `${kidDirective}${styleSpec.style_prefix}`,
    visualPrompt,
    styleSpec.style_suffix,
    colorVariantDirective
      ? `COLOR VARIANT OVERRIDE (highest priority): ${colorVariantDirective}`
      : '',
    WORLD_GENRE_PRESERVATION_DIRECTIVE,
  ].filter(Boolean).join('\n\n').trim();

  const classicMemorable = settings.visualMode === 'classic' && Boolean(options?.memorableMoment);
  const useHeroModel = classicMemorable
    ? options?.hero === true
    : options?.hero === true || HERO_IMAGE_TRIGGER.test(prompt);
  let fluxModels = resolveFluxImageModel({
    tier: settings.subscriptionTier,
    hero: useHeroModel,
    via: provider === 'flux-direct' ? 'direct' : 'openrouter',
  });
  if (classicMemorable && !useHeroModel && fluxModels.openRouterId === HERO_IMAGE_MODEL) {
    fluxModels = {
      openRouterId: PRIMARY_IMAGE_MODEL,
      bflEndpoint: 'flux-2-klein-9b',
    };
  }

  const recordSpend = () => {
    if (settings.visualMode === 'classic') spendCapacity('memorable');
    else if (settings.visualMode === 'comic') spendCapacity('illustrated');
  };

  // Optional later path — same tier map, BFL transport
  const fluxKey = canConfigurePlayerAiKeys(settings) ? resolveClientImageApiKey(settings) : '';
  if (provider === 'flux-direct' && fluxKey) {
    const label = `Flux direct (${fluxModels.bflEndpoint})`;
    const url = await withAbortTimeout(
      (signal) =>
        generateFluxImage({
          apiKey: fluxKey,
          endpoint: fluxModels.bflEndpoint,
          prompt: `${styledPrompt}\n\nAvoid depicting: ${effectiveNegativePrompt}.`,
          signal,
        }),
      timeoutMs,
      label
    );
    if (url) recordSpend();
    return url;
  }

  if (provider === 'custom' && settings.imageBaseUrl?.trim()) {
    const endpointType = settings.imageEndpointType || 'openai';
    const label = `Dedicated ${endpointType} image generation`;
    let url: string | null = null;
    switch (endpointType) {
      case 'openai':
        url = await withAbortTimeout((signal) => fetchOpenAIImage(styledPrompt, settings, signal), timeoutMs, label);
        break;
      case 'automatic1111':
        url = await withAbortTimeout(
          (signal) => fetchAutomatic1111Image(styledPrompt, settings, signal, effectiveNegativePrompt),
          timeoutMs,
          label
        );
        break;
      case 'comfyui':
        url = await withAbortTimeout(
          (signal) => fetchComfyUIImage(styledPrompt, settings, signal, effectiveNegativePrompt),
          timeoutMs,
          label
        );
        break;
      default:
        break;
    }
    if (url) recordSpend();
    return url;
  }

  // Default launch path: Flux via OpenRouter (tier-mapped schnell/dev)
  const openRouterPrompt = `${styledPrompt}\n\nAvoid depicting: ${effectiveNegativePrompt}.`;
  if (isByokTierWithoutHostedKeys(settings) && !resolveByokImageSpendKey(settings)) {
    console.log('[ImageService]', BYOK_IMAGE_KEY_REQUIRED);
    return null;
  }
  const apiKey = isByokTierWithoutHostedKeys(settings)
    ? resolveByokImageSpendKey(settings)
    : undefined;
  const routedModel =
    settings.imageModel?.trim() ||
    fluxModels.openRouterId ||
    (useHeroModel ? HERO_IMAGE_MODEL : PRIMARY_IMAGE_MODEL);

  // Hosted Free/Mid/High: prefer edge proxy (server key) so memorable art works without BYOK.
  if (!apiKey) {
    try {
      const proxied = await withAbortTimeout(
        (signal) =>
          invokeImageProxy({
            prompt: openRouterPrompt,
            model: routedModel,
            signal,
          }),
        timeoutMs,
        'Hosted Flux image generation'
      );
      if (proxied) {
        recordSpend();
        return proxied;
      }
    } catch (proxyErr) {
      debugLogger.record('WARN', 'Hosted image proxy failed — soft-skip', {
        error: proxyErr instanceof Error ? proxyErr.message : String(proxyErr),
      });
      return null;
    }
    // Proxy unavailable / empty — soft-skip rather than blaming Settings on Free.
    debugLogger.record('WARN', 'Image generation skipped — no hosted image key path', {
      envKey: false,
      byokKey: false,
    });
    return null;
  }

  const url = await withAbortTimeout(
    (signal) =>
      fetchComicPanel(openRouterPrompt, mode, 'western', apiKey, routedModel, {
        useRawPrompt: true,
        signal,
      }),
    timeoutMs,
    'OpenRouter Flux image generation'
  );
  if (url) recordSpend();
  return url;
}

/** Thrown when loot-video generation is requested but no video provider has been configured yet. */
export class VideoProviderNotConfiguredError extends Error {
  constructor() {
    super('Video generation is not configured. Add a video provider in API Settings to enable loot-video moments.');
    this.name = 'VideoProviderNotConfiguredError';
  }
}

/**
 * Dedicated video generation entry point (Legendary Loot Videos). Pluggable by design: no
 * concrete provider (Runway/Luma/Kling/Sora) ships in this codebase yet, so this targets a
 * generic OpenAI-style `/video/generations` contract when `settings.videoProvider === 'custom'`
 * is configured, and otherwise fails fast with a clear, catchable error so callers can degrade
 * to a placeholder instead of hanging or fabricating a fake integration. Video jobs get a much
 * longer timeout than images since generation typically takes 30s-2min+.
 */
export async function generateVideo(
  prompt: string,
  settings: Settings,
  options?: { timeoutMs?: number }
): Promise<string> {
  if (settings.videoProvider !== 'custom' || !settings.videoBaseUrl?.trim()) {
    throw new VideoProviderNotConfiguredError();
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_VIDEO_GEN_TIMEOUT_MS;
  const base = settings.videoBaseUrl.trim().replace(/\/+$/, '');
  const apiKey = settings.videoApiKey || undefined;
  const model = settings.videoModel?.trim() || undefined;

  return withAbortTimeout(async (signal) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    debugLogger.record('API_REQUEST', 'Video generation request', {
      url: `${base}/video/generations`,
      model,
      prompt: prompt.slice(0, 200),
    });

    const response = await fetch(`${base}/video/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, prompt, n: 1 }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Video generation API error ${response.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const item = data?.data?.[0];
    const videoUrl = item?.url || item?.video_url;
    if (videoUrl) return videoUrl as string;
    if (item?.b64_json) return toDataUri(item.b64_json, 'video/mp4');
    throw new Error('Video generation API returned no extractable video URL.');
  }, timeoutMs, 'Video generation');
}