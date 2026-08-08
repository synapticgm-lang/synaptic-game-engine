import type { AiProvider } from './types';

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function detectProviderFromKey(key: string): AiProvider | null {
  const k = key.trim();
  if (!k) return null;
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('sk-or-')) return 'openrouter';
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('sk-')) return 'openai';
  return null;
}

const ANTHROPIC_PRESETS = [
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-3-opus-latest',
];

const DEFAULT_MODELS: Record<AiProvider, string[]> = {
  gemini: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash'],
  openrouter: ['google/gemini-2.5-flash', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ANTHROPIC_PRESETS,
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  ollama: ['llama3.1', 'mistral', 'phi3'],
};

export function getDefaultModels(provider: AiProvider): string[] {
  return DEFAULT_MODELS[provider] ?? [];
}

export async function validateApiKey(
  provider: AiProvider,
  apiKey: string,
  baseUrl?: string
): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim().length < 5) {
    return { ok: false, error: 'API key is too short.' };
  }

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`;
      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'Invalid API key (401/403).' };
      }
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      return { ok: true };
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: 'Invalid API key (401/403).' };
      }
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      return { ok: true };
    }

    const defaultBase = provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
    const base = baseUrl?.trim() || defaultBase;
    const res = await fetch(`${base}/models?limit=1`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Invalid API key (401/403).' };
    }
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export async function fetchModelsForProvider(
  provider: AiProvider,
  apiKey: string,
  baseUrl?: string
): Promise<string[]> {
  if (provider === 'anthropic') {
    return ANTHROPIC_PRESETS;
  }

  if (provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models: string[] = (data.models ?? [])
      .filter((m: { name: string }) => m.name?.includes('gemini'))
      .map((m: { name: string }) => m.name.replace('models/', ''));
    return models.length > 0 ? models : getDefaultModels('gemini');
  }

  const defaultBase = provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
  const base = baseUrl?.trim() || defaultBase;
  const res = await fetch(`${base}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const models: string[] = (data.data ?? []).map((m: { id: string }) => m.id);
  return models.length > 0 ? models : getDefaultModels(provider);
}
