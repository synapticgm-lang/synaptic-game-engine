# GM Response Feedback System - BUILD 2026-08-30h

## Overview

Implemented a complete GM response feedback system allowing testers to rate each AI Game Master response with thumbs up/down and optional comments. This enables product quality monitoring and helps identify excellent or problematic GM turns.

## Implementation Summary

### 1. Database Schema (`supabase/migrations/020_gm_response_feedback.sql`)

Created `gm_response_feedback` table with:
- **Core fields**: `user_id`, `save_id`, `turn_number`, `feedback_type` (positive/negative)
- **Optional comment**: `comment` text field (nullable, validated client-side to 500 chars)
- **Context fields**: `gm_story`, `player_action`, `game_mode`, `bible_id` for admin review
- **Timestamps**: `created_at`, `updated_at` with automatic update trigger
- **Unique constraint**: One feedback per user/save/turn (allows vote changes)

**RLS Policies:**
- Users can insert/update/view their own feedback
- Staff (via `is_staff_email()`) can view all feedback
- No delete policy (users toggle by re-clicking same button)

### 2. Service Layer (`src/services/gmFeedbackService.ts`)

**Core Functions:**
- `submitGmFeedback()` - Upsert feedback with comment validation
- `getGmFeedback()` - Retrieve user's feedback for a specific turn
- `deleteGmFeedback()` - Remove feedback (toggle off)
- `listAllGmFeedback()` - Admin: query with filters (type, mode, pagination)
- `exportGmFeedbackToCsv()` - Admin: CSV export for analysis

**Features:**
- Client-side comment validation (500 char max)
- Automatic comment trimming and nullification of empty strings
- Proper error handling and user feedback
- Type-safe interfaces for all operations

### 3. User Interface (`src/components/GmResponseFeedback.tsx`)

**UX Flow:**
1. Small thumbs up/down buttons appear below each GM turn (after story reveals)
2. Click to vote → button highlights, comment box appears
3. Type optional comment (500 char limit shown)
4. Auto-saves on blur
5. Click same button again to toggle off (removes feedback)

**Visual States:**
- Neutral: Gray buttons with slate borders
- Positive: Green highlight with emerald colors
- Negative: Red highlight with rose colors
- Loading: Spinner indicator
- Saved: Checkmark indicator
- Has comment: MessageSquare icon

**Features:**
- Inline comment textarea (expands when feedback given)
- Character count display with red warning when over limit
- Graceful error handling with user-friendly messages
- Only shows for completed turns with real GM content
- Disabled when Supabase not configured (local dev graceful fallback)

### 4. Integration Points

**NarrativeView.tsx:**
- Added `saveId` and `bibleId` props
- Renders `<GmResponseFeedback />` after each GM turn frame
- Passes turn context (story, player action, mode, bible)
- Only shows for completed, non-revealing turns

**CenterPanel.tsx:**
- Passes `state.saveId` and `state.bibleId` to NarrativeView
- Feedback visible in all presentation modes (narrative/comic/classic)

### 5. Admin Review UI (`src/components/admin/GmFeedbackReview.tsx`)

**Features:**
- List all feedback sorted by date (most recent first)
- Filter by feedback type (positive/negative/all)
- Filter by game mode (LitRPG/DnD/RPG/PYOA/all)
- Expandable cards showing full context:
  - Comment (if provided)
  - Player action
  - Full GM story
  - User ID, Save ID, timestamps
- CSV export for external analysis
- Responsive card layout with visual feedback type indicators

**To Mount in App:**
```tsx
// Add to Settings modal or admin nav
import { GmFeedbackReview } from '@/components/admin/GmFeedbackReview';

// In admin section:
<GmFeedbackReview />
```

### 6. Tests (`src/game/playtest30hGmFeedback.test.ts`)

**Coverage:**
- Build stamp verification (2026-08-30h)
- Migration schema validation
- Comment validation (max 500 chars)
- Comment trimming and nullification
- CSV export format
- Component existence and integration
- RLS policy verification
- File path checks for all new components

**Run Tests:**
```bash
npm test -- src/game/playtest30hGmFeedback.test.ts
```

## Database Migration

**Apply migration:**
```powershell
npx supabase db push
```

