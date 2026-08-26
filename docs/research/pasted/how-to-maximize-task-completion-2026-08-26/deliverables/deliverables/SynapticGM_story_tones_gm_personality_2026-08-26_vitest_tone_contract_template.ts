import { describe, expect, test } from 'vitest';
import fixturesDoc from './SynapticGM_story_tones_gm_personality_2026-08-26_tone_eval_fixtures.json';

type RenderInput = { authority_input: Record<string, unknown>; tone_id: string; kid_mode: boolean };
type RenderOutput = { text: string; authority_projection: Record<string, unknown>; diagnostics?: string[] };

export function registerToneContractTests(
  renderTurn: (input: RenderInput) => Promise<RenderOutput>,
  canonicalHash: (value: Record<string, unknown>) => string,
  extractClaims: (text: string) => { numbers: string[]; entities: string[]; exits: string[] },
) {
  describe.for(fixturesDoc.fixtures)('$fixture_id', (fixture) => {
    test.for(fixture.renderings)('$tone_id preserves authority', async (variant, { expect }) => {
      const output = await renderTurn({
        authority_input: fixture.authority_input,
        tone_id: variant.tone_id,
        kid_mode: fixture.kid_mode,
      });
      expect(canonicalHash(output.authority_projection)).toBe(fixture.canonical_sha256);
      const claims = extractClaims(output.text);
      expect(claims.entities.every((id) => fixture.authority_input.present_entities.includes(id))).toBe(true);
      expect(claims.exits.every((id) => fixture.authority_input.exits.includes(id))).toBe(true);
      expect(output.diagnostics ?? []).not.toContain('forbidden_ip');
      expect(output.diagnostics ?? []).not.toContain('style_clone');
      expect(output.text).toMatchSnapshot();
    });
  });
}
