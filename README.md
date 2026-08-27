# BECOMR v0.2

**BECOME CAPABLE.**

BECOMR is a real-life progression system built around one idea:

> Progress is not time spent. Progress is proof that you can do something you could not do before.

The product's defining visual is the **Compass Tree** — a living tree growing from the center of a compass, with the sun representing action and the moon representing reflection.

## Current experience

### COMMAND — What should I do now?
- Today's North / Boss Quest
- Daily Compass
- Capacity state
- Active paths
- Momentum, XP, and progression
- Proof requirements instead of generic checkboxes

### COMPASS — Where am I going?
- Living Compass Tree
- Sun, moon, roots, stars, firmament, and engraved compass
- Eight major paths
- Proven / Open / Sealed / Boss states
- Clickable path inspection
- Branch-growth motion

### TRIAL / PROOF — What counts as completion?
- Dedicated focus view
- Optional Par Time
- Explicit Proof Required
- Elapsed timer
- Evidence/result note
- XP only after the quest is Proven
- Proof ceremony and level-up detection

### ARCHIVE — What changed me?
- Structured nightly Save
- What became easier
- What resisted
- Where the Compass should point next
- Persistent transformation history
- Proven capability ledger

### BUILD — Who am I becoming?
- Personal Compass Tree seal
- Level / XP / Momentum
- Strongest Limbs
- Proven capabilities
- Earned and Sealed Marks

## Paths included in the personal beta
1. Developer
2. Musician
3. Creative Direction
4. Creator
5. Global Communicator
6. Entrepreneur
7. Athlete
8. Truth Seeker

## Design language
BECOMR uses an **ancient navigation instrument × modern operating system** aesthetic:
- Obsidian
- Antique gold
- Achievement amber
- Celestial ivory
- Engraved/cartographic linework
- Organic botanical forms
- Compass geometry
- Celestial symbolism
- Sparse modern interaction surfaces

The UI intentionally avoids excessive rounded SaaS cards and generic dashboard patterns.

## Run in GitHub Codespaces

```bash
npm install
npm run dev
```

Open the forwarded port `3000`.

## Production verification

```bash
npm run build
npm start
```

> Note: the ChatGPT build environment timed out while downloading npm dependencies, so the final production compile should be verified in Codespaces after upload. Do not use `npm audit fix --force`; address dependency changes intentionally.

## Deploy to Vercel
Import the GitHub repository into Vercel and use the default Next.js settings.

## Install on iPhone as a PWA
1. Deploy BECOMR.
2. Open the deployed URL in Safari.
3. Tap **Share**.
4. Tap **Add to Home Screen**.
5. Launch BECOMR from its icon.

## Current technical boundary
v0.2 is a **personal local-first beta**:
- no authentication yet
- no Supabase/database yet
- no AI-generated paths yet
- no public onboarding yet
- no native WidgetKit widget yet
- progress persists in browser `localStorage`

Those are deliberate later milestones after the core loop is tested.

## Product loop

**ORIENT → ACT → PROVE → GROW → REFLECT → REORIENT**

See `CHANGELOG.md` and `PHASE_NOTES.md` for the phase-by-phase design and technical decisions.
