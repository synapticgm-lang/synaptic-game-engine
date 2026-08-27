# Direct Source Notes 02 — Adventure Controls and Child Privacy

**Access date:** 2026-08-18 (GMT+1)

| Target | Publicly evidenced behavior | Audit implication |
|---|---|---|
| NovelAI | Its Lorebook is a repository of supplemental information inserted into AI context when activation keys are found in recent context. Users can configure key matching, always-on entries, search range, token budgets, insertion order, and trimming. | **Verified product pattern:** Advanced users can exert extensive prompt-context control, but this is not a transactional game-state system. SynapticGM’s comparative win is not “more memory,” but a player-readable decision ledger that prevents narrative context from silently becoming fact. |
| NovelAI | It says subscriptions support server/compute upkeep. Its free trial has finite text/image/TTS generations; paid text/TTS can be unlimited under stated conditions, while image use relies on a replenishing paid credit currency (Anlas) and model/tier conditions. | **Verified monetization pattern:** Separate expensive image usage from narrative access; visible credit or rate mechanics can make cost allocation understandable. SynapticGM should not promise unlimited images in Free without a hard, transparent budget. |
| FTC COPPA guidance | The FTC states that COPPA applies to covered commercial child-directed online services and to certain general-audience services with actual knowledge. It identifies requirements around notice, verifiable parental consent (subject to exceptions), data minimization, parental access/deletion, security, retention, and not conditioning participation on unnecessary data. It warns that its FAQs are staff guidance and refers readers to the revised rule. | **COUNSEL boundary:** A “Kid Mode” filter alone is not a complete children’s product gate. Product, data, ads, account, age/knowledge, parental controls, third-party SDKs, retention, and escalation decisions require counsel before characterizing the service as child-directed or child-safe. |

## Explicit Non-Conclusion

This note does **not** conclude that SynapticGM is subject to COPPA, HIPAA, any particular age threshold, or any named jurisdiction’s rule. The supplied request does not identify jurisdiction, intended age audience, data flows, payment flow, app-store distribution, or whether the service is child-directed. These remain **COUNSEL / UNVERIFIED** decisions.

## Sources

[1]: https://docs.novelai.net/en/text/lorebook/ "NovelAI — Lorebook documentation (accessed 2026-08-18)"
[2]: https://docs.novelai.net/en/subscription/ "NovelAI — Subscription documentation (accessed 2026-08-18)"
[3]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions "FTC — Complying with COPPA: Frequently Asked Questions (accessed 2026-08-18)"
