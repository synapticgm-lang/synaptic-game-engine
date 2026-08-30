/**
 * Shared OpenAI-compatible chat helper for autoplay critic / patcher.
 * Batch D: retry on 429 / rate_limit / DNS with backoff (do not poison ladder).
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
}): Promise<string> {
  const base = opts.baseUrl.replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const maxAttempts = Math.max(1, Math.min(5, opts.maxAttempts ?? 3));
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
          model: opts.model,
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
        const err = new Error(`chat ${opts.model} HTTP ${res.status}: ${errBody.slice(0, 500)}`);
        if (retryable && attempt < maxAttempts) {
          const retryAfter = Number(res.headers.get('retry-after') || 0);
          const waitMs = Math.max(
            retryAfter > 0 ? retryAfter * 1000 : 0,
            2000 * attempt * attempt
          );
          console.warn(
            `[chatCompletion] ${res.status} attempt ${attempt}/${maxAttempts} — backoff ${waitMs}ms`
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
