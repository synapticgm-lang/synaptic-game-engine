# Testing and Deterministic Repair-Copy Notes

## VERIFIED findings

Vitest supports data-driven parameterized tests through `test.for`, object-based cases, file or inline snapshots, and custom serializers. Snapshot mismatches fail in CI by default rather than silently updating. These features fit a fixture design where the same canonical ledger object is rendered under multiple tone IDs and both semantic invariants and approved render output are tested. Sources: [Vitest — Writing Tests](https://vitest.dev/guide/learn/writing-tests.html) and [Vitest — Snapshot](https://vitest.dev/guide/snapshot).

NN/g recommends error messages that are visible, human-readable, concise, precise, constructive, non-blaming, and respectful of user effort. It specifically warns that humor can obstruct recovery and should be avoided in recurring errors. Source: [NN/g — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/).

NN/g’s error-message scoring rubric groups quality into visibility, communication, and efficiency; the communication dimension emphasizes readable language, precise problem statements, constructive advice, and non-blaming tone. Source: [NN/g — Error Messages Scoring Rubric](https://www.nngroup.com/articles/error-messages-scoring-rubric/).

## SynapticGM application

Use parameterized fixtures keyed by `fixture_id × tone_id × perspective × kid_mode`. Assert invariant hashes for StateTx and factual projections before evaluating prose distinctions. Snapshot only approved render segments, while machine-checking forbidden patterns, number preservation, entity-presence consistency, and Kid Mode gates. Status and repair chrome must state: **what happened, what did not change, and the next available action**. Humor is forbidden in repair, safety, payment, consent, and data-loss contexts.

## Citation-ready references

[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"
[12]: https://www.nngroup.com/articles/error-message-guidelines/ "Error-Message Guidelines — Nielsen Norman Group"
[13]: https://www.nngroup.com/articles/error-messages-scoring-rubric/ "An Error Messages Scoring Rubric — Nielsen Norman Group"
