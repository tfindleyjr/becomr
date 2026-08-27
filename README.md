# BECOMR v0.5 — Phases 12–15

This build moves BECOMR from a visually compelling prototype toward a real product system.

## Phase 12 — Data-driven progression
The Compass Tree no longer uses seeded percentages.

Each path now calculates:
- **Path XP** from Proven quests
- **Current node** from XP thresholds
- **Progress percentage** from real Path XP
- **Visual stage** from calculated progress

This means proving a quest changes the actual branch state.

## Phase 13 — Editable quests and paths
COMMAND now includes:
- `+ QUEST`
- `+ PATH`

Users can add custom quests with:
- path
- title
- Proof Required
- XP
- daily / weekly / boss type

Users can open new custom paths with:
- name
- glyph
- capability statement

This is the first step away from a hardcoded personal-only curriculum.

## Phase 14 — Weekly Bosses
There is now a dedicated **WEEKLY** realm.

It includes:
- active Weekly Bosses
- weekly completion score
- Proof requirements
- larger XP rewards
- per-path generation of a new Weekly Boss based on current progression

## Phase 15 — Supabase-ready persistence
v0.5 introduces a `StateStore` abstraction.

By default:
- BECOMR works immediately with browser `localStorage`.

If these variables exist:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

the app switches to `SupabaseStateStore`.

Files:
- `lib/storage.ts`
- `lib/supabase-store.ts`
- `supabase/schema.sql`
- `.env.example`

### Important
A Supabase project has **not** been created yet. The connected Supabase account currently has no projects. Creating one requires choosing the Supabase organization and confirming any applicable cost.

## Run
```bash
npm install
npm run dev
```

## Verify
```bash
npm run build
```
