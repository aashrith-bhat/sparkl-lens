import { useEffect, useState } from "react";
import { getRung, getSubject, shortRungName, SUBJECT_ORDER, topOrder } from "../data/curriculum";
import type { SubjectId } from "../types";
import { updateLearner, useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import {
  assessmentsForLearner,
  expectedOrderFor,
  progressSeries,
  subjectSnapshots,
} from "../lib/selectors";
import { formatDate, formatDuration, relativeDate, stepTitle } from "../lib/format";
import { WRITTEN_BAND_LABEL } from "../data/written";
import { PageHeader } from "../components/PageHeader";
import { Pill } from "../components/Pill";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { MiniLadder } from "../components/Ladder";
import { ProgressChart } from "../components/ProgressChart";
import { EmptyState } from "../components/EmptyState";
import { SubjectLabel } from "../components/SubjectLabel";
import { useToast } from "../components/Toast";

export function LearnerDetailPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const learnerId = route.segments[1];
  const learner = db.learners.find((item) => item.id === learnerId);
  const [selected, setSelected] = useState<SubjectId>("kannada");
  const [note, setNote] = useState(learner?.note ?? "");

  useEffect(() => {
    setNote(learner?.note ?? "");
  }, [learner?.id, learner?.note]);

  useEffect(() => {
    if (!learner) return;
    const snapshots = subjectSnapshots(learner, db.assessments, db.settings);
    const selectedHasRecord = snapshots.find((snapshot) => snapshot.subject === selected)?.assessment;
    if (!selectedHasRecord) {
      const firstWithRecord = snapshots.find((snapshot) => snapshot.assessment);
      if (firstWithRecord) setSelected(firstWithRecord.subject);
    }
    // The subject selection should only be repaired when the learner changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learner?.id]);

  if (!learner) {
    return (
      <>
        <PageHeader title="Learner" subline="This learner code is not stored on this device." />
        <EmptyState
          title="Learner not found"
          body="The code may belong to another device, or the record may have been cleared."
          action={
            <a className="btn" href="#/learners">
              Back to learners
            </a>
          }
        />
      </>
    );
  }

  const snapshots = subjectSnapshots(learner, db.assessments, db.settings);
  const selectedSnapshot = snapshots.find((snapshot) => snapshot.subject === selected) ?? snapshots[0];
  const subjectAssessments = assessmentsForLearner(db.assessments, learner.id, selected);
  const latest = selectedSnapshot.assessment;
  const series = progressSeries(db.assessments, learner.id, selected);
  const benchmark = expectedOrderFor(selected, learner.enrolledStd, db.settings);
  const lastDate = series.length ? series[series.length - 1].date : null;
  const latestRung = latest && latest.finalOrder > 0 ? getRung(selected, latest.finalOrder) : null;
  const allAssessments = assessmentsForLearner(db.assessments, learner.id);
  const firstRung = getRung(selected, 1);
  const latestWritten =
    db.writtenAssessments
      .filter((item) => item.learnerId === learner.id && item.subject === selected)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ??
    null;
  const nextStep =
    latestRung?.nextStep ??
    firstRung?.nextStep ??
    "Start with the first rung and note what the child can already do.";
  const selectedMeta = getSubject(selected);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(learner.code);
      toast(`Copied ${learner.code}`, "positive");
    } catch {
      toast("Clipboard is not available in this browser", "warning");
    }
  };

  const saveNote = () => {
    updateLearner(learner.id, { note: note.trim() });
    toast("Observation saved", "positive");
  };

  return (
    <>
      <div className="crumb">
        <a href="#/learners">Learners</a>
        <span aria-hidden="true">/</span>
        <span>{learner.code}</span>
      </div>

      <PageHeader
        title={learner.code}
        subline={
          <>
            Std {learner.enrolledStd} · {learner.centre} · {learner.homeLanguage} ·{" "}
            {learner.consentOnFile ? "consent on file" : "consent missing"}
            {lastDate ? <> · last record {relativeDate(lastDate).toLowerCase()}</> : null}
          </>
        }
        actions={
          <>
            <button type="button" className="btn" onClick={copyCode}>
              <Icon name="copy" size={14} /> Copy code
            </button>
            <a className="btn" href={`#/written/new?learner=${learner.id}&subject=${selected}`}>
              Written check
            </a>
            {learner.consentOnFile ? (
              <a
                className="btn btn-primary"
                href={`#/assess?learner=${learner.id}&subject=${selected}`}
              >
                {latest ? `Reassess ${selectedMeta.name}` : `Start ${selectedMeta.name} assessment`}
              </a>
            ) : (
              <button type="button" className="btn btn-primary" disabled>
                Consent needed
              </button>
            )}
          </>
        }
      />

      {!learner.consentOnFile ? (
        <div className="notice notice--warning mb-16">
          <Icon name="alert" size={15} />
          <span>
            Consent is not on file. An assessment cannot start until a guardian or centre coordinator
            confirms it.
          </span>
        </div>
      ) : null}

      <div className="subject-cards">
        {snapshots.map((snapshot) => {
          const meta = getSubject(snapshot.subject);
          const rung = snapshot.levelOrder ? getRung(snapshot.subject, snapshot.levelOrder) : null;
          const isSelected = snapshot.subject === selected;
          return (
            <button
              key={snapshot.subject}
              type="button"
              className={`subject-card ${isSelected ? "is-selected" : ""}`}
              onClick={() => setSelected(snapshot.subject)}
              aria-pressed={isSelected}
            >
              <span className="subject-card-top">
                <SubjectLabel subject={snapshot.subject} />
                <span className="subject-card-date">
                  {snapshot.assessment ? relativeDate(snapshot.assessment.completedAt) : "No record"}
                </span>
              </span>
              <span className="subject-card-level literata">
                {rung ? rung.name : "Not assessed yet"}
              </span>
              <span className="subject-card-meta">
                {rung ? (
                  <>
                    <span>Std {rung.benchmark} benchmark</span>
                    <Pill tone={snapshot.below ? "negative" : "positive"}>
                      {snapshot.gap
                        ? `${snapshot.gap} ${snapshot.gap === 1 ? "rung" : "rungs"} below`
                        : snapshot.atCeiling
                          ? "At ladder ceiling"
                          : "At benchmark"}
                    </Pill>
                  </>
                ) : (
                  <>
                    <span>{meta.ladderNote.split(".")[0]}.</span>
                    <Pill tone="neutral">6-rung ladder</Pill>
                  </>
                )}
              </span>
              <span className="subject-card-ladder">
                <MiniLadder subject={snapshot.subject} order={snapshot.levelOrder} expected={benchmarkForSnapshot(snapshot, learner.enrolledStd, db.settings)} />
                <span className="subject-card-ladder-label">6 rungs · {meta.name}</span>
              </span>
              <span className="subject-card-foot">
                {isSelected ? "Showing progress below" : "Select to see progress"}
                <Icon name="chevron-right" size={13} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid-12 learner-lower">
        <section className="col-7 panel learner-progress" aria-labelledby="progress-title">
          <div className="section-head">
            <div>
              <h2 id="progress-title">Progress in {selectedMeta.name}</h2>
              <p className="section-sub">
                {subjectAssessments.length
                  ? `${subjectAssessments.length} ${subjectAssessments.length === 1 ? "record" : "records"} · benchmark for Std ${learner.enrolledStd} is ${getRung(selected, benchmark)?.name ?? "top of ladder"}.`
                  : "No record in this subject yet."}
              </p>
            </div>
            {latest ? (
              <span className="section-action">
                {latest.finalOrder === topOrder(selected) ? "Top of ladder" : `${latest.finalOrder} of ${topOrder(selected)}`}
              </span>
            ) : null}
          </div>

          {series.length >= 2 ? (
            <ProgressChart
              subject={selected}
              series={series}
              benchmark={benchmark}
              enrolledStd={learner.enrolledStd}
            />
          ) : series.length === 1 ? (
            <div className="single-record">
              <div>
                <p className="single-record-kicker">One assessment so far</p>
                <p className="single-record-level literata">
                  {series[0].order > 0 ? getRung(selected, series[0].order)?.name : "Below rung 1"}
                </p>
                <p className="single-record-date">
                  Recorded {formatDate(series[0].date)}. A second record will show the step.
                </p>
              </div>
              <MiniLadder subject={selected} order={series[0].order} expected={benchmark} />
            </div>
          ) : (
            <EmptyState
              title="No assessments in this subject"
              body={`Start a ${selectedMeta.name} ladder to see a level and progress here.`}
              action={
                learner.consentOnFile ? (
                  <a className="btn btn-sm" href={`#/assess?learner=${learner.id}&subject=${selected}`}>
                    Start assessment
                  </a>
                ) : null
              }
            />
          )}

          {latest ? (
            <div className="progress-foot">
              <span>
                Last assessed {relativeDate(latest.completedAt).toLowerCase()} by {latest.educator}
              </span>
              <span>
                {latest.reviewStatus === "adjusted"
                  ? "Teacher adjusted"
                  : latest.pacing === "auto"
                    ? latest.reviewStatus === "confirmed"
                      ? "Automatic · teacher checked"
                      : "Automatic · not yet checked"
                    : "Educator confirmed"}
              </span>
            </div>
          ) : null}
        </section>

        <div className="col-5 learner-side">
          <section className="panel panel--raised learner-next">
            <p className="result-side-kicker">Next teaching step · {selectedMeta.name}</p>
            <h2>{stepTitle(nextStep)}</h2>
            <p>{nextStep}</p>
            <span className="learner-next-note">
              Draft suggestion · the educator decides what happens next.
            </span>
          </section>

          <section className="panel learner-last" aria-labelledby="last-title">
            <div className="section-head">
              <div>
                <h2 id="last-title">Last assessment</h2>
                <p className="section-sub">
                  {latest ? formatDate(latest.completedAt) : "No record in this subject."}
                </p>
              </div>
              {latest ? (
                <Pill tone={latest.confidence === "high" ? "positive" : latest.confidence === "medium" ? "warning" : "negative"}>
                  {latest.confidence} confidence
                </Pill>
              ) : null}
            </div>
            {latest ? (
              <dl className="kv-list">
                <div>
                  <dt>Level</dt>
                  <dd>{latestRung?.name ?? "Below rung 1"}</dd>
                </div>
                <div>
                  <dt>Rungs cleared</dt>
                  <dd className="num">
                    {latest.results.filter((result) => result.passed).length} of {latest.results.length}
                  </dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd className="num">{formatDuration(latest.durationSec)}</dd>
                </div>
                <div>
                  <dt>Educator</dt>
                  <dd>{latest.educator}</dd>
                </div>
                {latest.notes ? (
                  <div>
                    <dt>Observation</dt>
                    <dd>{latest.notes}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="small muted">
                A first assessment will show the level, rungs cleared, duration and the educator's note.
              </p>
            )}
            {latest ? (
              <a className="text-link mt-8" href={`#/reports/${latest.id}`}>
                Open the full report <Icon name="arrow-right" size={13} />
              </a>
            ) : null}
          </section>

          <section className="panel learner-last" aria-labelledby="written-title">
            <div className="section-head">
              <div>
                <h2 id="written-title">Written evidence</h2>
                <p className="section-sub">
                  {latestWritten
                    ? formatDate(latestWritten.completedAt)
                    : "No written check in this subject."}
                </p>
              </div>
              {latestWritten ? (
                <span className={`written-band written-band--${latestWritten.band}`}>
                  {WRITTEN_BAND_LABEL[latestWritten.band]}
                </span>
              ) : null}
            </div>
            {latestWritten ? (
              <>
                <dl className="kv-list">
                  <div>
                    <dt>Rubric score</dt>
                    <dd className="num">
                      {latestWritten.totalScore} / {latestWritten.maxScore}
                    </dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd className="num">{latestWritten.tasks.length}</dd>
                  </div>
                  <div>
                    <dt>Photos</dt>
                    <dd className="num">
                      {latestWritten.tasks.filter((task) => task.photoId).length}
                    </dd>
                  </div>
                </dl>
                <a className="text-link mt-8" href={`#/written/${latestWritten.id}`}>
                  Open written report <Icon name="arrow-right" size={13} />
                </a>
              </>
            ) : (
              <a
                className="text-link"
                href={`#/written/new?learner=${learner.id}&subject=${selected}`}
              >
                Start a written check <Icon name="arrow-right" size={13} />
              </a>
            )}
          </section>
        </div>
      </div>

      <section className="panel learner-notes" aria-labelledby="notes-title">
        <div className="section-head">
          <div>
            <h2 id="notes-title">What we noticed</h2>
            <p className="section-sub">One short observation for the next educator. No names or personal details.</p>
          </div>
          {note.trim() && note.trim() !== learner.note ? (
            <span className="section-action">Unsaved changes</span>
          ) : null}
        </div>
        <div className="notes-row">
          <textarea
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="For example: reads word by word; relaxes with picture cards."
            aria-label="Learner observation"
          />
          <button type="button" className="btn" onClick={saveNote} disabled={note.trim() === learner.note}>
            Save note
          </button>
        </div>
      </section>

      <section className="panel panel--flush history-panel" aria-labelledby="history-title">
        <div className="panel-pad section-head">
          <div>
            <h2 id="history-title">Assessment history</h2>
            <p className="section-sub">Every saved record for {learner.code}, latest first.</p>
          </div>
          <span className="section-action">{allAssessments.length} records</span>
        </div>
        {allAssessments.length ? (
          <div className="table-wrap">
            <table className="table table--rowlink">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Level</th>
                  <th className="num">Rungs cleared</th>
                  <th className="num">Time</th>
                  <th>Educator</th>
                </tr>
              </thead>
              <tbody>
                {allAssessments.map((assessment) => {
                  const rung = assessment.finalOrder > 0 ? getRung(assessment.subject, assessment.finalOrder) : null;
                  const cleared = assessment.results.filter((result) => result.passed).length;
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
                        <span className="cell-sub">{new Date(assessment.completedAt).getFullYear()}</span>
                      </td>
                      <td>
                        <SubjectLabel subject={assessment.subject} />
                      </td>
                      <td>
                        <span className="cell-main">{rung?.name ?? "Below rung 1"}</span>
                        <span className="cell-sub">
                          {assessment.overridden ? "Educator override" : `Std ${rung?.benchmark ?? "—"} benchmark`}
                          <span className="history-mobile-extra">
                            {" "}· {formatDuration(assessment.durationSec)} · {assessment.educator}
                          </span>
                        </span>
                      </td>
                      <td className="num">
                        {cleared} of {assessment.results.length}
                      </td>
                      <td className="num muted">{formatDuration(assessment.durationSec)}</td>
                      <td>
                        <span className="cell-main">{assessment.educator}</span>
                        <span className="cell-sub">{assessment.confidence} confidence</span>
                      </td>
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
              body="The first saved result will appear here with its date, level, duration and educator."
              action={
                learner.consentOnFile ? (
                  <a className="btn btn-sm" href={`#/assess?learner=${learner.id}`}>
                    Start an assessment
                  </a>
                ) : null
              }
            />
          </div>
        )}
      </section>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        {learner.code} is a local record. Export or clear it from Settings.
      </p>
    </>
  );
}

function benchmarkForSnapshot(
  snapshot: { subject: SubjectId },
  enrolledStd: number,
  settings: ReturnType<typeof useDB>["settings"],
): number {
  return expectedOrderFor(snapshot.subject, enrolledStd, settings);
}
