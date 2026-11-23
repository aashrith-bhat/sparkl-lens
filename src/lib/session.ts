import { getRung, getRungs, topOrder } from "../data/curriculum";
import type {
  DraftSession,
  Item,
  ItemResult,
  Rung,
  RungResult,
  SessionConfig,
  SessionMode,
  Settings,
  SubjectId,
} from "../types";
import { clamp } from "./format";
import { rungScore } from "./scoring";

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let value = seed || 1;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function itemsForRung(rung: Rung, settings: Settings): Item[] {
  return [...rung.items, ...(settings.customItems[rung.id] ?? [])];
}

export function enabledRungs(subject: SubjectId, settings: Settings): Rung[] {
  const disabled = new Set(settings.disabledRungs[subject] ?? []);
  const rungs = getRungs(subject).filter((rung) => !disabled.has(rung.id));
  return rungs.length ? rungs : getRungs(subject);
}

function chooseItems(rung: Rung, count: number, settings: Settings, seed: string): string[] {
  const bank = itemsForRung(rung, settings);
  const random = seededRandom(hashString(seed));
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(1, Math.min(count, shuffled.length))).map((item) => item.id);
}

export function findItem(
  subject: SubjectId,
  order: number,
  itemId: string,
  settings: Settings,
): Item | undefined {
  const rung = getRung(subject, order);
  if (!rung) return undefined;
  return itemsForRung(rung, settings).find((item) => item.id === itemId);
}

function enabledAfter(subject: SubjectId, order: number, settings: Settings, descending = false): number | null {
  const rungs = enabledRungs(subject, settings).sort((a, b) => a.order - b.order);
  if (descending) {
    const lower = rungs.filter((rung) => rung.order < order);
    return lower.length ? lower[lower.length - 1].order : null;
  }
  const higher = rungs.find((rung) => rung.order > order);
  return higher ? higher.order : null;
}

export function configFor(
  mode: SessionMode,
  subject: SubjectId,
  currentOrder: number,
  settings: Settings,
  custom?: { startOrder?: number; itemsPerRung?: number; passMark?: number; maxRungs?: number },
): SessionConfig {
  const top = topOrder(subject);
  if (mode === "quick") {
    return {
      mode,
      startOrder: clamp(currentOrder > 0 ? currentOrder - 1 : 1, 1, top),
      itemsPerRung: clamp(2, 1, 5),
      passMark: 1,
      maxRungs: 4,
      partialCredit: settings.partialCredit,
    };
  }
  if (mode === "custom") {
    return {
      mode,
      startOrder: clamp(custom?.startOrder ?? 1, 1, top),
      itemsPerRung: clamp(custom?.itemsPerRung ?? settings.itemsPerRung, 1, 5),
      passMark: clamp(custom?.passMark ?? settings.passMark, 1, 5),
      maxRungs: clamp(custom?.maxRungs ?? top, 1, top),
      partialCredit: settings.partialCredit,
    };
  }
  return {
    mode: "full",
    startOrder: 1,
    itemsPerRung: clamp(settings.itemsPerRung, 1, 5),
    passMark: clamp(settings.passMark, 1, 5),
    maxRungs: top,
    partialCredit: settings.partialCredit,
  };
}

