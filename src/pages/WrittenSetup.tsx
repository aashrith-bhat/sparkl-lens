import { useEffect, useMemo, useState } from "react";
import { getSubject, SUBJECT_ORDER } from "../data/curriculum";
import type { SubjectId, WrittenDraft } from "../types";
import { getWrittenTaskSet, emptyWrittenTaskResult } from "../data/written";
import { clearWrittenDraft, saveWrittenDraft, useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { requestPersistentStorage } from "../lib/photoStore";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function WrittenSetupPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const initialLearner = route.query.get("learner") ?? "";
  const initialSubject = route.query.get("subject");
  const [learnerId, setLearnerId] = useState(
    db.learners.some((item) => item.id === initialLearner) ? initialLearner : db.learners[0]?.id ?? "",
  );
  const [subject, setSubject] = useState<SubjectId>(
    initialSubject === "english" || initialSubject === "maths" ? initialSubject : "kannada",
  );
  const [search, setSearch] = useState("");

  const learner = db.learners.find((item) => item.id === learnerId) ?? null;
  const taskSet = getWrittenTaskSet(subject);
  const draft = db.writtenDraft;
  const consentMissing = Boolean(learner && !learner.consentOnFile);
  const today = new Date().toDateString();

  const writtenToday = (id: string, subjectId: SubjectId) =>
    db.writtenAssessments.some(
      (item) =>
        item.learnerId === id &&
        item.subject === subjectId &&
        new Date(item.completedAt).toDateString() === today,
    );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return db.learners;
    return db.learners.filter(
      (item) =>
        item.code.toLowerCase().includes(needle) ||
        item.centre.toLowerCase().includes(needle) ||
        String(item.enrolledStd).includes(needle),
    );
  }, [db.learners, search]);

  useEffect(() => {
    if (learnerId && db.learners.some((item) => item.id === learnerId)) return;
    if (db.learners[0]) setLearnerId(db.learners[0].id);
  }, [db.learners, learnerId]);

  if (!db.learners.length) {
    return (
      <>
        <PageHeader
          title="Written check"
          subline="A paper-first written assessment with photo evidence and a short teacher rubric."
        />
        <EmptyState
          title="No learners yet"
          body="Add a learner before starting a written check. Records use an anonymous code."
          action={
            <a className="btn btn-primary" href="#/learners">
              Go to Learners
            </a>
          }
        />
      </>
    );
  }

  const start = async () => {
    if (!learner || consentMissing || draft) return;
    await requestPersistentStorage();
    const now = new Date().toISOString();
    const fresh: WrittenDraft = {
      id: `wd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      learnerId: learner.id,
      subject,
      taskSetId: taskSet.id,
      taskSetName: taskSet.name,
      startedAt: now,
      lastSavedAt: now,
      educator: db.settings.educator,
      centre: learner.centre,
      currentIndex: 0,
      tasks: taskSet.tasks.map(emptyWrittenTaskResult),
      notes: "",
      deviceId: db.deviceId,
    };
    saveWrittenDraft(fresh);
    route.navigate("/written/session");
  };

  return (
    <>
      <div className="crumb">
        <a href="#/written">Written</a>
        <span aria-hidden="true">/</span>
        <span>New check</span>
      </div>

      <PageHeader
        title="Start a written check"
        subline="The child writes on paper. The volunteer photographs the page and marks three short criteria. Works without internet."
      />

      {draft ? (
        <div className="notice notice--warning mb-16">
          <Icon name="alert" size={15} />
          <span>
            A written check is already in progress for{" "}
            {db.learners.find((item) => item.id === draft.learnerId)?.code ?? "a learner"}. Resume it,
            or discard it before starting another.
          </span>
          <span className="written-notice-actions">
            <a className="btn btn-sm" href="#/written/session">
              Resume
            </a>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                clearWrittenDraft();
                toast("Written draft discarded");
              }}
            >
              Discard
            </button>
          </span>
        </div>
      ) : null}

      <div className="assess-actionbar">
        <div className="begin-summary">
          <span className="begin-title">
            {learner?.code ?? "Choose a learner"} · {getSubject(subject).name}
          </span>
          <span className="begin-meta">
            {taskSet.tasks.length} tasks · photo + rubric · about 8–10 min
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => void start()}
          disabled={!learner || consentMissing || Boolean(draft)}
        >
          Start written check <Icon name="arrow-right" size={15} />
        </button>
      </div>

      {consentMissing && learner ? (
        <p className="begin-reason">
          Consent is not on file for {learner.code}. A written check cannot start until it is recorded.
        </p>
      ) : null}

      <div className="grid-12 written-setup">
        <div className="col-8 written-setup-main">
          <section className="panel assess-step" aria-labelledby="written-learner">
            <div className="assess-step-head">
              <div>
                <h2 id="written-learner">Learner</h2>
                <p className="section-sub">Anonymous code only. Choose the child in front of you.</p>
              </div>
            </div>
            <label className="filter-search written-learner-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by code, standard or centre"
                aria-label="Filter learners for a written check"
              />
            </label>
            <div className="written-learner-list">
              {filtered.map((item) => {
                const selected = item.id === learnerId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`written-learner ${selected ? "is-selected" : ""}`}
                    onClick={() => setLearnerId(item.id)}
                    aria-pressed={selected}
                  >
                    <Avatar code={item.code} size={28} />
                    <span className="written-learner-copy">
                      <span className="written-learner-code">{item.code}</span>
                      <span className="written-learner-meta">
                        Std {item.enrolledStd} · {item.centre}
                      </span>
                    </span>
                    {!item.consentOnFile ? <span className="pill pill--warning">Consent</span> : null}
                    {writtenToday(item.id, subject) ? (
                      <span className="pill pill--positive">Done</span>
                    ) : null}
                    {selected ? (
                      <span className="written-learner-check">
                        <Icon name="check" size={12} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!filtered.length ? (
                <p className="small muted written-no-learners">No learner matches that filter.</p>
              ) : null}
            </div>
          </section>

          <section className="panel assess-step" aria-labelledby="written-subject">
            <div className="assess-step-head">
              <div>
                <h2 id="written-subject">Subject</h2>
                <p className="section-sub">Each subject has its own draft written sample.</p>
              </div>
            </div>
            <div className="written-subject-row" role="radiogroup" aria-label="Written subject">
              {SUBJECT_ORDER.map((id) => {
                const meta = getSubject(id);
                const selected = subject === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`written-subject ${selected ? "is-selected" : ""}`}
                    onClick={() => setSubject(id)}
                  >
                    <span className={`written-subject-glyph ${id === "kannada" ? "kannada" : ""}`}>
                      {meta.sample}
                    </span>
                    <span>
                      <strong>{meta.name}</strong>
                      <span>Written sample</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel assess-step" aria-labelledby="written-tasks">
            <div className="assess-step-head">
              <div>
                <h2 id="written-tasks">What the child will write</h2>
                <p className="section-sub">One page per check. These tasks are a draft and can be changed later.</p>
              </div>
              <span className="pill pill--neutral">{taskSet.tasks.length} tasks</span>
            </div>
            <ol className="written-task-preview">
              {taskSet.tasks.map((task, index) => (
                <li key={task.id}>
                  <span className="written-task-number">{index + 1}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.prompt}</p>
                    {task.content ? (
                      <p className={`written-task-content ${subject === "kannada" ? "kannada" : ""}`}>
                        {task.content}
                      </p>
                    ) : null}
                    <span className="written-task-criteria">
                      {task.criteria.map((criterion) => criterion.label).join(" · ")}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="col-4 written-setup-side">
          <section className="panel panel--raised">
            <h2 className="aside-title">How a written check works</h2>
            <ol className="how-list">
              <li>
                <span className="how-marker" aria-hidden="true" />
                <span>The child writes on paper. The volunteer keeps the page in view.</span>
              </li>
              <li>
                <span className="how-marker" aria-hidden="true" />
                <span>Photograph the page. The image is compressed and stored on this device.</span>
              </li>
              <li>
                <span className="how-marker" aria-hidden="true" />
                <span>Mark three criteria, add a note if useful, and move to the next task.</span>
              </li>
              <li>
                <span className="how-marker" aria-hidden="true" />
                <span>The report is saved offline. Supabase sync can wait for internet.</span>
              </li>
            </ol>
          </section>
          <section className="panel written-setup-note">
            <h2>What this is not</h2>
            <p>
              This is not handwriting OCR. The app stores the page and the teacher's rubric. That is more
              reliable for Kannada and for young children than pretending the machine can read every mark.
            </p>
            <a className="text-link" href="#/settings?tab=sync">
              Configure sync <Icon name="arrow-right" size={13} />
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}
