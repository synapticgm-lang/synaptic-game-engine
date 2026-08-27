#!/usr/bin/env python3
import json
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / 'source_drafts/draft_opener_families.json'
out = root / 'opener_pointer_examples.md'
results = json.loads(src.read_text())['results']
by_input = {r['input']: r for r in results}
order = [
    'isekai summon','late awaken','system apocalypse','tower','academy',
    'dungeon-core','void','PYOA crisis','tabletop haunted keep'
]

parts = ["""# Opener Pointer Examples

**Status:** **ORIGINAL SynapticGM** writer-training material.  
**Audience:** Internal writer and prompt-bank maintainers. These are page-one examples, not canned player cards and not UI chips.

> **How to use:** Treat each `SNAPSHOT FACTS` line as binding. Treat each `FLAIR` line as expendable sensory direction. A writer may vary the flair, rhythm, and imagery, but must not turn flair into new inventory, companions, ranks, exits, weather, time passage, or accepted objectives.

## Shared Rules

| Rule | Application |
| --- | --- |
| Viewpoint | Adult viewpoint in all examples; use a child viewpoint only when a real player biography explicitly says the character is a child. |
| Present cast | Only people named in `SNAPSHOT FACTS` may act or speak. |
| Objects | Only listed carried or visible objects may be put in hand or treated as available. |
| Pressure | End with a specific choice-pressure question that leaves agency intact. |
| Originality | Use generic folklore, original speculative systems, and ordinary architecture; never inject licensed titles, named styles, or copied world elements. |
| Provenance | Rumour stays rumour, offer stays open, and a task becomes accepted only through explicit player commitment. |
| Continuity | Time, weather, indoor/outdoor state, exits, crowd scale, and companions do not change merely for drama. |
"""]

for item in order:
    r = by_input[item]
    if r.get('error'):
        raise RuntimeError(r['error'])
    d = r['output']
    if d['example_count'] != 8:
        raise ValueError(f"Expected 8 examples for {item}")
    if d['section_markdown'].count('### ') != 8:
        raise ValueError(f"Heading count mismatch for {item}")
    section = d['section_markdown'].strip()
    # The generated section contains level-3 example headings; add a level-2 family heading.
    parts.append(f"\n## {d['section_title']}\n\n{section}\n")

parts.append("""
## Final Writer Check

Before using an opener as a pointer, confirm that every noun capable of changing state is either in `SNAPSHOT FACTS` or framed as uncertainty. Sensory verbs may be vivid; factual verbs must be grounded. If a sentence would require the engine to add an item, person, title, exit, elapsed interval, weather state, or quest acceptance, move that fact into the snapshot first or rewrite the sentence as possibility rather than truth.
""")
out.write_text('\n'.join(parts), encoding='utf-8')
print(out)
