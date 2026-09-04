/**
 * Batch 02o — Hangul/Thai empty-GM + token-salad commit (4×4 T30).
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { isTokenSaladLeak } from './beatCommitGate';
import { extractChatCompletionText, hasHanScript } from './openRouterChat';

describe('Batch 02o stamps', () => {
  it('HUD and BUILD are 2026-09-02o and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02o');
    expect(BUILD_STAMP).toBe('2026-09-02o');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02o — script empty + salad commit', () => {
  it('treats Hangul and Thai as empty-GM (Han path), not only CJK Unified', () => {
    expect(hasHanScript('你好世界')).toBe(true);
    expect(hasHanScript('흙 담니까? 왓 ㅋㅋ')).toBe(true);
    expect(hasHanScript('นำเสนอเพียงข้อความบรรยาย')).toBe(true);
    expect(hasHanScript('The rain drums the awning while Wren watches.')).toBe(false);
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: '흙 담니까? 왓 ㅋㅋ Consulting the FULL 59-line conversation log' } }],
      }),
    ).toBe('');
  });

  it('rejects conversation-log dump and glued ikuha nonce, keeps clean prose', () => {
    expect(
      isTokenSaladLeak(
        '흙 담니까? 왓 ㅋㅋ ====== Consulting the FULL 59-line conversation log (17K tokens above) is a forever process. Respond in the following exact XML structure',
      ),
    ).toBe(true);
    expect(isTokenSaladLeak("a thread tied beneath your sternum at the circle's heartikuha.")).toBe(true);
    expect(isTokenSaladLeak('you say carefullyikuha. "You talk like the mill\'s about to start."')).toBe(true);
    expect(isTokenSaladLeak('Rain drums the awning while the fence watches.')).toBe(false);
  });
});
