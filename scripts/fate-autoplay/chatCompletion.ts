/**
 * Shared OpenAI-compatible chat helper for autoplay critic / patcher.
 * Batch D: retry on 429 / rate_limit / DNS with backoff (do not poison ladder).
 * Dual free: on 429, try alternateModels (m3-free <-> m2.7-free) before failing.
 */
export async function chatCompletion(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Max attempts including the first (default 3). */
  maxAttempts?: number;
  /** Free Gateway alternates to try after 429 (never paid OpenRouter). */
  alternateModels?: string[];
}): Promise<string> {
  const base = opts.baseUrl.replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  // Free Gateway: default 5 attempts so m3↔m2.7 can rotate then cool down.
  const maxAttempts = Math.max(1, Math.min(6, opts.maxAttempts ?? 5));
  const modelQueue = [opts.model, ...(opts.alternateModels ?? [])].filter(
    (m, i, a) => !!m && a.indexOf(m) === i
  );
  let modelIdx = 0;
  let model = modelQueue[0];
  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 180_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 8192,
          messages: [
            { role: 'system', content: opts.system },
            { role: 'user', content: opts.user },
          ],
        }),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        const retryable =
          res.status === 429 ||
          res.status === 503 ||
          /rate[_ ]?limit|too many requests/i.test(errBody);
        const err = new Error(`chat ${model} HTTP ${res.status}: ${errBody.slice(0, 500)}`);
        if (retryable && attempt < maxAttempts) {
          if (res.status === 429 && modelIdx + 1 < modelQueue.length) {
            const prev = model;
            modelIdx += 1;
            model = modelQueue[modelIdx]!;
            console.warn(`[chatCompletion] 429 on ${prev} — rotate to free alternate ${model}`);
          } else if (res.status === 429 && modelQueue.length > 1) {
            // Both free models already tried — flip back to the other for cool-down retry.
            modelIdx = (modelIdx + 1) % modelQueue.length;
            model = modelQueue[modelIdx]!;
            console.warn(`[chatCompletion] 429 — flip free rotate to ${model}`);
          }
          const retryAfter = Number(res.headers.get('retry-after') || 0);
          // Strong free-tier cooldown: 20s, 45s, 90s, 150s… (was 2s/8s — too short for Gateway).
          const freeBackoff = 15_000 + 15_000 * attempt * attempt;
          const waitMs = Math.max(retryAfter > 0 ? retryAfter * 1000 : 0, freeBackoff);
          console.warn(
            `[chatCompletion] ${res.status} attempt ${attempt}/${maxAttempts} model=${model} — backoff ${waitMs}ms`
          );
          await sleep(waitMs);
          lastErr = err;
          continue;
        }
        throw err;
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastErr = err;
      const dns =
        /ENOTFOUND|EAI_AGAIN|getaddrinfo|DNS/i.test(err.message) ||
        /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(String((e as { cause?: unknown })?.cause ?? ''));
      const abort = /abort/i.test(err.message);
      if ((dns || abort) && attempt < maxAttempts) {
        const waitMs = dns ? 20_000 : 3000 * attempt;
        console.warn(
          `[chatCompletion] ${dns ? 'DNS' : 'abort'} attempt ${attempt}/${maxAttempts} — pause ${waitMs}ms`
        );
        await sleep(waitMs);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new Error('chatCompletion failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
