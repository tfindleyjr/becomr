# BECOMR v0.1

**BECOME CAPABLE.**

BECOMR is a mobile-first real-life progression system. Instead of rewarding time spent, it rewards demonstrated capability.

## v0.1 includes
- Mobile-first dashboard
- Main/Boss quest
- XP and levels
- Bronze / Silver / Gold day progression
- Leisure unlock
- Local persistence with `localStorage`
- Eight preloaded skill trees
- Branching visual skill forest
- PWA manifest / Add to Home Screen support
- Nightly Save Game reflection
- Dark motivational visual system

## Skill trees
1. Developer
2. Musician
3. Creative Direction
4. Creator
5. Global Communicator
6. Entrepreneur
7. Athlete
8. Truth Seeker

## Run in GitHub Codespaces

```bash
npm install
npm run dev
```

Open the forwarded port.

## Production build

```bash
npm run build
npm start
```

## Deploy
Import the GitHub repository into Vercel. The default Next.js settings should work.

## Install on iPhone
After deployment:
1. Open the deployed URL in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Launch BECOMR from the icon.

## v0.1 design direction
The visual language is inspired by immersive RPG progression systems: branching paths, locked nodes, boss nodes, glowing unlocks, and a cohesive character-development map. It does not copy Far Cry artwork or assets.

### Core palette
- Obsidian `#070A0D` — immersive background
- Achievement Amber `#FFB020` — primary progress / success / action
- Warm Gold `#FFCC55` — high-value achievement
- Electric Cyan `#37D7FF` — developer / focus
- Growth Green `#43E3A1` — communication / completed-positive state
- Empowered Violet `#B97AFF` — creative direction
- Off-white `#F7F2E8` — readable foreground

The palette intentionally uses warm yellow/orange accents for positive high-arousal achievement states, with dark neutrals for immersion and cooler colors for individual branches.

## Important
v0.1 is intentionally a personal beta. There is no authentication, cloud database, AI quest generation, native WidgetKit widget, or multi-user onboarding yet. Those belong in later versions after the core loop is tested.
