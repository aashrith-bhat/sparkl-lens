import { useEffect, useMemo, useRef, useState } from "react";
import { getRung, getRungs, getSubject, topOrder } from "../data/curriculum";
import type {
  Assessment,
  Confidence,
  DraftSession,
  Fluency,
  Item,
  ItemResult,
  Outcome,
  Settings,
  Support,
} from "../types";
import { addAssessment, levelNameFor, saveDraft, useDB } from "../lib/store";
import {
  addElapsed,
  advanceDraft,
  findItem,
  firstFailureAbove,
  rungItemsFor,
  suggestedOrder,
} from "../lib/session";
import { clamp, formatClock, formatDuration, relativeDate, stepTitle } from "../lib/format";
import { scoreAnswer, scoreTranscript, suggestionLabel } from "../lib/scoring";
import { expectedOrderFor, latestAssessment } from "../lib/selectors";
import { speakText, useMicLevel, useSpeechRecognition } from "../lib/useSpeech";
import { useHashRoute } from "../lib/router";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Pill } from "../components/Pill";
import { ResultLadder, RailLadder } from "../components/Ladder";
import { EmptyState } from "../components/EmptyState";
import { ItemContent } from "../components/ItemContent";
import { TokenRow } from "../components/TokenRow";
import { useToast } from "../components/Toast";
import { AutoSessionPage } from "./AutoSession";

export function SessionPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const [finishedDraft, setFinishedDraft] = useState<DraftSession | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const draft = db.draft ?? finishedDraft;
  const learner = draft ? db.learners.find((item) => item.id === draft.learnerId) : null;

  useEffect(() => {
    if (db.draft && Date.now() - new Date(db.draft.lastTickAt).getTime() > 120_000) {
      saveDraft({ ...db.draft, lastTickAt: new Date().toISOString() });
    }
    // Only reconcile a stale draft once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (db.draft?.config.pacing === "auto") {
    return <AutoSessionPage />;
  }

  if (!draft || !learner) {
    return (
      <>
        <h1 className="sr-only">Session</h1>
        <div className="session-empty">
          <EmptyState
            title="No assessment in progress"
            body="Start a ladder from the Assess screen. A draft is saved in this browser after every item."
            action={
              <a className="btn btn-primary" href="#/assess">
                Go to Assess
              </a>
            }
          />
        </div>
      </>
    );
  }

  const previous = latestAssessment(db.assessments, learner.id, draft.subject);

  const handleSave = (assessment: Assessment) => {
    setFinishedDraft(draft);
    addAssessment(assessment);
    setSavedId(assessment.id);
    toast(`Assessment saved for ${learner.code}`, "positive");
  };

  if (draft.phase === "result") {
    return (
      <ResultView
        key={`${draft.id}-result`}
        draft={draft}
        settings={db.settings}
        learnerCode={learner.code}
        enrolledStd={learner.enrolledStd}
        previousOrder={previous?.finalOrder ?? null}
        previousDate={previous?.completedAt ?? null}
        saved={Boolean(savedId)}
        onSave={handleSave}
        onReport={() => {
          if (savedId) route.navigate(`/reports/${savedId}`);
        }}
        onAnother={() => route.navigate("/assess")}
        onLearner={() => route.navigate(`/learners/${learner.id}`)}
      />
    );
  }

  if (draft.phase === "review") {
    return (
      <ReviewView
        key={`${draft.id}-review-${draft.rungResults.length}`}
        draft={draft}
        settings={db.settings}
        learnerCode={learner.code}
        onAdvance={() => saveDraft(advanceDraft(draft, db.settings))}
        onFinish={() => saveDraft({ ...addElapsed(draft), phase: "result", finished: true, nextOrder: null })}
        onExit={() => route.navigate("/assess")}
      />
    );
  }

  return (
    <ItemView
      key={`${draft.id}-${draft.currentOrder}-${draft.currentResults.length}`}
      draft={draft}
      settings={db.settings}
      learnerCode={learner.code}
      onExit={() => route.navigate("/assess")}
      onFinish={(ended) => saveDraft(ended)}
    />
  );
}

function useElapsed(draft: DraftSession): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return draft.elapsedSec + clamp((now - new Date(draft.lastTickAt).getTime()) / 1000, 0, 600);
}

