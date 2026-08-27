from pathlib import Path

root = Path('/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27')
deliverables = root / 'deliverables'
prefix = 'SynapticGM_score_boost_post_28c_2026-08-27'
out = deliverables / f'{prefix}_COMPLETE.md'

md_files = sorted(
    p for p in deliverables.glob(f'{prefix}_T*.md')
    if p.name != out.name
)

header = f'''# SynapticGM Post-28c Score Boost Research — Complete 29a Engineering Bundle

**Date:** 2026-08-27  
**Author:** Manus AI  
**Scope:** Live SynapticGM consumer application only; no WOF, licensed series, or second LLM critic path.

## Bundle navigation

| Deliverable | Content |
|---|---|
| T1 | Executive diagnosis and minimum-batch decision |
| T2 | Encounter Terminal FSM, receipts, caps, fallback, and edge cases |
| T3 | Entity allowlist and scrub-scope constitution |
| T4 | Encounter-aware ChoiceCompiler plus CSV edge matrix |
| T5 | STATUS prompt-leak firewall |
| T6 | NPC topic commitment and PYOA branch enforcement |
| T7 | Free T12 hook contract and per-mode pointer cards |
| T8 | Ranked implementation backlog in Markdown and CSV |
| T9 | Honest 29a/29b/three-batch score-ceiling model |
| T10 | Machine-readable evaluation-gate JSON Schema |
| T11 | Unknowns and evidence requests |
| T12 | Explicit rejects and non-goals |

## Companion structured files

| File | Purpose |
|---|---|
| `{prefix}_T04_choice_compiler_edge_matrix.csv` | Mode/phase legality and fallback matrix |
| `{prefix}_T08_ranked_implementation_backlog.csv` | Engineering work queue, dependencies, tests, rollout, and rollback |
| `{prefix}_T10_eval_harness_gates.schema.json` | Validation contract for resolution, branch, hook, replay, and contamination gates |
| `{prefix}_T02_encounter_terminal_fsm.mmd` | Editable Mermaid source |
| `{prefix}_T02_encounter_terminal_fsm.png` | Rendered state-machine diagram |

---
'''

parts = [header]
for path in md_files:
    parts.append(f'\n\n---\n\n<!-- BEGIN {path.name} -->\n\n')
    parts.append(path.read_text(encoding='utf-8').rstrip())
    parts.append(f'\n\n<!-- END {path.name} -->\n')

out.write_text(''.join(parts).rstrip() + '\n', encoding='utf-8')
print(out)
print(f'files={len(md_files)} bytes={out.stat().st_size}')
