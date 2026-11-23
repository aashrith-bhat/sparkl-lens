import { useEffect, useMemo, useState } from "react";
import { getRung, getSubject, SUBJECT_ORDER } from "../data/curriculum";
import type { Assessment, Learner, SubjectId } from "../types";
import { useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { formatDate, relativeDate } from "../lib/format";
import {
  assessmentFluency,
  assessmentMetrics,
  fluencyLabel,
  needsQuickCheck,
} from "../lib/reporting";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { Pill } from "../components/Pill";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";

type SubjectFilter = "all" | SubjectId;

const SUBJECT_NAME: Record<SubjectId, string> = {
  kannada: "Kannada",
  english: "English",
  maths: "Maths",
};

export function ReportsPage() {
  const db = useDB();
  const route = useHashRoute();
  const [search, setSearch] = useState(route.query.get("q") ?? "");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [quickOnly, setQuickOnly] = useState(false);
  const [centre, setCentre] = useState("all");

  useEffect(() => {
    setSearch(route.query.get("q") ?? "");
  }, [route.hash]);

  const centres = Array.from(new Set(db.learners.map((learner) => learner.centre))).sort();
  const learnerMap = useMemo(
    () => new Map(db.learners.map((learner) => [learner.id, learner])),
    [db.learners],
  );
  const sorted = useMemo(
    () =>
      [...db.assessments].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    [db.assessments],
  );

  const latestReports = useMemo(() => {
    const seen = new Set<string>();
    const latest: Assessment[] = [];
    for (const assessment of sorted) {
      const key = `${assessment.learnerId}:${assessment.subject}`;
      if (seen.has(key)) continue;
      seen.add(key);
      latest.push(assessment);
    }
    return latest;
  }, [sorted]);

  const thisMonth = sorted.filter((assessment) => {
    const date = new Date(assessment.completedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const checkCount = sorted.filter(needsQuickCheck).length;
  const noSpeechCount = sorted.filter(
    (assessment) => (assessment.autoSummary?.noSpeechItems ?? 0) > 0,
  ).length;
  const fluencyCounts = {
    fluent: latestReports.filter((a) => assessmentFluency(a) === "fluent").length,
    hesitant: latestReports.filter((a) => assessmentFluency(a) === "hesitant").length,
    struggling: latestReports.filter((a) => assessmentFluency(a) === "struggling").length,
  };
  const latestTotal = latestReports.length || 1;

  const breakdown = useMemo(() => {
    const counts = new Map<string, { subject: SubjectId; label: string; count: number }>();
    for (const assessment of latestReports) {
      const failed = [...assessment.results]
        .filter((result) => !result.passed)
        .sort((a, b) => a.order - b.order)[0];
      if (!failed) continue;
      const rung = getRung(assessment.subject, failed.order);
      const key = `${assessment.subject}:${failed.order}`;
      const current = counts.get(key);
      if (current) current.count += 1;
      else
        counts.set(key, {
          subject: assessment.subject,
          label: rung?.name ?? `Rung ${failed.order}`,
          count: 1,
        });
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [latestReports]);

  const filtered = sorted.filter((assessment) => {
    const learner = learnerMap.get(assessment.learnerId);
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      (learner?.code.toLowerCase().includes(needle) ?? false) ||
      (learner?.centre.toLowerCase().includes(needle) ?? false);
    const matchesSubject = subject === "all" || assessment.subject === subject;
    const matchesCentre = centre === "all" || learner?.centre === centre;
    const matchesQuick = !quickOnly || needsQuickCheck(assessment);
    return matchesSearch && matchesSubject && matchesCentre && matchesQuick;
  });

  const topChecks = sorted.filter(needsQuickCheck).slice(0, 3);

  return (
    <>
      <PageHeader
        title="Reports"
        subline="Automatic and educator-assisted assessment evidence, newest first. Open a report to see accuracy, pace, pauses, transcripts and the next teaching step."
        actions={
          <a className="btn btn-primary" href="#/assess">
            Start an assessment <Icon name="arrow-right" size={14} />
          </a>
        }
      />

      <section className="metric-strip" aria-label="Reports at a glance">
        <div className="metric-cell">
          <span className="metric-label">Reports</span>
          <span className="metric-value num">{sorted.length}</span>
          <span className="metric-sub">{thisMonth} this month</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Need a quick check</span>
          <span className="metric-value num">{checkCount}</span>
          <span className="metric-sub">low confidence or no speech</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">No-speech sessions</span>
          <span className="metric-value num">{noSpeechCount}</span>
          <span className="metric-sub">provisional evidence</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Latest reports</span>
          <span className="metric-value num">{latestReports.length}</span>
          <span className="metric-sub">one per learner and subject</span>
        </div>
      </section>

      <div className="reports-insights">
        <section className="panel reports-insight" aria-labelledby="fluency-mix-title">
          <div className="section-head">
            <div>
              <h2 id="fluency-mix-title">Fluency at a glance</h2>
              <p className="section-sub">Latest report per learner and subject.</p>
            </div>
            <span className="section-action">{latestReports.length} reports</span>
          </div>
          <div className="fluency-stack" role="img" aria-label="Fluency mix across latest reports">
            <span
              className="fluency-part is-fluent"
              style={{ width: `${(fluencyCounts.fluent / latestTotal) * 100}%` }}
            />
            <span
              className="fluency-part is-hesitant"
              style={{ width: `${(fluencyCounts.hesitant / latestTotal) * 100}%` }}
            />
            <span
              className="fluency-part is-struggling"
              style={{ width: `${(fluencyCounts.struggling / latestTotal) * 100}%` }}
            />
          </div>
          <div className="fluency-legend">
            <span><i className="fluency-dot is-fluent" /> Fluent <strong>{fluencyCounts.fluent}</strong></span>
            <span><i className="fluency-dot is-hesitant" /> Hesitant <strong>{fluencyCounts.hesitant}</strong></span>
            <span><i className="fluency-dot is-struggling" /> Struggling <strong>{fluencyCounts.struggling}</strong></span>
          </div>
          <p className="reports-insight-foot">
            Fluency comes from accuracy, pace and pauses. It is not a clinical measure.
          </p>
        </section>

        <section className="panel reports-insight" aria-labelledby="breakdown-title">
          <div className="section-head">
            <div>
              <h2 id="breakdown-title">Where reading breaks down</h2>
              <p className="section-sub">The first rung that stopped the ladder, in the latest reports.</p>
            </div>
          </div>
          {breakdown.length ? (
            <div className="breakdown-list">
              {breakdown.map((row) => (
                <div className="breakdown-row" key={`${row.subject}-${row.label}`}>
                  <span className="breakdown-subject">{SUBJECT_NAME[row.subject]}</span>
                  <span className="breakdown-label">{row.label}</span>
                  <span className="breakdown-count num">{row.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="small muted">No breakdown recorded in the latest reports.</p>
          )}
          <p className="reports-insight-foot">
            A breakdown is useful information: it is the next teaching edge, not a label for the child.
          </p>
        </section>

        <section className="panel reports-insight" aria-labelledby="checks-title">
          <div className="section-head">
            <div>
              <h2 id="checks-title">Needs a quick check</h2>
              <p className="section-sub">Low-confidence or no-speech reports to glance at first.</p>
            </div>
            <a className="section-action" href="#/reports">
              All reports
            </a>
          </div>
          {topChecks.length ? (
            <div className="check-list-reports">
              {topChecks.map((assessment) => {
                const learner = learnerMap.get(assessment.learnerId);
                return (
                  <a
                    className="check-report-row"
                    key={assessment.id}
                    href={`#/reports/${assessment.id}`}
                  >
                    <Avatar code={learner?.code ?? "SPK"} size={26} />
                    <span>
                      <span className="check-report-code">{learner?.code ?? "Learner"}</span>
                      <span className="check-report-sub">
                        {SUBJECT_NAME[assessment.subject]} · {relativeDate(assessment.completedAt)}
                      </span>
                    </span>
                    <Pill tone="warning">Check</Pill>
                    <Icon name="chevron-right" size={13} />
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="small muted">No report is currently flagged.</p>
          )}
          <p className="reports-insight-foot">
            These are spot checks, not per-item marking. The report is already saved.
          </p>
        </section>
      </div>

      <div className="filter-row reports-filter">
        <label className="filter-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Learner code or centre"
            aria-label="Search reports"
          />
        </label>
        <select
          className="select filter-select"
          value={subject}
          onChange={(event) => setSubject(event.target.value as SubjectFilter)}
          aria-label="Filter by subject"
        >
          <option value="all">All subjects</option>
          {SUBJECT_ORDER.map((id) => (
            <option key={id} value={id}>
              {SUBJECT_NAME[id]}
            </option>
          ))}
        </select>
        <select
          className="select filter-select"
          value={centre}
          onChange={(event) => setCentre(event.target.value)}
          aria-label="Filter by centre"
        >
          <option value="all">All centres</option>
          {centres.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={quickOnly}
            onChange={(event) => setQuickOnly(event.target.checked)}
          />
          Needs a check
        </label>
        <span className="filter-count">{filtered.length} reports</span>
      </div>

      {filtered.length ? (
        <>
          <div className="panel panel--flush reports-table-wrap">
            <div className="table-wrap">
              <table className="table reports-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Learner</th>
                    <th>Subject</th>
                    <th>Demonstrated level</th>
                    <th>Fluency</th>
                    <th className="num">Accuracy</th>
                    <th className="num">Pace</th>
                    <th>Review</th>
                    <th aria-label="Open report" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((assessment) => {
                    const learner = learnerMap.get(assessment.learnerId);
                    const rung =
                      assessment.finalOrder > 0
                        ? getRung(assessment.subject, assessment.finalOrder)
                        : null;
                    const metrics = assessmentMetrics(assessment);
                    const flagged = needsQuickCheck(assessment);
                    return (
                      <tr
                        key={assessment.id}
                        onClick={() => route.navigate(`/reports/${assessment.id}`)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") route.navigate(`/reports/${assessment.id}`);
                        }}
                      >
                        <td className="nowrap">
                          <span className="cell-main">{formatDate(assessment.completedAt, false)}</span>
                          <span className="cell-sub">{relativeDate(assessment.completedAt)}</span>
                        </td>
                        <td>
                          <span className="table-identity">
                            <Avatar code={learner?.code ?? "SPK"} size={24} />
                            <span>
                              <span className="cell-main">{learner?.code ?? "Learner"}</span>
                              <span className="cell-sub">Std {learner?.enrolledStd ?? "—"}</span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className={`report-subject is-${assessment.subject}`}>
                            {SUBJECT_NAME[assessment.subject]}
                          </span>
                        </td>
                        <td>
                          <span className="cell-main">{rung?.name ?? "Below rung 1"}</span>
                          <span className="cell-sub">
                            {rung ? `Std ${rung.benchmark} benchmark` : "foundational"}
                          </span>
                        </td>
                        <td>
                          <span className={`fluency-inline is-${assessmentFluency(assessment)}`}>
                            {fluencyLabel(assessmentFluency(assessment))}
                          </span>
                        </td>
                        <td className="num">{Math.round(metrics.accuracy * 100)}%</td>
                        <td className="num">
                          {metrics.wordsPerMinute ? `${Math.round(metrics.wordsPerMinute)} wpm` : "—"}
                        </td>
                        <td>
                          {flagged ? (
                            <Pill tone="warning">Check</Pill>
                          ) : (
                            <span className="faint">—</span>
                          )}
                        </td>
                        <td>
                          <Icon name="chevron-right" size={14} className="row-chevron" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="reports-mobile-list">
            {filtered.map((assessment) => {
              const learner = learnerMap.get(assessment.learnerId);
              const rung =
                assessment.finalOrder > 0
                  ? getRung(assessment.subject, assessment.finalOrder)
                  : null;
              const metrics = assessmentMetrics(assessment);
              const flagged = needsQuickCheck(assessment);
              return (
                <a
                  className="report-mobile-card"
                  key={assessment.id}
                  href={`#/reports/${assessment.id}`}
                >
                  <div className="report-mobile-head">
                    <Avatar code={learner?.code ?? "SPK"} size={28} />
                    <div>
                      <span className="report-mobile-code">{learner?.code ?? "Learner"}</span>
                      <span className="report-mobile-sub">
                        {SUBJECT_NAME[assessment.subject]} · {relativeDate(assessment.completedAt)}
                      </span>
                    </div>
                    {flagged ? <Pill tone="warning">Check</Pill> : null}
                    <Icon name="chevron-right" size={14} />
                  </div>
                  <div className="report-mobile-level">
                    <span className="report-mobile-level-name">{rung?.name ?? "Below rung 1"}</span>
                    <span className={`fluency-inline is-${assessmentFluency(assessment)}`}>
                      {fluencyLabel(assessmentFluency(assessment))}
                    </span>
                  </div>
                  <div className="report-mobile-metrics">
                    <span>{Math.round(metrics.accuracy * 100)}% accuracy</span>
                    <span>{metrics.wordsPerMinute ? `${Math.round(metrics.wordsPerMinute)} wpm` : "pace not measured"}</span>
                    <span>Std {rung?.benchmark ?? "—"} benchmark</span>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          title="No reports match these filters"
          body="Clear the filters, or start an assessment to create the first report."
          action={
            <a className="btn btn-primary" href="#/assess">
              Start an assessment
            </a>
          }
        />
      )}

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        Reports are stored only in this browser. Open a report for the full evidence and the optional
        teacher check.
      </p>
    </>
  );
}
