export type VisualStage = "sealed" | "open" | "inscribed" | "ornamented" | "mastered";
export type QuestKind = "daily" | "weekly_trial" | "weekly" | "boss";
export type CycleType = "day" | "week";
export type ProofKind = "text" | "number" | "link" | "photo" | "video" | "file";
export type DifficultyBand = "recover" | "steady" | "stretch";

export type ProofArtifact = {
  id: string;
  kind: ProofKind;
  value: string;
  label?: string;
  createdAt: string;
};

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
  pathWeekNumber?: number;
  createdAt?: string;
  done?: boolean;
  evidence?: string;
  evidenceArtifacts?: ProofArtifact[];
  proofKinds?: ProofKind[];
  completedAt?: string;
  aiGenerated?: boolean;
  adaptationReason?: string;
  difficulty?: DifficultyBand;
  prerequisiteNote?: string;
};

export type SkillNode = {
  id: string;
  title: string;
  order: number;
  xpRequired: number;
  boss?: boolean;
  prerequisite?: boolean;
};

export type SkillPath = {
  id: string;
  name: string;
  glyph: string;
  tone: string;
  region: string;
  capability: string;
  nodes: SkillNode[];
  paused?: boolean;
  capacity?: "low" | "steady" | "high";
  notes?: string;
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
  pathWeekNumber?: number;
  evidence?: string;
  evidenceArtifacts?: ProofArtifact[];
  completedAt?: string;
};

export type PathWeekSnapshot = {
  pathId: string;
  pathName: string;
  glyph: string;
  weekNumber?: number;
  earnedXp: number;
  progress: number;
  nodeTitle: string;
  bosses?: { title:string; xp:number }[];
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

export type PathWeekState = {
  weekNumber: number;
  cycleKey: string;
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
  pathWeeks?: Record<string,PathWeekState>;
  cycleHistory?: CycleSnapshot[];
};
