# PYOA spine v1 — Thornferry Road (2026-09-01)

Thin curated page graph for Fate-pick / ChoiceCompiler. AI still writes unique prose; structure is fixed.

| | |
|---|---|
| **Bible** | `thornferry-road` only |
| **Module** | `src/game/pyoaSpine.ts` |
| **Nodes** | 12 (`tf-landing` → road stops → `tf-gate` → 4 ending leaves) |
| **Major forks** | 3 (`tf-streets`, `tf-proof`, `tf-gate`) |
| **Endings** | `thornferry:mill-kept`, `sold-pell`, `burned`, `honest-delivery` |
| **Delay** | Wait once, then force a legal exit |
| **Persist** | `GameState.pyoaSpine` |

Other PYOA bibles keep B025 branch-lock / crisis behavior until a later densify pass.

Vitest: `playtest31rPyoaSpine`. Ship stamp: HUD `2026-08-31r` / BUILD `2026-08-31j`.
