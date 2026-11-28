# Credits — unconfirmed (for John)

Written 28 November 2026 (Europe/London) for brief 09. Items here are **not** guessed on the player Credits page. Confirm licence / grant text, then move each confirmed row into `src/legal/credits.ts` and delete it from this list.

## npm packages (runtime)

| Package | What we know | What is open |
|---|---|---|
| `@react-oauth/google` | `package.json` says MIT; used for Sign in with Google | No LICENSE file in the published package. Need the copyright holder line and full MIT grant text before a `notice` on the Credits page. |
| `@xenova/transformers` (bundled ONNX / Hugging Face models loaded at runtime) | Library itself is Apache-2.0 (credited). Models are fetched in-browser for story memory. | Which model id(s) ship or download in play, and each model's licence / NOTICE, are not confirmed from the Credits brief file list alone. |

Build tooling in `devDependencies` (Vite, Vitest, ESLint, TypeScript, Tailwind, Autoprefixer, PostCSS, `@types/*`, `vite-node`, `globals`, `typescript-eslint`, `@eslint/js`, `@vitejs/plugin-react`) is intentionally omitted from the player page. Confirm only if John wants them listed.

`puppeteer-core` is a `devDependency` (staff AI-player harness). Credited on the page for honesty; not a playtime dependency.

## Bundled files / folders under `public/` (names only)

| Path | What we know | What is open |
|---|---|---|
| `public/assets/images/` (e.g. `1785421156244~2 copy.png`) | Present in the tree | Provenance and licence unmapped. Looks like an unlabelled dump, not a named pack. |
| `public/backgrounds/` (`bg-landscape.png`, `bg-portrait.png`) | Title / home backgrounds | Author and licence not confirmed. |
| `public/game-logo.jpg`, `public/game_logo.jpg` | Site logos | Whether these are original SynapticGM art, commissioned, or third-party is not confirmed here. |
| `public/data/social-crisis-catalog.json` (+ schema) | Bundled JSON under `public/data/` | Whether this is original SynapticGM data or imported, and under what licence, is not confirmed here. |

Theme packs under `public/themes/*` and map textures under `public/maps/` are credited as SynapticGM original on the player page. If any file in those folders is actually a bought or third-party archive, move it to this list and remove the Original claim for that file.

## Mentioned 8 Nov, not found as named packs in `public/` folder names

| Item | Note |
|---|---|
| “Five npm package grant texts open” (8 Nov note) | React, react-dom, jsPDF, Supabase JS, and Lucide grant lines are now taken from each package’s LICENSE file and pasted on the Credits page. `@react-oauth/google` remains open (row above). |
| “24 asset archives unmapped” (8 Nov note) | No archive names appear as top-level `public/` folders. Likely offline / GameDev Market packs, or already flattened into `public/themes/*`. Need John’s map of archive → path → licence. |
| Free tabletop library credits (bot box) | Per brief 09: credits live on the bot box, not in this repo; library is not wired into the game yet — **do not credit on the player page until it is**. |

## Hosted APIs

Hosted AI rows (OpenRouter, DeepSeek, Flux, Gemini) stay on the Credits page as paid / hosted services. Confirm whether Gemini is still a live hosted writer path; do not invent a new licence line.
