/**
 * Multi lap 44 — the starter quest sits at the card place where its talk-stage giver stands, and still leads
 * the trip to its seed site (s79 #21); a speech line whose words name the person it would be pinned on is
 * not theirs ("She is a good woman, that Nell" is not Nell's); a quote closing on "?" that runs on in lowercase
 * keeps its sentence (`"Back again already?" while…`, s83 T18).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { storyChip } from '../../game/choiceRanking';
import { hubTravelTargets, questTravelSite } from '../../game/outdoorHubs';
import { mainQuestPlacePin } from '../../game/questPlay';
import { parseTokenBeat } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S79 = '2026-10-10T23-30-22-109Z_summoned-pact_cold-system_s79';
const FL151 = '2026-10-12T19-04-18-126Z_summoned-pact_cold-system_s151';
const S83 = '2026-10-11T07-32-23-189Z_summoned-pact_cold-system_s83';

let Q: Replay;
let F: Replay;
let T: Replay;
beforeAll(async () => {
  Q = new Replay(await replayWhole(S79));
  F = new Replay(await replayWhole(FL151));
  T = new Replay(await replayWhole(S83));
}, 900_000);

describe('replay bank m44 lap 44', () => {
  it('[s79 T2 | m44 quest given here, leads on] the starter sits at the card place and still leads to Cathedral Close', () => {
    const s = Q.after(2);
    const q = s.quests.find((x) => x.id === 'sp-quest-1')!;
    expect(q.location, 'given where its giver stands').toBe(s.currentLocation);
    expect(questTravelSite(q)).toBe('Cathedral Close');
    expect(mainQuestPlacePin(q), 'map pin is where it leads').toBe('Cathedral Close');
    expect(hubTravelTargets(s)[0], 'travel lists the quest site first').toBe('Cathedral Close');
    expect(storyChip(s)).not.toMatch(/^(?:Travel toward|Return to) the ledger stair/);
  });

  it('[fl151 T5,T6 | m44 speaker named in own words] a line naming Nell is not painted as Nell\'s', () => {
    const t5 = parseTokenBeat(String((F.at(5).telemetry as { writerRaw?: string }).writerRaw ?? ''))!;
    const about = t5.lines.find((l) => /that Nell/.test(l.text))!;
    expect(about.speaker_tok, '"She is a good woman, that Nell…" has no inferred speaker').toBeUndefined();
    const other = t5.lines.find((l) => /new decree/.test(l.text))!;
    expect(other.speaker_tok, 'a line that does not name her is still hers').toBe('t7');
    const t6 = parseTokenBeat(String((F.at(6).telemetry as { writerRaw?: string }).writerRaw ?? ''))!;
    expect(t6.lines.find((l) => /myself, Rudd/.test(l.text))?.speaker_tok).toBeUndefined();
    for (const n of [5, 6]) {
      expect(F.prose(n), `T${n}`).not.toMatch(/Nell(?: Rudd)? said, "[^"]*\b(?:Nell|Rudd)\b/);
    }
  });

  it('[s83 T18 | m44 quote runs on] "Back again already?" while… keeps its lowercase run-on', () => {
    expect(T.input(18)).toBe('Turn back toward Lowmarket');
    expect(T.prose(18)).toMatch(/"Back again already\?" while /);
    expect(T.prose(18)).not.toMatch(/[?!]"\s+While\b/);
  });
});
