/**
 * G-AIP fix (John 18:58): thumbs read-back by user_id + save_id + log_entry_id,
 * robust player-reply parsing (one targeted repair, harness error instead of an
 * automatic thumbs-down) and a non-zero exit verdict.
 * No model, no browser, no network: mocked fetch, page and Supabase client.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

type Row = Record<string, unknown> | null;
function mockClient(row: Row) {
  const eqs: Array<[string, unknown]> = [];
  const q = {
    select() { return q; },
    eq(col: string, val: unknown) { eqs.push([col, val]); return q; },
    limit() { return q; },
    async maybeSingle() {
      const want = Object.fromEntries(eqs);
      const hit = row && Object.entries(want).every(([k, v]) => row[k] === v);
      return { data: hit ? row : null, error: null };
    },
  };
  return {
    eqs,
    client: { from(table: string) { expect(table).toBe('gm_response_feedback'); return q; } },
  };
}

const ROW = {
  id: 'fb-9',
  user_id: 'u-1',
  save_id: 'save-uuid-1',
  log_entry_id: 'log-abc',
  turn_number: 4,
  feedback_type: 'negative',
  comment: 'loop',
};

describe('G-AIP fix: read-back by user_id + save_id + log_entry_id', () => {
  it('feedbackKeyFromUpsert reads the UI upsert body (object or array) and rejects partial rows', async () => {
    const { feedbackKeyFromUpsert } = await load('scripts/ai-player-browser/feedbackVerify.mjs');
    expect(feedbackKeyFromUpsert(ROW)).toMatchObject({ userId: 'u-1', saveId: 'save-uuid-1', logEntryId: 'log-abc' });
    expect(feedbackKeyFromUpsert([ROW])).toMatchObject({ logEntryId: 'log-abc' });
    expect(feedbackKeyFromUpsert({ ...ROW, log_entry_id: '' })).toBeNull();
    expect(feedbackKeyFromUpsert(null)).toBeNull();
  });

  it('verifyFeedbackByKey filters on exactly user_id, save_id and log_entry_id', async () => {
    const { verifyFeedbackByKey } = await load('scripts/ai-player-browser/feedbackVerify.mjs');
    const m = mockClient(ROW);
    const hit = await verifyFeedbackByKey(m.client, { userId: 'u-1', saveId: 'save-uuid-1', logEntryId: 'log-abc', feedbackType: 'negative' });
    expect(hit.verified).toBe(true);
    expect(m.eqs.map(([c]) => c)).toEqual(['user_id', 'save_id', 'log_entry_id']);
    expect(m.eqs.map(([c]) => c)).not.toContain('turn_number');
  });

  it('every miss logs a reason and the key it looked up', async () => {
    const { verifyFeedbackByKey } = await load('scripts/ai-player-browser/feedbackVerify.mjs');
    const miss = await verifyFeedbackByKey(mockClient(ROW).client, { userId: 'u-1', saveId: 'save-uuid-1', logEntryId: 'log-other' });
    expect(miss).toMatchObject({ verified: false, reason: 'not_found', lookup: { logEntryId: 'log-other' } });
    const noKey = await verifyFeedbackByKey(mockClient(ROW).client, { userId: 'u-1', saveId: 'save-uuid-1' });
    expect(noKey).toMatchObject({ verified: false, reason: 'no_feedback_key' });
    const wrongType = await verifyFeedbackByKey(mockClient(ROW).client, { userId: 'u-1', saveId: 'save-uuid-1', logEntryId: 'log-abc', feedbackType: 'positive' });
    expect(wrongType.verified).toBe(false);
    expect(wrongType.reason).toMatch(/^type_mismatch/);
  });

  it('verifyThumb uses the captured upsert key and the tester user id', async () => {
    const { verifyThumb } = await load('scripts/ai-player-browser/runVerdict.mjs');
    const ok = await verifyThumb(mockClient(ROW).client, { thumb: 'down', upsert: ROW }, 'u-1');
    expect(ok.verified).toBe(true);
    const none = await verifyThumb(mockClient(ROW).client, { thumb: 'down', upsert: null, upsertError: 'no_upsert_seen' }, 'u-1');
    expect(none).toMatchObject({ verified: false, reason: 'no_upsert_seen' });
    const other = await verifyThumb(mockClient(ROW).client, { thumb: 'down', upsert: ROW }, 'u-2');
    expect(other).toMatchObject({ verified: false, reason: 'user_mismatch' });
    const noClient = await verifyThumb(null, { thumb: 'down', upsert: ROW }, 'u-1');
    expect(noClient).toMatchObject({ verified: false, reason: 'no_client' });
  });

  it('submitThumb captures the UI gm_response_feedback POST response', async () => {
    const { submitThumb } = await load('scripts/ai-player-browser/gameTab.mjs');
    let predicateOk: boolean | null = null;
    const page = {
      async evaluate() { return true; },
      waitForResponse(pred: (r: unknown) => boolean) {
        const res = {
          url: () => 'https://x.supabase.co/rest/v1/gm_response_feedback?on_conflict=user_id%2Csave_id%2Clog_entry_id&select=*',
          request: () => ({ method: () => 'POST' }),
          ok: () => true,
          status: () => 201,
          json: async () => ROW,
        };
        const get = { ...res, request: () => ({ method: () => 'GET' }) };
        predicateOk = pred(res) && !pred(get);
        return Promise.resolve(res);
      },
    };
    const out = await submitThumb(page, { thumb: 'down', comment: '' });
    expect(predicateOk).toBe(true);
    expect(out).toMatchObject({ ok: true, upsert: ROW, upsertError: null });
  });
});

describe('G-AIP fix: player reply parsing', () => {
  const prevKey = process.env.OPENROUTER_API_KEY;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (prevKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = prevKey;
  });

  it('tolerant parser takes the first valid JSON object from wrapped prose', async () => {
    const { parsePlaytesterDecision, firstDecisionObject } = await load('scripts/ai-player-browser/geminiTab.mjs');
    const raw = 'Sure. {"kind":"chip","action":"Give your name","reason":"start","thumb":"up"} done';
    expect(firstDecisionObject(raw)).toMatchObject({ action: 'Give your name' });
    const d = parsePlaytesterDecision(raw, { chips: ['Give your name'] });
    expect(d).toMatchObject({ raw_ok: true, action: 'Give your name', thumb: 'up' });
    expect(parsePlaytesterDecision('{"action":"Give your name","kind":"', { chips: [] }).raw_ok).toBe(false);
  });

  function chat(content: string, finish = 'stop') {
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }) };
  }

  it('truncated reply gets ONE minimal repair; request uses JSON mode and a cap above the reasoning budget', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const { askOpenRouterPlayer, PLAYER_MAX_TOKENS } = await load('scripts/ai-player-browser/openRouterPlayer.mjs');
    const bodies: Array<Record<string, any>> = [];
    const fetchMock = vi.fn(async (_u: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body));
      return bodies.length === 1
        ? chat('{"action":"Give your name","kind":"', 'length')
        : chat('{"action":"Give your name","kind":"chip","thumb":"up","reason":"fine"}');
    });
    vi.stubGlobal('fetch', fetchMock);
    const d = await askOpenRouterPlayer({ bibleId: 'summoned-pact', modeLabel: 'LitRPG', turn: 1, chips: ['Give your name'], recentActions: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(PLAYER_MAX_TOKENS).toBeGreaterThanOrEqual(2000);
    expect(bodies[0].max_tokens).toBe(PLAYER_MAX_TOKENS);
    expect(bodies[0].response_format).toEqual({ type: 'json_object' });
    const repair = String(bodies[1].messages.at(-1).content);
    expect(repair).toContain('{"action":"Give your name","kind":"');
    expect(repair.length).toBeLessThan(900);
    expect(d).toMatchObject({ raw_ok: true, repaired: true, action: 'Give your name', thumb: 'up' });
    expect(d.harnessError).toBeUndefined();
  });

  it('still unparseable after the repair -> harness error, no thumb and no action (never an auto thumbs-down)', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const { askOpenRouterPlayer } = await load('scripts/ai-player-browser/openRouterPlayer.mjs');
    vi.stubGlobal('fetch', vi.fn(async () => chat('', 'length')));
    const d = await askOpenRouterPlayer({ bibleId: 'summoned-pact', modeLabel: 'LitRPG', turn: 2, chips: ['A'], recentActions: [] });
    expect(d.harnessError).toBe('unparseable_player_reply');
    expect(d.thumb).toBeNull();
    expect(d.action).toBe('');
    expect(d.harnessDetail.finish).toEqual(['length', 'length']);
  });
});

describe('G-AIP fix: run verdict drives a non-zero exit', () => {
  it('fails on not-ok bibles, harness errors or unverified thumbs', async () => {
    const { runVerdict } = await load('scripts/ai-player-browser/runVerdict.mjs');
    expect(runVerdict([{ bibleId: 'a', ok: true, harnessErrors: 0, unverified: 0 }]).ok).toBe(true);
    expect(runVerdict([{ bibleId: 'a', ok: true, unverified: 5 }])).toMatchObject({ ok: false, problems: ['a:unverified=5'] });
    expect(runVerdict([{ bibleId: 'a', ok: true, harnessErrors: 1 }]).ok).toBe(false);
    expect(runVerdict([{ bibleId: 'a', ok: false, error: 'boom' }]).problems[0]).toBe('a:not_ok(boom)');
    expect(runVerdict([]).ok).toBe(false);
  });

  it('run.mjs exits 1 when the verdict fails', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync(resolve('scripts/ai-player-browser/run.mjs'), 'utf8');
    expect(src).toMatch(/if \(!verdict\.ok\) \{[\s\S]{0,200}process\.exit\(1\)/);
    expect(src).not.toMatch(/verifyFeedbackRow\(feedbackClient, \{ saveId, turn \}\)/);
  });
});

describe('G-AIP fix 2 (John 19:15): one vote per reply, no_reply, typed line must reach the game', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('shouldThumb: vote once per reply; no new reply = no_reply, not a vote', async () => {
    const { shouldThumb } = await load('scripts/ai-player-browser/runVerdict.mjs');
    expect(shouldThumb({ feedbacks: 1, votedFeedbacks: -1 })).toEqual({ vote: true, reason: null });
    expect(shouldThumb({ feedbacks: 3, votedFeedbacks: 3 })).toEqual({ vote: false, reason: 'already_voted' });
    expect(shouldThumb({ feedbacks: 4, votedFeedbacks: 3 }).vote).toBe(true);
    expect(shouldThumb({ feedbacks: 4, votedFeedbacks: 3, noNewReply: true })).toEqual({ vote: false, reason: 'no_reply' });
  });

  it('run.mjs: no second thumb on a timeout; every vote goes through voteOnce', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync(resolve('scripts/ai-player-browser/run.mjs'), 'utf8');
    expect(src.match(/pressThumbWithReason\(/g)?.length).toBe(1);
    expect(src).toMatch(/const voteOnce = async/);
    expect(src).not.toMatch(/timeout: no new GM story/);
  });

  // Fake DOM: page.evaluate runs the in-page function against these globals.
  function fakePage(opts: { covered?: boolean; acceptsSend?: boolean; typingWorks?: boolean; tipUpper?: boolean } = {}) {
    const ta: any = { value: '', disabled: false, contains: () => false, getBoundingClientRect: () => ({ x: 10, y: 10 }), focus() {} };
    const send: any = { disabled: false, click() { if (opts.acceptsSend !== false) ta.value = ''; } };
    ta.parentElement = { querySelector: () => send };
    let tipOpen = !!opts.tipUpper;
    const gotIt = { textContent: 'Got it', click() { tipOpen = false; } };
    const overlay = { tagName: 'DIV', className: 'fixed inset-0 z-[55]' };
    const doc = {
      querySelector: () => ta,
      querySelectorAll: (q: string) => (q === 'button' && tipOpen ? [gotIt] : []),
      get body() { return { textContent: tipOpen ? 'TIP SAVE TURNS WITH AUTO FIGHT Got it' : 'story', innerText: tipOpen ? 'SAVE TURNS WITH AUTO FIGHT' : 'story' }; },
      elementFromPoint: () => (opts.covered || tipOpen ? overlay : ta),
    };
    vi.stubGlobal('document', doc);
    return {
      ta,
      get tipOpen() { return tipOpen; },
      page: {
        $: async () => ta,
        evaluate: async (fn: (...a: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
        mouse: { click: async () => {} },
        keyboard: { down: async () => {}, up: async () => {}, press: async () => {} },
        createCDPSession: async () => ({ send: async (_m: string, p: { text: string }) => { if (opts.typingWorks !== false) ta.value = p.text; } }),
      },
    };
  }

  it('Auto Fight tip is found although CSS renders its heading in capitals (the no-reply root cause)', async () => {
    const { dismissAutoFightTip } = await load('scripts/ai-player-browser/gameTab.mjs');
    const f = fakePage({ tipUpper: true });
    expect(await dismissAutoFightTip(f.page)).toBe(true);
    expect(f.tipOpen).toBe(false);
  });

  it('typePlayerAction clears the tip, then confirms the game took the line', async () => {
    const { typePlayerAction } = await load('scripts/ai-player-browser/gameTab.mjs');
    const f = fakePage({ tipUpper: true });
    expect(await typePlayerAction(f.page, "What's in this kit?")).toEqual({ sent: true, reason: 'ok' });
  });

  it('typePlayerAction reports a covered box, a line that never entered, or a send that was not taken', async () => {
    const { typePlayerAction } = await load('scripts/ai-player-browser/gameTab.mjs');
    const covered = await typePlayerAction(fakePage({ covered: true }).page, 'open the bundle');
    expect(covered.sent).toBe(false);
    expect(covered.reason).toMatch(/^input_covered:div\.fixed/);
    expect(await typePlayerAction(fakePage({ typingWorks: false }).page, 'open the bundle')).toEqual({ sent: false, reason: 'text_not_entered' });
    expect(await typePlayerAction(fakePage({ acceptsSend: false }).page, 'open the bundle')).toEqual({ sent: false, reason: 'send_not_accepted' });
  }, 15000);
});
