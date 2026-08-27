# BECOMR Changelog

## Unreleased — v0.2 identity rebuild

### Phase 4 — COMMAND
- Replaced the generic dashboard with COMMAND.
- Added the Daily Compass and Today’s North hierarchy.
- Added capacity states: LOW / STEADY / HIGH.
- Reframed completion around proof rather than time spent.
- Added Momentum, day marks, XP engraving, and leisure gating.
- Replaced generic card stacking with open engraved layouts.

### Phase 5 — COMPASS TREE
- Replaced the placeholder vertical skill list with the Compass Tree.
- Added a living tree that grows directly from the compass center.
- Added sun, moon, firmament arcs, roots, stars, compass ticks, and botanical linework.
- Added eight clickable major paths with restrained material accents.
- Added OPEN / PROVEN / SEALED / BOSS node states.
- Added a path inspector and growth indicator.

### Phase 6 — QUEST / PROOF
- Added a dedicated full-screen Trial experience.
- Clicking an open quest now enters the Trial instead of instantly checking it off.
- Added optional Par Time, elapsed timer, and a Start Trial state.
- Added Proof Required copy as a first-class element.
- Added a proof/evidence note before a quest can be marked Proven.
- Proof notes persist in localStorage with the rest of the personal beta data.
- Boss Quest now opens the same proof ritual rather than using a standard checkbox interaction.

### Phase 7 — ARCHIVE / BUILD
- Rebuilt Archive as a transformation history rather than a journal placeholder.
- Added three-part nightly Save: what became easier, what resisted, and where the Compass points next.
- Added persistent Save inscriptions with date, active paths, proof XP, resistance, and next bearing.
- Added a Proven Capability ledger derived from completed Trials and their proof notes.
- Rebuilt Build as a real character sheet centered on demonstrated capability.
- Added a personal Compass Tree identity seal, strongest-path view, capability list, and Marks system.
- Added earned/sealed Marks including First Proof, Momentum VII, Five Proofs, and Boss Proven.

## Phase 8 — Motion + Feedback
- Added page-entry transitions across Command, Compass, Archive, and Build.
- Added living celestial motion: breathing sun, drifting moon, pulsing stars, and subtly seeking compass needles.
- Added draw-on animations for tree limbs and roots so the Compass Tree feels revealed rather than rendered.
- Added animated selected-path feedback in the Compass Tree and refreshed branch inspector transitions.
- Added XP shimmer and smoother progress-bar growth.
- Added Mark inscription feedback and Proven-state settling.
- Added a full-screen Proof Ceremony after quest completion, with a distinct Boss treatment and level-up message.
- Added reduced-motion support for accessibility.

## Phase 9 — High-Fidelity Polish
- Reworked the remaining generic dashboard geometry into open engraved layouts.
- Reduced rounded-card usage across Command, Compass, Archive, Build, and navigation.
- Tightened the ceremonial serif + precision UI typography hierarchy.
- Refined the obsidian / antique-gold / amber material system and reduced decorative color noise.
- Rebuilt the bottom navigation as a flat instrument rail with a directional active marker.
- Added authored corner marks, hairlines, compass-like rules, and restrained cartographic framing.
- Improved mobile hierarchy and spacing for narrow iPhone widths.
- Added consistent keyboard focus-visible states and preserved reduced-motion support.
- Refined Boss, path, Archive, Mark, and Build surfaces so they read as one visual artifact rather than separate UI components.


## Phase 10 — Consolidation / v0.2
- Consolidated Phases 4–9 into one GitHub-ready BECOMR v0.2 source package.
- Renamed package metadata to `becomr` and versioned the product as `0.2.0`.
- Added repository hygiene with `.gitignore`.
- Removed generated TypeScript build artifacts from the distributable package.
- Kept the personal-beta persistence model in `localStorage` intentionally; cloud accounts and database work remain a later milestone.
- Documented the current product loop: ORIENT → ACT → PROVE → GROW → REFLECT → REORIENT.
- Prepared v0.2 as the single replacement checkpoint for the earlier v0.1 prototype.
