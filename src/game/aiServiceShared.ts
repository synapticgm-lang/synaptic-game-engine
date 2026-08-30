import type { EngineMode } from './types';
import {
  extractSystemRollBlocks,
  sanitizeNarrativeMechanics,
  trimAbruptCutoff,
} from './narrativeSanitize';
import { filterSystemLogForEngine } from './systemLog';
import { logger } from './logger';
import { rotateFreeGatewayWriterOnRateLimit } from './autoplayWriter';

export interface GmResult {
  text: string;
  imagePrompt: string[] | null;
  rolls: string[];
  systemLog: string[];
}

export class RateLimitError extends Error {
  retryAfterMs?: number;
  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 10000;
const BACKOFF_DELAYS_MS = [5000, 15000, 30000, 60000];

export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, delayMs: number) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) logger.info('ai-retry', `retry attempt ${attempt}/${MAX_RETRIES}`);
      return await fn();
    } catch (e) {
      lastError = e;
      const isRateLimit =
        e instanceof RateLimitError ||
        (e instanceof Error && (e.message.includes('429') || e.message.toLowerCase().includes('rate limit')));
      const aborted =
        e instanceof Error &&
        (/aborted|still compiling|cancel/i.test(e.message) || e.name === 'AbortError');
      if (aborted || !isRateLimit || attempt === MAX_RETRIES) {
        logger.error(
          'ai-retry',
          `retries exhausted or non-retryable`,
          e instanceof Error ? { name: e.name, message: e.message } : e
        );
        throw e;
      }
      // Free Gateway: flip m3-free ↔ m2.7-free before backoff so the next attempt uses the other model.
      rotateFreeGatewayWriterOnRateLimit('withRetry-429');
      const serverDelay = e instanceof RateLimitError && e.retryAfterMs ? e.retryAfterMs : undefined;
      const delay = serverDelay ?? BACKOFF_DELAYS_MS[attempt] ?? BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn('ai-retry', `retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`, {
        delayMs: delay,
      });
      onRetry?.(attempt + 1, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function extractImagePrompt(text: string): string[] | null {
  const regex = /\[ ?CINEMATIC SCENE PROMPT ?\]([\s\S]*?)(?=\n\[|\nWhat do you do|\n$|$)/gi;
  const matches = [...text.matchAll(regex)];
  const regex2 = /---\s*CINEMATIC SCENE PROMPT\s*---([\s\S]*?)(?=---|$)/gi;
  const matches2 = [...text.matchAll(regex2)];
  const allMatches = [...matches, ...matches2];
  if (allMatches.length === 0) return null;
  const prompts = allMatches
    .map((m) => {
      const descMatch = m[1].match(/Description:\s*([\s\S]+?)(?=\n[A-Z]|\n\n|$)/i);
      return (descMatch ? descMatch[1].trim() : m[1].trim()) || null;
    })
    .filter(Boolean) as string[];
  return prompts.length > 0 ? prompts : null;
}

function stripImageBlock(text: string): string {
  return text
    .replace(/\n?\[\s*CINEMATIC SCENE PROMPT\s*\][\s\S]*?(?=\n\[|\nWhat do you do\?|$)/gi, '')
    .replace(/\n?---+\s*CINEMATIC SCENE PROMPT\s*---+[\s\S]*?(?=---+|$)/gi, '')
    .trim();
}

function extractSystemLog(text: string): string[] {
  const m = text.match(/<system-log>([\s\S]*?)<\/system-log>/i);
  if (!m) return [];
  return m[1].split('\n').map((l) => l.trim()).filter(Boolean);
}

function stripSystemLog(text: string): string {
  return text.replace(/\n?<system-log>[\s\S]*?<\/system-log>/gi, '').trim();
}

/** Shared post-processing for model completions (proxy + direct). */
export function processGmCompletion(text: string, engineMode: EngineMode): GmResult {
  const imagePrompt = extractImagePrompt(text);
  let cleanText = imagePrompt ? stripImageBlock(text) : text;
  const systemLog = extractSystemLog(cleanText);
  cleanText = stripSystemLog(cleanText);
  const rolls = extractSystemRollBlocks(cleanText);
  const sanitized = sanitizeNarrativeMechanics(cleanText, engineMode);
  cleanText = trimAbruptCutoff(sanitized.text);
  const mergedLog = filterSystemLogForEngine(
    Array.from(
      new Set([...systemLog, ...sanitized.extracted, ...rolls].map((l) => l.trim()).filter(Boolean))
    ),
    engineMode
  );
  return {
    text: cleanText,
    imagePrompt,
    rolls,
    systemLog: mergedLog,
  };
}