function SessionHeader({
  draft,
  learnerCode,
  elapsed,
  onExit,
  onFinish,
}: {
  draft: DraftSession;
  learnerCode: string;
  elapsed: number;
  onExit: () => void;
  onFinish?: () => void;
}) {
  const rung = getRung(draft.subject, draft.currentOrder);
  return (
    <div className="session-header">
      <div className="session-header-top">
        <button type="button" className="session-exit" onClick={onExit}>
          <Icon name="arrow-left" size={14} />
          <span className="session-exit-full">Save &amp; exit</span>
          <span className="session-exit-short">Exit</span>
        </button>
        <div className="session-identity">
          <h1>{learnerCode}</h1>
          <p>
            {getSubject(draft.subject).name}
            {rung ? ` · ${rung.name} · rung ${rung.order} of ${topOrder(draft.subject)}` : null}
          </p>
        </div>
        <div className="session-head-actions">
          <span className="session-timer num" title="Time in this assessment">
            <Icon name="clock" size={13} /> {formatClock(elapsed)}
          </span>
          {onFinish ? (
            <button type="button" className="btn btn-sm" onClick={onFinish}>
              Finish now
            </button>
          ) : null}
        </div>
      </div>
      <div className="session-progress" aria-hidden="true">
        <span
          className="session-progress-bar"
          style={{
            width: `${Math.min(100, Math.round((draft.rungResults.length / topOrder(draft.subject)) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

function SessionRail({ draft }: { draft: DraftSession }) {
  return (
    <aside className="session-rail" aria-label="Skill ladder">
      <div className="rail-head">
        <span className="rail-head-label">{getSubject(draft.subject).name} ladder</span>
        <span className="rail-head-count">
          {draft.rungResults.length} of {topOrder(draft.subject)} attempted
        </span>
      </div>
      <RailLadder
        subject={draft.subject}
        currentOrder={draft.currentOrder}
        passedOrders={draft.rungResults.filter((result) => result.passed).map((result) => result.order)}
        failedOrders={draft.rungResults.filter((result) => !result.passed).map((result) => result.order)}
        attemptedOrders={draft.rungResults.map((result) => result.order)}
      />
      <div className="rail-note">
        <span className="status-dot status-dot--positive" />
        Saves after every item.
      </div>
      <p className="rail-note-text">
        {draft.config.mode === "quick"
          ? "Quick check · triage estimate"
          : draft.config.mode === "full"
            ? "Full ladder · confirm the level"
            : "Custom test"}{" "}
        · {draft.config.itemsPerRung} items, {Math.min(draft.config.passMark, draft.config.itemsPerRung)} to
        clear.
      </p>
    </aside>
  );
}

function ItemView({
  draft,
  settings,
  learnerCode,
  onExit,
  onFinish,
}: {
  draft: DraftSession;
  settings: Settings;
  learnerCode: string;
  onExit: () => void;
  onFinish: (draft: DraftSession) => void;
}) {
  const toast = useToast();
  const rung = getRung(draft.subject, draft.currentOrder);
  const items = rungItemsFor(draft, settings);
  const item = items[draft.currentResults.length];
  const language = draft.subject === "kannada" ? "kn-IN" : "en-IN";
  const speech = useSpeechRecognition(language);
  const levels = useMicLevel(speech.listening);
  const elapsed = useElapsed(draft);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [fluency, setFluency] = useState<Fluency>("fluent");
  const [support, setSupport] = useState<Support>("independent");
  const [answer, setAnswer] = useState("");
  const [finishOpen, setFinishOpen] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  useEffect(() => {
    speech.reset();
    setOutcome(null);
    setFluency("fluent");
    setSupport("independent");
    setAnswer("");
    setShowExpected(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.currentOrder, draft.currentResults.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [draft.currentOrder, draft.currentResults.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        document.querySelector("dialog[open]")
      ) {
        return;
      }
      if (event.key === "1") chooseOutcome("correct");
      if (event.key === "2") chooseOutcome("partial");
      if (event.key === "3") chooseOutcome("incorrect");
      if (event.key === "Enter" && outcome && item) commit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!rung || !item) {
    return (
      <div className="session-empty">
        <EmptyState
          title="This rung has no items"
          body="Check the item bank in Settings, or restart the assessment."
          action={
            <a className="btn" href="#/settings">
              Open Settings
            </a>
          }
        />
      </div>
    );
  }

  const isMaths = draft.subject === "maths" && (item.kind === "answer" || item.kind === "dots");
  const isReading = item.kind === "read" || item.kind === "say" || item.kind === "comprehension";
  const canSpeak = (item.kind === "read" || item.kind === "say") && !item.manualOnly && speech.supported;
  const transcript = speech.finalText.trim();
  const score = transcript ? scoreTranscript(item.spoken ?? item.content, transcript) : null;
  const answerOutcome = isMaths && answer.trim() ? scoreAnswer(item, answer) : null;
  const suggested = isMaths ? answerOutcome : score?.suggestion ?? null;
  const lastItem = draft.currentResults.length === items.length - 1;
  const itemNumber = draft.currentResults.length + 1;

  function chooseOutcome(next: Outcome) {
    setOutcome(next);
    setFluency(next === "correct" ? "fluent" : next === "partial" ? "hesitant" : "struggling");
    setSupport(next === "correct" ? "independent" : next === "partial" ? "prompted" : "with-help");
  }

  function commit() {
    if (!outcome) return;
    const result: ItemResult = {
      itemId: item.id,
      expected: item.spoken ?? item.content,
      heard: transcript || undefined,
      outcome,
      fluency: isReading ? fluency : null,
      support: isMaths ? support : null,
      method: isMaths ? "keypad" : transcript ? "speech" : "manual",
      suggestion: suggested ?? null,
      match: score?.match ?? (answerOutcome ? (answerOutcome === "correct" ? 1 : 0) : null),
    };
    const next = addElapsed(draft);
    const committed = {
      ...next,
      currentResults: [...next.currentResults, result],
      machineAssisted: next.machineAssisted || Boolean(transcript),
    };
    if (committed.currentResults.length < items.length) {
      saveDraft(committed);
      return;
    }
    const activeRung = rung!;
    const outcomes = committed.currentResults.map((entry) => entry.outcome);
    const points = outcomes.reduce(
      (sum, entry) =>
        sum + (entry === "correct" ? 1 : entry === "partial" && draft.config.partialCredit ? 0.5 : 0),
      0,
    );
    const passMark = Math.min(draft.config.passMark, items.length);
    const passed = points >= passMark;
    const rungResult = {
      rungId: activeRung.id,
      order: activeRung.order,
      itemResults: committed.currentResults,
      score: points,
      passed,
    };
    const results = [...next.rungResults, rungResult];
    const best = results.filter((entry) => entry.passed).reduce((max, entry) => Math.max(max, entry.order), 0);
    const attempted = new Set(results.map((entry) => entry.order));
    let nextOrder: number | null = null;
    let finished = false;
    if (results.length >= draft.config.maxRungs) {
      finished = true;
    } else if (passed) {
      const candidate = getRungs(draft.subject)
        .filter((entry) => entry.order > activeRung.order)
        .find((entry) => !settings.disabledRungs[draft.subject]?.includes(entry.id));
      if (candidate && !attempted.has(candidate.order)) nextOrder = candidate.order;
      else finished = true;
    } else if (best === 0) {
      const lower = getRungs(draft.subject)
        .filter((entry) => entry.order < activeRung.order)
        .sort((a, b) => b.order - a.order)
        .find((entry) => !settings.disabledRungs[draft.subject]?.includes(entry.id));
      if (lower && !attempted.has(lower.order)) nextOrder = lower.order;
      else finished = true;
    } else {
      finished = true;
    }
    saveDraft({
      ...committed,
      rungResults: results,
      phase: "review",
      nextOrder,
      finished: finished || !nextOrder,
    });
  }

  function readInstruction() {
    const kannada = settings.showKannadaInstructions;
    const text = kannada ? rung!.kannadaInstruction : rung!.instruction;
    const ok = speakText(text, kannada ? "kn-IN" : language);
    if (!ok) {
      toast("No Kannada voice on this device. Read the instruction aloud.", "warning");
    }
  }

  function requestFinish() {
    setFinishOpen(true);
  }

  const finishNoRungs = draft.rungResults.length === 0;

  return (
    <>
      <SessionHeader
        draft={draft}
        learnerCode={learnerCode}
        elapsed={elapsed}
        onExit={onExit}
        onFinish={requestFinish}
      />

      <div className="session-layout">
        <SessionRail draft={draft} />

        <div className="session-main">
          <div className="mobile-ladder" aria-hidden="true">
            {getRungs(draft.subject).map((entry) => {
              const passed = draft.rungResults.some((result) => result.order === entry.order && result.passed);
              const failed = draft.rungResults.some((result) => result.order === entry.order && !result.passed);
              const current = entry.order === draft.currentOrder;
              return (
                <span
                  key={entry.id}
                  className={`mobile-ladder-step ${passed ? "is-passed" : ""} ${failed ? "is-failed" : ""} ${
                    current ? "is-current" : ""
                  }`}
                  title={entry.name}
                />
              );
            })}
          </div>

          <article className="item-card" aria-labelledby="item-title">
            <div className="item-top">
              <div>
                <h2 id="item-title" aria-live="polite">
                  {rung.name}
                </h2>
                <p className="item-sub">
                  Rung {rung.order} of {topOrder(draft.subject)} · Std {rung.benchmark} benchmark ·{" "}
                  {rung.focus}
                </p>
              </div>
              <Pill tone="neutral">
                Item {itemNumber} of {items.length}
              </Pill>
            </div>

            <div className="instruction-block">
              <div className="instruction-main">
                <p>{rung.instruction}</p>
                {settings.showKannadaInstructions ? (
                  <p className="instruction-kannada kannada-ui" lang="kn">
                    {rung.kannadaInstruction}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="icon-btn instruction-audio"
                onClick={readInstruction}
                aria-label="Read the instruction aloud"
                title="Read the instruction aloud"
              >
                <Icon name="play" size={14} />
              </button>
            </div>

            <div className={`item-body ${item.kind === "read" && (item.spoken ?? item.content).split(/\s+/).length > 8 ? "is-left" : ""}`}>
              <ItemContent item={item} subject={draft.subject} />
            </div>

            {isMaths ? (
              <AnswerEntry
                item={item}
                answer={answer}
                setAnswer={setAnswer}
                outcome={answerOutcome}
              />
            ) : canSpeak ? (
              <div className="capture-card">
                <div className="mic-panel">
                  <button
                    type="button"
                    className={`mic-button ${speech.listening ? "is-listening" : ""}`}
                    onClick={() => (speech.listening ? speech.stop() : speech.start())}
                    aria-label={speech.listening ? "Stop listening" : "Start listening"}
                  >
                    <Icon name={speech.listening ? "stop" : "mic"} size={22} />
                  </button>
                  <span className="mic-label">
                    {speech.listening ? "Listening — tap to stop" : "Tap to listen"}
                  </span>
                  <span className="mic-sub">
                    Optional. The machine only suggests; the educator marks.
                  </span>
                  <span className="mic-wave" aria-hidden="true">
                    {levels.map((level, index) => (
                      <span
                        key={index}
                        style={{ height: `${3 + level * 24}px` }}
                        className={speech.listening ? "is-live" : ""}
                      />
                    ))}
                  </span>
                  {speech.listening && speech.interim ? (
                    <p className="live-transcript">{speech.interim}</p>
                  ) : null}
                  {speech.error ? (
                    <p className="capture-error" role="status">
                      {speech.error}
                    </p>
                  ) : null}
                  {!speech.supported ? (
                    <p className="capture-error">
                      This browser does not expose speech recognition. Use the educator's mark below.
                    </p>
                  ) : null}
                </div>

                {transcript ? (
                  <div className="transcript-panel">
                    <div className="transcript-head">
                      <span className="transcript-title">What the browser heard</span>
                      <span className="row">
                        <span className="match-text num">{Math.round((score?.match ?? 0) * 100)}% word match</span>
                        {score?.scriptMismatch ? <Pill tone="warning">Script mismatch</Pill> : null}
                      </span>
                    </div>
                    <p className="transcript-full">{transcript}</p>
                    {score ? (
                      <>
                        {score.tokens.length > 12 ? (
                          <details className="token-details">
                            <summary>Word-by-word comparison</summary>
                            <TokenRow tokens={score.tokens} />
                          </details>
                        ) : (
                          <TokenRow tokens={score.tokens} />
                        )}
                        <div className="suggestion-line">
                          <span>
                            Machine suggestion: <strong>{suggestionLabel(score.suggestion)}</strong>
                          </span>
                          <span className="faint">Advisory only</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="capture-note">
                <Icon name="users" size={15} />
                <span>
                  Educator judgement only. {item.kind === "comprehension" ? "Hide the expected answer before the child sees it." : "There is no machine score on this item."}
                </span>
              </div>
            )}

            {item.answer ? (
              <details
                className="expected-details"
                open={showExpected}
                onToggle={(event) => setShowExpected((event.target as HTMLDetailsElement).open)}
              >
                <summary>Show expected answer</summary>
                <p>{item.answer}</p>
              </details>
            ) : null}

            <div className="mark-block">
              <div className="mark-head">
                <span className="mark-label">Educator's mark</span>
                {suggested && outcome ? (
                  <span className="machine-suggestion">
                    <span className="status-dot status-dot--accent" />
                    Machine also read this as {suggestionLabel(suggested).toLowerCase()}
                  </span>
                ) : suggested ? (
                  <span className="faint small">Mark first — machine comparison after</span>
                ) : (
                  <span className="faint small">No machine suggestion</span>
                )}
              </div>
              <div className="mark-buttons" role="group" aria-label="Mark the response">
                <button
                  type="button"
                  className={`mark-btn mark-correct ${outcome === "correct" ? "is-selected" : ""} ${
                    outcome && suggested === "correct" ? "is-suggested" : ""
                  }`}
                  onClick={() => chooseOutcome("correct")}
                  aria-pressed={outcome === "correct"}
                >
                  <Icon name="check" size={15} /> Correct
                  <kbd>1</kbd>
                </button>
                <button
                  type="button"
                  className={`mark-btn mark-partial ${outcome === "partial" ? "is-selected" : ""} ${
                    outcome && suggested === "partial" ? "is-suggested" : ""
                  }`}
                  onClick={() => chooseOutcome("partial")}
                  aria-pressed={outcome === "partial"}
                >
                  <span className="half-mark" aria-hidden="true">½</span> Partial
                  <kbd>2</kbd>
                </button>
                <button
                  type="button"
                  className={`mark-btn mark-incorrect ${outcome === "incorrect" ? "is-selected" : ""} ${
                    outcome && suggested === "incorrect" ? "is-suggested" : ""
                  }`}
                  onClick={() => chooseOutcome("incorrect")}
                  aria-pressed={outcome === "incorrect"}
                >
                  <Icon name="close" size={15} /> Not yet
                  <kbd>3</kbd>
                </button>
              </div>

              {outcome ? (
                <div className="observation-row">
                  <span className="observation-label">
                    {isMaths ? "How did they get there?" : "How did it sound?"}
                  </span>
                  {isMaths ? (
                    <div className="segmented" role="group" aria-label="Support used">
                      {(
                        [
                          ["independent", "Independent"],
                          ["prompted", "Prompted"],
                          ["with-help", "With help"],
                        ] as Array<[Support, string]>
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={support === value ? "is-active" : ""}
                          onClick={() => setSupport(value)}
                          aria-pressed={support === value}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="segmented" role="group" aria-label="Reading fluency">
                      {(
                        [
                          ["fluent", "Fluent"],
                          ["hesitant", "Hesitant"],
                          ["struggling", "Struggling"],
                        ] as Array<[Fluency, string]>
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={fluency === value ? "is-active" : ""}
                          onClick={() => setFluency(value)}
                          aria-pressed={fluency === value}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="item-actions">
                <span className="item-actions-note">
                  {lastItem ? "The rung will be scored when you save this item." : "Saved on this device after every item."}
                </span>
                <button type="button" className="btn btn-primary" onClick={commit} disabled={!outcome}>
                  {lastItem ? "Save & review rung" : "Save & next item"} <Icon name="arrow-right" size={14} />
                </button>
              </div>
              {!outcome ? <p className="mark-hint">Choose a mark to continue. Keys 1, 2 and 3 work too.</p> : null}
            </div>
          </article>

          <p className="session-foot">
            <span className="status-dot status-dot--accent" />
            Draft rubric · pass rule {Math.min(draft.config.passMark, items.length)} of {items.length} · the
            educator can override the final level.
          </p>
        </div>
      </div>

      <Modal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={finishNoRungs ? "No rung is finished yet" : "End the assessment here?"}
        description={
          finishNoRungs
            ? "A level needs at least one completed rung. Your draft is already saved; you can come back to it."
            : "The level will be based only on the rungs already completed. The items in the current rung will not be counted."
        }
        footer={
          finishNoRungs ? (
            <>
              <button type="button" className="btn" onClick={() => setFinishOpen(false)}>
                Keep going
              </button>
              <button type="button" className="btn" onClick={onExit}>
                Save draft &amp; exit
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn" onClick={() => setFinishOpen(false)}>
                Keep going
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const ended = { ...addElapsed(draft), phase: "result" as const, finished: true, nextOrder: null };
                  setFinishOpen(false);
                  onFinish(ended);
                }}
              >
                Review this level
              </button>
            </>
          )
        }
      >
        <p className="small muted">
          {finishNoRungs
            ? "Completed rungs stay at zero. To save a level, finish the current rung first."
            : `${draft.rungResults.length} ${
                draft.rungResults.length === 1 ? "rung has" : "rungs have"
              } been completed.`}
        </p>
      </Modal>
    </>
  );
}

function AnswerEntry({
  item,
  answer,
  setAnswer,
  outcome,
}: {
  item: Item;
  answer: string;
  setAnswer: (value: string) => void;
  outcome: Outcome | null;
}) {
  const append = (value: string) => {
    if (value === "clear") setAnswer("");
    else if (value === "back") setAnswer(answer.slice(0, -1));
    else setAnswer(`${answer}${value}`);
  };
  return (
    <div className="answer-entry">
      <div className="answer-field">
        <label htmlFor="answer-input">What the child said</label>
        <div className="answer-input-wrap">
          <input
            id="answer-input"
            className="input answer-input num"
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type the answer"
          />
          {outcome ? <Pill tone={outcome === "correct" ? "positive" : outcome === "partial" ? "warning" : "negative"}>
            {outcome === "correct" ? "Matches expected" : outcome === "partial" ? "Close to expected" : "Not the expected answer"}
          </Pill> : null}
        </div>
      </div>
      <div className="keypad" role="group" aria-label="Number keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
          <button key={key} type="button" onClick={() => append(key)}>
            {key}
          </button>
        ))}
        <button type="button" className="keypad-word" onClick={() => append("clear")}>
          Clear
        </button>
        <button type="button" onClick={() => append("0")}>
          0
        </button>
        <button type="button" onClick={() => append("back")} aria-label="Backspace">
          ⌫
        </button>
      </div>
      <p className="answer-help">
        {item.kind === "dots" ? "Count together; enter the number the child says." : "If the child answers aloud, enter what you hear."}
      </p>
    </div>
  );
}

function ReviewView({
  draft,
  settings,
  learnerCode,
  onAdvance,
  onFinish,
  onExit,
}: {
  draft: DraftSession;
  settings: Settings;
  learnerCode: string;
  onAdvance: () => void;
  onFinish: () => void;
  onExit: () => void;
}) {
  const elapsed = useElapsed(draft);
  const last = draft.rungResults[draft.rungResults.length - 1];
  const rung = last ? getRung(draft.subject, last.order) : null;
  const items = last
    ? last.itemResults
        .map((result) => {
          const item = rungItemsFor(draft, settings).find((candidate) => candidate.id === result.itemId);
          return { result, item };
        })
        .filter((entry) => entry.item)
    : [];
  const next = draft.nextOrder ? getRung(draft.subject, draft.nextOrder) : null;
  const passMark = rung ? Math.min(draft.config.passMark, items.length) : 0;

  if (!last || !rung) {
    return (
      <div className="session-empty">
        <EmptyState title="Nothing to review" body="Finish an item to see the rung result." action={<a className="btn" href="#/assess">Go to Assess</a>} />
      </div>
    );
  }

  const higherFailed = draft.rungResults.some(
    (result) => !result.passed && result.order > last.order,
  );

  return (
    <>
      <SessionHeader
        draft={draft}
        learnerCode={learnerCode}
        elapsed={elapsed}
        onExit={onExit}
        onFinish={onFinish}
      />
      <div className="session-layout">
        <SessionRail draft={draft} />
        <div className="session-main">
          <article className="item-card review-card">
            <div className="item-top">
              <div>
                <h2>{rung.name}</h2>
                <p className="item-sub">
                  Rung {rung.order} of {topOrder(draft.subject)} · Std {rung.benchmark} benchmark
                </p>
              </div>
              <Pill tone={last.passed ? "positive" : "negative"}>
                {last.passed ? "Rung cleared" : "Stopped here"}
              </Pill>
            </div>

            <div className="review-score">
              <span className="review-score-value num">
                {formatScore(last.score)}
                <span className="review-score-of"> / {items.length}</span>
              </span>
              <span className="review-score-caption">
                {last.passed
                  ? `Cleared (${passMark} needed).`
                  : `${passMark} needed to clear. This is the edge we were looking for.`}
              </span>
            </div>

            <ul className="review-items">
              {items.map(({ result, item }, index) => (
                <li key={`${result.itemId}-${index}`}>
                  <span
                    className={`review-item-text ${draft.subject === "kannada" ? "kannada-ui" : ""}`}
                    lang={draft.subject === "kannada" ? "kn" : undefined}
                  >
                    {buildExcerpt(item!.content)}
                  </span>
                  <span className="review-item-meta">
                    {result.fluency ? <span className="muted">{result.fluency}</span> : null}
                    <Pill
                      tone={
                        result.outcome === "correct"
                          ? "positive"
                          : result.outcome === "partial"
                            ? "warning"
                            : "negative"
                      }
                    >
                      {result.outcome === "correct"
                        ? "Correct"
                        : result.outcome === "partial"
                          ? "Partial"
                          : "Not yet"}
                    </Pill>
                  </span>
                </li>
              ))}
            </ul>

            <div className="review-next">
              {last.passed ? (
                <p>
                  {next
                    ? `The ladder moves up to ${next.name}.`
                    : higherFailed
                      ? "The rung above was already checked. This is the highest comfortable rung."
                      : last.order >= topOrder(draft.subject)
                        ? "This is the top of the draft ladder. The result will note that a higher-level check is needed."
                        : "No more rungs will be attempted. The result will use this level."}
                </p>
              ) : next ? (
                <p>
                  Not cleared. Before recording a level, the ladder drops to {next.name} to check the rung
                  below.
                </p>
              ) : (
                <p>
                  This is the point where the ladder stopped. Keep it — it tells the next educator more than a
                  single “below level” label.
                </p>
              )}
            </div>

            <div className="item-actions">
              <span className="item-actions-note">
                {draft.finished ? "No more rungs will be attempted." : "One rung at a time; the rest stays untouched."}
              </span>
              <button type="button" className="btn btn-primary" onClick={onAdvance}>
                {draft.finished
                  ? "See result"
                  : next
                    ? last.passed
                      ? `Continue to ${next.name}`
                      : `Check ${next.name}`
                    : "See result"}
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          </article>
          <p className="session-foot">
            <span className="status-dot status-dot--accent" />
            The pass rule is a draft: {passMark} of {items.length} items
            {draft.config.partialCredit ? ", with partial credit at half" : ""}.
          </p>
        </div>
      </div>
    </>
  );
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function supportLabel(value: string): string {
  if (value === "with-help") return "With help";
  return capitalise(value);
}

function buildExcerpt(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= 62) return clean;
  return `${clean.slice(0, 59)}…`;
}

function ResultView({
  draft,
  settings,
  learnerCode,
  enrolledStd,
  previousOrder,
  previousDate,
  saved,
  onSave,
  onReport,
  onAnother,
  onLearner,
}: {
  draft: DraftSession;
  settings: Settings;
  learnerCode: string;
  enrolledStd: number;
  previousOrder: number | null;
  previousDate: string | null;
  saved: boolean;
  onSave: (assessment: Assessment) => void;
  onReport: () => void;
  onAnother: () => void;
  onLearner: () => void;
}) {
  const suggested = suggestedOrder(draft);
  const [finalOrder, setFinalOrder] = useState(suggested);
  const [confidence, setConfidence] = useState<Confidence>("high");
  const [notes, setNotes] = useState("");
  const elapsed = useElapsed(draft);
  const subject = getSubject(draft.subject);
  const rungs = getRungs(draft.subject);
  const finalRung = finalOrder > 0 ? getRung(draft.subject, finalOrder) : null;
  const benchmark = finalRung?.benchmark ?? 0;
  const expected = expectedOrderFor(draft.subject, enrolledStd, settings);
  const gap = Math.max(0, expected - finalOrder);
  const failed = firstFailureAbove(draft, suggested);
  const failedRung = failed ? getRung(draft.subject, failed.order) : null;
  const passedOrders = draft.rungResults.filter((result) => result.passed).map((result) => result.order);
  const cleared = passedOrders.length;
  const attempted = draft.rungResults.length;
  const progressNote =
    previousOrder !== null && suggested < previousOrder
      ? `This run suggests a lower level than the last record (${levelNameFor(
          draft.subject,
          previousOrder,
        )}, ${relativeDate(previousDate ?? "").toLowerCase()}). Check whether that is a real change or a difficult session before saving.`
      : null;
  const nextStepRung = finalOrder > 0 ? finalRung : rungs[0];
  const atTop = finalOrder >= topOrder(draft.subject);
  const endedEarly =
    !failed && draft.rungResults.length < draft.config.maxRungs && suggested < topOrder(draft.subject);
  const machineItems = draft.rungResults.reduce(
    (sum, result) => sum + result.itemResults.filter((item) => item.method === "speech").length,
    0,
  );

  const save = () => {
    if (saved) return;
    const timed = addElapsed(draft);
    const assessment: Assessment = {
      id: `as-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      learnerId: draft.learnerId,
      subject: draft.subject,
      config: draft.config,
      startedAt: draft.startedAt,
      completedAt: new Date().toISOString(),
      durationSec: Math.max(1, timed.elapsedSec),
      educator: settings.educator,
      results: draft.rungResults,
      suggestedOrder: suggested,
      finalOrder,
      overridden: finalOrder !== suggested,
      notes: notes.trim(),
      confidence,
      machineAssisted: draft.machineAssisted,
      pacing: draft.config.pacing,
      reviewStatus: draft.config.pacing === "educator" ? "confirmed" : "unreviewed",
      reviewedAt: draft.config.pacing === "educator" ? new Date().toISOString() : undefined,
      reviewedBy: draft.config.pacing === "educator" ? settings.educator : undefined,
      teacherNote: notes.trim(),
    };
    onSave(assessment);
  };

  return (
    <div className="result-view">
      <div className="session-header result-header">
        <div className="session-header-top">
          <button type="button" className="session-exit" onClick={onAnother}>
            <Icon name="arrow-left" size={14} /> <span>Back to Assess</span>
          </button>
          <div className="session-identity">
            <h1>Assessment result</h1>
            <p>
              {learnerCode} · {subject.name} · {relativeDate(new Date().toISOString()).toLowerCase()}
            </p>
          </div>
          <div className="session-head-actions">
            <span className="session-timer num">
              <Icon name="clock" size={13} /> {formatDuration(elapsed)}
            </span>
            {saved ? <Pill tone="positive">Saved</Pill> : <Pill tone="neutral">Draft result</Pill>}
          </div>
        </div>
      </div>

      <section className="result-hero" aria-labelledby="result-level">
        <p className="result-kicker">
          {finalOrder === suggested ? "Suggested level" : "Educator-recorded level"} in {subject.name}
        </p>
        <p className="result-level literata" id="result-level">
          {levelNameFor(draft.subject, finalOrder)}
        </p>
        <p className="result-subline">
          {finalOrder === 0 ? (
            <>Below the first rung. Start with {rungs[0].name.toLowerCase()} and reassess in a few weeks.</>
          ) : (
            <>
              {finalRung?.name} · Std {benchmark} foundational benchmark · enrolled Std {enrolledStd}
            </>
          )}
        </p>
        <div className="result-meta">
          <div>
            <span className="result-meta-label">Cleared</span>
            <span className="result-meta-value num">
              {cleared} <span className="muted">of {attempted} attempted</span>
            </span>
          </div>
          <div>
            <span className="result-meta-label">Against enrolled standard</span>
            <span className="result-meta-value">
              {gap === 0 ? "At or above benchmark" : `${gap} ${gap === 1 ? "rung" : "rungs"} below`}
            </span>
          </div>
          <div>
            <span className="result-meta-label">Where it stopped</span>
            <span className="result-meta-value">
              {failedRung ? failedRung.name : atTop ? "Top of ladder" : "No breakdown seen"}
            </span>
          </div>
          <div>
            <span className="result-meta-label">Time</span>
            <span className="result-meta-value num">{formatDuration(Math.max(1, elapsed))}</span>
          </div>
        </div>
        <div className="result-ladder-wrap">
          <ResultLadder subject={draft.subject} suggested={finalOrder} failed={failed?.order ?? null} passedOrders={passedOrders} />
          <div className="ladder-legend">
            <span><i className="legend-swatch is-ink" /> Cleared</span>
            <span><i className="legend-swatch is-accent" /> Demonstrated</span>
            <span><i className="legend-swatch is-open" /> Not tested</span>
            {failed ? <span><i className="legend-swatch is-failed" /> Stopped</span> : null}
          </div>
        </div>
        {endedEarly ? (
          <p className="result-early">
            This run ended after {attempted} {attempted === 1 ? "rung" : "rungs"}. The level is the highest
            rung cleared; the ladder did not reach a breakdown.
          </p>
        ) : null}
      </section>

      {progressNote ? (
        <div className="notice notice--warning mt-16">
          <Icon name="alert" size={15} />
          <span>{progressNote}</span>
        </div>
      ) : null}

      <div className="grid-12 result-grid">
        <section className="col-7 panel result-breakdown" aria-labelledby="breakdown-title">
          <div className="section-head">
            <div>
              <h2 id="breakdown-title">What we saw</h2>
              <p className="section-sub">The rungs attempted in this run, in order.</p>
            </div>
            <span className="section-action">
              {cleared} cleared · {attempted - cleared} stopped
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Rung</th>
                  <th className="num">Score</th>
                  <th>Result</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                {draft.rungResults.map((result) => {
                  const rung = getRung(draft.subject, result.order);
                  const fluencyValues = Array.from(
                    new Set(result.itemResults.map((item) => item.fluency).filter(Boolean)),
                  ) as string[];
                  const supportValues = Array.from(
                    new Set(result.itemResults.map((item) => item.support).filter(Boolean)),
                  ) as string[];
                  const observation = fluencyValues.length
                    ? fluencyValues.map(capitalise).join(", ")
                    : supportValues.length
                      ? supportValues.map(supportLabel).join(", ")
                      : "—";
                  return (
                    <tr key={result.order}>
                      <td>
                        <span className="cell-main">{rung?.name ?? `Rung ${result.order}`}</span>
                        <span className="cell-sub">Std {rung?.benchmark ?? "—"} benchmark</span>
                      </td>
                      <td className="num">
                        {formatScore(result.score)} / {result.itemResults.length}
                      </td>
                      <td>
                        <Pill tone={result.passed ? "positive" : "negative"}>
                          {result.passed ? "Cleared" : "Stopped"}
                        </Pill>
                      </td>
                      <td className="muted small">{observation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="result-items">
            <p className="result-items-title">Item evidence</p>
            <div className="result-item-chips">
              {draft.rungResults.flatMap((result) =>
                result.itemResults.map((itemResult, index) => {
                  const item = findItem(draft.subject, result.order, itemResult.itemId, settings);
                  return (
                    <span className="result-item" key={`${result.order}-${itemResult.itemId}-${index}`}>
                      <span
                        className={`result-item-text ${
                          draft.subject === "kannada" ? "kannada-ui" : ""
                        }`}
                        title={itemResult.expected}
                        lang={draft.subject === "kannada" ? "kn" : undefined}
                      >
                        {buildExcerpt(item?.content ?? itemResult.expected)}
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
                        {itemResult.outcome === "correct"
                          ? "Correct"
                          : itemResult.outcome === "partial"
                            ? "Partial"
                            : "Not yet"}
                      </Pill>
                    </span>
                  );
                }),
              )}
            </div>
          </div>
          <p className="result-evidence-note">
            Evidence from {attempted} {attempted === 1 ? "rung" : "rungs"}
            {machineItems ? ` · speech capture used on ${machineItems} ${machineItems === 1 ? "item" : "items"}` : ""}
            {" "}· every mark confirmed by the educator.
          </p>
        </section>

        <section className="col-5 panel result-next">
            <p className="result-side-kicker">Suggested next step</p>
            <h2>
              {atTop
                ? "Beyond this ladder"
                : nextStepRung
                  ? stepTitle(nextStepRung.nextStep)
                  : "Keep practising"}
            </h2>
            <p className="result-next-body">
              {atTop
                ? `${subject.topNote} Use a higher-level check before deciding the next learning goal.`
                : nextStepRung?.nextStep}
            </p>
            <div className="result-next-followup">
              <span>When to check again</span>
              <p>
                A few weeks, or sooner if these words become easy. Keep the same pass rule so the next
                comparison is fair.
              </p>
            </div>
            <div className="result-next-meta">
              <span>Draft next step</span>
              <span>·</span>
              <span>The educator decides</span>
            </div>
        </section>

        <section className="col-12 panel decision-panel decision-panel--wide" aria-labelledby="decision-title">
            <div className="section-head">
              <div>
                <h2 id="decision-title">Educator decision</h2>
                <p className="section-sub">The app suggests; the educator confirms.</p>
              </div>
            </div>
            <div className="decision-grid">
              <div className="field">
                <label htmlFor="final-level">Final level</label>
                <select
                  id="final-level"
                  className="select"
                  value={finalOrder}
                  onChange={(event) => setFinalOrder(Number(event.target.value))}
                  disabled={saved}
                >
                  <option value={0}>Below rung 1</option>
                  {rungs.map((rung) => (
                    <option key={rung.id} value={rung.order}>
                      {rung.name} · Std {rung.benchmark} benchmark
                    </option>
                  ))}
                </select>
                <span className="field-help">
                  Suggested: {levelNameFor(draft.subject, suggested)}
                  {finalOrder !== suggested ? " · this is an override" : ""}
                </span>
              </div>
              <div className="field">
                <label htmlFor="confidence">Educator confidence</label>
                <select
                  id="confidence"
                  className="select"
                  value={confidence}
                  onChange={(event) => setConfidence(event.target.value as Confidence)}
                  disabled={saved}
                >
                  <option value="high">High — clear result</option>
                  <option value="medium">Medium — some hesitation</option>
                  <option value="low">Low — difficult session</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="result-notes">What did you notice?</label>
                <textarea
                  id="result-notes"
                  className="textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="A short observation, no names or personal details."
                  disabled={saved}
                />
              </div>
            </div>
            {!saved ? (
              <div className="decision-foot">
                <p className="decision-note">
                  Saves only in this browser. No name, audio or file is stored. You can export records from
                  Settings.
                </p>
                <button type="button" className="btn btn-primary btn-lg decision-save" onClick={save}>
                  Save assessment
                </button>
              </div>
            ) : (
              <div className="saved-panel">
                <p>
                  <Icon name="check" size={15} /> Saved on this device
                </p>
                <span>
                  {learnerCode} · {levelNameFor(draft.subject, finalOrder)} ·{" "}
                  {formatDuration(Math.max(1, elapsed))}
                </span>
                <div className="saved-actions">
                  <button type="button" className="btn btn-sm btn-primary" onClick={onReport}>
                    Open report
                  </button>
                  <button type="button" className="btn btn-sm" onClick={onLearner}>
                    View learner profile
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={onAnother}>
                    Assess another
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      <div className="result-footer">
        <p>
          {finalOrder !== suggested
            ? `Educator override: suggested ${levelNameFor(draft.subject, suggested)}, recorded ${levelNameFor(
                draft.subject,
                finalOrder,
              )}.`
            : "Recorded at the suggested level. The educator confirmed every item."}
        </p>
        <p>
          Draft ladder · SparkL's official sequence and pass rules are still to be agreed.
        </p>
      </div>
    </div>
  );
}
