import { RUNGS, SUBJECT_ORDER } from "../data/curriculum";
import type { Settings, SubjectId } from "../types";

export function defaultSettings(): Settings {
  const benchmarks = {} as Record<SubjectId, Record<string, number>>;
  const disabledRungs = {} as Record<SubjectId, string[]>;
  for (const subject of SUBJECT_ORDER) {
    benchmarks[subject] = {};
    disabledRungs[subject] = [];
  }
  for (const rung of RUNGS) {
    benchmarks[rung.subject][rung.id] = rung.benchmark;
  }
  return {
    itemsPerRung: 3,
    passMark: 2,
    partialCredit: true,
    showKannadaInstructions: true,
    educator: "Hajira",
    centre: "Nagarhole",
    benchmarks,
    disabledRungs,
    customItems: {},
    syncUrl: "",
    syncKey: "",
  };
}

export const CENTRES = ["Nagarhole", "Hunsur", "Mysuru"];

export const HOME_LANGUAGES = [
  "Kannada",
  "Kannada + local language",
  "English + Kannada",
  "English",
];

export const EDUCATORS = ["Aashrith", "Hajira", "Sufiyan", "Vismay"];
