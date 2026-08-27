export type VisualStage = "sealed" | "open" | "inscribed" | "ornamented" | "mastered";
export type QuestKind = "daily" | "weekly" | "boss";

export type Quest = {
  id: string;
  pathId: string;
  title: string;
  proof: string;
  xp: number;
  kind: QuestKind;
  nodeId?: string;
  dueWeek?: string;
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

export type AppState = {
  xp: number;
  momentum: number;
  paths: SkillPath[];
  quests: Quest[];
  archive: ArchiveEntry[];
};
