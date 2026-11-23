import { getRungs, SUBJECT_ORDER, topOrder } from "../data/curriculum";
import type { Assessment, Learner, Settings, SubjectId } from "../types";

export interface SubjectSnapshot {
  subject: SubjectId;
  assessment: Assessment | null;
  levelOrder: number | null;
  benchmarkOrder: number;
  gap: number | null;
  below: boolean;
  atCeiling: boolean;
}

export function expectedOrderFor(
  subject: SubjectId,
  enrolledStd: number,
  settings: Settings,
): number {
  let expected = 1;
  for (const rung of getRungs(subject)) {
    const benchmark = settings.benchmarks[subject]?.[rung.id] ?? rung.benchmark;
    if (benchmark <= enrolledStd) expected = rung.order;
  }
  return expected;
}

export function latestAssessment(
  assessments: Assessment[],
  learnerId: string,
  subject: SubjectId,
): Assessment | null {
  const matching = assessments
    .filter((item) => item.learnerId === learnerId && item.subject === subject)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  return matching[0] ?? null;
}

export function latestAssessmentsForLearner(
  assessments: Assessment[],
  learnerId: string,
): Record<SubjectId, Assessment | null> {
  return {
    kannada: latestAssessment(assessments, learnerId, "kannada"),
    english: latestAssessment(assessments, learnerId, "english"),
    maths: latestAssessment(assessments, learnerId, "maths"),
  };
}

export function subjectSnapshots(
  learner: Learner,
  assessments: Assessment[],
  settings: Settings,
): SubjectSnapshot[] {
  return SUBJECT_ORDER.map((subject) => {
    const assessment = latestAssessment(assessments, learner.id, subject);
    const benchmarkOrder = expectedOrderFor(subject, learner.enrolledStd, settings);
    const levelOrder = assessment ? assessment.finalOrder : null;
    const gap = levelOrder === null ? null : Math.max(0, benchmarkOrder - levelOrder);
    return {
      subject,
      assessment,
      levelOrder,
      benchmarkOrder,
      gap,
      below: levelOrder !== null && levelOrder < benchmarkOrder,
      atCeiling: levelOrder !== null && levelOrder >= topOrder(subject),
    };
  });
}

export function latestDateForLearner(assessments: Assessment[], learnerId: string): string | null {
  const dates = assessments
    .filter((item) => item.learnerId === learnerId)
    .map((item) => new Date(item.completedAt).getTime());
  if (!dates.length) return null;
  return new Date(Math.max(...dates)).toISOString();
}

export function assessmentsForLearner(
  assessments: Assessment[],
  learnerId: string,
  subject?: SubjectId,
): Assessment[] {
  return assessments
    .filter((item) => item.learnerId === learnerId && (!subject || item.subject === subject))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function learnerNeedsAttention(
  learner: Learner,
  assessments: Assessment[],
  settings: Settings,
): { gap: number; subject: SubjectId; lastDate: string | null } | null {
  const snapshots = subjectSnapshots(learner, assessments, settings);
  const assessed = snapshots.filter((snapshot) => snapshot.gap !== null);
  if (!assessed.length) return null;
  const worst = assessed.reduce((current, snapshot) =>
    (snapshot.gap ?? 0) > (current.gap ?? 0) ? snapshot : current,
  );
  return {
    gap: worst.gap ?? 0,
    subject: worst.subject,
    lastDate: latestDateForLearner(assessments, learner.id),
  };
}

export function watchlist(
  learners: Learner[],
  assessments: Assessment[],
  settings: Settings,
  limit = 4,
): Array<{ learner: Learner; gap: number; subject: SubjectId; lastDate: string | null }> {
  return learners
    .map((learner) => {
      const attention = learnerNeedsAttention(learner, assessments, settings);
      return attention ? { learner, ...attention } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null && entry.gap > 0)
    .sort((a, b) => {
      if (b.gap !== a.gap) return b.gap - a.gap;
      return (a.lastDate ?? "").localeCompare(b.lastDate ?? "");
    })
    .slice(0, limit);
}

export function assessmentsThisMonth(assessments: Assessment[], now = new Date()): Assessment[] {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return assessments.filter((item) => new Date(item.completedAt).getTime() >= start);
}

export function belowBenchmarkCount(
  learners: Learner[],
  assessments: Assessment[],
  settings: Settings,
): { below: number; assessed: number } {
  let below = 0;
  let assessed = 0;
  for (const learner of learners) {
    const snapshots = subjectSnapshots(learner, assessments, settings).filter(
      (snapshot) => snapshot.levelOrder !== null,
    );
    if (!snapshots.length) continue;
    assessed += 1;
    if (snapshots.some((snapshot) => snapshot.below)) below += 1;
  }
  return { below, assessed };
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function levelDistribution(
  learners: Learner[],
  assessments: Assessment[],
  subject: SubjectId,
): { counts: number[]; assessed: number } {
  const counts = new Array(topOrder(subject) + 1).fill(0) as number[];
  let assessed = 0;
  for (const learner of learners) {
    const assessment = latestAssessment(assessments, learner.id, subject);
    if (!assessment) continue;
    assessed += 1;
    counts[Math.max(0, Math.min(counts.length - 1, assessment.finalOrder))] += 1;
  }
  return { counts, assessed };
}

export function progressSeries(
  assessments: Assessment[],
  learnerId: string,
  subject: SubjectId,
): Array<{ date: string; order: number; id: string }> {
  return assessments
    .filter((item) => item.learnerId === learnerId && item.subject === subject)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((item) => ({ date: item.completedAt, order: item.finalOrder, id: item.id }));
}

export function learnerByCode(learners: Learner[], code: string): Learner | undefined {
  return learners.find((learner) => learner.code.toLowerCase() === code.toLowerCase());
}
