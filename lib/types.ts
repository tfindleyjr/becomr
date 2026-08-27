export type VisualStage = "sealed" | "open" | "inscribed" | "ornamented" | "mastered";
export type QuestKind = "daily" | "weekly_trial" | "weekly" | "boss";
export type CycleType = "day" | "week";

export type Quest = {
  id: string;
  pathId: string;
  title: string;
  proof: string;
  xp: number;
  kind: QuestKind;
  nodeId?: string;
  dueWeek?: string;
  cycleType?: CycleType;
  cycleKey?: string;
  createdAt?: string;
  done?: boolean;
  evidence?: string;
  completedAt?: string;
};

export type SkillNode = {
  id: string;
  title: string;
  order: number;
  xpRequired: number;
  boss?: boolean;
};

export type SkillPath = {
  id: string;
  name: string;
  glyph: string;
  tone: string;
  region: string;
  capability: string;
  nodes: SkillNode[];
};

export type ArchiveEntry = {
  id: string;
  date: string;
  easier: string;
  resisted: string;
  next: string;
  proven: number;
  xp: number;
};

export type CycleQuestRecord = {
  id: string;
  pathId: string;
  title: string;
  kind: QuestKind;
  xp: number;
  done: boolean;
  evidence?: string;
  completedAt?: string;
};

export type PathWeekSnapshot = {
  pathId: string;
  pathName: string;
  glyph: string;
  earnedXp: number;
  progress: number;
  nodeTitle: string;
  bossTitle?: string;
  bossXp?: number;
};

export type CycleSnapshot = {
  id: string;
  type: CycleType;
  cycleKey: string;
  weekNumber?: number;
  closedAt: string;
  proven: number;
  earnedXp: number;
  quests: CycleQuestRecord[];
  paths?: PathWeekSnapshot[];
};

export type CycleState = {
  dayKey: string;
  weekKey: string;
  calendarWeekKey?: string;
  weekNumber?: number;
};

export type AppState = {
  xp: number;
  momentum: number;
  paths: SkillPath[];
  quests: Quest[];
  archive: ArchiveEntry[];
  cycles?: CycleState;
  cycleHistory?: CycleSnapshot[];
};
