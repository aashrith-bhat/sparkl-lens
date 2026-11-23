import { getRung } from "../data/curriculum";
import type {
  AutoItemMetrics,
  AutoSummary,
  Fluency,
  Item,
  Outcome,
  RungResult,
  SubjectId,
} from "../types";
import { normaliseText, scoreAnswer, scoreTranscript } from "./scoring";

export interface CaptureTiming {
  durationSec: number;
  firstResultAt: number | null;
  lastResultAt: number | null;
  pauseCount: number;
  longPauseCount: number;
  asrConfidence: number | null;
}

const READING_RATE: Record<"english" | "kannada" | "maths", { fluent: number; hesitant: number }> = {
  english: { fluent: 35, hesitant: 15 },
  kannada: { fluent: 22, hesitant: 9 },
  maths: { fluent: 35, hesitant: 15 },
};

const FILLER_WORDS = new Set([
  "uh",
  "um",
  "erm",
  "hmm",
  "ah",
  "aah",
  "ಅ",
  "ಆ",
  "ಉಂ",
  "ಹ್ಮ್",
]);

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function tokenCount(text: string): number {
  const normalised = normaliseText(text);
  return normalised ? normalised.split(" ").length : 0;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function uniqueReasons(reasons: string[], limit = 5): string[] {
  return Array.from(new Set(reasons.filter(Boolean))).slice(0, limit);
}

function readingSeconds(timing: CaptureTiming): number {
  if (timing.firstResultAt && timing.lastResultAt && timing.lastResultAt > timing.firstResultAt) {
    return Math.max(0.7, (timing.lastResultAt - timing.firstResultAt) / 1000);
  }
  return Math.max(0.7, timing.durationSec || 1);
}

function countHesitations(transcript: string): number {
  const tokens = normaliseText(transcript).split(" ").filter(Boolean);
  let count = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    if (FILLER_WORDS.has(tokens[index])) count += 1;
    if (index > 0 && tokens[index] === tokens[index - 1]) count += 1;
  }
  return count;
}

function visible(text: string, max = 90): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export interface AutoAnalysis {
  outcome: Outcome;
  metrics: AutoItemMetrics;
}

export function analyseReading(
  subject: SubjectId,
  item: Item,
  transcript: string,
  timing: CaptureTiming,
): AutoAnalysis {
  const expected =
    item.kind === "comprehension"
      ? item.answer ?? item.content
      : item.spoken ?? item.content;
  const score = scoreTranscript(expected, transcript);
  const spokenWords = tokenCount(transcript);
  const expectedWords = tokenCount(expected);
  const noSpeech = !normaliseText(transcript);
  const reading = readingSeconds(timing);
  const passages = expectedWords > 8 && item.kind === "read";
  const rawWpm = passages && reading > 0 ? Math.round((spokenWords / reading) * 60) : null;
  // Browser timings can compress a passage into a second; cap implausible rates.
  const wpm = rawWpm === null ? null : Math.min(220, rawWpm);
  const pauses = Math.max(0, timing.pauseCount);
  const longPauses = Math.max(0, timing.longPauseCount);
  const hesitations = countHesitations(transcript);
  const asr = timing.asrConfidence && timing.asrConfidence > 0 ? timing.asrConfidence : 0.55;
  const rates = READING_RATE[subject] ?? READING_RATE.english;
  const accuracy = score.match;
  const isComprehension = item.kind === "comprehension";
  let fluency: Fluency;

  if (noSpeech || accuracy < 0.32) {
    fluency = "struggling";
  } else if (isComprehension) {
    fluency = accuracy >= 0.7 ? "fluent" : accuracy >= 0.4 ? "hesitant" : "struggling";
  } else if (passages) {
    const fastEnough = (wpm ?? 0) >= rates.fluent;
    const steadyEnough = (wpm ?? 0) >= rates.hesitant;
    if (accuracy >= 0.85 && fastEnough && longPauses === 0 && pauses <= 3 && hesitations <= 1) {
      fluency = "fluent";
    } else if (accuracy >= 0.55 && steadyEnough && longPauses <= 2) {
      fluency = "hesitant";
    } else {
      fluency = "struggling";
    }
  } else {
    const expectedSeconds = 1.2 + expectedWords * 0.55;
    if (accuracy >= 0.85 && reading <= expectedSeconds * 1.35 && longPauses === 0 && hesitations === 0) {
      fluency = "fluent";
    } else if (accuracy >= 0.55 && reading <= expectedSeconds * 2.3) {
      fluency = "hesitant";
    } else {
      fluency = "struggling";
    }
  }

  const coverage = expectedWords ? clamp01(spokenWords / expectedWords) : 1;
  let confidence = 0.35 + 0.25 * asr + 0.2 * coverage + 0.2 * accuracy;
  if (noSpeech) confidence = 0.18;
  if (score.scriptMismatch) confidence = Math.min(confidence, 0.35);
  if (isComprehension) confidence = Math.min(confidence, 0.68);
  if (item.kind === "say") confidence = Math.min(confidence, 0.62);
  if (subject === "kannada" && passages) confidence = Math.min(confidence, 0.82);
  confidence = clamp01(confidence);

  const needsReview =
    noSpeech ||
    score.scriptMismatch ||
    isComprehension ||
    item.kind === "say" ||
    (confidence < 0.55 && accuracy >= 0.35);

  const reasons: string[] = [];
  if (noSpeech) reasons.push("No speech was detected.");
  if (score.scriptMismatch) reasons.push("The Kannada transcript script did not match the item.");
  reasons.push(`${score.matchedTokens} of ${score.totalTokens} expected words matched.`);
  if (wpm !== null) reasons.push(`About ${wpm} words per minute.`);
  else reasons.push(`Read in about ${reading.toFixed(1)} seconds.`);
  if (pauses) reasons.push(`${pauses} likely pause${pauses === 1 ? "" : "s"} while reading.`);
  if (longPauses) reasons.push(`${longPauses} long pause${longPauses === 1 ? "" : "s"}.`);
  if (hesitations) reasons.push(`${hesitations} hesitation${hesitations === 1 ? "" : "s"} in the transcript.`);
  reasons.push(`${Math.round(confidence * 100)}% machine confidence.`);

  const outcome: Outcome = noSpeech
    ? "incorrect"
    : accuracy >= (passages ? 0.78 : 0.84)
      ? "correct"
      : accuracy >= 0.5
        ? "partial"
        : "incorrect";

  return {
    outcome,
    metrics: {
      accuracy,
      wordsPerMinute: wpm,
      speakingSeconds: Number(reading.toFixed(1)),
      pauseCount: pauses,
      longPauseCount: longPauses,
      hesitationCount: hesitations,
      matchedWords: score.matchedTokens,
      totalWords: score.totalTokens,
      asrConfidence: timing.asrConfidence,
      machineConfidence: confidence,
      fluency,
      reasons: uniqueReasons(reasons, 6),
      noSpeech,
      needsReview,
      response: visible(transcript, 300),
    },
  };
}

