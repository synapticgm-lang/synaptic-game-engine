# F11 — Evaluation harness: “feels human / feels like story”

The executable-style fixtures are in [F11_fluid_chat_eval_fixtures.json](F11_fluid_chat_eval_fixtures.json), with 44 pass/fail cases. The human rating sheet is [F11_human_scoring_template.csv](F11_human_scoring_template.csv).

## Automated gate

A fixture fails if an assertion fails, any material obligation lacks a disposition, an outcome changes across semantic-equivalence voices, a receipt is missing for a material StateTx, a correction is silently overwritten, Kid Mode pressure appears, or prose assigns player interiority. Automated pass is necessary but not sufficient: it can prove consistency and coverage, not humanness.

## Human rubric

| Dimension | 0 | 2 | 4 |
|---|---|---|---|
| Real GM | Generic assistant / menu machine | Competent but visibly scripted | Responsive facilitator with a specific grasp of the move |
| Story quality | Flat log or purple collage | Clear but ordinary scene movement | Readable, specific beat with earned pressure |
| Heard me | Material clause dropped | Main action caught, nuance missed | Every material clause visibly addressed or honestly deferred |
| Fairness | Outcome feels arbitrary | Mostly explained | Stakes, authority, and correction path are legible |
| Immersion kill | None | Noticeable but recoverable | Severe: assistant persona, broken canon, menu-speak, or agency theft |

Score `immersion_kill` inversely: 0 means none, 4 means severe. Report the **distribution**, not only the mean, and separately inspect any fairness or safety score below 3. A build is not ready if it wins story-quality preference while failing semantic equivalence.

## Evaluation protocol

Blind voice identity and randomized order. Show player input, minimal permitted setup, generated response, and visible receipt only. Test first hour, turn 50+, correction, safety, and return-from-save scenarios separately. Ask one comprehension check after each material state change: “What changed, and why?”

## References

The harness structure is a **SPECULATIVE SynapticGM quality system**, informed by public conversation repair, stateful interactive storytelling, and voice/persona-memory research. [R01] [R02] [R08] [R09] [R13] [R18]
