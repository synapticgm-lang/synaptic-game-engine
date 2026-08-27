# DO NOT USE — Asset and Reference Exclusions

This file is a **release-blocking register** for SynapticGM. It records sources, licences, and practices that must not enter the default commercial asset path. It is operational guidance, **not legal advice**.

> **Default:** Generate original SynapticGM art. Use third-party material only when the exact file or uniformly licensed pack appears in `asset_index.csv` with `commercial_use=YES` and passes `intake_checklist.md`.

## Prohibited Sources and Practices

| Source or practice | Decision | Reason | What would change the decision |
| --- | --- | --- | --- |
| World of Warcraft interface files, screenshots, icons, frames, or extracted assets | **DO NOT USE** | Commercial-game UI is not a free design library; extraction or imitation creates copyright, trademark, trade-dress, and product-confusion risk. | Nothing in the normal intake path. A bespoke written licence reviewed by counsel would be a separate project. |
| AI Dungeon or NovelAI chrome, screenshots, CSS, icons, or close replicas | **DO NOT USE** | Competing hosted-product interface materials and distinctive presentation must not be cloned. | No ordinary exception. Use functional requirements only and design original materials. |
| Pinterest | **DO NOT USE AS A SOURCE** | Pins commonly detach images from authorship, licence, version, and original file pages. | A pin may inspire a search for the real primary source, but cannot be evidence or a download location. |
| ArtStation and DeviantArt | **DO NOT DOWNLOAD OR SCRAPE** | Portfolio display does not imply commercial reuse permission; creator identity alone is not a licence. | A separate direct creator agreement with exact asset, term, territory, media, modification, and commercial rights. |
| Google Images or other image-search thumbnails | **DO NOT USE AS A SOURCE** | Search results are discovery surfaces, not licence grants or provenance records. | Follow to a verified primary file page, then review that page independently. |
| Humble Bundle or RPG creator packs without exact per-file licence proof | **EXCLUDE** | Bundle purchase, “royalty free,” or a general marketing page may not establish proprietary-game commercial rights for each file or redistribution model. | Quote and archive exact per-file or uniformly scoped pack terms that permit the intended commercial shipped use; counsel review if wording is ambiguous. |
| OpenGameArt mixed packs or site-level assumptions | **EXCLUDE BY DEFAULT** | OpenGameArt hosts multiple licences; a page, pack, or archive may mix authors and terms. | Verify the exact file’s licence and author on its file page. CC0 or clear public-domain files may then enter as individual rows. |
| Wikimedia category pages, search pages, or Commons thumbnails without file-page verification | **EXCLUDE BY DEFAULT** | Categories can mix public domain, attribution, share-alike, non-free contextual material, and jurisdiction-specific claims. | Use the exact file page, confirm the licence tag and source, then record the direct original-file URL. Prefer clear PD/CC0. |
| “Free for streamers,” “free for personal use,” “educational use,” or “non-profit only” material | **DO NOT USE** | These restrictions do not cover a commercial hosted game. | A new commercial licence from the rights holder. |
| CC BY-NC or any non-commercial variant | **DO NOT USE** | SynapticGM is a commercial live product. | Re-licensing by the rights holder under commercial-compatible terms. |
| CC BY-SA, GPL-style art packs, or other share-alike media in the default asset path | **EXCLUDE BY DEFAULT** | Adaptation and distribution obligations can complicate proprietary derivatives, public asset delivery, and notices. | Record only in `share_alike_counsel_risk.csv`; require written counsel decision and an implementation-specific compliance plan. |
| “No attribution required” claims made only by a blog, forum, social post, or marketplace comment | **DO NOT RELY ON** | Secondary statements may be stale, incomplete, or outside the licensor’s authority. | Verify the official licence or creator-controlled page. |
| AI-generated third-party dumps with unknown training provenance or no rights warranty | **EXCLUDE** | A download licence does not resolve source-training, embedded-logo, or close-replica risk. | Founder-approved vendor terms, provenance disclosure, indemnity or warranty where appropriate, and visual review. Prefer SynapticGM’s own controlled generation path. |
| Assets containing brands, platform glyphs, console marks, logos, or distinctive product shapes merely because the pack is CC0 | **HOLD** | Copyright permission does not grant trademark or endorsement rights. | Select a genuinely generic subset or obtain separate trademark clearance. Kenney Input Prompts is excluded from `asset_index.csv` because the pack includes branded platform/console glyphs; any generic subset needs separate file-level review. |
| Unverified direct-download mirrors and re-upload archives | **DO NOT USE** | Mirrors can alter files, remove notices, introduce malware, or misstate the licence. | Download from the official creator or an explicitly authorized distribution channel. |
| Executables, installers, macros, or scripts bundled with visual assets | **DO NOT RUN** | Asset archives are untrusted until inspected; visual delivery does not require arbitrary code execution. | Security review in an isolated environment and a demonstrated production need. |

## Licensed-World and Series References

Player-facing, GM-ready, prompt-library, and generation-ready material must not name, imitate, or request the style of licensed series, games, publishers, studios, characters, worlds, or distinctive UI systems. This includes the titles and publishers listed in the founder brief. Internal research may discuss a generic **shape** only when clearly labelled `FOUNDER-ONLY`, and that wording must never enter a GM or generator column.

| Disallowed prompt pattern | Safe replacement |
| --- | --- |
| “Write like [series or author].” | Describe pace, viewpoint, sensory density, sentence length, stakes, and folklore ingredients in original terms. |
| “Make the UI look like [commercial game].” | Specify material, hierarchy, spacing, border weight, contrast, interaction state, and accessibility requirements. |
| “Use [studio] style.” | Specify medium, palette, line quality, lighting, composition, and public-domain visual traditions. |
| “Clone this screenshot.” | Extract functional needs, then create an original layout and original material system. |

## Permanent Live-Product Exclusions

Do not introduce any retired or unrelated world names, races, places, organisations, or setting vocabulary listed in the founder’s hard product law. Do not add a continuity model, critic model, fine-tune dataset, graph database, or multi-agent turn path under the guise of asset or prompt research. These are product-law constraints, not gaps.

## Escalation Rule

If a candidate feels valuable but cannot pass the table, record it in `gaps.md` with **INPUT REQUIRED** rather than importing it “temporarily.” Temporary art becomes production debt; an honest gap is safer than an unlicensed dependency.
