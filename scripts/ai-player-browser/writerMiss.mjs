/**
 * Opt-in forced writer miss for one story turn.
 *
 * Env: AI_PLAYER_WRITER_MISS_TURN=<n> (1-based story turn after setup; unset/0 = off).
 * When armed, the next browser POST to …/functions/v1/gm-turn with mode:"turn"
 * is fulfilled as a real empty-writer reply (HTTP 502 + rawIssue:"empty"), matching
 * what gm-turn returns when the model gives no content. invokeGmProxy then returns
 * '' without throwing, so useGame paints honest Try again — not a network/timeout path.
 */

/** @param {NodeJS.ProcessEnv} [env] */
export function parseWriterMissTurn(env = process.env) {
  const raw = env.AI_PLAYER_WRITER_MISS_TURN;
  if (raw == null || String(raw).trim() === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.floor(n);
}

/**
 * @param {number} missTurn 1-based story turn, or 0 to disable
 */
export function createWriterMissController(missTurn) {
  const target = Number(missTurn) >= 1 ? Math.floor(Number(missTurn)) : 0;
  let installed = false;
  let armed = false;
  let fired = false;
  let noted = false;

  const isGmTurnPost = (req) => {
    if (req.method() !== 'POST') return false;
    const url = String(req.url() || '');
    return /\/functions\/v1\/gm-turn(?:\?|$)/.test(url);
  };

  const requestMode = (req) => {
    try {
      const body = JSON.parse(req.postData() || '{}');
      return String(body?.mode || '');
    } catch {
      return '';
    }
  };

  return {
    missTurn: target,
    get enabled() {
      return target >= 1;
    },
    get fired() {
      return fired;
    },
    /** Arm for the upcoming story turn number (storyTurnNo + 1). No-op after fire. */
    armForStoryTurn(storyTurn) {
      if (target < 1 || fired) return false;
      if (Number(storyTurn) !== target) {
        armed = false;
        return false;
      }
      armed = true;
      return true;
    },
    /**
     * One-shot play-log line after the forced miss turn committed.
     * @returns {string|null}
     */
    playLogNote(storyTurn) {
      if (!fired || noted) return null;
      if (Number(storyTurn) !== target) return null;
      noted = true;
      return (
        `T${target}: forced writer miss (AI_PLAYER_WRITER_MISS_TURN=${target}) — `
        + 'intercepted gm-turn mode:turn as 502 rawIssue=empty (honest Try again path)'
      );
    },
    /**
     * Install page request interception once. Safe when disabled (no-op).
     * @param {import('puppeteer-core').Page} page
     */
    async install(page) {
      if (target < 1 || installed) return;
      installed = true;
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        void (async () => {
          try {
            if (!armed || fired || !isGmTurnPost(req) || requestMode(req) !== 'turn') {
              await req.continue();
              return;
            }
            armed = false;
            fired = true;
            console.log(
              `[ai-player] forced writer miss: fulfilled gm-turn mode:turn as 502 rawIssue=empty (T${target})`,
            );
            await req.respond({
              status: 502,
              contentType: 'application/json',
              headers: {
                'access-control-allow-origin': '*',
                'access-control-allow-headers':
                  'authorization, x-client-info, apikey, content-type',
                'access-control-expose-headers': 'content-type',
              },
              // Same shape gm-turn uses when the model returns no content (see edge index).
              body: JSON.stringify({
                error: 'The AI provider returned no content.',
                rawIssue: 'empty',
              }),
            });
          } catch (err) {
            console.log(
              `[ai-player] writer-miss intercept error: ${err?.message || err}`,
            );
            try {
              await req.continue();
            } catch {
              /* already handled */
            }
          }
        })();
      });
    },
  };
}
