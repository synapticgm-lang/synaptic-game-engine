# GM voice: Cozy Brutal (`cozy-brutal`)

**Date:** 2026-08-19  
**Status:** Live Settings profile (all modes) + LitRPG New Game voice card. Not a Tabletop New Game personality.

## What it is

Original SynapticGM narrator diction: punchy LitRPG prose, visceral high-stakes combat, casual modern inner voice, quick cut to slice-of-life after fights. Voice is **diction only** — ledger / authority firewall unchanged.

## Inspiration note (internal only)

Style brief inspired by a popular LitRPG novel’s cozy-brutal balance (close POV, thrill-seeking attitude, tactile progression). **Do not** put that novel’s title, author, or “emulate [book]” in player-facing UI, Settings blurbs, or prompt banks. Profile name and rails are SynapticGM-original.

## Where players pick it

- LitRPG New Game → **System / story voice** → **Cozy Brutal** (stamped on the save as `systemPersonality`).
- Settings → Narrative → **GM / System voice** → **Cozy Brutal** (Story RPG / PYOA; also LitRPG fallback for older saves with no stamp).

## Kid Mode

`formatGmVoiceForPrompt(..., { kidMode: true })` appends an extra rail: keep thrills and workout-energy combat; strip broken bones / burning flesh / graphic gore.
