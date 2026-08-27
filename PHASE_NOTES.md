# BECOMR Phase Notes

## Product rule
BECOMR rewards demonstrated capability rather than the appearance of activity.

## Phase 4 — COMMAND
**Question answered:** What should I do now?

COMMAND reduces decision load. The user sees one dominant "Today’s North," a small number of active paths, available capacity, and proof requirements. The Daily Compass reinforces the product metaphor instead of behaving like a generic task dashboard.

## Phase 5 — COMPASS
**Question answered:** Where am I going?

The Compass Tree is the visual identity of the product. Direction originates at the compass; growth physically emerges from it. The eight paths are uneven because the long-term goal is for each user's tree to become biographical rather than symmetrical.

## Phase 6 — QUEST / PROOF
**Question answered:** What does it mean to actually finish something?

A quest is no longer completed by tapping a checkbox. An open quest enters a Trial. The user can set an optional Par Time, begin the attempt, and then record the evidence/result that proves the objective was achieved. Only then is XP awarded.

### Core interaction state
1. **Open** — the user can attempt the quest.
2. **Trial started** — the user is actively attempting it.
3. **Proof submitted** — the user records the result/evidence.
4. **Proven** — XP is awarded and progress is stored.

### Why Par Time is optional
Time pressure can make a challenge engaging, but BECOMR is not a time-tracking product. If a 30-minute quest takes 52 minutes and the capability is demonstrated, the quest still succeeds.

### Current technical compromise
v0.2 is still a personal prototype, so proof is stored as a simple text note in `localStorage`. Later versions can support numeric proof, links, photos/video, uploaded files, automated validations, and AI-assisted interpretation.

## Phase 7 — ARCHIVE / BUILD
**Questions answered:** What changed me? Who am I becoming?

ARCHIVE is deliberately not a chronological task feed. A Save captures three things that matter for future progression: a capability that became easier, the point of resistance, and the next bearing. These entries persist locally and form a personal transformation timeline.

BUILD is the user's real-world character sheet. Instead of cosmetic character attributes, it surfaces proven capabilities, strongest skill paths, Momentum, XP, and Marks. The Compass Tree seal acts as the user's identity symbol and will become increasingly personalized in later versions.

### Current data model
`ArchiveEntry` stores:
- `note`: what became easier
- `resistance`: what resisted the user
- `next`: where the Compass should point next
- `path`: the paths represented by current proof
- `xp`: XP represented by the day's proven quests

For the personal prototype this remains in `localStorage`. A database-backed event history will replace it before public multi-user release.

## Phase 8 — Motion + Feedback
Motion is treated as meaning, not decoration. Celestial motion represents a living navigation instrument; tree drawing represents growth; Mark inscription represents persistent identity; and the Proof Ceremony creates a deliberate moment between real-world achievement and app progression. The UI avoids constant large movement and includes `prefers-reduced-motion` fallbacks.

## Phase 9 — High-Fidelity Polish
**Question answered:** Does every part of BECOMR feel authored by the same design system?

Phase 9 intentionally adds no major product concept. It removes visual habits associated with generic AI/SaaS interfaces: excessive rounded containers, glass cards, uniform boxed sections, and component-library geometry. Information is instead separated with engraved rules, open composition, compass-derived circles and markers, restrained material contrast, and deliberate serif/sans hierarchy.

The visual rule is now: ornamental density is reserved for emotional moments (Compass Tree, Bosses, Marks, Proof ceremonies), while everyday reading and interaction stay sparse and precise. The result should feel like a navigational artifact first and a conventional dashboard second.


## Phase 10 — Consolidation
**Question answered:** Is there now one coherent build that represents the BECOMR identity?

Phase 10 does not introduce a new product mechanic. It freezes the current visual/interaction direction into one testable v0.2 checkpoint. The purpose is to let the personal beta be judged as a complete experience before authentication, Supabase, AI-generated paths, native widgets, or public onboarding add architectural complexity.

### v0.2 core loop
1. **ORIENT** in Command and the Daily Compass.
2. **ACT** by entering a Trial.
3. **PROVE** the capability with an explicit result or note.
4. **GROW** through XP, Marks, and Compass Tree progression.
5. **REFLECT** in Archive.
6. **REORIENT** by setting the next bearing.

### Technical boundary
v0.2 is intentionally local-first. It uses browser `localStorage` so the product can be used immediately without accounts. Before a public beta with multiple users, progress events should move to a real database with authentication and server-side persistence.
