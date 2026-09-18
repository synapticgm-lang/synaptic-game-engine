/**
 * OpenRouter player-brain (decisions / thumbs / notes).
 * Game still plays in visible Chrome. Never logs the API key.
 *
 * HARD: default judge is google/gemini-2.5-pro.
 * Do not run a quality T10 on Flash. Flash is not the judge.
 */
import { buildPlaytesterPrompt, parsePlaytesterDecision } from './geminiTab.mjs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_PLAYER_MODEL = 'google/gemini-2.5-pro';

export function openRouterKey() {
  return (
    process.env.OPENROUTER_API_KEY
    || process.env.VITE_OPENROUTER_API_KEY
    || process.env.AUTOPLAY_OPENROUTER_API_KEY
    || ''
  ).trim();
}

export function openRouterPlayerModel() {
  const raw = (process.env.AI_PLAYER_MODEL || process.env.GEMINI_REVIEW_MODEL || DEFAULT_PLAYER_MODEL).trim();
  if (!raw || raw === 'gemini-2.5-pro' || raw === 'gemini-3.1-pro-preview') {
    return DEFAULT_PLAYER_MODEL;
  }
  if (raw === 'gemini-2.5-flash') return 'google/gemini-2.5-flash';
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
  'You are a person playing a browser text RPG — curious, impatient, and a bit stubborn.',
  'We pay for Gemini Pro so you play like a human, not a chip masher or a JSON parser.',
  'Return ONE JSON object and nothing else.',
  'Required keys: action_kind, action, thumb, comment, nonsense_options, future_leak, note.',
  'action_kind is "chip" or "type". thumb is "up" or "down".',
  'nonsense_options and future_leak are booleans.',
  'Play like a human in the room: speak to people, ask a follow-up, try a doorway, wait, leave, or do the next obvious thing.',
  'Chips are optional shortcuts. Do NOT prefer a chip just because it exists.',
  'If the only chip is Inspect the panel (or the same inspect/look you already used), TYPE a short natural line instead.',
  'Never click the same inspect/look/wait chip twice in a row. Never mash one leftover chip.',
  'Typed lines should sound like a player, 1–2 short sentences, in this scene — not a robot label.',
  'MUST vote thumb=down and nonsense_options=true if the GM beat is any of:',
  'system text as story (They have the name Jax. / The room waited. / name telegrams);',
  'looping stitch or the same paragraph as the last GM;',
  'combat resolving inside a talk/dialogue beat;',
  'STATUS/XP/Quest Unlocked chrome with no real story paragraph;',
  'already-told who/want reprint;',
  'a wordy padded essay / purple pile a human would skim;',
  'dull empty filler with no concrete HERE, action, or spoken want.',
  'UP only when it reads like a short interesting chapter beat: clear, spoken, one new thing, not a paragraph dump.',
  'If Who or Want was already answered this scene, IGNORE those chips. Type something new.',
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
        temperature: 0.85,
        max_tokens: 400,
        reasoning: { effort: 'medium', exclude: true },
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
