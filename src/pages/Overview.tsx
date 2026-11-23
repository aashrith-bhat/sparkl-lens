import { useState } from "react";
import { getRung, shortRungName, SUBJECT_ORDER } from "../data/curriculum";
import type { SubjectId } from "../types";
import { useDB } from "../lib/store";
import {
  assessmentsThisMonth,
  belowBenchmarkCount,
  levelDistribution,
  median,
  subjectSnapshots,
  watchlist,
} from "../lib/selectors";
import { relativeDate, formatDuration } from "../lib/format";
import { useHashRoute } from "../lib/router";
import { PageHeader } from "../components/PageHeader";
import { Pill } from "../components/Pill";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { SubjectLabel } from "../components/SubjectLabel";
import { EmptyState } from "../components/EmptyState";

export function OverviewPage() {
  const db = useDB();
  const route = useHashRoute();
  const [spreadSubject, setSpreadSubject] = useState<SubjectId>("kannada");
  const { learners, assessments, settings } = db;

  const { below, assessed } = belowBenchmarkCount(learners, assessments, settings);
  const attention = watchlist(learners, assessments, settings, 4);
  const month = assessmentsThisMonth(assessments);
  const medianSeconds = median(month.map((assessment) => assessment.durationSec));
  const recent = [...assessments]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5);
  const distribution = levelDistribution(learners, assessments, spreadSubject);
  const latest = recent[0]?.completedAt;
  const draft = db.draft;
  const draftLearner = draft ? learners.find((learner) => learner.id === draft.learnerId) : null;

  if (!learners.length) {
    return (
      <>
        <PageHeader
          title="Overview"
          subline="No learners are on this device yet. Add an anonymous learner code to begin."
          actions={
            <a className="btn btn-primary" href="#/assess">
              Start an assessment
            </a>
          }
        />
        <EmptyState
          title="The cohort will appear here"
          body="SparkL Lens keeps one anonymous code per learner, with a separate level for Kannada, English and Maths."
          action={
            <a className="btn" href="#/learners">
              Add the first learner
            </a>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Overview"
        subline={
          <>
            <strong>
              {below} of {assessed}
            </strong>{" "}
            assessed learners are below the foundational benchmark for their standard in at least one
            subject. {latest ? <>Latest record {relativeDate(latest).toLowerCase()}.</> : null}
          </>
        }
        actions={
          <>
            <a className="btn" href="#/learners">
              View learners
            </a>
            <a className="btn btn-primary" href="#/assess">
              Start assessment <Icon name="arrow-right" size={14} />
            </a>
          </>
        }
      />

      {draft && draftLearner ? (
        <div className="resume-strip">
          <span className="resume-copy">
            <span className="status-dot status-dot--accent" />
            <span>
              <strong>{draftLearner.code}</strong> has an assessment in progress in{" "}
              {getSubjectName(draft.subject)}. Pick up where you left off.
            </span>
          </span>
          <a className="btn btn-sm" href="#/session">
            Resume
          </a>
        </div>
      ) : null}

      <div className="grid-12 overview-main">
        <section className="col-7 panel watch-panel" aria-labelledby="watch-title">
          <div className="section-head">
            <div>
              <h2 id="watch-title">Needs a closer look</h2>
              <p className="section-sub">Sorted by the widest gap against the learner's standard.</p>
            </div>
            <a className="section-action" href="#/learners">
              All learners
            </a>
          </div>

          {attention.length ? (
            <div className="watch-list">
              {attention.map(({ learner, gap, subject }) => {
                const snapshots = subjectSnapshots(learner, assessments, settings);
                const lastDate = snapshots
                  .map((snapshot) => snapshot.assessment?.completedAt)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .reverse()[0];
                return (
                  <a
                    className="watch-row"
                    key={learner.id}
                    href={`#/learners/${learner.id}`}
                    aria-label={`Open ${learner.code}, ${gap} rungs below in ${subject}`}
                  >
                    <Avatar code={learner.code} size={30} />
                    <span className="watch-id">
                      <span className="watch-code">{learner.code}</span>
                      <span className="watch-sub">
                        Std {learner.enrolledStd} · {learner.centre}
                        {lastDate ? ` · ${relativeDate(lastDate).toLowerCase()}` : ""}
                      </span>
                    </span>
                    <span className="watch-levels">
                      {snapshots.map((snapshot) => {
                        const rung = snapshot.levelOrder
                          ? getRung(snapshot.subject, snapshot.levelOrder)
                          : null;
                        return (
                          <span
                            key={snapshot.subject}
                            className={`watch-subject ${snapshot.subject === subject ? "is-worst" : ""}`}
                            title={`${getSubjectName(snapshot.subject)}: ${
                              rung ? rung.name : "not assessed"
                            }${snapshot.gap ? ` · ${snapshot.gap} rungs below` : ""}`}
                          >
                            <span className="watch-subject-label">
                              {getSubjectName(snapshot.subject)}
                            </span>
                            <span className="watch-subject-level">
                              {rung ? shortRungName(rung) : "—"}
                            </span>
                          </span>
                        );
                      })}
                    </span>
                    <span className="watch-action">
                      <Pill tone={gap > 0 ? "negative" : "neutral"}>
                        {gap > 0 ? `${gap} ${gap === 1 ? "rung" : "rungs"} below` : "At benchmark"}
                      </Pill>
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No gaps to flag"
              body="Every assessed learner is at or above the foundational benchmark for their standard."
              action={
                <a className="btn btn-sm" href="#/assess">
                  Start an assessment
                </a>
              }
            />
          )}
        </section>

        <section className="col-5 panel spread-panel" aria-labelledby="spread-title">
          <div className="section-head spread-head">
            <div>
              <h2 id="spread-title">Level spread</h2>
              <p className="section-sub">
                Latest {getSubjectName(spreadSubject)} level for {distribution.assessed}{" "}
                {distribution.assessed === 1 ? "learner" : "learners"}.
              </p>
            </div>
          </div>
          <div className="segmented spread-tabs" role="group" aria-label="Choose a subject">
            {SUBJECT_ORDER.map((subject) => (
              <button
                key={subject}
                type="button"
                className={spreadSubject === subject ? "is-active" : ""}
                onClick={() => setSpreadSubject(subject)}
                aria-pressed={spreadSubject === subject}
              >
                {getSubjectName(subject)}
              </button>
            ))}
          </div>
          <div
            className="spread-chart"
            role="img"
            aria-label={`Distribution of latest ${spreadSubject} levels across ${distribution.assessed} learners; ${distribution.counts[0]} below rung 1`}
          >
            {distribution.counts.slice(1).map((count, index) => {
              const order = index + 1;
              const bins = distribution.counts.slice(1);
              const max = Math.max(1, ...bins);
              const height = count === 0 ? 2 : Math.max(8, (count / max) * 100);
              const rung = getRung(spreadSubject, order);
              return (
                <div className="spread-col" key={order}>
                  <span className="spread-count num">{count}</span>
                  <div className="spread-track">
                    <span
                      className={`spread-bar ${count === 0 ? "is-empty" : ""}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="spread-label">{chartRungLabel(spreadSubject, order)}</span>
                </div>
              );
            })}
          </div>
          <div className="spread-foot">
            <span>
              Each learner counted once.{" "}
              {distribution.counts[0] === 0
                ? "None are below rung 1."
                : `${distribution.counts[0]} ${distribution.counts[0] === 1 ? "is" : "are"} below rung 1.`}
            </span>
            <a className="section-action" href="#/learners">
              Open learners
            </a>
          </div>
        </section>
      </div>

      <section className="metric-strip" aria-label="This month at a glance">
        <div className="metric-cell">
          <span className="metric-label">Learners</span>
          <span className="metric-value num">{learners.length}</span>
          <span className="metric-sub">{assessed} assessed at least once</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Assessments this month</span>
          <span className="metric-value num">{month.length}</span>
          <span className="metric-sub">
            {month.length === 1 ? "one record" : `${month.length} records`} since 1{" "}
            {new Date().toLocaleString("en", { month: "short" })}
          </span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Typical assessment</span>
          <span className="metric-value num">
            {medianSeconds
              ? formatDuration(medianSeconds).replace(" min", "m").replace(" s", "s")
              : "—"}
          </span>
          <span className="metric-sub">median, this month</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Below benchmark</span>
          <span className="metric-value num">
            {below}
            <span className="metric-of"> / {assessed}</span>
          </span>
          <span className="metric-sub">in one or more subjects</span>
        </div>
      </section>

      <div className="grid-12 overview-bottom">
        <section className="col-7 panel panel--flush recent-panel" aria-labelledby="recent-title">
          <div className="panel-pad section-head">
            <div>
              <h2 id="recent-title">Recent assessments</h2>
              <p className="section-sub">The latest records saved on this device.</p>
            </div>
            <a className="section-action" href="#/reports">
              All reports
            </a>
          </div>
          {recent.length ? (
            <div className="table-wrap">
              <table className="table table--rowlink">
                <thead>
                  <tr>
                    <th>Learner</th>
                    <th>Assessed</th>
                    <th>Subject</th>
                    <th>Demonstrated level</th>
                    <th className="num">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((assessment) => {
                    const learner = learners.find((item) => item.id === assessment.learnerId);
                    const rung = getRung(assessment.subject, assessment.finalOrder);
                    return (
                      <tr
                        key={assessment.id}
                        onClick={() => route.navigate(`/reports/${assessment.id}`)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") route.navigate(`/reports/${assessment.id}`);
                        }}
                      >
                        <td>
                          <span className="table-identity">
                            <Avatar code={learner?.code ?? "SPK"} size={24} />
                            <span>
                              <span className="cell-main">{learner?.code ?? "Unknown"}</span>
                              <span className="cell-sub">Std {learner?.enrolledStd ?? "—"}</span>
                            </span>
                          </span>
                        </td>
                        <td className="muted">{relativeDate(assessment.completedAt)}</td>
                        <td>
                          <SubjectLabel subject={assessment.subject} />
                        </td>
                        <td>
                          <span className="cell-main">{rung?.name ?? "Below rung 1"}</span>
                          <span className="cell-sub">
                            {rung ? `Std ${rung.benchmark} benchmark` : "foundational"}
                          </span>
                        </td>
                        <td className="num muted">{formatDuration(assessment.durationSec)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-pad">
              <EmptyState
                title="No assessments yet"
                body="The first saved assessment will appear here."
                action={
                  <a className="btn btn-sm" href="#/assess">
                    Start an assessment
                  </a>
                }
              />
            </div>
          )}
        </section>

        <section className="col-5 panel panel--raised evidence-panel" aria-labelledby="evidence-title">
          <p className="evidence-kicker">Why this exists</p>
          <p className="evidence-stat literata">27.1%</p>
          <p className="evidence-label">
            of Std III children in rural India could read a Std II-level text in 2024.
          </p>
          <p className="evidence-source">ASER 2024 · rural household survey</p>
          <p className="evidence-body">
            A school standard is not the same as a demonstrated skill. The gap between them is what
            SparkL Lens is built to make visible.
          </p>
          <div className="evidence-meta">
            <div>
              <span className="evidence-meta-value num">6</span>
              <span className="evidence-meta-label">conversations</span>
            </div>
            <div>
              <span className="evidence-meta-value num">7</span>
              <span className="evidence-meta-label">tools reviewed</span>
            </div>
            <div>
              <span className="evidence-meta-value num">4</span>
              <span className="evidence-meta-label">task notes</span>
            </div>
          </div>
          <div className="evidence-links">
            <a className="text-link" href="#/evidence">
              Open the evidence <Icon name="arrow-right" size={13} />
            </a>
            <a className="text-link" href="/docs/sparkl-task-1-problem.pdf" target="_blank" rel="noreferrer">
              Task 1 PDF
            </a>
          </div>
        </section>
      </div>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" /> Demo records, stored only in this browser. This
        prototype is not a production data system.
      </p>
    </>
  );
}

function getSubjectName(subject: SubjectId): string {
  if (subject === "kannada") return "Kannada";
  if (subject === "english") return "English";
  return "Maths";
}

function chartRungLabel(subject: SubjectId, order: number): string {
  const rung = getRung(subject, order);
  if (!rung) return "—";
  const compact: Record<string, string> = {
    "ma-1": "1 to 9",
    "ma-2": "To 99",
    "ma-3": "Add/sub",
    "ma-5": "Tables",
    "en-6": "Meaning",
  };
  return compact[rung.id] ?? shortRungName(rung);
}
