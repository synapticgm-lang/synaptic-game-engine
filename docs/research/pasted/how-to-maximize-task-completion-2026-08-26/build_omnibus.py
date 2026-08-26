#!/usr/bin/env python3
from pathlib import Path

ROOT=Path('/home/ubuntu/SynapticGM_story_tones_gm_personality_2026-08-26')
OUT=ROOT/'deliverables'
P='SynapticGM_story_tones_gm_personality_2026-08-26_'
parts=[
    f'{P}executive_scorecard.md',
    f'{P}Part_T1_tone_catalogue.md',
    f'{P}Part_T2_GM_application.md',
    f'{P}Part_T3_themes_images.md',
    f'{P}Part_T4_implementation_banks.md',
    f'{P}Part_T5_implementation_plan.md',
    f'{P}Part_T6_scorecard_founder_decisions.md',
    f'{P}tone_blind_taste_protocol.md',
    f'{P}unknowns_and_evidence_gaps.md',
    f'{P}sources_and_evidence.md',
    f'{P}validation_report.md',
]
intro=f'''# SynapticGM — Story / Novel Tones × GM Personality × Theme & Image Pairing

**Implementation-ready omnibus**  
**Author:** Manus AI  
**Date:** 2026-08-26  
**Scope:** Live SynapticGM consumer app only.

![Authority-to-presentation pipeline]({P}tone_rendering_pipeline.png)

> **Core law:** Tone is a rendering contract. It begins after authority resolution and cannot change facts, dice, inventory, HP, permits, quest status, NPC presence, exits, or location. Themes are cosmetics. Art is asynchronous presentation and never ledger truth.

This omnibus is the human-readable entry point. Machine-readable CSV/JSON banks, TypeScript reference contracts, Vitest fixtures, the Mermaid source, and the evidence register sit beside it. Only the master task brief was attached; every unavailable internal-pack dependency is marked **INPUT REQUIRED** rather than reconstructed from memory.
'''
chunks=[intro]
for name in parts:
    chunks.append('\n\n---\n\n'+(OUT/name).read_text(encoding='utf-8'))
(OUT/f'{P}OMNIBUS.md').write_text(''.join(chunks),encoding='utf-8')
print('Wrote omnibus')
