export type SubjectId = "kannada" | "english" | "maths";

export type Outcome = "correct" | "partial" | "incorrect";
export type Fluency = "fluent" | "hesitant" | "struggling";
export type Support = "independent" | "prompted" | "with-help";
export type Confidence = "high" | "medium" | "low";
export type Pacing = "auto" | "educator";
export type ReviewStatus = "unreviewed" | "confirmed" | "adjusted";
export type WrittenBand = "emerging" | "developing" | "secure";
export type WrittenSyncStatus = "queued" | "synced" | "error";

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

export interface AutoItemMetrics {
  accuracy: number;
  wordsPerMinute: number | null;
  speakingSeconds: number;
  pauseCount: number;
  longPauseCount: number;
  hesitationCount: number;
  matchedWords: number;
  totalWords: number;
  asrConfidence: number | null;
  machineConfidence: number;
  fluency: Fluency;
  reasons: string[];
  noSpeech: boolean;
  needsReview: boolean;
  response: string;
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
  auto?: AutoItemMetrics;
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
  pacing: Pacing;
  startOrder: number;
  itemsPerRung: number;
  passMark: number;
  maxRungs: number;
  partialCredit: boolean;
}

export interface AutoSummary {
  accuracy: number;
  wordsPerMinute: number | null;
  fluency: Fluency;
  machineConfidence: number;
  noSpeechItems: number;
  reviewItems: number;
  reasons: string[];
  summary: string;
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
  pacing: Pacing;
  autoSummary?: AutoSummary;
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  teacherNote?: string;
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

export interface WrittenCriterion {
  id: string;
  label: string;
  max: number;
}

export interface WrittenTaskDefinition {
  id: string;
  title: string;
  prompt: string;
  content: string;
  kannadaPrompt?: string;
  criteria: WrittenCriterion[];
}

export interface WrittenTaskSet {
  id: string;
  subject: SubjectId;
  name: string;
  description: string;
  tasks: WrittenTaskDefinition[];
}

export interface WrittenTaskResult {
  taskId: string;
  title: string;
  prompt: string;
  content: string;
  criteria: WrittenCriterion[];
  photoId: string | null;
  scores: Record<string, number>;
  note: string;
}

export interface WrittenAssessment {
  id: string;
  learnerId: string;
  subject: SubjectId;
  taskSetId: string;
  taskSetName: string;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  educator: string;
  centre: string;
  tasks: WrittenTaskResult[];
  totalScore: number;
  maxScore: number;
  band: WrittenBand;
  notes: string;
  syncStatus: WrittenSyncStatus;
  syncError?: string;
  syncedAt?: string;
  updatedAt: string;
  deviceId: string;
}

export interface WrittenDraft {
  id: string;
  learnerId: string;
  subject: SubjectId;
  taskSetId: string;
  taskSetName: string;
  startedAt: string;
  lastSavedAt: string;
  educator: string;
  centre: string;
  currentIndex: number;
  tasks: WrittenTaskResult[];
  notes: string;
  deviceId: string;
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
  syncUrl: string;
  syncKey: string;
}

export interface Database {
  version: number;
  createdAt: string;
  deviceId: string;
  learners: Learner[];
  assessments: Assessment[];
  writtenAssessments: WrittenAssessment[];
  speechTrials: SpeechTrial[];
  settings: Settings;
  draft: DraftSession | null;
  writtenDraft: WrittenDraft | null;
}
