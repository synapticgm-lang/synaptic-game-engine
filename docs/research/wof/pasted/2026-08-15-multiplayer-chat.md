# Pasted chat — 2026-08-15 WOF multiplayer dump

Source: John pasted another agent's reply into this chat.  
Do not implement. WOF only.

The agent said the full dump was written to `WOF_Multiplayer_Design_Dump.md` in **its** workspace. That file was never attached here. What follows is the **verbatim paste**.

---

626f6c742d63632d6167656e74I'll research the specific sources mentioned (Evennia turnbattle, Friends & Fables, StoryNexus, MMO hub-and-spoke), then write the full dump.I have enough material. Let me read the two existing project research docs to ensure I build on prior decisions, then write the full dump.I have enough research material. I'll write the full WOF design dump to a file and give you the key findings.Full design dump written to `WOF_Multiplayer_Design_Dump.md`. Key findings:

**Stop gate passed.** A 15-round 5-man dungeon with one shared narration paragraph per round costs ~$0.018 at GPT-4o Mini (under 2 cents). A 25-round 10-man raid costs ~$0.031. Raids are IN for v1 — but only with Mode A (one shared paragraph) or Mode C (no LLM mid-combat, phase-change announcements only). Mode B (N personal beats per round) is too expensive and rejected.

**First-ship cap: Tier 3 (shared hubs + instanced dungeons).** Players see each other in town hubs (presence + chat + async traces), but all combat happens in private instances. Strangers never merge into one fight. Hubs use per-player narration (idle players cost zero LLM calls); party dungeons use one shared narration call per round.

**Time model: ready-check + simultaneous round** for dungeons and raids. All players submit actions, code resolves at once, one narration call follows. 2–8s LLM latency is absorbed into the round wait. Sequential initiative and real-time combat are both rejected.

**Raid = phase graph, not more HP.** Recommended size: 10 players (two 5-man groups). The toy 3-phase script "Millstone Hollow" uses original mechanics (soak checks, interrupt windows, add spawns) with code flags — no licensed role names or boss mechanics.

**8 decisions left to John**, including: raid size (8 vs 10), lockout duration, friends-only vs public finder, scheduled vs persistent raids, hub NPC mortality, and whether raids get Mode A prose or stay Mode C (numbers only).

The full schema (PartyInstance, EncounterLedger, RaidEncounterScript, Phase, RoleFlag) and all decision tables are in the file.
