import { getRung, getSubject, topOrder } from "../data/curriculum";
import type {
  Assessment,
  AutoItemMetrics,
  Fluency,
  ItemResult,
  Learner,
  RungResult,
  Settings,
} from "../types";
import { overallFluency } from "./autoAssess";
import { expectedOrderFor } from "./selectors";

export interface RungAggregate {
  accuracy: number;
  fluency: Fluency;
  wordsPerMinute: number | null;
  confidence: number;
  noSpeechItems: number;
  reviewItems: number;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function rungAggregate(result: RungResult): RungAggregate {
  const auto = result.itemResults.map((item) => item.auto).filter((item) => Boolean(item));
  const fluency = overallFluency(
    result.itemResults.map((item) => item.auto?.fluency ?? item.fluency),
  );
  if (!auto.length) {
    return {
      accuracy:
        result.itemResults.reduce(
          (sum, item) => sum + (item.outcome === "correct" ? 1 : item.outcome === "partial" ? 0.5 : 0),
          0,
        ) / Math.max(1, result.itemResults.length),
      fluency,
      wordsPerMinute: null,
      confidence: 0.7,
      noSpeechItems: 0,
      reviewItems: 0,
    };
  }
  return {
    accuracy: auto.reduce((sum, item) => sum + item!.accuracy, 0) / auto.length,
    fluency,
    wordsPerMinute: median(
      auto.map((item) => item!.wordsPerMinute).filter((value): value is number => value !== null),
    ),
    confidence: auto.reduce((sum, item) => sum + item!.machineConfidence, 0) / auto.length,
    noSpeechItems: auto.filter((item) => item!.noSpeech).length,
    reviewItems: auto.filter((item) => item!.needsReview).length,
  };
}

export function fluencyLabel(fluency: Fluency | null | undefined): string {
  if (fluency === "fluent") return "Fluent";
  if (fluency === "hesitant") return "Hesitant";
  if (fluency === "struggling") return "Struggling";
  return "Not scored";
}

export function confidenceLabel(value: number): string {
  if (value >= 0.72) return "High";
  if (value >= 0.5) return "Medium";
  return "Low";
}

export function needsQuickCheck(assessment: Assessment): boolean {
  if (assessment.reviewStatus === "confirmed" || assessment.reviewStatus === "adjusted") return false;
  return (
    assessment.confidence === "low" ||
    (assessment.autoSummary?.reviewItems ?? 0) > 0 ||
    (assessment.autoSummary?.noSpeechItems ?? 0) > 0
  );
}

export function buildNarrative({
  assessment,
  learner,
  settings,
  previous,
}: {
  assessment: Assessment;
  learner: Learner;
  settings: Settings;
  previous: Assessment | null;
}): string {
  const subject = getSubject(assessment.subject);
  const rung = assessment.finalOrder > 0 ? getRung(assessment.subject, assessment.finalOrder) : null;
  const expectedOrder = expectedOrderFor(assessment.subject, learner.enrolledStd, settings);
  const gap = Math.max(0, expectedOrder - assessment.finalOrder);
  const auto = assessment.autoSummary;
  const failed = assessment.results
    .filter((result) => !result.passed)
    .sort((a, b) => a.order - b.order)[0];
  const failedRung = failed ? getRung(assessment.subject, failed.order) : null;
  const failedMetrics = failed ? rungAggregate(failed) : null;
  const atTop = assessment.finalOrder >= topOrder(assessment.subject);

  const levelSentence =
    assessment.finalOrder === 0
      ? `${learner.code} did not clear the first rung of the draft ${subject.name} ladder.`
      : `${learner.code} demonstrated the ${rung?.name} level in ${subject.name}${
          rung ? ` (Std ${rung.benchmark} benchmark)` : ""
        }, ${gap === 0 ? "at or above the benchmark for their enrolled standard." : `${gap} rung${
            gap === 1 ? "" : "s"
          } below the benchmark for Std ${learner.enrolledStd}.`}`;

  const endedEarly =
    !failed &&
    assessment.results.length < assessment.config.maxRungs &&
    assessment.finalOrder < topOrder(assessment.subject);

  const detailSentence = failedRung
    ? `The ladder stopped at ${failedRung.name}: ${Math.round(
        (failedMetrics?.accuracy ?? 0) * 100,
      )}% ${assessment.subject === "maths" ? "answer" : "word"} accuracy and ${fluencyLabel(
        failedMetrics?.fluency,
      ).toLowerCase()} reading.`
    : endedEarly
      ? `The run was stopped after ${assessment.results.length} rung${
          assessment.results.length === 1 ? "" : "s"
        } with no breakdown recorded, so treat the level as provisional.`
      : atTop
        ? "The child reached the top of this draft ladder; the next check needs to go beyond these six rungs."
        : `The run ended after ${assessment.results.length} rung${
            assessment.results.length === 1 ? "" : "s"
          } with no breakdown observed.`;

  const confidenceSentence = auto
    ? `The system's overall accuracy was ${Math.round(auto.accuracy * 100)}%${
        auto.wordsPerMinute ? `, at about ${Math.round(auto.wordsPerMinute)} words per minute` : ""
      }. ${assessment.confidence === "low" || (auto.reviewItems > 0)
        ? `${auto.reviewItems} item${auto.reviewItems === 1 ? "" : "s"} ${
            auto.reviewItems === 1 ? "is" : "are"
          } flagged for a quick check.`
        : "No low-confidence items were flagged."
      }`
    : "This assessment was marked by the educator; automatic speech metrics are not available.";

  const progressSentence =
    previous && previous.id !== assessment.id
      ? `The previous ${subject.name} report recorded ${getRung(previous.subject, previous.finalOrder)?.name ?? "below rung 1"}.`
      : "";

  return [levelSentence, detailSentence, confidenceSentence, progressSentence]
    .filter(Boolean)
    .join(" ");
}

export function buildTeachingPlan(assessment: Assessment): Array<{ title: string; body: string }> {
  const rung = assessment.finalOrder > 0 ? getRung(assessment.subject, assessment.finalOrder) : null;
  const failed = assessment.results
    .filter((result) => !result.passed)
    .sort((a, b) => a.order - b.order)[0];
  const failedRung = failed ? getRung(assessment.subject, failed.order) : null;
  const firstRung = getRung(assessment.subject, 1);
  return [
    {
      title: rung ? `Keep practising ${rung.name.toLowerCase()}` : "Start at the first rung",
      body: rung?.nextStep ?? firstRung?.nextStep ?? "Start with the first rung and note what the child can do.",
    },
    {
      title: failedRung ? `Revisit ${failedRung.name.toLowerCase()}` : "Hold this level steady",
      body: failedRung
        ? `${failedRung.nextStep} Use short, supported practice before asking for a full passage again.`
        : "Add one new passage each week and keep the same pass rule so the next comparison is fair.",
    },
    {
      title: "Check again in two to three weeks",
      body: "Keep the same items and rule. Look for fewer pauses and steadier pace before moving up a rung.",
    },
  ];
}

export function reportItemLabel(itemResult: ItemResult): string {
  if (itemResult.outcome === "correct") return "Correct";
  if (itemResult.outcome === "partial") return "Partial";
  return "Not yet";
}

export function transcriptFor(itemResult: ItemResult): string {
  return (itemResult.heard ?? itemResult.auto?.response ?? "").trim();
}


export function assessmentFluency(assessment: Assessment): Fluency {
  if (assessment.autoSummary) return assessment.autoSummary.fluency;
  return overallFluency(assessment.results.flatMap((result) => result.itemResults.map((item) => item.fluency)));
}

export function assessmentMetrics(assessment: Assessment): {
  accuracy: number;
  wordsPerMinute: number | null;
  confidence: number;
  secondsPerItem: number | null;
} {
  if (assessment.autoSummary) {
    const auto = assessment.results
      .flatMap((result) => result.itemResults)
      .map((item) => item.auto)
      .filter((item): item is AutoItemMetrics => Boolean(item));
    return {
      accuracy: assessment.autoSummary.accuracy,
      wordsPerMinute: assessment.autoSummary.wordsPerMinute,
      confidence: assessment.autoSummary.machineConfidence,
      secondsPerItem: median(auto.map((item) => item.speakingSeconds)),
    };
  }
  const items = assessment.results.flatMap((result) => result.itemResults);
  const accuracy = items.length
    ? items.reduce(
        (sum, item) => sum + (item.outcome === "correct" ? 1 : item.outcome === "partial" ? 0.5 : 0),
        0,
      ) / items.length
    : 0;
  return { accuracy, wordsPerMinute: null, confidence: 0.7, secondsPerItem: null };
}
