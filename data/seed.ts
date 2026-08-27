import type { AppState, SkillPath, Quest } from "@/lib/types";

// Phase 17: BECOMR no longer gives new users a prebuilt identity.
// Their Compass begins empty and is created from the paths they choose to pursue.
export const seedPaths: SkillPath[] = [];
export const seedQuests: Quest[] = [];

export const seedState: AppState = {
  xp: 0,
  momentum: 0,
  paths: seedPaths,
  quests: seedQuests,
  archive: []
};
