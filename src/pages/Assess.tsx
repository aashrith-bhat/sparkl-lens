import { useEffect, useRef, useState } from "react";
import { getRung, getRungs, getSubject, shortRungName, SUBJECT_ORDER } from "../data/curriculum";
import type { Pacing, SessionConfig, SessionMode, SubjectId } from "../types";
import { useDB, addLearner, clearDraft, saveDraft } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { estimateMinutes, configFor, createDraft, enabledRungs } from "../lib/session";
import { latestAssessment, subjectSnapshots } from "../lib/selectors";
import { clamp, relativeDate } from "../lib/format";
import { speechRecognitionSupported, useSpeechRecognition } from "../lib/useSpeech";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Pill } from "../components/Pill";
import { EmptyState } from "../components/EmptyState";
import { AddLearnerModal } from "../components/AddLearnerModal";
import { useToast } from "../components/Toast";

export function AssessPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const { learners, assessments, settings, draft } = db;

  const queryLearner = route.query.get("learner");
  const querySubject = route.query.get("subject");
  const initialLearner =
    queryLearner && learners.some((learner) => learner.id === queryLearner)
      ? queryLearner
      : learners[0]?.id ?? "";
  const initialSubject: SubjectId =
    querySubject === "kannada" || querySubject === "english" || querySubject === "maths"
      ? querySubject
      : "kannada";

  const [learnerId, setLearnerId] = useState(initialLearner);
  const [subject, setSubject] = useState<SubjectId>(initialSubject);
  const [mode, setMode] = useState<SessionMode>("quick");
  const [pacing, setPacing] = useState<Pacing>("auto");
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState({
    startOrder: 1,
    itemsPerRung: settings.itemsPerRung,
    passMark: settings.passMark,
    maxRungs: 6,
  });
  const [newLearnerOpen, setNewLearnerOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const browserSpeech = speechRecognitionSupported();
  const secureContext = typeof window === "undefined" || window.isSecureContext;
  const autoReady = browserSpeech && online && secureContext;

  const learner = learners.find((item) => item.id === learnerId) ?? learners[0];
  const latest = learner ? latestAssessment(assessments, learner.id, subject) : null;
  const currentOrder = latest?.finalOrder ?? 0;
  const snapshots = learner ? subjectSnapshots(learner, assessments, settings) : [];
  const filteredLearners = learners.filter((item) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      item.code.toLowerCase().includes(needle) ||
      item.centre.toLowerCase().includes(needle) ||
      String(item.enrolledStd).includes(needle)
    );
  });

  const activeRungs = enabledRungs(subject, settings);
  const customStart = activeRungs.some((rung) => rung.order === custom.startOrder)
    ? custom.startOrder
    : activeRungs[0]?.order ?? 1;
  const config: SessionConfig = configFor(
    mode,
    subject,
    currentOrder,
    settings,
    mode === "custom"
      ? {
          startOrder: customStart,
          itemsPerRung: custom.itemsPerRung,
          passMark: custom.passMark,
          maxRungs: custom.maxRungs,
        }
      : undefined,
    pacing,
  );
  const minutes = estimateMinutes(config);
  const fullConfig = configFor("full", subject, currentOrder, settings, undefined, pacing);
  const fullMinutes = estimateMinutes(fullConfig);
  const quickConfig = configFor("quick", subject, currentOrder, settings, undefined, pacing);
  const quickMinutes = estimateMinutes(quickConfig);
  const quickStart = currentOrder > 1 ? currentOrder - 1 : 1;
  const startRung = getRung(subject, config.startOrder);
  const consentMissing = Boolean(learner && !learner.consentOnFile);
  const autoBlocked = pacing === "auto" && !autoReady;
  const canStart = Boolean(learner) && !consentMissing && !autoBlocked;

  const pickLearner = (id: string) => {
    setLearnerId(id);
    setCustom((value) => ({ ...value, startOrder: 1 }));
  };

  const begin = () => {
    if (!learner) return;
    if (draft) {
      setReplaceOpen(true);
      return;
    }
    startNow();
  };

  const startNow = () => {
    if (!learner) return;
    const fresh = createDraft(learner.id, subject, config, settings);
    saveDraft(fresh);
    setReplaceOpen(false);
    route.navigate("/session");
  };

  const createLearner = (input: {
    enrolledStd: number;
    centre: string;
    homeLanguage: string;
    consent: boolean;
  }) => {
    const created = addLearner({ ...input, consentOnFile: input.consent });
    setLearnerId(created.id);
    setNewLearnerOpen(false);
    toast(`Learner ${created.code} added`, "positive");
  };

  if (!learners.length) {
    return (
      <>
        <PageHeader
          title="Assess"
          subline="Add an anonymous learner code before starting a ladder."
        />
        <EmptyState
          title="No learners yet"
          body="SparkL Lens records an anonymous code, the enrolled standard, the centre and the home language. No name is collected."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setNewLearnerOpen(true)}>
              Add a learner
            </button>
          }
        />
        <AddLearnerModal
          open={newLearnerOpen}
          defaultCentre={settings.centre}
          onClose={() => setNewLearnerOpen(false)}
          onAdded={createLearner}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Assess"
        subline="Pick a learner, subject and test length. Automatic mode listens, scores and builds the detailed report; the volunteer only starts it and reads the evidence."
      />

      {draft && draft !== null ? (
        <DraftStrip
          draft={draft}
          learnerCode={learners.find((item) => item.id === draft.learnerId)?.code ?? "Learner"}
          onResume={() => route.navigate("/session")}
          onDiscard={() => {
            clearDraft();
            toast("In-progress assessment discarded");
          }}
        />
      ) : null}

      <div className="assess-actionbar">
        <div className="begin-summary">
          <span className="begin-title">
            {learner ? learner.code : "Choose a learner"} · {getSubject(subject).name}
          </span>
          <span className="begin-meta">
            {pacing === "auto" ? "Automatic" : "Educator-assisted"} ·{" "}
            {startRung ? startRung.name : "—"} start · {config.itemsPerRung} items per rung ·{" "}
            {config.passMark} to clear · about {minutes} min
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={begin}
          disabled={!canStart}
          aria-label="Begin assessment"
          title={
            !canStart
              ? consentMissing
                ? "Consent must be on file before an assessment can start."
                : "Automatic mode needs browser speech, HTTPS/localhost and a connection. Switch to educator-assisted or use Chrome."
              : undefined
          }
        >
          <span className="begin-label-full" aria-hidden="true">Begin assessment</span>
          <span className="begin-label-short" aria-hidden="true">Begin</span>
          <Icon name="arrow-right" size={15} />
        </button>
      </div>
      {!canStart && learner ? (
        <p className="begin-reason">
          {consentMissing
            ? `Consent is not on file for ${learner.code}. The begin button stays disabled.`
            : "Automatic mode is blocked: this browser needs speech recognition, a secure context and a connection. Use Chrome on localhost, or choose educator-assisted mode."}
        </p>
      ) : null}

      <div className="grid-12 assess-layout">
        <div className="col-8 assess-form">
          <section className="panel assess-step" aria-labelledby="step-learner">
            <div className="assess-step-head">
              <div>
                <h2 id="step-learner">Learner</h2>
                <p className="section-sub">Anonymous code only. Consent must be on file.</p>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setNewLearnerOpen(true)}>
                <Icon name="plus" size={13} /> New learner
              </button>
            </div>

            <div className="learner-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by code, standard or centre"
                aria-label="Filter learners"
              />
            </div>

            <div className="learner-picker" role="radiogroup" aria-label="Choose a learner">
              {filteredLearners.map((item) => {
                const selected = item.id === learnerId;
                const itemSnapshots = subjectSnapshots(item, assessments, settings);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`learner-option ${selected ? "is-selected" : ""}`}
                    onClick={() => pickLearner(item.id)}
                  >
                    <Avatar code={item.code} size={30} />
                    <span className="learner-option-main">
                      <span className="learner-option-code">{item.code}</span>
                      <span className="learner-option-sub">
                        Std {item.enrolledStd} · {item.centre} · {item.homeLanguage}
                      </span>
                    </span>
                    <span className="learner-option-levels">
                      {itemSnapshots.map((snapshot) => {
                        const rung = snapshot.levelOrder ? getRung(snapshot.subject, snapshot.levelOrder) : null;
                        return (
                          <span key={snapshot.subject} className="learner-mini" title={`${getSubject(snapshot.subject).name}: ${rung?.name ?? "not assessed"}`}>
                            <span className="learner-mini-subject" aria-hidden="true">
                              {subjectInitial(snapshot.subject)}
                            </span>
                            <span className={`learner-mini-level ${rung ? "" : "faint"}`}>
                              {rung ? shortRungName(rung) : "—"}
                            </span>
                          </span>
                        );
                      })}
                    </span>
                    {!item.consentOnFile ? <Pill tone="warning">Consent missing</Pill> : null}
                    <span className={`choice-radio ${selected ? "is-on" : ""}`} aria-hidden="true">
                      {selected ? <Icon name="check" size={10} /> : null}
                    </span>
                  </button>
                );
              })}
              {!filteredLearners.length ? (
                <p className="learner-empty">No learner code matches that filter.</p>
              ) : null}
            </div>
          </section>

          <section className="panel assess-step" aria-labelledby="step-subject">
            <div className="assess-step-head">
              <div>
                <h2 id="step-subject">Subject</h2>
                <p className="section-sub">Each subject has its own level and its own ladder.</p>
              </div>
            </div>
            <div className="subject-choices" role="radiogroup" aria-label="Choose a subject">
              {SUBJECT_ORDER.map((id) => {
                const meta = getSubject(id);
                const snapshot = snapshots.find((item) => item.subject === id);
                const rung = snapshot?.levelOrder ? getRung(id, snapshot.levelOrder) : null;
                const selected = subject === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`subject-choice ${selected ? "is-selected" : ""}`}
                    onClick={() => setSubject(id)}
                  >
                    <span className="subject-choice-top">
                      <span
                        className={`subject-choice-glyph ${id === "kannada" ? "kannada" : "literata"}`}
                        lang={id === "kannada" ? "kn" : undefined}
                      >
                        {meta.sample}
                      </span>
                      {selected ? (
                        <span className="subject-choice-check">
                          <Icon name="check" size={11} />
                        </span>
                      ) : null}
                    </span>
                    <span className="subject-choice-name">{meta.name}</span>
                    <span className="subject-choice-level">
                      {rung ? rung.name : "Not assessed yet"}
                    </span>
                    <span className="subject-choice-meta">
                      {rung ? `Std ${rung.benchmark} benchmark` : "6-rung draft ladder"}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel assess-step" aria-labelledby="step-pacing">
            <div className="assess-step-head">
              <div>
                <h2 id="step-pacing">How should it run?</h2>
                <p className="section-sub">
                  Automatic is built for a volunteer starting one child and reading the report
                  afterwards.
                </p>
              </div>
            </div>

            <div className="mode-list" role="radiogroup" aria-label="Assessment pacing">
              <ModeRow
                selected={pacing === "auto"}
                onSelect={() => setPacing("auto")}
                title="Automatic (child-led)"
                detail="The child taps Start, reads aloud, and the app scores accuracy, pace and pauses, then moves on. No per-item marking."
                meta="Recommended"
              />
              <ModeRow
                selected={pacing === "educator"}
                onSelect={() => setPacing("educator")}
                title="Educator-assisted"
                detail="The educator listens and marks each item. Use this for calibration or when speech is not available."
                meta="Offline-friendly"
              />
            </div>

            {pacing === "auto" ? (
              <div className="auto-preflight">
                <div className="auto-preflight-head">
                  <span className="auto-preflight-title">Before you start</span>
                  <span className={`auto-preflight-badge ${autoReady ? "is-ready" : "is-blocked"}`}>
                    {autoReady ? "Ready for automatic" : "Needs attention"}
                  </span>
                </div>
                <div className="auto-preflight-grid">
                  <div className="device-row">
                    <span
                      className={`status-dot ${
                        browserSpeech ? "status-dot--positive" : "status-dot--negative"
                      }`}
                    />
                    <span className="device-label">Browser speech</span>
                    <span className={`device-value ${browserSpeech ? "is-positive" : "is-negative"}`}>
                      {browserSpeech ? "Available" : "Not available"}
                    </span>
                  </div>
                  <div className="device-row">
                    <span
                      className={`status-dot ${
                        secureContext ? "status-dot--positive" : "status-dot--negative"
                      }`}
                    />
                    <span className="device-label">Secure context</span>
                    <span className={`device-value ${secureContext ? "is-positive" : "is-negative"}`}>
                      {secureContext ? "Yes" : "Needs HTTPS"}
                    </span>
                  </div>
                  <div className="device-row">
                    <span
                      className={`status-dot ${online ? "status-dot--positive" : "status-dot--warning"}`}
                    />
                    <span className="device-label">Connection</span>
                    <span className={`device-value ${online ? "is-positive" : "is-warning"}`}>
                      {online ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <MicCheck subject={subject} />
                {!autoReady ? (
                  <p className="auto-preflight-warning">
                    Automatic scoring needs browser speech, HTTPS or localhost, and a connection in
                    Chrome. Switch to educator-assisted mode, or open the app in Chrome on localhost.
                  </p>
                ) : null}
                <p className="auto-preflight-note">
                  The app uses the browser's speech service; the audio is not stored. Low-confidence
                  items are flagged for a quick check in the report.
                </p>
              </div>
            ) : (
              <div className="notice mt-16">
                <Icon name="users" size={15} />
                <span>
                  Educator-assisted mode works offline. The educator marks each item and confirms the
                  level; the detailed report still captures the evidence.
                </span>
              </div>
            )}
          </section>

          <section className="panel assess-step" aria-labelledby="step-mode">
            <div className="assess-step-head">
              <div>
                <h2 id="step-mode">How far to test</h2>
                <p className="section-sub">
                  {mode === "quick"
                    ? `Starts one rung below the current level (${shortRungName(getRung(subject, quickStart) ?? getRungs(subject)[0])}).`
                    : mode === "full"
                      ? "Starts at the first rung and climbs until the child stops."
                      : "Choose the start, the number of items and the pass rule."}
                </p>
              </div>
            </div>

            <div className="mode-list" role="radiogroup" aria-label="Assessment length">
              <ModeRow
                selected={mode === "quick"}
                onSelect={() => setMode("quick")}
                title="Quick check"
                detail="Two items per rung, one to clear, up to four attempts. A triage estimate."
                meta={`About ${quickMinutes} min`}
              />
              <ModeRow
                selected={mode === "full"}
                onSelect={() => setMode("full")}
                title="Full ladder"
                detail={`${settings.itemsPerRung} items per rung, ${Math.min(
                  settings.passMark,
                  settings.itemsPerRung,
                )} to clear, all enabled rungs. Use when the level must be confirmed.`}
                meta={`About ${fullMinutes} min`}
              />
              <ModeRow
                selected={mode === "custom"}
                onSelect={() => setMode("custom")}
                title="Custom test"
                detail="Set the start rung, items per rung, pass mark and attempt limit for this child."
                meta={`${config.itemsPerRung} items · ${config.passMark} to clear`}
              />
            </div>

            {mode === "custom" ? (
              <div className="custom-config">
                <div className="field">
                  <label htmlFor="custom-start">Start at</label>
                  <select
                    id="custom-start"
                    className="select"
                    value={customStart}
                    onChange={(event) =>
                      setCustom((value) => ({ ...value, startOrder: Number(event.target.value) }))
                    }
                  >
                    {activeRungs.map((rung) => (
                      <option key={rung.id} value={rung.order}>
                        {rung.name} · Std {rung.benchmark}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="custom-items">Items per rung</label>
                  <select
                    id="custom-items"
                    className="select"
                    value={custom.itemsPerRung}
                    onChange={(event) => {
                      const items = Number(event.target.value);
                      setCustom((value) => ({
                        ...value,
                        itemsPerRung: items,
                        passMark: clamp(value.passMark, 1, items),
                      }));
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="custom-pass">To clear a rung</label>
                  <select
                    id="custom-pass"
                    className="select"
                    value={Math.min(custom.passMark, custom.itemsPerRung)}
                    onChange={(event) =>
                      setCustom((value) => ({ ...value, passMark: Number(event.target.value) }))
                    }
                  >
                    {Array.from({ length: custom.itemsPerRung }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count} of {custom.itemsPerRung}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="custom-max">Attempt limit</label>
                  <select
                    id="custom-max"
                    className="select"
                    value={custom.maxRungs}
                    onChange={(event) =>
                      setCustom((value) => ({ ...value, maxRungs: Number(event.target.value) }))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? "rung" : "rungs"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {consentMissing ? (
              <div className="notice notice--warning mt-16">
                <Icon name="alert" size={15} />
                <span>
                  Consent is not on file for this learner. Add consent on the learner profile before
                  assessing. No assessment can start without it.
                </span>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="col-4 assess-aside">
          <section className="panel aside-panel">
            <h2 className="aside-title">
              {pacing === "auto" ? "How automatic scoring works" : "How a level is decided"}
            </h2>
            <ol className="how-list">
              {pacing === "auto" ? (
                <>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      The child reads each item aloud. The app scores accuracy, pace, pauses and
                      recognition confidence; the volunteer does not mark items.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      The ladder advances automatically. If a rung does not clear, it checks the level
                      below before recording a result.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      At the end it saves a detailed report with the level, fluency band and item
                      evidence. Low-confidence items are flagged for a quick check.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      A teacher check is optional afterwards; it is not needed to finish the session.
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      The ladder starts at the chosen rung. Clear it and the next opens; the educator
                      confirms the highest comfortable rung.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      If the first rung is not cleared, the ladder drops one rung to check the level
                      below.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      The machine can suggest a reading match, but the educator marks every item.
                    </span>
                  </li>
                  <li>
                    <span className="how-marker" aria-hidden="true" />
                    <span>
                      On the result screen, the educator can override the suggested level before saving.
                    </span>
                  </li>
                </>
              )}
            </ol>
            <div className="aside-rule">
              <span className="aside-rule-label">Current draft rule</span>
              <span>
                {config.itemsPerRung} items per rung, {config.passMark} to clear
                {config.partialCredit ? ", partial counts as half" : ", partial does not count"}.
              </span>
            </div>
            <a className="text-link mt-8" href="#/settings">
              Change grading rules <Icon name="arrow-right" size={13} />
            </a>
          </section>

          <section className="panel panel--raised aside-panel">
            <h2 className="aside-title">Field notes</h2>
            <div className="field-note">
              <span className="field-note-kicker">Draft, not final</span>
              <p>
                The six-rung sequence, the Std benchmarks and the pass rules are a working draft. SparkL
                has not yet supplied its official rubric.
              </p>
            </div>
            {pacing === "auto" ? (
              <div className="field-note">
                <span className="field-note-kicker">Automatic is experimental</span>
                <p>
                  Task 4 recommends an educator listens and confirms. This build adds child-led scoring
                  to explore scale; treat low-confidence reports as provisional and spot-check them.
                </p>
              </div>
            ) : null}
            <div className="field-note">
              <span className="field-note-kicker">Kannada instructions</span>
              <p className="kannada-note kannada" lang="kn">
                ಈ ಅಕ್ಷರಗಳನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.
              </p>
              <p>Instructions show in Kannada as well as English. Change this in Settings.</p>
            </div>
            <div className="field-note">
              <span className="field-note-kicker">
                {pacing === "auto" ? "Quiet corner, private data" : "Offline and private"}
              </span>
              <p>
                Records stay in this browser; learner codes only, no names.{" "}
                {pacing === "auto"
                  ? "Automatic speech uses the browser's service and may need a connection. Use a quiet corner and a charged device."
                  : "This mode works offline; speech capture is optional."}
              </p>
            </div>
            <a className="text-link mt-8" href="#/evidence">
              Read the evidence <Icon name="arrow-right" size={13} />
            </a>
          </section>
        </aside>
      </div>

      <AddLearnerModal
        open={newLearnerOpen}
        defaultCentre={settings.centre}
        onClose={() => setNewLearnerOpen(false)}
        onAdded={createLearner}
      />

      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title="Replace the assessment in progress?"
        description="Starting this one will discard the unsaved draft. Completed assessments are not affected."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setReplaceOpen(false)}>
              Keep draft
            </button>
            <button type="button" className="btn btn-primary" onClick={startNow}>
              Start new assessment
            </button>
          </>
        }
      >
        <p className="small muted">
          The draft belongs to{" "}
          {learners.find((item) => item.id === draft?.learnerId)?.code ?? "another learner"}. Only one
          draft is kept at a time.
        </p>
      </Modal>
    </>
  );
}

function MicCheck({ subject }: { subject: SubjectId }) {
  const language = subject === "kannada" ? "kn-IN" : "en-IN";
  const speech = useSpeechRecognition(language);
  const [status, setStatus] = useState<"idle" | "listening" | "done">("idle");
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  useEffect(() => {
    if (speech.error && status === "listening") {
      clearTimer();
      setStatus("done");
    }
  }, [speech.error, status]);

  const test = () => {
    if (!speech.supported || status === "listening") return;
    clearTimer();
    speech.start();
    setStatus("listening");
    timerRef.current = window.setTimeout(() => {
      speech.stop();
      setStatus("done");
    }, 5000);
  };

  return (
    <div className="mic-check">
      <div className="mic-check-head">
        <span className="mic-check-title">Microphone check</span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={test}
          disabled={!speech.supported || status === "listening"}
        >
          {status === "listening" ? "Listening…" : "Test microphone"}
        </button>
      </div>
      <p className="mic-check-copy">
        {speech.error
          ? speech.error
          : status === "done"
            ? speech.capturedText.trim()
              ? `Heard: “${speech.capturedText.trim()}”`
              : "No speech heard. Check the microphone and the quiet space."
            : status === "listening"
              ? "Speak a short sentence. This test is not saved."
              : "Speak for five seconds so the volunteer knows the device can hear the child."}
      </p>
    </div>
  );
}

function subjectInitial(subject: SubjectId): string {
  if (subject === "kannada") return "K";
  if (subject === "english") return "E";
  return "M";
}

function ModeRow({
  selected,
  onSelect,
  title,
  detail,
  meta,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`mode-row ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <span className={`choice-radio ${selected ? "is-on" : ""}`} aria-hidden="true">
        {selected ? <Icon name="check" size={10} /> : null}
      </span>
      <span className="mode-copy">
        <span className="mode-title">{title}</span>
        <span className="mode-detail">{detail}</span>
      </span>
      <span className="mode-meta">{meta}</span>
    </button>
  );
}

function DraftStrip({
  draft,
  learnerCode,
  onResume,
  onDiscard,
}: {
  draft: { subject: SubjectId; currentOrder: number; rungResults: unknown[] };
  learnerCode: string;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="resume-strip">
      <span className="resume-copy">
        <span className="status-dot status-dot--accent" />
        <span>
          <strong>{learnerCode}</strong> · {getSubject(draft.subject).name} ·{" "}
          {draft.rungResults.length} {draft.rungResults.length === 1 ? "rung" : "rungs"} finished.
          One draft is kept at a time.
        </span>
      </span>
      <span className="row">
        <button type="button" className="btn btn-sm btn-ghost" onClick={onDiscard}>
          Discard
        </button>
        <button type="button" className="btn btn-sm" onClick={onResume}>
          Resume draft
        </button>
      </span>
    </div>
  );
}
