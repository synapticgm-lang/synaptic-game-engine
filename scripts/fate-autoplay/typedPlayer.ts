/**
 * Typed-input mix for autoplay (`--typed-mix <pct>`): on about <pct>% of turns an AI player model writes the
 * line the human would type (usually several things in one reply, a few odd on purpose); the rest are the
 * normal chip picks. Seeded and deterministic in WHICH turns are typed; the model text is live.
 * Cost / tokens / time of every player call land on the turn row (`typedPlayer`) and in the run total.
 * Key: OPENROUTER_API_KEY_SYNAPTICGM, else VITE_OPENROUTER_API_KEY (the game's own key). Never the personal key.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mulberry32 } from '../../src/game/fatePick';
import type { GameState } from '../../src/game/types';

export type TypedPlayerTurn = {
  kind: 'chip' | 'typed' | 'odd';
  model?: string;
  ms?: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  costUsd?: number | null;
  line?: string;
  error?: string;
};

export type TypedPlayerOpts = {
  mixPct: number;
  seed: number;
  model?: string;
  apiKey?: string;
  /** File hand-off instead of a model call: write turn-N.context.md here, wait for turn-N.line.txt (a human or an agent is the player). */
  lineDir?: string;
  lineWaitMs?: number;
};

export const DEFAULT_TYPED_PLAYER_MODEL = 'qwen/qwen3.7-flash';

const SYSTEM = [
  'You play a human tester in a text roleplaying game. Reply with ONLY the single line the player types - no quotes, no labels, no explanation.',
  'First person intent, one to three sentences, plain words, like a real player typing fast.',
  'Never mention game rules, dice, numbers, stats or the word "roll". Never write what happens next, only what your character does or says.',
].join(' ');

const STYLES = {
  typed: [
    'COMBINE two or three things in one reply: a physical action plus spoken words to someone present (an ally or a foe), for example a move while shouting an order or a taunt.',
    'COMBINE an action with a question to someone present, plus a small second action.',
    'Do something with an item or the surroundings while talking to a person who is present, in one sentence.',
  ],
  odd: [
    'Do something odd, off-script or unexpected that a mischievous player might try (not abusive, not meta). It must still be something your character does or says.',
    'Try something silly or clever that the story did not offer, and add a spoken line.',
  ],
};

export function pickTypedKind(rng: () => number, mixPct: number): 'chip' | 'typed' | 'odd' {
  if (rng() * 100 >= mixPct) return 'chip';
  return rng() < 0.2 ? 'odd' : 'typed';
}

function lastGm(state: GameState): string {
  const log = (state.log ?? []) as Array<{ role?: string; content?: string }>;
  for (let i = log.length - 1; i >= 0; i--) if (log[i]?.role === 'gm' && log[i]?.content) return String(log[i]!.content);
  return '';
}

export function createTypedPlayer(opts: TypedPlayerOpts) {
  const rng = mulberry32((opts.seed ^ 0x7e57ed) >>> 0);
  const model = opts.model || process.env.SGM_TYPED_PLAYER_MODEL || DEFAULT_TYPED_PLAYER_MODEL;
  const apiKey = opts.apiKey || process.env.OPENROUTER_API_KEY_SYNAPTICGM || process.env.VITE_OPENROUTER_API_KEY || '';
  const totals = { calls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, typed: 0, odd: 0, chip: 0, errors: 0 };
  return {
    model,
    totals,
    async decide(ctx: { turnIndex: number; state: GameState; prevChips?: string[]; recent?: string[] }): Promise<{
      input?: string;
      meta: TypedPlayerTurn;
    }> {
      const kind = pickTypedKind(rng, opts.mixPct);
      const styleSet = kind === 'odd' ? STYLES.odd : STYLES.typed;
      const style = styleSet[Math.floor(rng() * styleSet.length)]!;
      if (kind === 'chip') {
        totals.chip++;
        return { meta: { kind } };
      }
      if (!apiKey) {
        totals.errors++;
        return { meta: { kind, error: 'no OpenRouter key for typed player; falling back to chip pick' } };
      }
      const st = ctx.state;
      const allies = (st.companions ?? []).map((c) => c.name).filter(Boolean).join(', ');
      const user = [
        `Where you are: ${st.currentLocation ?? 'unknown'}.`,
        allies ? `Allies with you: ${allies}.` : 'No allies with you right now.',
        st.roundCombat ? 'You are in a fight right now.' : '',
        ctx.prevChips?.length ? `Buttons on screen (you may ignore them): ${ctx.prevChips.slice(0, 4).join(' / ')}` : '',
        ctx.recent?.length ? `Your last lines were: ${ctx.recent.slice(-3).join(' | ')} (do not repeat them).` : '',
        '',
        'The story so far (latest):',
        lastGm(st).slice(-1400),
        '',
        `Style for this turn: ${style}`,
        'Write the line now.',
      ]
        .filter((s) => s !== '')
        .join('\n');
      if (opts.lineDir) {
        mkdirSync(opts.lineDir, { recursive: true });
        const n = ctx.turnIndex + 1;
        const linePath = join(opts.lineDir, `turn-${n}.line.txt`);
        writeFileSync(join(opts.lineDir, `turn-${n}.context.md`), `# Turn ${n} (${kind})\n\n${SYSTEM}\n\n${user}\n`);
        const started0 = Date.now();
        const limit = opts.lineWaitMs ?? 900_000;
        while (!existsSync(linePath) && Date.now() - started0 < limit) await new Promise((r) => setTimeout(r, 1500));
        if (!existsSync(linePath)) {
          totals.errors++;
          return { meta: { kind, model: 'file-handoff', ms: Date.now() - started0, error: 'no line supplied in time; fell back to chip pick' } };
        }
        await new Promise((r) => setTimeout(r, 300));
        const line = readFileSync(linePath, 'utf8').replace(/\s+/g, ' ').trim().slice(0, 400);
        totals.calls++;
        if (kind === 'odd') totals.odd++;
        else totals.typed++;
        return { input: line, meta: { kind, model: 'file-handoff', ms: Date.now() - started0, costUsd: 0, line } };
      }
      const started = Date.now();
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(60_000),
          body: JSON.stringify({
            model,
            temperature: 0.9,
            max_tokens: 160,
            usage: { include: true },
            reasoning: { enabled: false },
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user', content: user },
            ],
          }),
        });
        if (!res.ok) {
          totals.errors++;
          return { meta: { kind, model, ms: Date.now() - started, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` } };
        }
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
        };
        const line = (data.choices?.[0]?.message?.content ?? '').replace(/^["'\s]+|["'\s]+$/g, '').replace(/\s+/g, ' ').slice(0, 400);
        const u = data.usage ?? {};
        totals.calls++;
        totals.tokensIn += u.prompt_tokens ?? 0;
        totals.tokensOut += u.completion_tokens ?? 0;
        totals.costUsd += u.cost ?? 0;
        const meta: TypedPlayerTurn = {
          kind,
          model,
          ms: Date.now() - started,
          tokensIn: u.prompt_tokens ?? null,
          tokensOut: u.completion_tokens ?? null,
          costUsd: u.cost ?? null,
          line,
        };
        if (!line) {
          totals.errors++;
          return { meta: { ...meta, error: 'empty player line; falling back to chip pick' } };
        }
        if (kind === 'odd') totals.odd++;
        else totals.typed++;
        return { input: line, meta };
      } catch (e) {
        totals.errors++;
        return { meta: { kind, model, ms: Date.now() - started, error: e instanceof Error ? e.message : String(e) } };
      }
    },
  };
}