import { useEffect, useMemo, useState } from "react";
import { getSubject } from "../data/curriculum";
import type { WrittenAssessment, WrittenDraft, WrittenTaskResult } from "../types";
import {
  getWrittenTaskSet,
  writtenBandFor,
  writtenTaskMax,
  writtenTaskScore,
  writtenTotals,
} from "../data/written";
import {
  addWrittenAssessment,
  saveWrittenDraft,
  useDB,
} from "../lib/store";
import { useHashRoute } from "../lib/router";
import { syncConfigured } from "../lib/sync";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";
import { PhotoCapture } from "../components/PhotoCapture";
import { useToast } from "../components/Toast";

export function WrittenSessionPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const draft = db.writtenDraft;
  const learner = draft ? db.learners.find((item) => item.id === draft.learnerId) : null;
  const task = draft ? draft.tasks[draft.currentIndex] : null;

  useEffect(() => {
    if (!draft) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [draft]);

  if (!draft || !learner || !task) {
    return (
      <>
        <PageHeader title="Written check" subline="No written check is in progress on this device." />
        <EmptyState
          title="Nothing to resume"
          body="Start a written check from the Written screen. Drafts are saved after every change."
          action={
            <a className="btn btn-primary" href="#/written/new">
              Start a written check
            </a>
          }
        />
      </>
    );
  }

  const taskSet = getWrittenTaskSet(draft.subject);
  const subject = getSubject(draft.subject);
  const isLast = draft.currentIndex >= draft.tasks.length - 1;
  const total = writtenTotals(draft.tasks);
  const progress = Math.round(((draft.currentIndex + 1) / draft.tasks.length) * 100);

  const updateTask = (result: WrittenTaskResult) => {
    const tasks = draft.tasks.map((item, index) =>
      index === draft.currentIndex ? result : item,
    );
    saveWrittenDraft({
      ...draft,
      tasks,
      lastSavedAt: new Date().toISOString(),
    });
  };

  const commitTask = (result: WrittenTaskResult) => {
    const tasks = draft.tasks.map((item, index) =>
      index === draft.currentIndex ? result : item,
    );
    if (!isLast) {
      saveWrittenDraft({
        ...draft,
        tasks,
        currentIndex: draft.currentIndex + 1,
        lastSavedAt: new Date().toISOString(),
      });
      return;
    }
    const totals = writtenTotals(tasks);
    const assessment: WrittenAssessment = {
      id: `wr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      learnerId: draft.learnerId,
      subject: draft.subject,
      taskSetId: draft.taskSetId,
      taskSetName: draft.taskSetName,
      startedAt: draft.startedAt,
      completedAt: new Date().toISOString(),
      durationSec: Math.max(1, Math.round((Date.now() - new Date(draft.startedAt).getTime()) / 1000)),
      educator: draft.educator,
      centre: draft.centre,
      tasks,
      totalScore: totals.total,
      maxScore: totals.max,
      band: writtenBandFor(totals.total, totals.max),
      notes: draft.notes,
      syncStatus: "queued",
      updatedAt: new Date().toISOString(),
      deviceId: draft.deviceId,
    };
    addWrittenAssessment(assessment);
    if (syncConfigured(db.settings) && navigator.onLine) {
      toast("Written report saved. It will sync in the background.", "positive");
    } else {
      toast("Written report saved on this device. Sync when internet is available.", "positive");
    }
    route.navigate(`/written/${assessment.id}`);
  };

  return (
    <>
      <PageHeader
        title="Written check"
        subline={`${learner.code} · ${subject.name} · ${draft.taskSetName}`}
        actions={
          <a className="btn" href="#/written">
            <Icon name="arrow-left" size={14} /> Save &amp; exit
          </a>
        }
      />

      <div className="written-session-head">
        <div>
          <p className="report-kicker">
            {learner.code} · {subject.name}
          </p>
          <h1 className="written-session-title">{task.title}</h1>
          <p className="section-sub">
            Task {draft.currentIndex + 1} of {draft.tasks.length} · {draft.educator} · {draft.centre}
          </p>
        </div>
        <div className="written-session-meta">
          <span className="written-session-progress">{progress}% complete</span>
          <span className="written-session-total num">
            {total.total} / {total.max} marks
          </span>
        </div>
      </div>
      <div className="auto-progress-track written-progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="grid-12 written-session-layout">
        <div className="col-7">
          <section className="panel written-task-panel">
            <div className="written-task-head">
              <div>
                <span className="written-task-kicker">Written task</span>
                <h2>{task.prompt}</h2>
              </div>
              <span className="pill pill--neutral">{task.criteria.length} criteria</span>
            </div>
            {task.content ? (
              <div className={`written-task-sheet ${draft.subject === "kannada" ? "kannada" : ""}`}>
                {task.content}
              </div>
            ) : (
              <div className="written-task-sheet written-task-sheet--blank">
                Child writes on the answer page.
              </div>
            )}
            <p className="written-task-hint">
              Keep the page flat. Photograph the whole answer, including the edges.
            </p>
            <PhotoCapture
              photoId={task.photoId}
              onChange={(photoId) => updateTask({ ...task, photoId })}
            />
          </section>
        </div>

        <div className="col-5">
          <WrittenTaskForm
            key={`${draft.id}-${draft.currentIndex}`}
            task={task}
            isLast={isLast}
            subject={draft.subject}
            onDraft={updateTask}
            onCommit={commitTask}
          />
        </div>
      </div>

      <p className="overview-foot">
        <span className="status-dot status-dot--positive" />
        Saved on this device after every change. {taskSet.tasks.length} draft tasks · rubric not yet
        validated.
      </p>
    </>
  );
}

function WrittenTaskForm({
  task,
  isLast,
  subject,
  onDraft,
  onCommit,
}: {
  task: WrittenTaskResult;
  isLast: boolean;
  subject: WrittenDraft["subject"];
  onDraft: (task: WrittenTaskResult) => void;
  onCommit: (task: WrittenTaskResult) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(task.scores ?? {});
  const [note, setNote] = useState(task.note ?? "");
  const complete = task.criteria.every((criterion) => scores[criterion.id] !== undefined);
  const taskScore = useMemo(() => {
    const draft = { ...task, scores };
    return writtenTaskScore(draft);
  }, [scores, task]);
  const max = writtenTaskMax(task);

  const choose = (criterionId: string, value: number) => {
    const next = { ...scores, [criterionId]: value };
    setScores(next);
    onDraft({ ...task, scores: next, note });
  };

  return (
    <section className="panel written-rubric-panel">
      <div className="section-head">
        <div>
          <h2>Educator rubric</h2>
          <p className="section-sub">Mark what you see on the page. No machine score.</p>
        </div>
        <span className="written-rubric-total num">
          {taskScore}/{max}
        </span>
      </div>

      <div className="written-score-legend">
        <span><strong>0</strong> Not yet</span>
        <span><strong>1</strong> Partly</span>
        <span><strong>2</strong> Secure</span>
      </div>

      <div className="written-rubric-list">
        {task.criteria.map((criterion) => (
          <div className="written-rubric-row" key={criterion.id}>
            <span className="written-rubric-label">{criterion.label}</span>
            <div className="written-rubric-buttons" role="group" aria-label={criterion.label}>
              {[0, 1, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`written-score-button ${scores[criterion.id] === value ? "is-selected" : ""}`}
                  aria-pressed={scores[criterion.id] === value}
                  aria-label={`${criterion.label}: ${value}`}
                  onClick={() => choose(criterion.id, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="written-note-label" htmlFor="written-task-note">
        What did you notice? <span>Optional</span>
      </label>
      <textarea
        id="written-task-note"
        className="textarea written-note"
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          onDraft({ ...task, scores, note: event.target.value });
        }}
        placeholder="For example: reversals in b/d; leaves spaces between words; needed the prompt repeated."
      />

      {!task.photoId ? (
        <div className="notice notice--warning mt-16">
          <Icon name="alert" size={15} />
          <span>No photo attached. The report will still save, but the written evidence will be missing.</span>
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn-primary btn-lg written-save"
        onClick={() => onCommit({ ...task, scores, note })}
        disabled={!complete}
      >
        {isLast ? "Finish & see report" : "Save & next task"} <Icon name="arrow-right" size={15} />
      </button>
      {!complete ? (
        <p className="written-save-hint">Choose a score for every criterion to continue.</p>
      ) : null}
      <p className="written-rubric-foot">
        {subject === "kannada" ? "Kannada" : "Written"} evidence is stored locally. The rubric is a draft.
      </p>
    </section>
  );
}