export function analyseMaths(item: Item, answer: string, durationSec: number): AutoAnalysis {
  const response = answer.trim();
  const outcome = response ? scoreAnswer(item, response) : "incorrect";
  const accuracy = outcome === "correct" ? 1 : outcome === "partial" ? 0.5 : 0;
  const fluency: Fluency =
    outcome === "correct" && durationSec <= 25
      ? "fluent"
      : outcome === "correct" || outcome === "partial"
        ? "hesitant"
        : "struggling";
  const noSpeech = !response;
  const confidence = noSpeech ? 0.18 : 0.96;
  const reasons = [
    noSpeech ? "No answer was entered." : `The child entered ${response}.`,
    outcome === "correct" ? "The answer matched the expected answer." : "The answer did not match the expected answer.",
    `Answered in about ${Math.max(1, Math.round(durationSec))} seconds.`,
  ];

  return {
    outcome,
    metrics: {
      accuracy,
      wordsPerMinute: null,
      speakingSeconds: Math.max(1, Math.round(durationSec)),
      pauseCount: 0,
      longPauseCount: 0,
      hesitationCount: 0,
      matchedWords: outcome === "correct" ? 1 : 0,
      totalWords: 1,
      asrConfidence: null,
      machineConfidence: confidence,
      fluency,
      reasons,
      noSpeech,
      needsReview: noSpeech,
      response,
    },
  };
}

export function overallFluency(fluencies: Array<Fluency | null | undefined>): Fluency {
  const counts = { fluent: 0, hesitant: 0, struggling: 0 };
  for (const fluency of fluencies) if (fluency) counts[fluency] += 1;
  if (!counts.fluent && !counts.hesitant && !counts.struggling) return "hesitant";
  if (counts.struggling > counts.fluent + counts.hesitant) return "struggling";
  if (counts.fluent >= counts.hesitant && counts.fluent >= counts.struggling) return "fluent";
  return "hesitant";
}

export function assessmentConfidence(summary: AutoSummary): "high" | "medium" | "low" {
  if (summary.machineConfidence >= 0.72 && summary.reviewItems === 0 && summary.noSpeechItems === 0) {
    return "high";
  }
  if (summary.machineConfidence >= 0.5 && summary.noSpeechItems <= 1) return "medium";
  return "low";
}

export function summariseResults(
  results: RungResult[],
  subject: SubjectId,
  finalOrder: number,
): AutoSummary {
  const itemResults = results.flatMap((rung) => rung.itemResults);
  const auto = itemResults.map((item) => item.auto).filter((item) => Boolean(item));
  const fluency = overallFluency(auto.map((item) => item!.fluency));
  const accuracy = auto.length
    ? auto.reduce((sum, item) => sum + item!.accuracy, 0) / auto.length
    : itemResults.length
      ? itemResults.reduce(
          (sum, item) =>
            sum + (item.outcome === "correct" ? 1 : item.outcome === "partial" ? 0.5 : 0),
          0,
        ) / itemResults.length
      : 0;
  const wpm = median(auto.map((item) => item!.wordsPerMinute).filter((value): value is number => value !== null));
  const machineConfidence = auto.length
    ? auto.reduce((sum, item) => sum + item!.machineConfidence, 0) / auto.length
    : 0.7;
  const noSpeechItems = auto.filter((item) => item!.noSpeech).length;
  const reviewItems = auto.filter((item) => item!.needsReview).length;
  const reasons = uniqueReasons(auto.flatMap((item) => item!.reasons), 5);
  const levelName =
    finalOrder > 0 ? getRung(subject, finalOrder)?.name ?? "the highest rung" : "below rung 1";
  const summary = `Automatically assessed ${itemResults.length} item${
    itemResults.length === 1 ? "" : "s"
  } across ${results.length} rung${results.length === 1 ? "" : "s"}. Overall accuracy ${Math.round(
    accuracy * 100,
  )}%${wpm !== null ? `, about ${Math.round(wpm)} words per minute` : ""}. Demonstrated level: ${levelName}.`;

  return {
    accuracy,
    wordsPerMinute: wpm,
    fluency,
    machineConfidence,
    noSpeechItems,
    reviewItems,
    reasons,
    summary,
  };
}
