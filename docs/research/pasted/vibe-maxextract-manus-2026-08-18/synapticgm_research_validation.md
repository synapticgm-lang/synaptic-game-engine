# Direct Research Validation

Validated on 2026-08-18.

## AI Dungeon memory documentation

AI Dungeon documents a finite-context constraint, the removal of older text as context fills, and a memory approach based on auto-summarization plus a retrieval-oriented Memory Bank. Its documentation states that generated memories summarize prior actions and that the system combines story text with instructions, plot essentials, author notes, and relevant story cards. This validates the comparative conclusion that summary/retrieval mechanisms are useful supporting context but should not be considered an authoritative game ledger in SynapticGM. Source: [AI Dungeon — All About the Memory System](https://help.aidungeon.com/faq/the-memory-system).

## Usability and repair guidance

Nielsen Norman Group’s usability heuristics call for prompt feedback about system status, clearly marked exits and undo for unwanted actions, and plain-language error messages that identify the problem and constructive next step. This validates compact state receipts, correction/undo paths, and in-world-but-clear repair language. Source: [NN/g — 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Design implication

SynapticGM should use summaries and retrieval as labelled, fallible context; preserve player correction and ledger state as authoritative; show meaningful updates through concise receipts; and make recovery from misinterpretations explicit and easy.
