# Admin Setup: GM Feedback Review

## Quick Start

The GM feedback review panel is ready but not yet mounted in the UI. Follow these steps to add it to the admin interface.

## Option 1: Add to Settings Modal (Recommended)

**File:** `src/components/SettingsModal.tsx`

1. Import the component:
```tsx
import { GmFeedbackReview } from './admin/GmFeedbackReview';
```

2. Add a new tab or section for admin users:
```tsx
// In the tabs array, add:
{ id: 'admin', label: 'Admin' }

// In the render section:
{activeTab === 'admin' && canShowTestLabUi({ email: accountEmail, subscriptionTier: draft.subscriptionTier }) && (
  <div className="space-y-6">
    <GmFeedbackReview />
  </div>
)}
```

## Option 2: Standalone Admin Page

**File:** `src/pages/Admin.tsx` (create if doesn't exist)

```tsx
import { GmFeedbackReview } from '@/components/admin/GmFeedbackReview';

export function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-100">Admin Console</h1>
        <GmFeedbackReview />
      </div>
    </div>
  );
}
```

## Accessing the Review Panel

Once mounted, admins will see:

- **All feedback** from all users (staff RLS policy)
- **Filters** for feedback type and game mode
- **Expandable cards** with full context
- **CSV export** button for external analysis

## Permissions

Only users with `is_staff_email()` returning true can:
- View all feedback in the admin panel
- See other users' feedback
- Export CSV data

Regular users can only:
- Submit feedback on their own games
- View/edit their own feedback
- Toggle their votes on/off

## Testing the Setup

1. **As a tester**: Play a game, rate some GM turns with comments
2. **As admin**: Navigate to the admin panel
3. **Verify**: You see the feedback in the list
4. **Test filters**: Switch between positive/negative/all
5. **Test export**: Download CSV and check format
6. **Test expansion**: Click cards to see full GM stories

## Database Queries (Manual)

If you need to query feedback directly:

```sql
-- All feedback with user emails
SELECT 
  f.*,
  p.email as user_email
FROM gm_response_feedback f
LEFT JOIN profiles p ON f.user_id = p.id
ORDER BY f.created_at DESC
LIMIT 100;

-- Feedback stats
SELECT 
  feedback_type,
  game_mode,
  COUNT(*) as count,
  COUNT(CASE WHEN comment IS NOT NULL THEN 1 END) as with_comments
FROM gm_response_feedback
GROUP BY feedback_type, game_mode
ORDER BY count DESC;

-- Recent negative feedback with comments
SELECT 
  turn_number,
  game_mode,
  bible_id,
  comment,
  LEFT(gm_story, 200) as story_preview
FROM gm_response_feedback
WHERE feedback_type = 'negative'
  AND comment IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
```

## CSV Export Format

The exported CSV includes these columns:
- ID, User ID, Save ID, Turn
- Feedback (positive/negative)
- Comment (if provided)
- Game Mode, Bible ID
- Created At
- GM Story (first 200 chars)
- Player Action (first 100 chars)

Import into Excel, Google Sheets, or analysis tools.

## Troubleshooting

**No feedback showing:**
- Check if migration 020 was applied: `npx supabase db push`
- Verify RLS policies are in place
- Confirm you're signed in as a staff member
- Check browser console for errors

**Can't export:**
- Verify there are records to export
- Check browser console for errors
- Try filtering to specific mode/type first

**Users can't submit:**
- Confirm Supabase is configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Check if user is signed in
- Verify RLS policies allow user insert
- Check for JavaScript errors in console
