export type SubjectId = "kannada" | "english" | "maths";

export type Outcome = "correct" | "partial" | "incorrect";
export type Fluency = "fluent" | "hesitant" | "struggling";
export type Support = "independent" | "prompted" | "with-help";
export type Confidence = "high" | "medium" | "low";

export type ItemKind = "read" | "say" | "answer" | "dots" | "comprehension";
export type CaptureMethod = "speech" | "manual" | "keypad" | "text";

export interface Item {
  id: string;
  kind: ItemKind;
  content: string;
  answer?: string;
  accept?: string[];
  spoken?: string;
  passage?: string;
  instructionOverride?: string;
  kannadaInstructionOverride?: string;
  dots?: number;
  manualOnly?: boolean;
  extension?: boolean;
}

export interface Rung {
  id: string;
  subject: SubjectId;
  order: number;
  name: string;
  kannadaName?: string;
  benchmark: number;
  focus: string;
  instruction: string;
  kannadaInstruction: string;
  items: Item[];
  nextStep: string;
  complexity?: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  sample: string;
  description: string;
  ladderNote: string;
  topNote: string;
}

export interface ItemResult {
  itemId: string;
  expected: string;
  heard?: string;
  outcome: Outcome;
  fluency?: Fluency | null;
  support?: Support | null;
  method: CaptureMethod;
  suggestion?: Outcome | null;
  match?: number | null;
}

export interface RungResult {
  rungId: string;
  order: number;
  itemResults: ItemResult[];
  score: number;
  passed: boolean;
}

export type SessionMode = "quick" | "full" | "custom";

export interface SessionConfig {
  mode: SessionMode;
  startOrder: number;
  itemsPerRung: number;
  passMark: number;
  maxRungs: number;
  partialCredit: boolean;
}

export interface Assessment {
  id: string;
  learnerId: string;
  subject: SubjectId;
  config: SessionConfig;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  educator: string;
  results: RungResult[];
  suggestedOrder: number;
  finalOrder: number;
  overridden: boolean;
  notes: string;
  confidence: Confidence;
  machineAssisted: boolean;
}

export interface Learner {
  id: string;
  code: string;
  enrolledStd: number;
  centre: string;
  homeLanguage: string;
  consentOnFile: boolean;
  createdAt: string;
  note: string;
}

export interface SpeechTrial {
  id: string;
  createdAt: string;
  language: "english" | "kannada";
  expected: string;
  transcript: string;
  match: number;
  suggestion: Outcome | null;
  verdict: Outcome;
  educator: string;
  source: "speech" | "manual";
}

export interface DraftRung {
  order: number;
  itemIds: string[];
}

export type DraftPhase = "items" | "review" | "result";

export interface DraftSession {
  id: string;
  learnerId: string;
  subject: SubjectId;
  config: SessionConfig;
  startedAt: string;
  lastSavedAt: string;
  lastTickAt: string;
  elapsedSec: number;
  currentOrder: number;
  phase: DraftPhase;
  rungItems: DraftRung[];
  rungResults: RungResult[];
  currentResults: ItemResult[];
  nextOrder: number | null;
  finished: boolean;
  machineAssisted: boolean;
}

export interface Settings {
  itemsPerRung: number;
  passMark: number;
  partialCredit: boolean;
  showKannadaInstructions: boolean;
  educator: string;
  centre: string;
  benchmarks: Record<SubjectId, Record<string, number>>;
  disabledRungs: Record<SubjectId, string[]>;
  customItems: Record<string, Item[]>;
}

export interface Database {
  version: number;
  createdAt: string;
  learners: Learner[];
  assessments: Assessment[];
  speechTrials: SpeechTrial[];
  settings: Settings;
  draft: DraftSession | null;
}
