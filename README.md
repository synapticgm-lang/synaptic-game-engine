# ⚔️ Resonance — AI-Powered LitRPG / 5e Hybrid VTT

> A cross-platform virtual tabletop where an AI Game Master narrates your adventure, rolls dice, tracks stats, and paints comic-book scenes — all in real time.

---

## Table of Contents

- [Premise](#premise)
- [The Two Engine Modes](#the-two-engine-modes)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Campaign Lore Bibles](#campaign-lore-bibles)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [AI Provider Configuration](#ai-provider-configuration)
- [Database & Persistence](#database--persistence)
- [Roadmap](#roadmap)
- [License](#license)

---

## Premise

**Resonance** is a single-player virtual tabletop (VTT) application that fuses two RPG paradigms into one seamless experience:

1. **LitRPG Mode** — The world operates under a visible "System" interface. Blue stat panels, skill trees, XP bars, and item rarities are part of the world's fabric. The narrative acknowledges the game mechanics as in-universe reality (think *Solo Leveling*, *Dungeon Crawler Carl*, or *The Primal Hunter*).

2. **5e Fantasy Mode** — A traditional tabletop experience running on SRD 5.1-compatible mechanics: d20 resolution, difficulty classes, spell slots, death saving throws, advantage/disadvantage, and strict action economy. The AI GM enforces the rules while narrating the story.

You type what your character does. The AI Game Master responds with narrative text, structured system logs (stat changes, item drops, quest updates), dice roll results, and optional cinematic-scene image prompts. The app parses the GM's structured output and updates your character sheet, inventory, quest log, and encounter state automatically.

---

## The Two Engine Modes

### LitRPG Mode

- Visible stat panels and system notifications woven into the narrative
- 9 archetype options: AI Random, System Integration, Isekai, VRMMO Trap, Monster Reincarnation, Void Audience, Regression, Cyber-Neural Boot, Dungeon Transport
- Each archetype enforces unique rules (permadeath, evolution trees, cosmic favor, thermal mechanics, etc.)
- Comic-book visual mode with halftone overlays and multi-panel layouts

### 5e Fantasy Mode

- SRD 5.1-compatible mechanics (trademark-safe — never uses "D&D" or "Dungeon Master" in output)
- d20 resolution with standard DCs (Easy 10, Medium 15, Hard 20, Very Hard 25)
- Spell slots, cantrips, short/long rests, death saving throws
- Advantage/disadvantage system
- 7 opening archetypes: AI Custom, Caravan Escort, Prisoner/Shipwrecked, Patron's Quest, Under Siege, Cursed Manor, Wilderness Expedition

---

## Features

### Core Gameplay

- **AI Game Master** — Multi-provider AI dispatch (Gemini, OpenRouter, Anthropic, OpenAI, Groq, Ollama) with automatic retry, exponential backoff, and rate-limit handling
- **Action Input** — Free-text natural language input; the GM interprets and resolves your actions
- **Auto-Fight** — Optional auto-resolution of combat encounters with a confirmation modal for tough fights
- **Turn Rewind** — Step back one turn to undo a bad decision
- **Habit Learning** — The app tracks your frequently used actions and surfaces them as suggested choices in contextually appropriate moments (combat ends, room entries, etc.)

### Character System

- **3-Way Character Sheet** — A comprehensive character window with attributes (STR/DEX/CON/INT/WIS/CHA), HP/MP/SP pools, conditions, equipment slots, skills, companions, and summon entities
- **Character Progression** — Level-up tracking, XP curves, and skill tree display
- **Companions & Summons** — Manage party members, mounts, beasts, and summoned entities (pets, demons, minions, familiars) with their own HP, attack, defense, and abilities

### Inventory & Crafting

- **Container System** — Physical and magical containers with capacity limits, storage types (general vs. materials-only), and equipment slots
- **Item Rarity Tiers** — Common, Uncommon, Rare, Epic, Legendary
- **Crafting Materials** — Separate material inventory with source-type tracking
- **Salvage System** — Deconstruct items into crafting materials
- **Merchant Window** — Buy, sell, and trade with NPCs; includes a background trade-caravan simulation with safe vs. dangerous route risk/reward mechanics

### Combat & Encounters

- **Combat Encounter UI** — Active combat display with enemy target frame, HP, armor class, and initiative
- **Enemy Target Frame** — Dedicated enemy health and armor display
- **Auto-Fight Warning** — Confirmation modal showing enemy level vs. player level before auto-resolving

### Quality-of-Life Toolbars

- **Dice Tray Toolbar** — Floating toolbar with d4, d6, d8, d10, d12, d20, d100, and a custom formula builder (e.g., `2d6+3`)
- **Dice Formula Builder** — Construct complex dice formulas with modifiers
- **Action Bar** — Quick-access action shortcuts
- **Rewind Bar** — Turn rewind control

### Visual Modes

- **Classic Mode** — Traditional narrative text with background imagery
- **Comic Mode** — Multi-panel comic-book layout with speech bubbles, action overlays, and halftone art styles (manga screentone, dark-fantasy Mignola, cyberpunk cel, western)
- **Narrative Mode** — Clean text-focused presentation
- **Cinematic Scene Prompts** — The GM generates image prompts that are rendered into scene backgrounds

### World & Exploration

- **Dungeon Maps** — Fog-of-war dungeon map modal with node-based navigation, floor tracking, and procedural generation
- **Hex Coordinates** — 3D location system with hex coordinates (q, r), tier (1-4), elevation, and z-floor
- **Quest Journal** — Active, completed, failed, and hidden quests with objectives, rewards, and recommended levels
- **Lorebook** — Right-drawer lore card system tracking NPCs, locations, items, quests, and factions with keyword matching and visual anchors for image consistency
- **Relationship Tracker** — NPC relationships with status (Friendly/Hostile/Neutral/Rival/Loyal), affinity scores, tiers, and interaction history
- **Bestiary** — Threat assessment notes for encountered creatures
- **Shrine Log** — Discovered shrines and landmarks

### GM Library

- **Campaign Starters** — A carousel of 6 pre-built campaign lore bibles, each with premise, lore snippets, key NPCs, starter quests, and starter items
- **Map Template Gallery** — Procedural and hand-crafted dungeon map templates
- **Info Card Viewer** — Searchable reference for lore, NPCs, rules, and items

### Voice & Accessibility

- **Text-to-Speech** — GM narration can be read aloud
- **Speech-to-Text** — Voice input for player actions
- **Content Mode** — Kid-friendly vs. adult content filtering with PIN protection
- **GM Strictness** — Forgiving, Standard, or Hardcore difficulty
- **Stat Display Modes** — Inline, tap-to-reveal, or minimal stat verbosity

### Save System

- **Local Saves** — Browser localStorage persistence with auto-save indicator
- **Google Drive Sync** — Cloud save synchronization via Google OAuth
- **Guest Mode** — Play without a Google account; saves remain local
- **Export/Import** — Manual save export and import for backup or transfer
- **Auto-Resume** — Configurable post-login behavior to automatically resume your last game

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | 18.3 |
| **Language** | TypeScript | 5.5 |
| **Build Tool** | Vite | 5.4 |
| **Styling** | Tailwind CSS | 3.4 |
| **PostCSS** | Autoprefixer + PostCSS | — |
| **Icons** | lucide-react | 0.344 |
| **Auth** | @react-oauth/google | 0.13 |
| **Database** | @supabase/supabase-js | 2.57 |
| **Linting** | ESLint + typescript-eslint | 9 / 8 |

### Architecture Notes

- **Path Alias** — `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- **Code Splitting** — Heavy modals (Settings, API Setup, New Game, Quest Log, Dungeon Map, Debug, GM Library, Character Window, Merchant Window) are lazy-loaded via `React.lazy()` + `Suspense`
- **Bundle Optimization** — Manual chunks for `react-vendor` and `icons` in the Vite rollup config
- **State Management** — Centralized via a custom `useGame()` hook (no Redux/Zustand); all state flows from a single root hook
- **AI Service Layer** — Provider-agnostic dispatch with automatic fallback (Gemini → OpenRouter if key missing), retry with exponential backoff, and rate-limit detection

---

## Campaign Lore Bibles

Six deeply detailed, 100% original-IP campaign lore bibles live in `src/data/campaigns/`. Each contains a premise, 8 lore snippets, 6 key NPCs with story hooks, 4 starter quests with objectives and rewards, and 6 starter items.

| Bible | Mode | Difficulty | Premise |
|---|---|---|---|
| **System Integration** | LitRPG | Hardcore | Earth is forcibly integrated into a cosmic RPG system. Electronics fail, cities fracture into dungeon zones, permadeath is real. |
| **The Void Audience** | LitRPG | Hardcore | You die and negotiate stats/flaws with a cosmic entity before being reborn into a magical world where interdimensional beings watch your trial for entertainment. |
| **Dungeon Transport** | LitRPG | Hardcore | You step through a sealed portal into the Abyssal Spire — a dungeon of unknown depth with no exit. Only down. |
| **Fabled Legacy** | LitRPG | Easy | A no-system farmhand adventure in the village of Mossford. Choices ripple through the Weave — a consequence system with no numbers, only narrative impact. |
| **Shattered Coast** | 5e | Standard | The cliff-city of Saltmar discovers a dragon was sealed, not slain, 300 years ago — and the binding expires this year. Five guild heirlooms hold the key. |
| **Cursed Keep** | 5e | Standard | The Greymark family vanished from their keep 80 years ago. Now livestock are bloodless, graves are opening, and a 12-year-old girl is missing. |

---

## Project Structure

```
src/
├── App.tsx                     # Root: boot sequence, layout, modal orchestration
├── main.tsx                    # Entry point
├── index.css                   # Tailwind directives + global styles
│
├── components/                 # UI layer
│   ├── BootScreens.tsx         # Welcome splash, auth overlay, syncing splash
│   ├── MainMenu.tsx            # Start screen
│   ├── Hud.tsx                 # Top status bar
│   ├── CenterPanel.tsx         # Main narrative + action input
│   ├── LeftDrawer.tsx          # Character/inventory drawer
│   ├── RightDrawer.tsx         # Lorebook/relationships drawer
│   ├── CharacterWindow.tsx     # 3-way character sheet
│   ├── CharacterSheetView.tsx  # Detailed sheet rendering
│   ├── CharacterProgression.tsx# Level-up / skill tree
│   ├── CombatEncounter.tsx     # Combat UI
│   ├── EnemyTargetFrame.tsx    # Enemy health/armor
│   ├── MerchantWindow.tsx     # Buy/sell/trade
│   ├── GMLibrary.tsx           # Campaign carousel + info card viewer
│   ├── NewGameModal.tsx        # Campaign + character creation
│   ├── SettingsModal.tsx       # Full settings
│   ├── ApiSetupModal.tsx       # API key configuration
│   ├── QuestLogModal.tsx       # Quest journal
│   ├── DungeonMapModal.tsx     # Fog-of-war dungeon map
│   ├── DebugModal.tsx          # Developer debug panel
│   ├── SetupScreen.tsx         # Initial API setup
│   ├── WelcomeModal.tsx        # First-run welcome
│   ├── EngineOverlay.tsx       # Loading + error overlays
│   ├── AutoSaveIndicator.tsx   # Save status badge
│   ├── ToastStack.tsx          # Toast notifications
│   ├── UploadImport.tsx        # Save import UI
│   ├── CampaignSettings.tsx    # Campaign configuration
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── FormattedText.tsx       # Rich text renderer
│   ├── AutoFightWarningModal.tsx
│   ├── NarrativeView.tsx
│   │
│   ├── comic/                  # Comic-book visual mode
│   │   ├── ComicGrid.tsx       # Multi-panel layout
│   │   ├── SpeechBubble.tsx    # Comic speech bubbles
│   │   ├── NarrativeText.tsx   # Comic narrative text
│   │   └── ActionOverlay.tsx   # Action effect overlays
│   │
│   └── qol/                    # Quality-of-life toolbars
│       ├── DiceTrayToolbar.tsx
│       ├── DiceFormulaBuilder.tsx
│       ├── ActionBar.tsx
│       └── RewindBar.tsx
│
├── game/                       # Game engine (non-UI logic)
│   ├── useGame.ts              # Central state hook (state, saves, AI dispatch)
│   ├── gameEngine.ts           # Roll evaluation, caravan simulation
│   ├── aiService.ts            # Multi-provider AI dispatch + retry
│   ├── systemPrompt.ts         # System prompt builder
│   ├── parser.ts               # Tag extraction (stats, items, quests, panels)
│   ├── mapEngine.ts            # Dungeon generation, node movement, fog
│   ├── combat.ts               # Combat simulation, auto-fight
│   ├── inventory.ts            # Inventory management
│   ├── merchant.ts             # Merchant logic
│   ├── salvage.ts              # Item salvage/deconstruction
│   ├── imageGen.ts             # Image prompt moderation
│   ├── archetypes.ts           # 16 archetype definitions + rules + intro text
│   ├── defaults.ts             # Initial game state factory
│   ├── types.ts                # All TypeScript interfaces
│   ├── db.ts                   # localStorage save/load
│   ├── drive.ts                # Google Drive cloud sync
│   ├── logger.ts               # Logging infrastructure
│   ├── debugLogger.ts          # Debug logging
│   ├── useVoice.ts             # TTS/STT hooks
│   ├── useBgImage.ts           # Background image management
│   ├── useCallbackRef.ts       # Stable callback ref utility
│   └── bgCache.ts              # Background image cache
│
├── hooks/
│   └── useGameEngine.ts        # Comic panel rendering engine hook
│
├── services/
│   └── openRouterService.ts    # OpenRouter API client (comic panel generation)
│
├── data/
│   ├── mockGameData.ts         # Mock data for development
│   └── campaigns/              # Lore bibles
│       ├── index.ts            # Central export + helpers
│       ├── types.ts            # CampaignBible interface
│       ├── systemIntegration.ts
│       ├── voidAudience.ts
│       ├── dungeonTransport.ts
│       ├── fabledLegacy.ts
│       ├── shatteredCoast.ts
│       └── cursedKeep.ts
│
├── config/
│   └── comicStyles.ts          # Comic art style presets
│
├── types/
│   └── index.ts                # Shared types
│
└── utils/
    └── filterLogic.ts           # Input sanitization
```

---

## Local Setup

### Prerequisites

- **Node.js** 18+ (tested on 18.x and 20.x)
- **npm** 9+ (or pnpm/yarn — adjust commands accordingly)
- An AI provider API key (see [AI Provider Configuration](#ai-provider-configuration))

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/resonance-vtt.git
cd resonance-vtt

# Install dependencies
npm install
```

### Development

```bash
# Start the dev server (Vite)
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Production Build

```bash
# Type-check + build
npm run build

# Preview the production build locally
npm run preview
```

### Linting & Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checker (no emit)
npm run typecheck
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are prefixed with `VITE_` so Vite exposes them to the client:

```env
# Google OAuth client id (optional legacy Drive helper)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# AI Provider API Keys (at least one required)
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase — Google Auth + Game Ops Console telemetry (see .env.example)
# Set the same VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY on Vercel for production.
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> **Note:** Guest mode still works without signing in. Google sign-in uses Supabase Auth (`signInWithOAuth({ provider: 'google' })`). Telemetry (`telemetry_logs`, `ai_traffic`) is written when Supabase env vars are present. Apply `supabase/migrations/001_game_ops_telemetry.sql` once in the Supabase SQL editor.

---

## AI Provider Configuration

The app supports six AI providers. Configure them in the in-app **API Settings** modal (gear icon → API Settings) or via environment variables:

| Provider | Env Variable | Default Model | Notes |
|---|---|---|---|
| **Google Gemini** | `VITE_GEMINI_API_KEY` | `gemini-2.0-flash` | Default provider if no OpenRouter key |
| **OpenRouter** | `VITE_OPENROUTER_API_KEY` | `deepseek/deepseek-chat` | Aggregator — supports hundreds of models |
| **Anthropic** | API key in settings | Provider default | Claude models |
| **OpenAI** | API key in settings | Provider default | GPT models |
| **Groq** | API key in settings | Provider default | Fast inference |
| **Ollama** | API key in settings | Provider default | Local/self-hosted |

### Automatic Fallback

If the selected provider is Gemini but no Gemini key is configured, the app automatically falls back to OpenRouter (if an OpenRouter key exists). This ensures the app never dead-ends on a missing key.

### Custom Models

You can specify a custom model ID in the settings modal for any provider. For OpenRouter, this lets you pick from their full catalog (e.g., `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.1-70b-instruct`, etc.).

---

## Database & Persistence

### Current State

Game saves are currently stored in **browser localStorage** with optional **Google Drive cloud sync**. The Supabase client is installed and configured but no tables or migrations have been applied yet.

### Planned Migration

The project includes a planned migration to Supabase for cross-device persistence. The target schema is a `game_saves` table with:

- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users`, defaults to `auth.uid()`)
- `story_name`, `character_name` (text)
- `game_state` (jsonb — full serialized `GameState`)
- `engine_mode`, `campaign_archetype`, `campaign_bible_id` (text)
- `turn`, `level` (integer)
- `last_updated`, `created_at` (timestamptz)

With four owner-scoped RLS policies (SELECT, INSERT, UPDATE, DELETE) using `auth.uid() = user_id`.

---

## Roadmap

### Phase 1: Supabase Migration
- [ ] Create `game_saves` table with RLS policies
- [ ] Replace `db.ts` localStorage calls with Supabase client
- [ ] Keep localStorage as offline cache; sync when online
- [ ] Migrate user settings to Supabase

### Phase 2: Lore Bible Integration
- [ ] Add `campaignBibleId` field to `GameState`
- [ ] Inject campaign bible lore into `systemPrompt.ts`
- [ ] Wire GM Library campaign selection to `startNewGame()`
- [ ] Deploy edge function to proxy AI requests server-side (keep API keys off the client)

### Phase 3: Native Mobile
- [ ] PWA manifest + service worker for offline play
- [ ] Safe-area insets for notch devices
- [ ] Touch target audit (44px minimum)
- [ ] Capacitor wrapper for app store deployment
- [ ] Native speech plugins for TTS/STT
- [ ] Capacitor Google Auth plugin for native OAuth

---

## License

This project is proprietary. All campaign lore bibles, archetype rules, and narrative content are original IP. SRD 5.1 mechanics are used under the Open Gaming License v1.0a. No trademarked brand names ("Dungeons & Dragons", "D&D", "Dungeon Master") appear in AI-generated output.
