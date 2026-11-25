import { useState } from "react";
import { getSubject } from "../data/curriculum";
import type { WrittenAssessment } from "../types";
import { WRITTEN_BAND_LABEL, writtenTaskMax, writtenTaskScore } from "../data/written";
import { useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { formatDate, formatDuration, relativeDate } from "../lib/format";
import { syncConfigured, pushWrittenAssessment } from "../lib/sync";
import { usePhotoUrl } from "../lib/photoStore";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { Pill } from "../components/Pill";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function WrittenReportPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const assessment = db.writtenAssessments.find((item) => item.id === route.segments[1]);
  const learner = assessment
    ? db.learners.find((item) => item.id === assessment.learnerId)
    : null;
  const [syncing, setSyncing] = useState(false);

  if (!assessment || !learner) {
    return (
      <>
        <PageHeader title="Written report" subline="This written check is not stored on this device." />
        <EmptyState
          title="Written report not found"
          body="The record may have been cleared, or it belongs to another device."
          action={
            <a className="btn btn-primary" href="#/written">
              Back to written checks
            </a>
          }
        />
      </>
    );
  }

  const subject = getSubject(assessment.subject);
  const configured = syncConfigured(db.settings);
  const totalTasks = assessment.tasks.length;
  const photos = assessment.tasks.filter((task) => task.photoId).length;
  const percent = assessment.maxScore
    ? Math.round((assessment.totalScore / assessment.maxScore) * 100)
    : 0;

  const syncNow = async () => {
    setSyncing(true);
    const result = await pushWrittenAssessment(assessment, db.settings);
    setSyncing(false);
    if (result.ok) {
      toast("Written report synced.", "positive");
    } else {
      toast(result.message ?? "Sync failed. The report stays on this device.", "warning");
    }
  };

  const plan = writtenPlan(assessment);

  return (
    <>
      <div className="crumb">
        <a href="#/written">Written</a>
        <span aria-hidden="true">/</span>
        <span>{learner.code}</span>
      </div>

      <PageHeader
        title={`${learner.code} · ${subject.name}`}
        subline={
          <>
            Written check · {formatDate(assessment.completedAt)} · {formatDuration(assessment.durationSec)} ·{" "}
            <a className="text-link" href={`#/learners/${learner.id}`}>
              Learner profile
            </a>
          </>
        }
        actions={
          <>
            <a className="btn" href="#/written">
              <Icon name="arrow-left" size={14} /> All written
            </a>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Icon name="download" size={14} /> Print / PDF
            </button>
            <a className="btn" href="#/written/new">
              Next child
            </a>
            {configurationAction(assessment, configured, syncing, syncNow)}
          </>
        }
      />

      <section className="written-report-hero">
        <div>
          <p className="report-kicker">
            <Avatar code={learner.code} size={20} /> Written evidence · {totalTasks} tasks · {photos}{" "}
            photo{photos === 1 ? "" : "s"}
          </p>
          <h2 className="report-level literata">{WRITTEN_BAND_LABEL[assessment.band]}</h2>
          <p className="report-hero-sub">
            {assessment.totalScore} of {assessment.maxScore} rubric marks · {percent}% · teacher-judged
          </p>
          <div className="written-score-track" aria-hidden="true">
            <span style={{ width: `${Math.max(2, percent)}%` }} />
          </div>
        </div>
        <div className="written-report-hero-side">
          <div className={`written-band written-band--${assessment.band} written-band--large`}>
            {WRITTEN_BAND_LABEL[assessment.band]}
          </div>
          <Pill
            tone={
              assessment.syncStatus === "synced"
                ? "positive"
                : assessment.syncStatus === "error"
                  ? "negative"
                  : "warning"
            }
          >
            {assessment.syncStatus === "synced"
              ? `Synced ${assessment.syncedAt ? relativeDate(assessment.syncedAt).toLowerCase() : ""}`
              : assessment.syncStatus === "error"
                ? "Sync failed"
                : "Waiting to sync"}
          </Pill>
        </div>
      </section>

      <div className="grid-12 written-report-grid">
        <div className="col-8 written-report-main">
          <section className="panel written-report-summary">
            <div className="section-head">
              <div>
                <h2>What this page shows</h2>
                <p className="section-sub">
                  Teacher-marked written evidence. This is not handwriting OCR or a validated score.
                </p>
              </div>
              <span className="section-action">{assessment.centre}</span>
            </div>
            <p className="report-narrative">
              {learner.code} completed a {totalTasks}-task written sample in {subject.name}. The
              demonstrated band is {WRITTEN_BAND_LABEL[assessment.band].toLowerCase()}: {percent}% of the
              available rubric marks. Use the page photos and the notes against each task to decide the next
              teaching step.
            </p>
            {assessment.notes ? <p className="written-report-note">{assessment.notes}</p> : null}
          </section>

          <section className="panel panel--flush written-report-tasks">
            <div className="panel-pad section-head">
              <div>
                <h2>Task evidence</h2>
                <p className="section-sub">The page, the rubric and the teacher's note.</p>
              </div>
            </div>
            {assessment.tasks.map((task, index) => (
              <article className="written-report-task" key={task.taskId}>
                <div className="written-report-task-head">
                  <span className="written-task-number">{index + 1}</span>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.prompt}</p>
                  </div>
                  <span className="written-report-task-score num">
                    {writtenTaskScore(task)}/{writtenTaskMax(task)}
                  </span>
                </div>
                {task.content ? (
                  <div
                    className={`written-report-content ${assessment.subject === "kannada" ? "kannada" : ""}`}
                  >
                    {task.content}
                  </div>
                ) : null}
                <div className="written-report-task-body">
                  <WrittenTaskPhoto photoId={task.photoId} />
                  <div className="written-report-rubric">
                    {task.criteria.map((criterion) => {
                      const score = task.scores[criterion.id] ?? 0;
                      return (
                        <div className="written-report-criterion" key={criterion.id}>
                          <span>{criterion.label}</span>
                          <span className={`written-criterion-score is-${score}`}>
                            {score}/2
                          </span>
                        </div>
                      );
                    })}
                    {task.note ? <p className="written-report-task-note">{task.note}</p> : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>

        <aside className="col-4 written-report-side">
          <section className="panel panel--raised written-plan-panel">
            <p className="result-side-kicker">Next teaching step</p>
            <h2>{plan.title}</h2>
            <p>{plan.body}</p>
            <span className="report-plan-note">Draft suggestion · the teacher decides.</span>
          </section>

          <section className="panel written-report-meta">
            <h2>Record</h2>
            <dl className="kv-list">
              <div>
                <dt>Learner</dt>
                <dd>{learner.code}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{subject.name}</dd>
              </div>
              <div>
                <dt>Educator</dt>
                <dd>{assessment.educator}</dd>
              </div>
              <div>
                <dt>Centre</dt>
                <dd>{assessment.centre}</dd>
              </div>
              <div>
                <dt>Tasks</dt>
                <dd className="num">{totalTasks}</dd>
              </div>
              <div>
                <dt>Photos</dt>
                <dd className="num">{photos}</dd>
              </div>
              <div>
                <dt>Device</dt>
                <dd>{assessment.deviceId.slice(0, 8)}…</dd>
              </div>
            </dl>
          </section>

          <section className="panel written-sync-card">
            <h2>Sync</h2>
            <p className="small muted">
              {assessment.syncStatus === "synced"
                ? "This report and its photos are in Supabase."
                : configured
                  ? "This report stays on this device until it can upload."
                  : "Configure Supabase in Settings to keep a central copy."}
            </p>
            {assessment.syncError ? <p className="written-error">{assessment.syncError}</p> : null}
            {configured && assessment.syncStatus !== "synced" ? (
              <button
                type="button"
                className="btn btn-primary written-sync-button"
                onClick={() => void syncNow()}
                disabled={syncing}
              >
                {syncing ? "Syncing…" : "Sync this report"}
              </button>
            ) : null}
            {!configured ? (
              <a className="text-link mt-8" href="#/settings?tab=sync">
                Open sync settings <Icon name="arrow-right" size={13} />
              </a>
            ) : null}
          </section>

          <section className="panel written-rubric-explainer">
            <h2>How this was scored</h2>
            <p>
              Each task has three criteria. <strong>0</strong> means not yet, <strong>1</strong> partly and{" "}
              <strong>2</strong> secure. The band is the percentage of available rubric marks: 75%+ secure,
              45–74% developing, below 45% emerging.
            </p>
            <p className="written-caveat">
              Draft rubric and thresholds. Review with a Kannada educator and SparkL before field use.
            </p>
          </section>
        </aside>
      </div>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        Written report {assessment.id} · stored only in this browser until synced.
      </p>
    </>
  );
}

function configurationAction(
  assessment: WrittenAssessment,
  configured: boolean,
  syncing: boolean,
  syncNow: () => Promise<void>,
) {
  if (!configured || assessment.syncStatus === "synced") return null;
  return (
    <button type="button" className="btn" onClick={() => void syncNow()} disabled={syncing}>
      {syncing ? "Syncing…" : "Sync"}
    </button>
  );
}

function WrittenTaskPhoto({ photoId }: { photoId: string | null }) {
  const url = usePhotoUrl(photoId);
  if (!photoId) {
    return (
      <div className="written-photo-missing">
        <Icon name="camera" size={20} />
        <span>No photo attached</span>
      </div>
    );
  }
  if (!url) {
    return (
      <div className="written-photo-missing">
        <Icon name="camera" size={20} />
        <span>Loading photo…</span>
      </div>
    );
  }
  return (
    <a className="written-report-photo" href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Written work for this task" />
    </a>
  );
}

function writtenPlan(assessment: WrittenAssessment): { title: string; body: string } {
  if (assessment.band === "secure") {
    return {
      title: "Move to longer writing",
      body: "Ask for two or three connected sentences, then a short retell. Keep checking spacing and spelling in context rather than isolated drills.",
    };
  }
  if (assessment.band === "developing") {
    return {
      title: "Practise one short piece",
      body: "Use a daily five-minute writing prompt. Model the first sentence, then ask the child to write one more independently. Recheck formation and spacing.",
    };
  }
  return {
    title: "Start with formation and one word",
    body: "Begin with a few letters or numbers the child can form, then copy one meaningful word. Keep the page short and praise the attempt before correcting.",
  };
}
