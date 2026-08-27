# BECOMR v0.4 — Dynamic Insignia

**BECOME CAPABLE.**

This version turns the Compass Tree from a static brand image into an **earned visual identity system**.

## Core mechanic
The complete celestial emblem is no longer given to the user at the beginning.

It exists only as a faint `future-form` blueprint. The actual foreground insignia is rebuilt from live SVG layers and progresses through:

1. **SEALED** — ghost structure only
2. **OPEN** — primary branch becomes visible
3. **INSCRIBED** — secondary structure is carved in
4. **ORNAMENTED** — leaves, symbols, and details emerge
5. **MASTERED** — region reaches full ceremonial form

Each major path owns a different physical region of the Compass Tree.

## Path regions
- Developer — West / structure
- Musician — Northwest / rhythm
- Creative Direction — Northeast / vision
- Creator — East / craft
- Global Communicator — Southeast / connection
- Entrepreneur — South / expansion
- Athlete — Southwest / force
- Truth Seeker — West-South / wisdom

Selecting a path emphasizes its actual SVG branch and dims the other areas.

## Distinctive typography
The interface now uses:
- **Cinzel** — ritual labels, marks, navigation, BECOMR wordmark
- **Cormorant Garamond** — major editorial headings, capability language, Archive
- **Manrope** — functional interface text

They are loaded via Google Fonts with local fallbacks.

## Final-form preview
`public/assets/becomr-compass-tree.png` remains as a very faint background blueprint. It represents what the full identity can become, not what the user already owns.

## Constellations
The SVG architecture now supports multi-path constellation overlays. Example rules are present for future Founder and Artist combinations.

## Run
```bash
npm install
npm run dev
```

## Verify
```bash
npm run build
```

## Replace the existing GitHub repo
Replace the root `app/`, `public/`, and project config files with this version. Then:

```bash
git pull
rm -rf .next node_modules
npm install
npm run dev
```
