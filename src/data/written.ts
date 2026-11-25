import type {
  SubjectId,
  WrittenBand,
  WrittenCriterion,
  WrittenTaskDefinition,
  WrittenTaskResult,
  WrittenTaskSet,
} from "../types";

const accuracy: WrittenCriterion = { id: "accuracy", label: "Correct content", max: 2 };
const formation: WrittenCriterion = {
  id: "formation",
  label: "Letter / number formation",
  max: 2,
};
const spacing: WrittenCriterion = {
  id: "spacing",
  label: "Spacing and legibility",
  max: 2,
};
const sentence: WrittenCriterion = {
  id: "sentence",
  label: "Sentence structure",
  max: 2,
};
const spelling: WrittenCriterion = { id: "spelling", label: "Spelling", max: 2 };
const working: WrittenCriterion = {
  id: "working",
  label: "Working / layout",
  max: 2,
};

const kannadaTasks: WrittenTaskDefinition[] = [
  {
    id: "kn-written-letters",
    title: "Letters",
    prompt: "Write these letters.",
    kannadaPrompt: "ಈ ಅಕ್ಷರಗಳನ್ನು ಬರೆಯಿರಿ.",
    content: "ಅ ಆ ಇ ಈ ಉ ಊ",
    criteria: [accuracy, formation, spacing],
  },
  {
    id: "kn-written-words",
    title: "Words",
    prompt: "Copy these words.",
    kannadaPrompt: "ಈ ಪದಗಳನ್ನು ಬರೆಯಿರಿ.",
    content: "ಮನೆ · ನೀರು · ಶಾಲೆ",
    criteria: [accuracy, formation, spacing],
  },
  {
    id: "kn-written-sentence",
    title: "Sentence",
    prompt: "Write one sentence about your school.",
    kannadaPrompt: "ನಿಮ್ಮ ಶಾಲೆಯ ಬಗ್ಗೆ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ.",
    content: "",
    criteria: [sentence, spelling, formation],
  },
];

const englishTasks: WrittenTaskDefinition[] = [
  {
    id: "en-written-letters",
    title: "Letters",
    prompt: "Write these letters.",
    content: "A B C D E F G H I J",
    criteria: [accuracy, formation, spacing],
  },
  {
    id: "en-written-words",
    title: "Words",
    prompt: "Copy these words.",
    content: "cat · school · friend",
    criteria: [accuracy, formation, spacing],
  },
  {
    id: "en-written-sentence",
    title: "Sentence",
    prompt: "Write one sentence about your school.",
    content: "",
    criteria: [sentence, spelling, formation],
  },
];

const mathsTasks: WrittenTaskDefinition[] = [
  {
    id: "maths-written-numbers",
    title: "Numbers",
    prompt: "Write the numbers from 1 to 10.",
    content: "1  2  3  4  5  6  7  8  9  10",
    criteria: [accuracy, formation, spacing],
  },
  {
    id: "maths-written-sums",
    title: "Sums",
    prompt: "Work out and write the answers.",
    content: "8 + 5 = ______        14 − 6 = ______",
    criteria: [accuracy, working, formation],
  },
  {
    id: "maths-written-names",
    title: "Number names",
    prompt: "Write the number names.",
    content: "3 = ______    7 = ______    12 = ______",
    criteria: [accuracy, spelling, formation],
  },
];

const sets: Record<SubjectId, WrittenTaskSet> = {
  kannada: {
    id: "written-kannada",
    subject: "kannada",
    name: "Kannada written sample",
    description: "Letters, words and one sentence. Draft task set, editable later.",
    tasks: kannadaTasks,
  },
  english: {
    id: "written-english",
    subject: "english",
    name: "English written sample",
    description: "Letters, words and one sentence. Draft task set, editable later.",
    tasks: englishTasks,
  },
  maths: {
    id: "written-maths",
    subject: "maths",
    name: "Maths written sample",
    description: "Numbers, sums and number names. Draft task set, editable later.",
    tasks: mathsTasks,
  },
};

export const WRITTEN_TASK_SETS = sets;

export function getWrittenTaskSet(subject: SubjectId): WrittenTaskSet {
  return sets[subject];
}

export function writtenCriteriaMax(criteria: WrittenCriterion[]): number {
  return criteria.reduce((sum, criterion) => sum + criterion.max, 0);
}

export function writtenTaskMax(task: WrittenTaskResult): number {
  return writtenCriteriaMax(task.criteria);
}

export function writtenTaskScore(task: WrittenTaskResult): number {
  return task.criteria.reduce((sum, criterion) => sum + (task.scores[criterion.id] ?? 0), 0);
}

export function writtenTotals(tasks: WrittenTaskResult[]): { total: number; max: number } {
  return tasks.reduce(
    (result, task) => ({
      total: result.total + writtenTaskScore(task),
      max: result.max + writtenTaskMax(task),
    }),
    { total: 0, max: 0 },
  );
}

export function writtenBandFor(total: number, max: number): WrittenBand {
  if (!max) return "emerging";
  const ratio = total / max;
  if (ratio >= 0.75) return "secure";
  if (ratio >= 0.45) return "developing";
  return "emerging";
}

export const WRITTEN_BAND_LABEL: Record<WrittenBand, string> = {
  emerging: "Emerging",
  developing: "Developing",
  secure: "Secure",
};

export function emptyWrittenTaskResult(task: WrittenTaskDefinition): WrittenTaskResult {
  return {
    taskId: task.id,
    title: task.title,
    prompt: task.prompt,
    content: task.content,
    criteria: task.criteria,
    photoId: null,
    scores: {},
    note: "",
  };
}
