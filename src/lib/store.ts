import { useSyncExternalStore } from "react";
import { makeSeedDatabase } from "../data/seed";
import { getRung } from "../data/curriculum";
import type {
  Assessment,
  Database,
  DraftSession,
  Item,
  Learner,
  Settings,
  SpeechTrial,
  SubjectId,
} from "../types";
import { defaultSettings } from "./defaults";

const KEY = "sparkl-lens-db-v1";
const VERSION = 2;

const listeners = new Set<() => void>();

function load(): Database {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.version === VERSION && Array.isArray(parsed.learners)) {
        return parsed;
      }
    }
  } catch {
    // A corrupted or unavailable store falls back to demo data.
  }
  const seeded = makeSeedDatabase();
  persist(seeded);
  return seeded;
}

function persist(database: Database): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(database));
  } catch {
    // Local-only prototype: if storage is full or blocked, the session still works in memory.
  }
}

let state: Database = load();

function emit(): void {
  for (const listener of listeners) listener();
}

export function getDB(): Database {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDB(): Database {
  return useSyncExternalStore(subscribe, getDB, getDB);
}

export function update(mutator: (draft: Database) => void): void {
  const next = structuredClone(state) as Database;
  mutator(next);
  state = next;
  persist(state);
  emit();
}

export function updateSettings(patch: Partial<Settings>): void {
  update((draft) => {
    draft.settings = { ...draft.settings, ...patch };
  });
}

export function setBenchmark(subject: SubjectId, rungId: string, value: number): void {
  update((draft) => {
    draft.settings.benchmarks[subject] = {
      ...draft.settings.benchmarks[subject],
      [rungId]: value,
    };
  });
}

export function toggleRung(subject: SubjectId, rungId: string): void {
  update((draft) => {
    const current = new Set(draft.settings.disabledRungs[subject] ?? []);
    if (current.has(rungId)) current.delete(rungId);
    else current.add(rungId);
    draft.settings.disabledRungs[subject] = Array.from(current);
  });
}

export function addCustomItem(rungId: string, item: Item): void {
  update((draft) => {
    const existing = draft.settings.customItems[rungId] ?? [];
    draft.settings.customItems[rungId] = [...existing, item];
  });
}

export function deleteCustomItem(rungId: string, itemId: string): void {
  update((draft) => {
    draft.settings.customItems[rungId] = (draft.settings.customItems[rungId] ?? []).filter(
      (item) => item.id !== itemId,
    );
  });
}

export function addLearner(input: {
  enrolledStd: number;
  centre: string;
  homeLanguage: string;
  consentOnFile: boolean;
}): Learner {
  let created: Learner | null = null;
  update((draft) => {
    const highest = draft.learners.reduce((max, learner) => {
      const numeric = Number(learner.code.replace(/\D/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const code = `SPK-${String(highest + 13).padStart(4, "0")}`;
    created = {
      id: `lr-${code.toLowerCase()}`,
      code,
      enrolledStd: input.enrolledStd,
      centre: input.centre,
      homeLanguage: input.homeLanguage,
      consentOnFile: input.consentOnFile,
      createdAt: new Date().toISOString(),
      note: "",
    };
    draft.learners.push(created);
  });
  if (!created) throw new Error("Learner could not be created");
  return created;
}

export function updateLearner(learnerId: string, patch: Partial<Learner>): void {
  update((draft) => {
    const learner = draft.learners.find((item) => item.id === learnerId);
    if (learner) Object.assign(learner, patch);
  });
}

export function addAssessment(assessment: Assessment): void {
  update((draft) => {
    if (!draft.assessments.some((item) => item.id === assessment.id)) {
      draft.assessments.push(assessment);
    }
    draft.draft = null;
  });
}

export function updateAssessment(assessmentId: string, patch: Partial<Assessment>): void {
  update((draft) => {
    const assessment = draft.assessments.find((item) => item.id === assessmentId);
    if (assessment) Object.assign(assessment, patch);
  });
}

export function saveDraft(draft: DraftSession): void {
  update((database) => {
    database.draft = draft;
  });
}

export function clearDraft(): void {
  update((database) => {
    database.draft = null;
  });
}

export function addSpeechTrial(trial: SpeechTrial): void {
  update((database) => {
    database.speechTrials.unshift(trial);
  });
}

export function resetDemo(): void {
  state = makeSeedDatabase();
  persist(state);
  emit();
}

export function clearAll(): void {
  state = {
    version: VERSION,
    createdAt: new Date().toISOString(),
    learners: [],
    assessments: [],
    speechTrials: [],
    settings: defaultSettings(),
    draft: null,
  };
  persist(state);
  emit();
}

export function levelNameFor(subject: SubjectId, order: number): string {
  if (order <= 0) return "Below rung 1";
  return getRung(subject, order)?.name ?? "—";
}