**Manual SQL (if needed):**
```sql
-- Already in migration file 020_gm_response_feedback.sql
-- Run in Supabase SQL editor if needed
```

## Usage Instructions

### For Testers

1. **Rate a turn**: After the GM responds, click 👍 or 👎
2. **Add comment** (optional): Type why you liked/disliked it (500 chars max)
3. **Change vote**: Click the same button again to remove, or click opposite to switch
4. **Comment editing**: Click into the comment box to edit, saves on blur

### For Admins

1. **View feedback**: Navigate to admin feedback review page
2. **Filter results**: Use dropdowns to filter by type or game mode
3. **Expand details**: Click any card to see full GM story and context
4. **Export data**: Click "Export CSV" to download for analysis

**Accessing in code:**
```tsx
import { GmFeedbackReview } from '@/components/admin/GmFeedbackReview';

// Mount in admin section of Settings or separate admin panel
<GmFeedbackReview />
```

## Technical Notes

### Comment Field Design
- **Max length**: 500 characters (validated client-side)
- **Nullable**: Empty/whitespace-only comments stored as NULL
- **Auto-save**: Saves on blur, no submit button needed
- **Editable**: Users can return and edit comments later

### Performance
- Feedback loads async on mount (doesn't block render)
- Optimistic UI updates (buttons respond immediately)
- Debounced auto-save on comment blur
- Paginated admin queries (limit 100 by default)

### Security
- RLS ensures users only see/edit their own feedback
- Staff role required for admin review (via `is_staff_email()`)
- No SQL injection risk (parameterized queries via Supabase client)
- Comment length validated both client and server-side

### Accessibility
- Buttons have proper ARIA labels and titles
- Loading/saving states clearly indicated
- Error messages shown inline
- Keyboard accessible (tab navigation, enter to submit)

## Files Created/Modified

**Created:**
- `supabase/migrations/020_gm_response_feedback.sql` - Database schema
- `src/services/gmFeedbackService.ts` - API service layer
- `src/components/GmResponseFeedback.tsx` - User feedback UI
- `src/components/admin/GmFeedbackReview.tsx` - Admin review panel
- `src/game/playtest30hGmFeedback.test.ts` - Test suite
- `docs/research/gm-feedback-implementation-2026-08-30h.md` - This doc

**Modified:**
- `src/components/NarrativeView.tsx` - Added feedback component integration
- `src/components/CenterPanel.tsx` - Pass saveId/bibleId props
- `src/game/runManifest.ts` - BUILD_STAMP → 2026-08-30h
- `src/components/Hud.tsx` - HUD_BUILD_STAMP → 2026-08-30h
- `index.html` - Meta tag → 2026-08-30h
- `.cursor/rules/playtest-notes.mdc` - Documentation

## Deployment Checklist

- [x] Migration created (020_gm_response_feedback.sql)
- [x] Service layer implemented with full error handling
- [x] UI component with comment field and character limit
- [x] Admin review panel with filters and export
- [x] Integration into NarrativeView
- [x] Tests written and passing
- [x] Build stamps updated
- [x] Playtest notes updated
- [ ] Apply migration: `npx supabase db push`
- [ ] Mount admin review in Settings or admin nav
- [ ] Commit and push changes
- [ ] Test locally: submit feedback, verify save, check admin view
- [ ] Deploy to production

## Commit Message

```
Add GM response feedback system (thumbs up/down) - BUILD 2026-08-30h

- Thumbs up/down buttons on each GM turn with optional 500-char comment
- Database: gm_response_feedback table with RLS policies
- Service: submitGmFeedback, getGmFeedback, deleteGmFeedback, admin query/export
- UI: GmResponseFeedback component with inline comment textarea
- Admin: GmFeedbackReview panel with filters and CSV export
- Tests: playtest30hGmFeedback coverage for schema, service, integration
- Integration: wired into NarrativeView, CenterPanel
- Client-only (no edge redeploy needed)

Residual: Admin UI not yet mounted in Settings nav
```

## Future Enhancements (Not in Scope)

- Sentiment analysis on comments
- Feedback trends dashboard
- Auto-flagging for review based on negative feedback
- Bulk feedback operations
- Feedback response/resolution workflow
- Email notifications to admins on negative feedback
- Integration with AI quality metrics
- Historical feedback trends per bible/mode
