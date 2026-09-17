/**
 * OpenRouter player-brain (decisions / thumbs / notes).
 * Game still plays in visible Chrome. Never logs the API key.
 */
import { buildPlaytesterPrompt, parsePlaytesterDecision } from './geminiTab.mjs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-pro';

export function openRouterKey() {
  return (
    process.env.OPENROUTER_API_KEY
    || process.env.VITE_OPENROUTER_API_KEY
    || process.env.AUTOPLAY_OPENROUTER_API_KEY
    || ''
  ).trim();
}

export function openRouterPlayerModel() {
  const raw = (process.env.AI_PLAYER_MODEL || process.env.GEMINI_REVIEW_MODEL || DEFAULT_MODEL).trim();
  if (!raw || raw === 'gemini-2.5-pro' || raw === 'gemini-3.1-pro-preview') return DEFAULT_MODEL;
  return raw;
}

function extractText(payload) {
  const choice = payload?.choices?.[0];
  const msg = choice?.message;
  const content = msg?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
  }
  return String(choice?.text || '').trim();
}

const SYSTEM = [
  'You are a human playtester for a browser text RPG.',
  'Use only the packet. Return ONE JSON object and nothing else.',
  'Required keys: action_kind, action, thumb, comment, nonsense_options, future_leak, note.',
  'action_kind is "chip" or "type". thumb is "up" or "down".',
  'nonsense_options and future_leak are booleans.',
  'If chips exist, prefer action_kind chip and copy exact chip text (or a 1-based chip number).',
].join(' ');

export function buildJsonPlaytesterPrompt(packet) {
  return [
    buildPlaytesterPrompt(packet),
    '',
    'Ignore the 6-line KIND format. Return ONLY this JSON object:',
    '{"action_kind":"chip","action":"exact chip or typed line","thumb":"up","comment":"short why","nonsense_options":false,"future_leak":false,"note":"one line"}',
  ].join('\n');
}

async function postChat(apiKey, user) {
  const model = openRouterPlayerModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://synapticgm.app',
        'X-Title': 'SynapticGM-ai-player',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_tokens: 400,
        reasoning: { effort: 'low', exclude: true },
        response_format: { type: 'json_object' },
      }),
    });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OpenRouter HTTP ${res.status}: ${raw.slice(0, 220)}`);
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error('OpenRouter returned non-JSON');
  }
  return extractText(payload);
}

export async function askOpenRouterPlayer(packet) {
  const apiKey = openRouterKey();
  if (!apiKey) {
    return {
      blocked: 'missing_openrouter_key',
      action_kind: 'chip',
      action: '',
      thumb: 'down',
      comment: '',
      nonsense_options: false,
      future_leak: false,
      note: 'OPENROUTER_API_KEY missing',
      raw_ok: false,
    };
  }
  const chips = packet.chips || [];
  let text = await postChat(apiKey, buildJsonPlaytesterPrompt(packet));
  let decision = parsePlaytesterDecision(text, { chips });
  if (!decision.raw_ok) {
    text = await postChat(
      apiKey,
      `${buildJsonPlaytesterPrompt(packet)}\n\nYour last reply was not valid JSON. Reply with only the JSON object.`,
    );
    decision = parsePlaytesterDecision(text, { chips });
  }
  return { ...decision, model: openRouterPlayerModel() };
}
