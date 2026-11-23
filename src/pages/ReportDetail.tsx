import { useEffect, useState } from "react";
import { getRung, getSubject, topOrder } from "../data/curriculum";
import type { ReviewStatus } from "../types";
import { updateAssessment, useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { expectedOrderFor } from "../lib/selectors";
import { formatDate, formatDuration, relativeDate } from "../lib/format";
import {
  assessmentFluency,
  assessmentMetrics,
  buildNarrative,
  buildTeachingPlan,
  confidenceLabel,
  fluencyLabel,
  needsQuickCheck,
  reportItemLabel,
  rungAggregate,
  transcriptFor,
} from "../lib/reporting";
import { PageHeader } from "../components/PageHeader";
import { Pill } from "../components/Pill";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";
import { SubjectLabel } from "../components/SubjectLabel";
import { MiniLadder } from "../components/Ladder";
import { useToast } from "../components/Toast";

export function ReportDetailPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const assessmentId = route.segments[1];
  const assessment = db.assessments.find((item) => item.id === assessmentId);
  const learner = assessment
    ? db.learners.find((item) => item.id === assessment.learnerId)
    : undefined;
  const [teacherNote, setTeacherNote] = useState(assessment?.teacherNote ?? "");
  const [adjustOrder, setAdjustOrder] = useState(assessment?.finalOrder ?? 0);

  useEffect(() => {
    setTeacherNote(assessment?.teacherNote ?? "");
    setAdjustOrder(assessment?.finalOrder ?? 0);
  }, [assessment?.id, assessment?.teacherNote, assessment?.finalOrder]);

  if (!assessment || !learner) {
    return (
      <>
        <PageHeader title="Report" subline="This report is not stored on this device." />
        <EmptyState
          title="Report not found"
          body="The report may have been cleared, or it belongs to another device."
          action={
            <a className="btn btn-primary" href="#/reports">
              Back to reports
            </a>
          }
        />
      </>
    );
  }

  const subject = getSubject(assessment.subject);
  const rung =
    assessment.finalOrder > 0 ? getRung(assessment.subject, assessment.finalOrder) : null;
  const expectedOrder = expectedOrderFor(assessment.subject, learner.enrolledStd, db.settings);
  const gap = Math.max(0, expectedOrder - assessment.finalOrder);
  const atTop = assessment.finalOrder >= topOrder(assessment.subject);
  const previous =
    [...db.assessments]
      .filter(
        (item) =>
          item.id !== assessment.id &&
          item.learnerId === assessment.learnerId &&
          item.subject === assessment.subject &&
          new Date(item.completedAt).getTime() < new Date(assessment.completedAt).getTime(),
      )
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ??
    null;
  const narrative = buildNarrative({ assessment, learner, settings: db.settings, previous });
  const plan = buildTeachingPlan(assessment);
  const metrics = assessmentMetrics(assessment);
  const fluency = assessmentFluency(assessment);
  const flagged = needsQuickCheck(assessment);
  const reviewStatus: ReviewStatus = assessment.reviewStatus ?? "unreviewed";
  const totalItems = assessment.results.reduce(
    (sum, result) => sum + result.itemResults.length,
    0,
  );
  const pauseCount = assessment.results.reduce(
    (sum, result) =>
      sum + result.itemResults.reduce((inner, item) => inner + (item.auto?.pauseCount ?? 0), 0),
    0,
  );
  const longPauseCount = assessment.results.reduce(
    (sum, result) =>
      sum + result.itemResults.reduce((inner, item) => inner + (item.auto?.longPauseCount ?? 0), 0),
    0,
  );
  const noSpeechItems = assessment.autoSummary?.noSpeechItems ?? 0;
  const reviewItems = assessment.autoSummary?.reviewItems ?? 0;
  const modeLabel = assessment.pacing === "auto" ? "Automatic" : "Educator-assisted";
  const isMaths = assessment.subject === "maths";
  const isManual = assessment.pacing === "educator";
  const clearedRungs = assessment.results.filter((result) => result.passed).length;

  const stamp = () => ({
    reviewedAt: new Date().toISOString(),
    reviewedBy: db.settings.educator,
    teacherNote: teacherNote.trim(),
  });

  const confirm = () => {
    updateAssessment(assessment.id, { reviewStatus: "confirmed", ...stamp() });
    toast("Teacher check saved. The level is confirmed.", "positive");
  };

  const adjust = () => {
    if (adjustOrder === assessment.finalOrder) {
      confirm();
      return;
    }
    updateAssessment(assessment.id, {
      reviewStatus: "adjusted",
      finalOrder: adjustOrder,
      overridden: true,
      ...stamp(),
    });
    toast("Level adjusted. The report now reflects the teacher check.", "positive");
  };

  const saveNote = () => {
    updateAssessment(assessment.id, { teacherNote: teacherNote.trim() });
    toast("Note saved", "positive");
  };

  return (
    <>
      <div className="crumb">
        <a href="#/reports">Reports</a>
        <span aria-hidden="true">/</span>
        <span>{learner.code}</span>
      </div>

      <PageHeader
        title={`${learner.code} · ${subject.name}`}
        subline={
          <>
            {formatDate(assessment.completedAt)} · {modeLabel} · {formatDuration(assessment.durationSec)} ·{" "}
            <a className="text-link" href={`#/learners/${learner.id}`}>
              Learner profile
            </a>
          </>
        }
        actions={
          <>
            <a className="btn" href="#/reports">
              <Icon name="arrow-left" size={14} /> All reports
            </a>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Icon name="download" size={14} /> Print / PDF
            </button>
            <a className="btn btn-primary" href={`#/assess?learner=${learner.id}&subject=${assessment.subject}`}>
              Reassess
            </a>
          </>
        }
      />

      {flagged && reviewStatus === "unreviewed" ? (
        <div className="notice notice--warning mb-16">
          <Icon name="alert" size={15} />
          <span>
            This report has {reviewItems || noSpeechItems ? `${Math.max(reviewItems, noSpeechItems)} item${Math.max(reviewItems, noSpeechItems) === 1 ? "" : "s"} ` : ""}
            that need a quick look ({confidenceLabel(metrics.confidence).toLowerCase()} machine
            confidence). It is already saved; no per-item marking is required.
          </span>
        </div>
      ) : null}

      <section className="report-hero" aria-labelledby="report-level-title">
        <div className="report-hero-main">
          <p className="report-kicker">
            <SubjectLabel subject={assessment.subject} /> · demonstrated level
          </p>
          <h2 id="report-level-title" className="report-level literata">
            {rung ? rung.name : "Below rung 1"}
          </h2>
          <p className="report-hero-sub">
            {rung ? `Std ${rung.benchmark} benchmark` : "Foundational"}
            {" · "}
            {gap === 0
              ? `At or above the Std ${learner.enrolledStd} benchmark`
              : `${gap} rung${gap === 1 ? "" : "s"} below the Std ${learner.enrolledStd} benchmark`}
            {atTop ? " · top of this draft ladder" : ""}
          </p>
          <div className="report-hero-ladder">
            <MiniLadder subject={assessment.subject} order={assessment.finalOrder} expected={expectedOrder} />
            <span className="report-hero-ladder-label">
              {assessment.finalOrder > 0 ? assessment.finalOrder : 0} of {topOrder(assessment.subject)} rungs
              {" · "}benchmark marker {expectedOrder > 0 ? `rung ${expectedOrder}` : "—"}
            </span>
          </div>
        </div>
        <div className="report-hero-side">
          <div className={`report-band is-${fluency}`}>
            <span className="report-band-label">Fluency</span>
            <span className="report-band-value">{fluencyLabel(fluency)}</span>
            <span className="report-band-sub">Accuracy + pace + pauses</span>
          </div>
          <div className="report-hero-pills">
            <Pill
              tone={
                assessment.confidence === "high"
                  ? "positive"
                  : assessment.confidence === "medium"
                    ? "warning"
                    : "negative"
              }
            >
              {confidenceLabel(metrics.confidence)} machine confidence
            </Pill>
            <Pill tone={reviewStatus === "unreviewed" ? "neutral" : "positive"}>
              {reviewStatus === "adjusted"
                ? "Teacher adjusted"
                : reviewStatus === "confirmed"
                  ? isManual
                    ? "Educator marked"
                    : "Teacher confirmed"
                  : "Not yet checked"}
            </Pill>
          </div>
        </div>
      </section>

      <section className="panel report-summary" aria-labelledby="summary-title">
        <div className="section-head">
          <div>
            <h2 id="summary-title">What this assessment found</h2>
            <p className="section-sub">
              {isManual
                ? "Written from the educator's item marks. No machine scoring was used."
                : "Written from the saved evidence. The teacher check below is optional."}
            </p>
          </div>
          <span className="section-action">{modeLabel}</span>
        </div>
        <p className="report-narrative">{narrative}</p>
        <div className="report-metric-grid">
          {isManual ? (
            <>
              <div className="report-metric">
                <span className="report-metric-label">Item accuracy</span>
                <span className="report-metric-value num">{Math.round(metrics.accuracy * 100)}%</span>
                <span className="report-metric-sub">
                  {totalItems} item{totalItems === 1 ? "" : "s"} marked by the educator
                </span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Rungs attempted</span>
                <span className="report-metric-value num">{assessment.results.length}</span>
                <span className="report-metric-sub">
                  {clearedRungs} cleared · {assessment.results.length - clearedRungs} stopped
                </span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Items marked</span>
                <span className="report-metric-value num">{totalItems}</span>
                <span className="report-metric-sub">every item confirmed by hand</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Educator confidence</span>
                <span className="report-metric-value report-metric-value--text">
                  {assessment.confidence.charAt(0).toUpperCase() + assessment.confidence.slice(1)}
                </span>
                <span className="report-metric-sub">recorded at the end of the session</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Duration</span>
                <span className="report-metric-value num">{formatDuration(assessment.durationSec)}</span>
                <span className="report-metric-sub">started {relativeDate(assessment.startedAt).toLowerCase()}</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Run by</span>
                <span className="report-metric-value report-metric-value--text">{assessment.educator}</span>
                <span className="report-metric-sub">educator-assisted session</span>
              </div>
            </>
          ) : (
            <>
              <div className="report-metric">
                <span className="report-metric-label">{isMaths ? "Answer accuracy" : "Word accuracy"}</span>
                <span className="report-metric-value num">{Math.round(metrics.accuracy * 100)}%</span>
                <span className="report-metric-sub">
                  {totalItems} item{totalItems === 1 ? "" : "s"} across {assessment.results.length}{" "}
                  {assessment.results.length === 1 ? "rung" : "rungs"}
                </span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">{isMaths ? "Typical answer time" : "Reading pace"}</span>
                <span className="report-metric-value num">
                  {isMaths
                    ? metrics.secondsPerItem !== null
                      ? `${Math.round(metrics.secondsPerItem)}s`
                      : "—"
                    : metrics.wordsPerMinute
                      ? Math.round(metrics.wordsPerMinute)
                      : "—"}
                </span>
                <span className="report-metric-sub">
                  {isMaths
                    ? metrics.secondsPerItem !== null
                      ? "median seconds per answer"
                      : "not measured on these items"
                    : metrics.wordsPerMinute
                      ? "words per minute (median)"
                      : "not measured on these items"}
                </span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Likely pauses</span>
                <span className="report-metric-value num">{pauseCount}</span>
                <span className="report-metric-sub">{longPauseCount} long · detected from timing gaps</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Machine confidence</span>
                <span className="report-metric-value num">{Math.round(metrics.confidence * 100)}%</span>
                <span className="report-metric-sub">
                  {noSpeechItems} no-speech · {reviewItems} flagged
                </span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Duration</span>
                <span className="report-metric-value num">{formatDuration(assessment.durationSec)}</span>
                <span className="report-metric-sub">started {relativeDate(assessment.startedAt).toLowerCase()}</span>
              </div>
              <div className="report-metric">
                <span className="report-metric-label">Run by</span>
                <span className="report-metric-value report-metric-value--text">{assessment.educator}</span>
                <span className="report-metric-sub">device-led session</span>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid-12 report-lower">
        <section className="col-8 panel panel--flush report-rungs" aria-labelledby="rungs-title">
          <div className="panel-pad section-head">
            <div>
              <h2 id="rungs-title">Rung by rung</h2>
              <p className="section-sub">
                Each rung, the items behind the decision, and what the app heard.
              </p>
            </div>
          </div>
          <div className="report-rung-list">
            {assessment.results.map((result) => {
              const aggregate = rungAggregate(result);
              const rungMeta = getRung(assessment.subject, result.order);
              return (
                <details className="report-rung" key={result.rungId} open={result.order === assessment.finalOrder}>
                  <summary className="report-rung-head">
                    <span className={`report-rung-mark ${result.passed ? "is-pass" : "is-stop"}`}>
                      <Icon name={result.passed ? "check" : "minus"} size={14} />
                    </span>
                    <span className="report-rung-title">
                      <span className="report-rung-name">
                        {result.order}. {rungMeta?.name ?? `Rung ${result.order}`}
                      </span>
                      <span className="report-rung-sub">
                        {result.itemResults.length} items ·{" "}
                        {rungMeta ? `Std ${rungMeta.benchmark} benchmark` : "—"}
                      </span>
                    </span>
                    <span className="report-rung-metrics">
                      <span className="num">{Math.round(aggregate.accuracy * 100)}%</span>
                      <span className={`fluency-inline is-${aggregate.fluency}`}>
                        {fluencyLabel(aggregate.fluency)}
                      </span>
                      <Pill tone={result.passed ? "positive" : "negative"}>
                        {result.passed ? "Cleared" : "Stopped here"}
                      </Pill>
                    </span>
                    <Icon name="chevron-down" size={14} className="report-rung-chevron" />
                  </summary>
                  <div className="report-item-list">
                    {result.itemResults.map((itemResult, index) => {
                      const item = rungMeta?.items.find((entry) => entry.id === itemResult.itemId);
                      const heard = transcriptFor(itemResult);
                      return (
                        <article className="report-item" key={`${result.rungId}-${itemResult.itemId}`}>
                          <div className="report-item-head">
                            <span className="report-item-index">Item {index + 1}</span>
                            <span className="report-item-kind">
                              {item?.kind === "dots"
                                ? "Count the dots"
                                : item?.kind === "comprehension"
                                  ? "Comprehension"
                                  : item?.kind === "say"
                                    ? "Sound / letter"
                                    : item?.kind === "answer"
                                      ? "Maths answer"
                                      : "Read aloud"}
                            </span>
                            <Pill
                              tone={
                                itemResult.outcome === "correct"
                                  ? "positive"
                                  : itemResult.outcome === "partial"
                                    ? "warning"
                                    : "negative"
                              }
                            >
                              {reportItemLabel(itemResult)}
                            </Pill>
                            {itemResult.auto?.needsReview ? <Pill tone="neutral">Check</Pill> : null}
                          </div>
                          {item?.kind === "comprehension" ? (
                            <p className="report-item-question">{item.content}</p>
                          ) : null}
                          <p className="report-item-expected" lang={assessment.subject === "kannada" ? "kn" : undefined}>
                            {item?.kind === "comprehension" ? `Expected answer: ${itemResult.expected}` : itemResult.expected}
                          </p>
                          <div className="report-item-evidence">
                            <span className="report-item-label">
                              {itemResult.method === "keypad"
                                ? "Entered"
                                : itemResult.method === "manual"
                                  ? "Educator mark"
                                  : "Heard"}
                            </span>
                            <span className={`report-item-transcript ${heard ? "" : "is-empty"}`}>
                              {heard ||
                                (itemResult.method === "keypad"
                                  ? "No answer entered"
                                  : itemResult.method === "manual"
                                    ? `${reportItemLabel(itemResult)}${
                                        itemResult.support
                                          ? ` · ${itemResult.support.replace("-", " ")}`
                                          : ""
                                      }`
                                    : "No speech captured")}
                            </span>
                          </div>
                          {itemResult.auto ? (
                            <div className="report-item-stats">
                              {isMaths ? (
                                <span>
                                  <strong className="num">{itemResult.auto.speakingSeconds}s</strong> to answer
                                </span>
                              ) : (
                                <>
                                  <span>
                                    <strong className="num">
                                      {Math.round(itemResult.auto.accuracy * 100)}%
                                    </strong>{" "}
                                    word match
                                  </span>
                                  <span>
                                    <strong className="num">
                                      {itemResult.auto.wordsPerMinute ?? itemResult.auto.speakingSeconds}
                                    </strong>{" "}
                                    {itemResult.auto.wordsPerMinute ? "wpm" : "sec"}
                                  </span>
                                  <span>
                                    <strong className="num">{itemResult.auto.pauseCount}</strong> pauses
                                  </span>
                                </>
                              )}
                              <span>
                                <strong className="num">
                                  {Math.round(itemResult.auto.machineConfidence * 100)}%
                                </strong>{" "}
                                confidence
                              </span>
                            </div>
                          ) : null}
                          {itemResult.auto?.reasons.length ? (
                            <ul className="report-item-reasons">
                              {itemResult.auto.reasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <div className="col-4 report-side">
          <section className="panel panel--raised report-plan" aria-labelledby="plan-title">
            <p className="result-side-kicker">Next teaching steps</p>
            <h2 id="plan-title">Where to go next</h2>
            <ol className="report-plan-list">
              {plan.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <span className="report-plan-note">
              Draft suggestions from the ladder, not a prescription. The teacher decides.
            </span>
          </section>

          {!isManual ? (
            <section className="panel report-check" aria-labelledby="check-title">
            <div className="section-head">
              <div>
                <h2 id="check-title">Optional teacher check</h2>
                <p className="section-sub">Only if something looks off. The report is already saved.</p>
              </div>
            </div>
            <div className={`report-check-state is-${reviewStatus}`}>
              <span className="report-check-dot" />
              <span>
                {reviewStatus === "confirmed"
                  ? `Confirmed by ${assessment.reviewedBy ?? "the teacher"}${assessment.reviewedAt ? ` · ${relativeDate(assessment.reviewedAt).toLowerCase()}` : ""}`
                  : reviewStatus === "adjusted"
                    ? `Adjusted by ${assessment.reviewedBy ?? "the teacher"}${assessment.reviewedAt ? ` · ${relativeDate(assessment.reviewedAt).toLowerCase()}` : ""}`
                    : "Not checked yet"}
              </span>
            </div>
            <div className="report-check-actions">
              <button type="button" className="btn btn-primary" onClick={confirm}>
                <Icon name="check" size={14} /> Confirm this report
              </button>
            </div>
            <div className="report-check-adjust">
              <label htmlFor="report-adjust-level">Or adjust the demonstrated level</label>
              <div className="report-check-row">
                <select
                  id="report-adjust-level"
                  className="select"
                  value={adjustOrder}
                  onChange={(event) => setAdjustOrder(Number(event.target.value))}
                >
                  <option value={0}>Below rung 1</option>
                  {Array.from({ length: topOrder(assessment.subject) }, (_, index) => {
                    const option = getRung(assessment.subject, index + 1);
                    return (
                      <option key={index + 1} value={index + 1}>
                        {option?.name ?? `Rung ${index + 1}`}
                      </option>
                    );
                  })}
                </select>
                <button type="button" className="btn" onClick={adjust}>
                  Save
                </button>
              </div>
            </div>
            <label className="report-note-label" htmlFor="report-teacher-note">
              Teacher note
            </label>
            <textarea
              id="report-teacher-note"
              className="textarea report-note"
              value={teacherNote}
              onChange={(event) => setTeacherNote(event.target.value)}
              placeholder="For example: needs a quieter room for the next check; recognised letters but slowed on blends."
            />
            <button
              type="button"
              className="btn btn-sm report-note-save"
              onClick={saveNote}
              disabled={teacherNote.trim() === (assessment.teacherNote ?? "")}
            >
              Save note
            </button>
            </section>
          ) : null}

          <section className="panel report-how" aria-labelledby="how-title">
            <h2 id="how-title">How this was scored</h2>
            <dl className="report-how-list">
              {isManual ? (
                <>
                  <div>
                    <dt>Item marks</dt>
                    <dd>
                      The educator marked each item Correct, Partial or Not yet after listening to the
                      child. The app did not score the response.
                    </dd>
                  </div>
                  <div>
                    <dt>Rung score</dt>
                    <dd>
                      Correct counts as one, Partial as half when partial credit is on, and Not yet as
                      zero. A rung clears at the draft pass mark.
                    </dd>
                  </div>
                  <div>
                    <dt>Suggested level</dt>
                    <dd>
                      The highest rung cleared. The educator can override it before saving; the report
                      records the confirmed level.
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt>{isMaths ? "Answer accuracy" : "Word accuracy"}</dt>
                    <dd>
                      {isMaths
                        ? "Each typed answer is checked against the expected answer and the accepted alternatives."
                        : "Matched words against the expected text, allowing small recognition slips."}
                    </dd>
                  </div>
                  <div>
                    <dt>Fluency</dt>
                    <dd>
                      {isMaths
                        ? "Correct answers with a steady pace read as fluent; repeated errors or long gaps read as hesitant or struggling."
                        : `Combines accuracy, reading pace and detected pauses. Fluent is roughly ${
                            assessment.subject === "kannada" ? "22+" : "35+"
                          } words per minute with few long pauses.`}
                    </dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>
                      {isMaths
                        ? "Keypad answers have high confidence because the app sees the exact number the child entered."
                        : "The browser's recognition confidence, how much of the item was covered, and the word match. Below 50% is flagged for a human glance."}
                    </dd>
                  </div>
                </>
              )}
            </dl>
            <p className="report-how-caveat">
              {isManual
                ? "This mode works offline and keeps the educator in control. It is the calibration path when automatic speech is unavailable."
                : "Draft thresholds. Browser speech is network-dependent and was not validated on this cohort, so treat low-confidence reports as provisional evidence, not a diagnosis."}
            </p>
            <a className="text-link" href="#/evidence">
              Read the evidence <Icon name="arrow-right" size={13} />
            </a>
          </section>
        </div>
      </div>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        Report {assessment.id} · stored only in this browser · learner {learner.code}
      </p>
    </>
  );
}
