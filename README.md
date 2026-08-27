# BECOMR v0.6 — Accounts + Cloud Sync

Phase 15 is now implemented end-to-end at the app layer.

## What v0.6 adds
- Email/password account creation
- Email/password sign in
- Persistent Supabase sessions
- Sign out
- Local-first state saving
- Automatic cloud saving
- Cloud restore on login
- Local-to-cloud migration on first successful login
- Offline fallback
- Debounced cloud writes
- Visible sync state:
  - LOCAL
  - SYNCING
  - CLOUD SAVED
  - OFFLINE
  - SYNC ERROR

## Supabase project
BECOMR is connected to:
`https://hzhxbjvzgnrrtrevhokt.supabase.co`

The production database already contains `public.user_state` with Row Level Security.

## Environment setup
Copy:

```bash
cp .env.local.example .env.local
```

The included `.env.local.example` contains the BECOMR project URL and the project's public publishable key.

`.env.local` is ignored by Git.

Restart Next.js after adding the variables:

```bash
rm -rf .next
npm run dev
```

## First sign-in migration
BECOMR always saves locally first.

When an authenticated user signs in:
1. BECOMR checks `user_state` in Supabase.
2. If a cloud record exists, cloud state wins and is mirrored locally.
3. If no cloud record exists but local state exists, the local build is uploaded to the user's cloud record.
4. If neither exists, the seed state is created in the cloud.

This prevents a first login from wiping existing local progress.

## Auth note
Depending on the Supabase Auth settings, new users may have to confirm their email before receiving a session. The UI handles this and tells them to check their email.

## Security
The `user_state` table uses RLS policies based on `auth.uid() = user_id`, so authenticated users cannot read or overwrite another user's BECOMR state.

## Run
```bash
npm install
cp .env.local.example .env.local
npm run build
npm run dev
```

## Next phase
Phase 16 — AI Progression Engine:
- goal → generated Path
- node/prerequisite generation
- context-aware next Trials
- Weekly Boss generation
- difficulty adaptation from Proof + Archive
- AI operating behind the Compass rather than as a generic chatbot
