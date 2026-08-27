# BECOMR Changelog

## v0.6 — Accounts + Cloud Sync
- Added Supabase email/password authentication.
- Added persistent auth session handling.
- Added an artifact-style sign in/sign up screen.
- Added cloud hydration on authenticated sessions.
- Added automatic local-to-cloud migration when the user has local progress but no cloud record.
- Added local mirror of cloud state for resilience.
- Added debounced automatic cloud writes.
- Added online/offline handling and retry-on-reconnect behavior.
- Added visible LOCAL / SYNCING / CLOUD SAVED / OFFLINE / SYNC ERROR status.
- Added sign-out controls in the masthead and Build screen.
- Added `.env.local.example` configured for the BECOMR Supabase project.
