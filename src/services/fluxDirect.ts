/**
 * Direct Black Forest Labs (Flux) image generation.
 * Prefer this over OpenRouter for launch speed/quality.
 * Docs: https://docs.bfl.ml/quick_start/generating_images
 */

import type { FluxEndpointId } from '@/game/subscriptionTiers';
import { logger } from '@/game/logger';

const BFL_BASE = 'https://api.bfl.ai/v1';
const POLL_MS = 500;
const MAX_POLLS = 120;

export interface FluxGenerateOptions {
  apiKey: string;
  endpoint: FluxEndpointId;
  prompt: string;
  width?: number;
  height?: number;
  signal?: AbortSignal;
}

export async function generateFluxImage(opts: FluxGenerateOptions): Promise<string> {
  const width = opts.width ?? 1024;
  const height = opts.height ?? 768;
  const submit = await fetch(`${BFL_BASE}/${opts.endpoint}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'x-key': opts.apiKey,
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      width,
      height,
    }),
    signal: opts.signal,
  });

  if (submit.status === 402) {
    throw new Error('Flux credits exhausted — add credits at dashboard.bfl.ai');
  }
  if (submit.status === 429) {
    throw new Error('Flux rate limit — too many active generations');
  }
  if (!submit.ok) {
    const body = await submit.text().catch(() => '');
    throw new Error(`Flux submit failed (${submit.status}): ${body.slice(0, 200)}`);
  }

  const started = (await submit.json()) as { id?: string; polling_url?: string };
  const pollingUrl = started.polling_url;
  if (!pollingUrl) {
    throw new Error('Flux response missing polling_url');
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    if (opts.signal?.aborted) throw new Error('Flux generation aborted');
    await sleep(POLL_MS, opts.signal);
    const poll = await fetch(pollingUrl, {
      headers: { accept: 'application/json', 'x-key': opts.apiKey },
      signal: opts.signal,
    });
    if (!poll.ok) {
      logger.warn('ai-image', `Flux poll status ${poll.status}`);
      continue;
    }
    const data = (await poll.json()) as {
      status?: string;
      result?: { sample?: string };
    };
    if (data.status === 'Ready' && data.result?.sample) {
      return data.result.sample;
    }
    if (data.status === 'Error' || data.status === 'Failed') {
      throw new Error(`Flux generation ${data.status}`);
    }
  }
  throw new Error('Flux generation timed out');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new Error('aborted'));
      },
      { once: true }
    );
  });
}
