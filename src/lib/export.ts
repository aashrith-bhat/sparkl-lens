import { getRung } from "../data/curriculum";
import type { Assessment, Database, Learner, SubjectId } from "../types";
import { downloadFile, formatDate } from "./format";

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildCsv(rows: Array<Record<string, string | number | boolean | null>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

const SUBJECT_LABEL: Record<SubjectId, string> = {
  kannada: "Kannada",
  english: "English",
  maths: "Maths",
};

function safeDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportAssessmentCsv(db: Database): void {
  const learnerMap = new Map(db.learners.map((learner) => [learner.id, learner]));
  const rows = [...db.assessments]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .map((assessment) => {
      const learner = learnerMap.get(assessment.learnerId);
      const rung = getRung(assessment.subject, assessment.finalOrder);
      const benchmark = rung
        ? db.settings.benchmarks[assessment.subject]?.[rung.id] ?? rung.benchmark
        : "";
      return {
        learner_code: learner?.code ?? "—",
        enrolled_std: learner?.enrolledStd ?? "",
        centre: learner?.centre ?? "",
        subject: SUBJECT_LABEL[assessment.subject],
        assessed_on: formatDate(assessment.completedAt),
        level_order: assessment.finalOrder,
        level_name: rung?.name ?? "Below rung 1",
        benchmark_std: benchmark,
        suggested_order: assessment.suggestedOrder,
        educator_overrode: assessment.overridden,
        duration_sec: assessment.durationSec,
        educator: assessment.educator,
        confidence: assessment.confidence,
        notes: assessment.notes,
      };
    });
  downloadFile(`sparkl-assessments-${safeDate()}.csv`, buildCsv(rows), "text/csv;charset=utf-8");
}

export function exportLearnerCsv(db: Database): void {
  const rows = db.learners.map((learner) => ({
    learner_code: learner.code,
    enrolled_std: learner.enrolledStd,
    centre: learner.centre,
    home_language: learner.homeLanguage,
    consent_on_file: learner.consentOnFile,
    created_on: formatDate(learner.createdAt),
    educator_note: learner.note,
  }));
  downloadFile(`sparkl-learners-${safeDate()}.csv`, buildCsv(rows), "text/csv;charset=utf-8");
}

export function exportSpeechCsv(db: Database): void {
  const rows = db.speechTrials.map((trial) => ({
    logged_on: formatDate(trial.createdAt),
    language: trial.language,
    source: trial.source ?? "speech",
    expected: trial.expected,
    transcript: trial.transcript,
    match_percent: Math.round(trial.match * 100),
    machine_suggestion: trial.suggestion ?? "none",
    educator_verdict: trial.verdict,
    educator: trial.educator,
  }));
  downloadFile(`sparkl-speech-trials-${safeDate()}.csv`, buildCsv(rows), "text/csv;charset=utf-8");
}

export function exportJson(db: Database): void {
  const payload = {
    product: "SparkL Lens",
    status: "Draft prototype — rubric pending SparkL review",
    exportedAt: new Date().toISOString(),
    data: { ...db, draft: null },
  };
  downloadFile(
    `sparkl-lens-backup-${safeDate()}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}

export function learnerLabel(learner: Learner | undefined): string {
  return learner?.code ?? "Unknown learner";
}

export function assessmentSummary(assessment: Assessment): string {
  const learner = assessment.learnerId;
  return `${learner} · ${SUBJECT_LABEL[assessment.subject]}`;
}
