import { getRung, getRungs, SUBJECT_ORDER, topOrder } from "../data/curriculum";
import type {
  Assessment,
  AutoItemMetrics,
  Database,
  Fluency,
  Item,
  ItemResult,
  Learner,
  Outcome,
  RungResult,
  SpeechTrial,
  SubjectId,
} from "../types";
import { assessmentConfidence, summariseResults } from "../lib/autoAssess";
import { defaultSettings } from "../lib/defaults";
import { normaliseText, rungScore, scoreTranscript } from "../lib/scoring";

interface HistoryPoint {
  order: number;
  daysAgo: number;
  durationSec: number;
  educator: string;
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

interface Profile {
  code: string;
  enrolledStd: number;
  centre: string;
  homeLanguage: string;
  note: string;
  createdDaysAgo: number;
  history: Partial<Record<SubjectId, HistoryPoint[]>>;
}

const AT = (daysAgo: number, hour: number, minute: number, now: Date): Date =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, minute, 0, 0);

const profiles: Profile[] = [
  {
    code: "SPK-0142",
    enrolledStd: 4,
    centre: "Nagarhole",
    homeLanguage: "Kannada",
    note: "Relaxes with picture cards. Reads word by word when the text gets longer.",
    createdDaysAgo: 68,
    history: {
      kannada: [
        { order: 2, daysAgo: 34, durationSec: 505, educator: "Hajira" },
        { order: 3, daysAgo: 20, durationSec: 472, educator: "Hajira" },
        { order: 4, daysAgo: 3, durationSec: 438, educator: "Hajira" },
      ],
      english: [
        { order: 2, daysAgo: 32, durationSec: 520, educator: "Vismay" },
        { order: 3, daysAgo: 9, durationSec: 466, educator: "Vismay" },
      ],
      maths: [
        { order: 3, daysAgo: 30, durationSec: 551, educator: "Sufiyan" },
        { order: 4, daysAgo: 4, durationSec: 490, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0187",
    enrolledStd: 3,
    centre: "Nagarhole",
    homeLanguage: "Kannada + local language",
    note: "Strong oral answers. Needs more time with written subtraction.",
    createdDaysAgo: 61,
    history: {
      kannada: [
        { order: 3, daysAgo: 40, durationSec: 420, educator: "Hajira" },
        { order: 3, daysAgo: 12, durationSec: 398, educator: "Hajira" },
      ],
      english: [
        { order: 1, daysAgo: 38, durationSec: 515, educator: "Aashrith" },
        { order: 2, daysAgo: 11, durationSec: 470, educator: "Aashrith" },
      ],
      maths: [
        { order: 2, daysAgo: 36, durationSec: 544, educator: "Sufiyan" },
        { order: 3, daysAgo: 5, durationSec: 512, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0211",
    enrolledStd: 5,
    centre: "Hunsur",
    homeLanguage: "Kannada",
    note: "Reads Kannada fluently. English vocabulary is the next focus.",
    createdDaysAgo: 74,
    history: {
      kannada: [
        { order: 4, daysAgo: 45, durationSec: 460, educator: "Hajira" },
        { order: 5, daysAgo: 17, durationSec: 401, educator: "Hajira" },
      ],
      english: [
        { order: 3, daysAgo: 44, durationSec: 540, educator: "Vismay" },
        { order: 4, daysAgo: 16, durationSec: 498, educator: "Vismay" },
      ],
      maths: [
        { order: 4, daysAgo: 42, durationSec: 571, educator: "Vismay" },
        { order: 5, daysAgo: 14, durationSec: 523, educator: "Vismay" },
      ],
    },
  },
  {
    code: "SPK-0233",
    enrolledStd: 2,
    centre: "Hunsur",
    homeLanguage: "Kannada",
    note: "Quiet at first. Counts on fingers confidently.",
    createdDaysAgo: 20,
    history: {
      kannada: [{ order: 2, daysAgo: 8, durationSec: 388, educator: "Hajira" }],
      english: [{ order: 1, daysAgo: 8, durationSec: 412, educator: "Hajira" }],
      maths: [{ order: 2, daysAgo: 8, durationSec: 430, educator: "Hajira" }],
    },
  },
  {
    code: "SPK-0276",
    enrolledStd: 6,
    centre: "Mysuru",
    homeLanguage: "English + Kannada",
    note: "Confident reader. Loses the thread when a story is long.",
    createdDaysAgo: 82,
    history: {
      kannada: [
        { order: 5, daysAgo: 50, durationSec: 478, educator: "Aashrith" },
        { order: 6, daysAgo: 22, durationSec: 432, educator: "Aashrith" },
      ],
      english: [
        { order: 4, daysAgo: 48, durationSec: 505, educator: "Aashrith" },
        { order: 5, daysAgo: 21, durationSec: 449, educator: "Aashrith" },
      ],
      maths: [
        { order: 4, daysAgo: 47, durationSec: 590, educator: "Sufiyan" },
        { order: 5, daysAgo: 20, durationSec: 548, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0304",
    enrolledStd: 3,
    centre: "Mysuru",
    homeLanguage: "Kannada",
    note: "Needs a Kannada-first introduction. Do not rush the first rung.",
    createdDaysAgo: 23,
    history: {
      kannada: [{ order: 1, daysAgo: 19, durationSec: 610, educator: "Hajira", confidence: "medium" }],
      english: [{ order: 1, daysAgo: 19, durationSec: 590, educator: "Hajira", confidence: "medium" }],
      maths: [{ order: 1, daysAgo: 19, durationSec: 600, educator: "Hajira", confidence: "medium" }],
    },
  },
  {
    code: "SPK-0319",
    enrolledStd: 4,
    centre: "Nagarhole",
    homeLanguage: "Kannada",
    note: "Reads with expression. Subtraction needs a slower demonstration.",
    createdDaysAgo: 57,
    history: {
      kannada: [
        { order: 3, daysAgo: 36, durationSec: 465, educator: "Hajira" },
        { order: 4, daysAgo: 15, durationSec: 421, educator: "Hajira" },
      ],
      english: [
        { order: 3, daysAgo: 34, durationSec: 480, educator: "Vismay" },
        { order: 4, daysAgo: 13, durationSec: 452, educator: "Vismay" },
      ],
      maths: [
        { order: 3, daysAgo: 33, durationSec: 545, educator: "Sufiyan" },
        { order: 3, daysAgo: 12, durationSec: 532, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0352",
    enrolledStd: 2,
    centre: "Hunsur",
    homeLanguage: "Kannada",
    note: "Reads ahead of her class in Kannada. Enjoying story cards.",
    createdDaysAgo: 35,
    history: {
      kannada: [
        { order: 2, daysAgo: 28, durationSec: 410, educator: "Hajira" },
        { order: 3, daysAgo: 7, durationSec: 386, educator: "Hajira" },
      ],
      english: [
        { order: 1, daysAgo: 27, durationSec: 430, educator: "Aashrith" },
        { order: 2, daysAgo: 6, durationSec: 405, educator: "Aashrith" },
      ],
      maths: [
        { order: 2, daysAgo: 26, durationSec: 440, educator: "Hajira" },
        { order: 2, daysAgo: 5, durationSec: 428, educator: "Hajira" },
      ],
    },
  },
  {
    code: "SPK-0388",
    enrolledStd: 7,
    centre: "Mysuru",
    homeLanguage: "English + Kannada",
    note: "At the top of the reading ladder. Needs a higher-level check next.",
    createdDaysAgo: 90,
    history: {
      kannada: [
        { order: 5, daysAgo: 58, durationSec: 455, educator: "Aashrith" },
        { order: 6, daysAgo: 29, durationSec: 410, educator: "Aashrith" },
      ],
      english: [
        { order: 4, daysAgo: 57, durationSec: 490, educator: "Aashrith" },
        { order: 5, daysAgo: 28, durationSec: 440, educator: "Aashrith" },
      ],
      maths: [
        { order: 5, daysAgo: 55, durationSec: 540, educator: "Sufiyan" },
        { order: 6, daysAgo: 30, durationSec: 505, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0411",
    enrolledStd: 5,
    centre: "Nagarhole",
    homeLanguage: "Kannada + local language",
    note: "More comfortable speaking than reading. Pair reading with familiar words.",
    createdDaysAgo: 48,
    history: {
      kannada: [
        { order: 2, daysAgo: 31, durationSec: 585, educator: "Vismay" },
        { order: 3, daysAgo: 10, durationSec: 540, educator: "Vismay" },
      ],
      english: [
        { order: 2, daysAgo: 30, durationSec: 600, educator: "Vismay" },
        { order: 3, daysAgo: 9, durationSec: 556, educator: "Vismay" },
      ],
      maths: [
        { order: 3, daysAgo: 29, durationSec: 560, educator: "Sufiyan" },
        { order: 4, daysAgo: 8, durationSec: 515, educator: "Sufiyan" },
      ],
    },
  },
  {
    code: "SPK-0427",
    enrolledStd: 1,
    centre: "Hunsur",
    homeLanguage: "Kannada",
    note: "New to the centre. First assessment not started.",
    createdDaysAgo: 2,
    history: {},
  },
  {
    code: "SPK-0440",
    enrolledStd: 3,
    centre: "Mysuru",
    homeLanguage: "Kannada",
    note: "Consent confirmed by the centre coordinator. First assessment pending.",
    createdDaysAgo: 0,
    history: {},
  },
];

function wordCount(value: string): number {
  const normalised = normaliseText(value);
  return normalised ? normalised.split(" ").length : 0;
}

function seedAutoMetrics(
  subject: SubjectId,
  item: Item,
  outcome: Outcome,
  variant: { hesitant: boolean; noSpeech: boolean },
  index: number,
): AutoItemMetrics {
  const keypad = subject === "maths" && (item.kind === "answer" || item.kind === "dots");
  const noSpeech = variant.noSpeech && outcome !== "correct" && index === 0;
  const fluency: Fluency =
    outcome === "correct"
      ? variant.hesitant
        ? "hesitant"
        : "fluent"
      : outcome === "partial"
        ? "hesitant"
        : "struggling";
  const expectedText = item.spoken ?? item.content;
  const expectedWords = Math.max(1, wordCount(expectedText));
  const passage = item.kind === "read" && expectedWords > 8 && subject !== "maths";
  const baseWpm = fluency === "fluent" ? 38 : fluency === "hesitant" ? 23 : 12;
  const wordsPerMinute = passage && !noSpeech ? baseWpm : null;
  const speakingSeconds = noSpeech
    ? 0
    : passage
      ? Math.round((expectedWords / (wordsPerMinute ?? baseWpm)) * 60)
      : Math.round((1.4 + expectedWords * 0.55 + (fluency === "hesitant" ? 1.2 : 0)) * 10) / 10;
  const accuracy = noSpeech ? 0 : outcome === "correct" ? 0.95 : outcome === "partial" ? 0.6 : 0.28;
  const machineConfidence = noSpeech ? 0.2 : fluency === "fluent" ? 0.88 : fluency === "hesitant" ? 0.62 : 0.38;

  if (keypad) {
    const answer = noSpeech ? "" : outcome === "correct" ? item.answer ?? "correct" : "0";
    const answeredIn = Math.max(1, 6 + index * 5 + (fluency === "hesitant" ? 6 : 0));
    return {
      accuracy: noSpeech ? 0 : outcome === "correct" ? 1 : outcome === "partial" ? 0.5 : 0,
      wordsPerMinute: null,
      speakingSeconds: answeredIn,
      pauseCount: 0,
      longPauseCount: 0,
      hesitationCount: 0,
      matchedWords: outcome === "correct" ? 1 : 0,
      totalWords: 1,
      asrConfidence: null,
      machineConfidence: noSpeech ? 0.2 : 0.97,
      fluency: noSpeech ? "struggling" : fluency,
      reasons: noSpeech
        ? ["No answer was entered.", "The item was recorded as no response."]
        : [
            answer ? `The child entered ${answer}.` : "No answer was entered.",
            outcome === "correct" ? "The answer matched the expected answer." : "The answer did not match the expected answer.",
            `Answered in about ${answeredIn} seconds.`,
          ],
      noSpeech,
      needsReview: noSpeech,
      response: answer,
    };
  }

  const asrConfidence = noSpeech ? null : fluency === "fluent" ? 0.9 : fluency === "hesitant" ? 0.64 : 0.4;
  const matchedWords = Math.max(0, Math.round(expectedWords * accuracy));
  const reasons = noSpeech
    ? ["No speech was detected.", "The item was recorded as no response."]
    : [
        `${matchedWords} of ${expectedWords} expected words matched.`,
        wordsPerMinute
          ? `About ${wordsPerMinute} words per minute.`
          : `Read in about ${speakingSeconds.toFixed(1)} seconds.`,
        fluency === "fluent"
          ? "The reading was steady and accurate."
          : fluency === "hesitant"
            ? "The reading was accurate but hesitant."
            : "Accuracy and pace fell below the expected band.",
        `${Math.round(machineConfidence * 100)}% machine confidence.`,
      ];

  return {
    accuracy,
    wordsPerMinute,
    speakingSeconds,
    pauseCount: noSpeech ? 0 : fluency === "fluent" ? 0 : fluency === "hesitant" ? 3 : 5,
    longPauseCount: noSpeech ? 0 : fluency === "fluent" ? 0 : fluency === "hesitant" ? 1 : 2,
    hesitationCount: noSpeech ? 0 : fluency === "fluent" ? 0 : fluency === "hesitant" ? 1 : 2,
    matchedWords,
    totalWords: expectedWords,
    asrConfidence,
    machineConfidence,
    fluency,
    reasons,
    noSpeech,
    needsReview: noSpeech || (machineConfidence < 0.5 && accuracy >= 0.35),
    response: noSpeech ? "" : expectedText,
  };
}

function buildRungResult(
  subject: SubjectId,
  order: number,
  passed: boolean,
  partialCredit: boolean,
  variant: { hesitant: boolean; noSpeech: boolean },
): RungResult {
  const rung = getRung(subject, order);
  if (!rung) throw new Error(`Missing rung ${subject} ${order}`);
  const items = rung.items.slice(0, Math.min(3, rung.items.length));
  const outcomes: Outcome[] = passed
    ? items.map((_, index) => (index === items.length - 1 && items.length > 2 ? "partial" : "correct"))
    : items.map((_, index) => (index === 1 ? "partial" : "incorrect"));
  const itemResults: ItemResult[] = items.map((item, index) => {
    const metrics = seedAutoMetrics(subject, item, outcomes[index], variant, index);
    const keypad = subject === "maths" && (item.kind === "answer" || item.kind === "dots");
    return {
      itemId: item.id,
      expected: item.spoken ?? item.content,
      heard: metrics.response || undefined,
      outcome: metrics.noSpeech ? "incorrect" : outcomes[index],
      fluency: metrics.fluency,
      support: null,
      method: keypad ? "keypad" : "speech",
      suggestion: metrics.noSpeech ? "incorrect" : outcomes[index],
      match: metrics.accuracy,
      auto: metrics,
    };
  });
  return {
    rungId: rung.id,
    order,
    itemResults,
    score: rungScore(partialCredit, outcomes),
    passed,
  };
}

function buildAssessment(
  learner: Learner,
  subject: SubjectId,
  point: HistoryPoint,
  now: Date,
): Assessment {
  const config = {
    mode: "full" as const,
    pacing: "auto" as const,
    startOrder: 1,
    itemsPerRung: 3,
    passMark: 2,
    maxRungs: 6,
    partialCredit: true,
  };
  const variant = {
    hesitant: learner.code === "SPK-0411" || learner.code === "SPK-0304",
    noSpeech: learner.code === "SPK-0304",
  };
  const results: RungResult[] = [];
  for (let order = 1; order <= point.order; order += 1) {
    results.push(buildRungResult(subject, order, true, true, variant));
  }
  if (point.order < topOrder(subject)) {
    results.push(buildRungResult(subject, point.order + 1, false, true, variant));
  }
  const summary = summariseResults(results, subject, point.order);
  const confidence = assessmentConfidence(summary);
  const needsReview = summary.reviewItems > 0 || confidence === "low";
  const completed = AT(point.daysAgo, 10, 15 + (point.daysAgo % 20), now);
  const started = new Date(completed.getTime() - point.durationSec * 1000);
  return {
    id: `as-${learner.code}-${subject}-${point.daysAgo}`,
    learnerId: learner.id,
    subject,
    config,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationSec: point.durationSec,
    educator: point.educator,
    results,
    suggestedOrder: point.order,
    finalOrder: point.order,
    overridden: false,
    notes: point.notes ?? "",
    confidence,
    machineAssisted: true,
    pacing: "auto",
    autoSummary: summary,
    reviewStatus: needsReview ? "unreviewed" : "confirmed",
    reviewedBy: needsReview ? undefined : point.educator,
    reviewedAt: needsReview ? undefined : new Date(completed.getTime() + 3_600_000).toISOString(),
    teacherNote: "",
  };
}

const speechPrompts = [
  {
    language: "english" as const,
    expected: "The children walk to school together.",
    transcript: "the children walk to school together",
    verdict: "correct" as const,
    daysAgo: 1,
    educator: "Hajira",
  },
  {
    language: "english" as const,
    expected: "water",
    transcript: "wader",
    verdict: "correct" as const,
    daysAgo: 2,
    educator: "Hajira",
  },
  {
    language: "kannada" as const,
    expected: "ನೀರು",
    transcript: "ನೀರು",
    verdict: "correct" as const,
    daysAgo: 3,
    educator: "Hajira",
  },
  {
    language: "english" as const,
    expected: "school",
    transcript: "school",
    verdict: "correct" as const,
    daysAgo: 4,
    educator: "Vismay",
  },
  {
    language: "kannada" as const,
    expected: "ಶಾಲೆ",
    transcript: "ಸಾಲೆ",
    verdict: "correct" as const,
    daysAgo: 5,
    educator: "Hajira",
  },
  {
    language: "english" as const,
    expected: "mother",
    transcript: "other",
    verdict: "incorrect" as const,
    daysAgo: 6,
    educator: "Aashrith",
  },
  {
    language: "kannada" as const,
    expected: "ಮನೆ",
    transcript: "ಮನೆ",
    verdict: "correct" as const,
    daysAgo: 8,
    educator: "Vismay",
  },
  {
    language: "english" as const,
    expected: "The sun rises in the east.",
    transcript: "the sun rises in the east",
    verdict: "correct" as const,
    daysAgo: 9,
    educator: "Sufiyan",
  },
];

export function makeSeedDatabase(now = new Date()): Database {
  const settings = defaultSettings();
  const learners: Learner[] = profiles.map((profile, index) => ({
    id: `lr-${profile.code.toLowerCase()}`,
    code: profile.code,
    enrolledStd: profile.enrolledStd,
    centre: profile.centre,
    homeLanguage: profile.homeLanguage,
    consentOnFile: true,
    createdAt: AT(profile.createdDaysAgo, 9, index, now).toISOString(),
    note: profile.note,
  }));

  const assessments: Assessment[] = [];
  for (const profile of profiles) {
    const learner = learners.find((item) => item.code === profile.code);
    if (!learner) continue;
    for (const subject of SUBJECT_ORDER) {
      const points = profile.history[subject];
      if (!points) continue;
      for (const point of points) {
        assessments.push(buildAssessment(learner, subject, point, now));
      }
    }
  }
  assessments.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  const speechTrials: SpeechTrial[] = speechPrompts.map((prompt, index) => {
    const score = scoreTranscript(prompt.expected, prompt.transcript);
    return {
      id: `sp-${index + 1}`,
      createdAt: AT(prompt.daysAgo, 11, index * 4, now).toISOString(),
      language: prompt.language,
      expected: prompt.expected,
      transcript: prompt.transcript,
      match: score.match,
      suggestion: score.suggestion,
      verdict: prompt.verdict,
      educator: prompt.educator,
      source: "speech" as const,
    };
  });

  return {
    version: 2,
    createdAt: now.toISOString(),
    learners,
    assessments,
    speechTrials,
    settings,
    draft: null,
  };
}

export const SEED_LEARNER_COUNT = profiles.length;
export const SEED_ASSESSMENT_COUNT = profiles.reduce(
  (total, profile) =>
    total +
    Object.values(profile.history).reduce((count, points) => count + (points?.length ?? 0), 0),
  0,
);