export function createDraft(
  learnerId: string,
  subject: SubjectId,
  config: SessionConfig,
  settings: Settings,
): DraftSession {
  const startRung = getRung(subject, config.startOrder) ?? enabledRungs(subject, settings)[0];
  if (!startRung) throw new Error("No assessment rungs available");
  const now = new Date().toISOString();
  const id = `dr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const chosen = chooseItems(startRung, config.itemsPerRung, settings, `${id}:${startRung.order}`);
  return {
    id,
    learnerId,
    subject,
    config,
    startedAt: now,
    lastSavedAt: now,
    lastTickAt: now,
    elapsedSec: 0,
    currentOrder: startRung.order,
    phase: "items",
    rungItems: [{ order: startRung.order, itemIds: chosen }],
    rungResults: [],
    currentResults: [],
    nextOrder: null,
    finished: false,
    machineAssisted: false,
  };
}

export function addElapsed(draft: DraftSession, capSeconds = 600): DraftSession {
  const now = Date.now();
  const delta = Math.max(0, Math.min(capSeconds, (now - new Date(draft.lastTickAt).getTime()) / 1000));
  return {
    ...draft,
    elapsedSec: Math.round(draft.elapsedSec + delta),
    lastTickAt: new Date(now).toISOString(),
    lastSavedAt: new Date(now).toISOString(),
  };
}

export function rungItemsFor(draft: DraftSession, settings: Settings): Item[] {
  const entry = draft.rungItems.find((item) => item.order === draft.currentOrder);
  if (!entry) return [];
  return entry.itemIds
    .map((id) => findItem(draft.subject, draft.currentOrder, id, settings))
    .filter((item): item is Item => Boolean(item));
}

function nextState(
  draft: DraftSession,
  completed: RungResult,
  settings: Settings,
): { nextOrder: number | null; finished: boolean } {
  const results = [...draft.rungResults, completed];
  const best = results.filter((result) => result.passed).reduce((max, result) => Math.max(max, result.order), 0);
  const attempted = new Set(results.map((result) => result.order));
  const top = topOrder(draft.subject);

  if (results.length >= draft.config.maxRungs) return { nextOrder: null, finished: true };
  if (completed.passed) {
    if (completed.order >= top) return { nextOrder: null, finished: true };
    const candidate = enabledAfter(draft.subject, completed.order, settings);
    if (candidate === null || attempted.has(candidate)) return { nextOrder: null, finished: true };
    return { nextOrder: candidate, finished: false };
  }
  if (best === 0) {
    const lower = enabledAfter(draft.subject, completed.order, settings, true);
    if (lower !== null && !attempted.has(lower)) return { nextOrder: lower, finished: false };
  }
  return { nextOrder: null, finished: true };
}

export function commitItemResult(
  draft: DraftSession,
  result: ItemResult,
  settings: Settings,
  machineAssisted: boolean,
): DraftSession {
  const timed = addElapsed(draft);
  const items = rungItemsFor(timed, settings);
  const currentResults = [...timed.currentResults, result];
  const machineFlag = timed.machineAssisted || machineAssisted;

  if (currentResults.length < items.length) {
    return { ...timed, currentResults, machineAssisted: machineFlag };
  }

  const activeRung = getRung(timed.subject, timed.currentOrder);
  if (!activeRung) throw new Error("Missing active rung");
  const outcomes = currentResults.map((item) => item.outcome);
  const score = rungScore(timed.config.partialCredit, outcomes);
  const passMark = Math.min(timed.config.passMark, items.length);
  const passed = score >= passMark;
  const rungResult: RungResult = {
    rungId: activeRung.id,
    order: activeRung.order,
    itemResults: currentResults,
    score,
    passed,
  };
  const rungResults = [...timed.rungResults, rungResult];
  const next = nextState({ ...timed, rungResults }, rungResult, settings);
  return {
    ...timed,
    currentResults,
    rungResults,
    phase: "review",
    nextOrder: next.nextOrder,
    finished: next.finished,
    machineAssisted: machineFlag,
  };
}

export function advanceDraft(draft: DraftSession, settings: Settings): DraftSession {
  const timed = addElapsed(draft);
  if (timed.finished) {
    return {
      ...timed,
      phase: "result",
      lastSavedAt: new Date().toISOString(),
    };
  }
  const nextOrder = timed.nextOrder;
  if (!nextOrder) {
    return { ...timed, phase: "result", finished: true };
  }
  const rung = getRung(timed.subject, nextOrder);
  if (!rung) return { ...timed, phase: "result", finished: true };
  const existing = timed.rungItems.find((entry) => entry.order === nextOrder);
  const chosen = existing
    ? existing.itemIds
    : chooseItems(rung, timed.config.itemsPerRung, settings, `${timed.id}:${nextOrder}`);
  const rungItems = existing
    ? timed.rungItems
    : [...timed.rungItems, { order: nextOrder, itemIds: chosen }];
  return {
    ...timed,
    currentOrder: nextOrder,
    phase: "items",
    rungItems,
    currentResults: [],
    nextOrder: null,
    finished: false,
    lastSavedAt: new Date().toISOString(),
  };
}

export function suggestedOrder(draft: DraftSession): number {
  return draft.rungResults
    .filter((result) => result.passed)
    .reduce((max, result) => Math.max(max, result.order), 0);
}

export function firstFailureAbove(draft: DraftSession, order: number): RungResult | null {
  const failures = draft.rungResults
    .filter((result) => !result.passed && result.order > order)
    .sort((a, b) => a.order - b.order);
  return failures[0] ?? null;
}

export function estimateMinutes(config: SessionConfig): number {
  const perItem = 22;
  const overhead = 45;
  return Math.max(2, Math.round((config.itemsPerRung * config.maxRungs * perItem + overhead) / 60));
}

export function latestOrderFor(
  assessments: Array<{ subject: SubjectId; learnerId: string; finalOrder: number; completedAt: string }>,
  learnerId: string,
  subject: SubjectId,
): number {
  const latest = assessments
    .filter((item) => item.learnerId === learnerId && item.subject === subject)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  return latest?.finalOrder ?? 0;
}
