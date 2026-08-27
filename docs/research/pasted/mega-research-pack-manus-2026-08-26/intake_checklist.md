# Third-Party Asset Intake Checklist

**Purpose:** This checklist is a release gate for every third-party file considered for SynapticGM. It is operational guidance, **not legal advice**. The product default remains **generate original art**; an indexed third-party asset is only a candidate, not an approval.

> **Release rule:** No file enters the repository, build pipeline, CDN, theme generator, marketing capture, or shipped bundle until a named reviewer can answer every required line with evidence stored beside the asset record.

## 1. Candidate Identity

| Check | Founder action | Pass evidence |
| --- | --- | --- |
| Stable asset identity | Record the exact asset name, creator or publisher, pack version, page URL, direct file URL, and retrieval date. | A completed `asset_index.csv` row and an internal asset ID. |
| Intended use | State whether the file will be used as an icon, UI chrome, background, texture, font, or optional sound. | A one-sentence use case naming the live screen or generation stage. |
| Existing-system check | Confirm that the need is not already served by generated theme materials, original inventory SVG glyphs, Lucide, Google Fonts, or original map assets. | A short `why third party` note. |
| Product fit | Review the asset at target size and in at least one live theme. | Screenshot or design review reference; if no screenshot exists, mark **INPUT REQUIRED**. |

## 2. Source and Provenance

| Check | Founder action | Pass evidence |
| --- | --- | --- |
| Primary page | Open the creator’s official file or pack page. Do not rely on a search result, mirror, repost, Pinterest pin, forum attachment, or asset aggregator. | Saved URL and retrieval date. |
| Per-file scope | Confirm the licence applies to the exact file or a uniformly licensed pack. Mixed-site or mixed-pack claims do not pass. | Quoted licence field or licence file tied to the exact asset. |
| Creator authority | Check whether the source says the work is original, commissioned, or contributed under terms that permit the stated licence. | Primary-source provenance statement where available. |
| Version lock | Record a checksum for the downloaded file and the pack/version at intake. | SHA-256 value and immutable internal filename. |
| No suspicious payload | Treat archives and binaries as untrusted. Inspect file types, reject executables or scripts not required by the asset, and scan archives before extraction. | Scan result and file inventory. |

## 3. Licence Gate

| Check | Pass condition | Failure action |
| --- | --- | --- |
| Commercial use | Exact licence permits commercial use in a proprietary shipped product. | `NO` or unclear means do not ship. |
| Attribution | Required credit text, link, placement, and version are known and implementable. | If unclear, keep out until resolved. |
| Share-alike | `NO` for the default asset path. | CC BY-SA or equivalent moves to `share_alike_counsel_risk.csv`; no implementation without counsel approval. |
| Non-commercial restriction | None. | CC BY-NC, personal-use, educational-only, streamer-only, or “free with no commercial use” is rejected. |
| Modification right | Permitted if SynapticGM will recolour, crop, tile, trace, animate, compress, or otherwise adapt it. | If modification is prohibited or unclear, do not transform or ship. |
| Redistribution | Terms are compatible with the way browser clients, source maps, public folders, downloadable builds, and CDNs expose files. | If raw-file exposure conflicts with terms, change the implementation or reject. |
| Notice preservation | All licence and copyright notices required by MIT, BSD, Apache, OFL, CC BY, or similar terms are included in the shipping credits and source notices. | Missing notice blocks release. |
| Revocation snapshot | Save the reviewed licence text or page capture and date. | If the current source conflicts with the snapshot, pause updates and review. |

## 4. Non-Copyright Rights

A copyright licence does not automatically clear **trademarks, logos, publicity rights, privacy rights, moral rights, cultural restrictions, or depicted property**. Run these checks even for CC0 or public-domain files.

| Check | Founder action | Pass condition |
| --- | --- | --- |
| Logos and brands | Inspect every glyph, prompt icon, texture, and background for platform marks, product shapes, signage, or protected symbols. | None present, or separately cleared in writing. |
| People and faces | Reject identifiable people unless releases and the intended commercial use are documented. | No identifiable person, or release on file. |
| Fictional IP resemblance | Compare against the prompt ban list and known commercial-game UI silhouettes. | No copied character, emblem, interface, or distinctive world element. |
| Cultural and religious symbols | Review context, audience, and modification plans. | Use is respectful, generic where intended, and not falsely presented as SynapticGM-originated tradition. |
| Location and property | Check visible artwork, murals, sculptures, interiors, or restricted property. | No unlicensed embedded work or restricted commercial depiction. |

## 5. Technical and Accessibility Gate

| Check | Founder action | Pass condition |
| --- | --- | --- |
| Format | Prefer inspectable, web-safe formats and avoid unnecessary embedded metadata. | File opens cleanly in the production pipeline. |
| Size and performance | Generate appropriate variants; do not ship an 8K source when a 1K or smaller derivative is enough. | Performance budget met on desktop and mobile. |
| Seam and scaling | Test textures at target tile size, zoom, and device pixel ratio. | No visible seams, moiré, or false geometric implication. |
| Readability | Test UI contrast, focus states, disabled states, and text over the asset. | WCAG review completed for the component, not merely the source image. |
| Kid Mode | Confirm no adult visual, frightening detail, sexualized form, gambling cue, or brand association leaks into Kid Mode. | `kid_ok` decision documented. |
| Theme distinctness | Confirm the asset does not make multiple kits look like recolours of one stock pack. | Material role and kit-specific transform documented. |

## 6. Repository and Release Controls

| Check | Founder action | Pass condition |
| --- | --- | --- |
| Immutable source folder | Store the untouched source separately from production derivatives. | Source and derivative paths are distinct. |
| Metadata sidecar | Add creator, source URL, direct URL, licence, retrieval date, checksum, modifications, reviewer, and approval date. | Sidecar committed with the asset. |
| Credits integration | Add required notice to the live credits surface and repository notice file. | Automated release check finds the credit. |
| Dependency owner | Assign a person responsible for future licence or source changes. | Named owner and review cadence. |
| Removal path | Document every screen, theme, bundle, cache, and generated derivative that uses the asset. | Asset can be removed without repository archaeology. |
| Final approval | A person other than the importer verifies the row and evidence. | Two-person sign-off for non-CC0/PD assets; one reviewer plus founder sign-off for CC0/PD. |

## 7. Decision Record

| Field | Value |
| --- | --- |
| Internal asset ID | **INPUT REQUIRED** |
| Decision | `APPROVE`, `REJECT`, or `HOLD` |
| Decision label | `EVIDENCED`, `PUBLICLY EVIDENCED`, `SPECULATIVE`, or `INPUT REQUIRED` |
| Reviewer | **INPUT REQUIRED** |
| Founder approver | **INPUT REQUIRED** |
| Approval date | **INPUT REQUIRED** |
| Production locations | **INPUT REQUIRED** |
| Required credits | **INPUT REQUIRED** |
| Removal owner | **INPUT REQUIRED** |

## Minimum Approval Standard

A row marked `commercial_use=YES` means the reviewed copyright licence permits commercial use; it does **not** mean the asset has passed SynapticGM’s visual-fit, trademark, privacy, security, accessibility, Kid Mode, performance, or release checks. Only a completed decision record changes a candidate into an approved production asset.
