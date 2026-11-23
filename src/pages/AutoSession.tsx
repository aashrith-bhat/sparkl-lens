import { useEffect, useRef, useState } from "react";
import { getRung, getSubject, topOrder } from "../data/curriculum";
import type {
  Assessment,
  AutoItemMetrics,
  DraftSession,
  Fluency,
  Item,
  ItemResult,
  Settings,
} from "../types";
import { analyseMaths, analyseReading, assessmentConfidence, summariseResults } from "../lib/autoAssess";
import { addElapsed, advanceDraft, commitItemResult, rungItemsFor, suggestedOrder } from "../lib/session";
import { addAssessment, saveDraft, useDB } from "../lib/store";
import { useSpeechRecognition, useMicLevel, speakText } from "../lib/useSpeech";
import { formatDuration } from "../lib/format";
import { useHashRoute } from "../lib/router";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Pill } from "../components/Pill";
import { ItemContent } from "../components/ItemContent";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

const MAX_SPEECH_SECONDS = (item: Item): number => {
  if (item.kind === "comprehension") return 22;
  if (item.kind === "say") return 8;
  if (item.kind === "read") {
    const words = (item.spoken ?? item.content).trim().split(/\s+/).length;
    if (words > 35) return 60;
    if (words > 12) return 35;
    return 12;
  }
  return 12;
};

function labelFluency(fluency: Fluency): string {
  if (fluency === "fluent") return "Fluent";
  if (fluency === "hesitant") return "Hesitant";
  return "Struggling";
}

export function AutoSessionPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const draft = db.draft;
  const learner = draft ? db.learners.find((item) => item.id === draft.learnerId) : null;
  const [paused, setPaused] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const savedRef = useRef(false);

  const openPause = () => {
    setPaused(true);
    setPauseOpen(true);
  };

  useEffect(() => {
    if (!draft || draft.phase !== "result" || savedRef.current) return;
    if (draft.rungResults.length === 0) return;
    savedRef.current = true;
    const timed = addElapsed(draft);
    const suggested = suggestedOrder(draft);
    const summary = summariseResults(draft.rungResults, draft.subject, suggested);
    const assessment: Assessment = {
      id: `as-auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      learnerId: draft.learnerId,
      subject: draft.subject,
      config: draft.config,
      startedAt: draft.startedAt,
      completedAt: new Date().toISOString(),
      durationSec: Math.max(1, timed.elapsedSec),
      educator: db.settings.educator,
      results: draft.rungResults,
      suggestedOrder: suggested,
      finalOrder: suggested,
      overridden: false,
      notes: "",
      confidence: assessmentConfidence(summary),
      machineAssisted: true,
      pacing: "auto",
      autoSummary: summary,
      reviewStatus: "unreviewed",
      teacherNote: "",
    };
    addAssessment(assessment);
    toast("Assessment saved. The report is ready.", "positive");
    route.navigate(`/reports/${assessment.id}`, { replace: true });
  }, [draft, db.settings.educator, route, toast]);

  if (!draft || !learner) {
    return (
      <div className="auto-empty">
        <EmptyState
          title="No automatic assessment in progress"
          body="Start an assessment from the setup screen. The child reads each item; the app scores and builds the report."
          action={
            <a className="btn btn-primary" href="#/assess">
              Go to Assess
            </a>
          }
        />
      </div>
    );
  }

  if (draft.phase === "result") {
    if (draft.rungResults.length === 0) {
      return (
        <div className="auto-empty">
          <EmptyState
            title="No completed rung"
            body="The report needs at least one finished rung. Start again, or use educator-assisted mode."
            action={
              <a className="btn btn-primary" href="#/assess">
                Back to Assess
              </a>
            }
          />
        </div>
      );
    }
    return (
      <div className="auto-saving">
        <span className="auto-saving-mark">
          <Icon name="spark" size={30} />
        </span>
        <h1>Building the report…</h1>
        <p>Scoring the reading, summarising the evidence and saving it on this device.</p>
      </div>
    );
  }

  const subject = getSubject(draft.subject);
  const headerRung = getRung(draft.subject, draft.currentOrder);

  const endEarly = () => {
    if (draft.rungResults.length === 0) return;
    setPaused(false);
    setPauseOpen(false);
    saveDraft({
      ...addElapsed(draft),
      phase: "result",
      finished: true,
      nextOrder: null,
    });
  };

  const showReport = () => {
    saveDraft(advanceDraft(draft, db.settings));
  };

  return (
    <>
      <div className="auto-page">
        <header className="auto-top">
          <span className="auto-brand">
            <span className="auto-brand-mark">
              <Icon name="spark" size={17} />
            </span>
            <span>SparkL</span>
          </span>
          <span className="auto-top-context">
            {learner.code} · {subject.name}
            {headerRung ? ` · ${headerRung.name}` : ""}
          </span>
          {draft.phase !== "review" ? (
            <button type="button" className="auto-pause" onClick={openPause}>
              Pause
            </button>
          ) : null}
        </header>

        {draft.phase === "review" ? (
          <AutoReview draft={draft} learnerCode={learner.code} onShowReport={showReport} />
        ) : !welcomeDone && draft.currentResults.length === 0 && draft.rungResults.length === 0 ? (
          <AutoWelcome
            draft={draft}
            learnerCode={learner.code}
            onStart={() => setWelcomeDone(true)}
            onExit={() => route.navigate("/assess")}
          />
        ) : (
          <AutoItem
            key={`${draft.currentOrder}-${draft.currentResults.length}`}
            draft={draft}
            settings={db.settings}
            learnerCode={learner.code}
            paused={paused}
            onCommit={(result) => saveDraft(commitItemResult(draft, result, db.settings, true))}
            onPause={openPause}
          />
        )}
      </div>

      <Modal
        open={pauseOpen}
        onClose={() => {
          setPauseOpen(false);
          setPaused(false);
        }}
        title="Assessment paused"
        description="Hand the device back to the volunteer. The current item will start again when you resume."
        footer={
          <>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPauseOpen(false);
                setPaused(false);
              }}
            >
              Resume
            </button>
            {draft.rungResults.length > 0 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  endEarly();
                }}
              >
                Finish and see report
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => route.navigate("/assess")}>
                Save draft &amp; exit
              </button>
            )}
          </>
        }
      >
        <p className="small muted">
          {draft.rungResults.length > 0
            ? `${draft.rungResults.length} rung${
                draft.rungResults.length === 1 ? "" : "s"
              } completed. Finishing now will use those results only.`
            : "No rung is complete yet. Resuming is the best option; the draft is saved on this device."}
        </p>
      </Modal>
    </>
  );
}

function AutoWelcome({
  draft,
  learnerCode,
  onStart,
  onExit,
}: {
  draft: DraftSession;
  learnerCode: string;
  onStart: () => void;
  onExit: () => void;
}) {
  const subject = getSubject(draft.subject);
  const remainingRungs = Math.max(
    1,
    Math.min(draft.config.maxRungs, topOrder(draft.subject) - draft.currentOrder + 1),
  );
  return (
    <main className="auto-welcome">
      <div className="auto-welcome-mark">
        <Icon name="spark" size={36} />
      </div>
      <p className="auto-kicker">Reading time</p>
      <h1>Let&apos;s find out what you can read.</h1>
      <p className="auto-welcome-copy">
        You will read a few letters, words or a short story out loud. The app will listen and move on
        by itself. Take your time — there is no score to worry about on this screen.
      </p>
      <div className="auto-welcome-meta">
        <span className="auto-meta-pill">
          <Icon name="book" size={14} /> {subject.name}
        </span>
        <span className="auto-meta-pill">
          <Icon name="ladder" size={14} /> About {remainingRungs} short steps
        </span>
        <span className="auto-meta-pill">
          <Icon name="learners" size={14} /> {learnerCode}
        </span>
      </div>
      <div className="auto-welcome-actions">
        <button type="button" className="btn btn-primary btn-lg auto-start" onClick={onStart}>
          Start reading <Icon name="arrow-right" size={16} />
        </button>
        <button type="button" className="auto-back" onClick={onExit}>
          Volunteer: back to setup
        </button>
      </div>
      <p className="auto-welcome-note">
        Find a quiet corner and keep the device close. The volunteer can pause at any point.
      </p>
    </main>
  );
}

function AutoReview({
  draft,
  learnerCode,
  onShowReport,
}: {
  draft: DraftSession;
  learnerCode: string;
  onShowReport: () => void;
}) {
  const next = draft.nextOrder ? getRung(draft.subject, draft.nextOrder) : null;
  const finished = draft.finished || !next;
  const showRef = useRef(onShowReport);

  useEffect(() => {
    showRef.current = onShowReport;
  });

  useEffect(() => {
    if (finished) return;
    const timer = window.setTimeout(() => showRef.current(), 1800);
    return () => window.clearTimeout(timer);
  }, [finished]);

  if (finished) {
    return (
      <main className="auto-done">
        <span className="auto-done-mark">
          <Icon name="check" size={32} />
        </span>
        <p className="auto-kicker">Assessment complete</p>
        <h1>All done. Thank you.</h1>
        <p className="auto-done-copy">
          The reading has been scored and saved on this device. Hand the device to the volunteer to see
          the detailed report.
        </p>
        <div className="auto-done-card">
          <span className="auto-done-label">{learnerCode}</span>
          <span className="auto-done-sub">
            {getSubject(draft.subject).name} · {draft.rungResults.length} rungs attempted ·{" "}
            {formatDuration(Math.max(1, draft.elapsedSec))}
          </span>
        </div>
        <button type="button" className="btn btn-primary btn-lg auto-start" onClick={onShowReport}>
          Show the report <Icon name="arrow-right" size={16} />
        </button>
      </main>
    );
  }

  return (
    <main className="auto-done auto-done--quiet">
      <span className="auto-done-mark">
        <Icon name="check" size={28} />
      </span>
      <p className="auto-kicker">Step complete</p>
      <h1>Nice reading.</h1>
      <p className="auto-done-copy">
        {next ? `Next, let's try ${next.name.toLowerCase()}.` : "The next part is ready."}
      </p>
      <div className="auto-next-line">
        <span className="status-dot status-dot--accent" />
        Moving on automatically…
      </div>
      <button type="button" className="btn btn-sm auto-continue" onClick={onShowReport}>
        Continue now
      </button>
    </main>
  );
}

function AutoItem({
  draft,
  settings,
  learnerCode,
  paused,
  onCommit,
  onPause,
}: {
  draft: DraftSession;
  settings: Settings;
  learnerCode: string;
  paused: boolean;
  onCommit: (result: ItemResult) => void;
  onPause: () => void;
}) {
  const rung = getRung(draft.subject, draft.currentOrder);
  const items = rungItemsFor(draft, settings);
  const item = items[draft.currentResults.length];
  const toast = useToast();

  if (!rung || !item) {
    return (
      <div className="auto-empty">
        <EmptyState
          title="This step has no items"
          body="The item bank may have changed. Return to setup and try again."
          action={
            <a className="btn btn-primary" href="#/assess">
              Back to Assess
            </a>
          }
        />
      </div>
    );
  }

  const isMathsKeypad = draft.subject === "maths" && (item.kind === "answer" || item.kind === "dots");
  const language = draft.subject === "kannada" ? "kn-IN" : "en-IN";
  const instruction = isMathsKeypad
    ? item.kind === "dots"
      ? "Count the dots and type how many on the number pad."
      : "Work out the answer and type it on the number pad."
    : rung.instruction;
  const kannadaInstruction = isMathsKeypad
    ? item.kind === "dots"
      ? "ಚುಕ್ಕಿಗಳನ್ನು ಎಣಿಸಿ ಸಂಖ್ಯೆಯನ್ನು ಬರೆಯಿರಿ."
      : "ಉತ್ತರವನ್ನು ಲೆಕ್ಕ ಮಾಡಿ ಸಂಖ್ಯಾ ಪಟ್ಟಿಯಲ್ಲಿ ಬರೆಯಿರಿ."
    : rung.kannadaInstruction;

  const hearInstruction = () => {
    const text = settings.showKannadaInstructions ? kannadaInstruction : instruction;
    const ok = speakText(text, settings.showKannadaInstructions ? "kn-IN" : language);
    if (!ok) toast("No Kannada voice on this device. Read the instruction aloud.", "warning");
  };

  return (
    <main className="auto-main">
      <div className="auto-progress">
        <div className="auto-progress-head">
          <span className="auto-step-label">
            Step {draft.currentOrder} of {topOrder(draft.subject)}
          </span>
          <span className="auto-item-count">
            Item {draft.currentResults.length + 1} of {items.length}
          </span>
        </div>
        <div className="auto-progress-track" aria-hidden="true">
          <span style={{ width: `${(draft.currentOrder / topOrder(draft.subject)) * 100}%` }} />
        </div>
      </div>

      <article className="auto-card">
        <div className="auto-card-head">
          <div>
            <p className="auto-kicker">
              {getSubject(draft.subject).name} · {learnerCode}
            </p>
            <h1>{rung.name}</h1>
            <p className="auto-card-sub">{rung.focus}</p>
          </div>
          <Pill tone="neutral">{isMathsKeypad ? "Number pad" : "Listening activity"}</Pill>
        </div>

        <div className="auto-instruction">
          <div>
            <p>{instruction}</p>
            {settings.showKannadaInstructions ? (
              <p className="auto-instruction-kn kannada-ui" lang="kn">
                {kannadaInstruction}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={hearInstruction}
            aria-label="Read the instruction aloud"
            title="Read the instruction aloud"
          >
            <Icon name="play" size={14} />
          </button>
        </div>

        <div className="auto-item-body">
          <ItemContent item={item} subject={draft.subject} />
        </div>

        {isMathsKeypad ? (
          <AutoMathsItem
            item={item}
            draft={draft}
            paused={paused}
            onCommit={onCommit}
          />
        ) : (
          <AutoReadingItem
            item={item}
            draft={draft}
            settings={settings}
            paused={paused}
            onCommit={onCommit}
            onPause={onPause}
          />
        )}

        <p className="auto-caveat">
          The app scores this automatically. The volunteer does not mark individual answers.
        </p>
      </article>
    </main>
  );
}

function AutoReadingItem({
  item,
  draft,
  settings,
  paused,
  onCommit,
  onPause,
}: {
  item: Item;
  draft: DraftSession;
  settings: Settings;
  paused: boolean;
  onCommit: (result: ItemResult) => void;
  onPause: () => void;
}) {
  const language = draft.subject === "kannada" ? "kn-IN" : "en-IN";
  const speech = useSpeechRecognition(language);
  const levels = useMicLevel(speech.listening);
  const [phase, setPhase] = useState<"ready" | "listening" | "processing" | "feedback" | "retry">(
    "ready",
  );
  const [remaining, setRemaining] = useState(MAX_SPEECH_SECONDS(item));
  const [analysis, setAnalysis] = useState<AutoItemMetrics | null>(null);
  const [noSpeech, setNoSpeech] = useState(false);
  const speechRef = useRef(speech);
  const captureStartedAtRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const finaliseTimerRef = useRef<number | null>(null);
  const commitTimerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const finalisedRef = useRef(false);
  const pausedRef = useRef(paused);
  const windowSeconds = MAX_SPEECH_SECONDS(item);

  useEffect(() => {
    speechRef.current = speech;
  });

  const clearTimers = () => {
    if (maxTimerRef.current) window.clearTimeout(maxTimerRef.current);
    if (finaliseTimerRef.current) window.clearTimeout(finaliseTimerRef.current);
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    maxTimerRef.current = null;
    finaliseTimerRef.current = null;
    commitTimerRef.current = null;
  };

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      clearTimers();
      if (phase === "listening") {
        speech.stop();
      }
      setPhase("ready");
      setAnalysis(null);
      finalisedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "listening") return;
    const started = captureStartedAtRef.current ?? Date.now();
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, windowSeconds - (Date.now() - started) / 1000));
    }, 180);
    return () => window.clearInterval(timer);
  }, [phase, windowSeconds]);

  useEffect(() => {
    if (speech.error && phase === "listening") {
      clearTimers();
      setPhase("retry");
      setNoSpeech(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.error]);

  const startCapture = () => {
    if (paused) return;
    clearTimers();
    finalisedRef.current = false;
    setAnalysis(null);
    setNoSpeech(false);
    setPhase("listening");
    setRemaining(windowSeconds);
    captureStartedAtRef.current = Date.now();
    speech.start();
    maxTimerRef.current = window.setTimeout(finish, windowSeconds * 1000);
  };

  const finish = () => {
    if (pausedRef.current || phase === "processing" || phase === "feedback") return;
    clearTimers();
    setPhase("processing");
    speech.stop();
    finaliseTimerRef.current = window.setTimeout(finalise, 850);
  };

  const finalise = () => {
    if (finalisedRef.current) return;
    finalisedRef.current = true;
    const snap = speechRef.current;
    const transcript = (snap.capturedText || snap.finalText || "").trim();
    const stoppedAt = Date.now();
    const started = captureStartedAtRef.current ?? stoppedAt;
    const timing = {
      durationSec: Math.max(0.7, (stoppedAt - started) / 1000),
      firstResultAt: snap.firstResultAt,
      lastResultAt: snap.lastResultAt,
      pauseCount: snap.pauseCount,
      longPauseCount: snap.longPauseCount,
      asrConfidence: snap.asrConfidence,
    };
    if (!transcript && attemptsRef.current < 1) {
      attemptsRef.current = 1;
      setNoSpeech(true);
      setPhase("retry");
      speech.reset();
      return;
    }
    const auto = analyseReading(draft.subject, item, transcript, timing);
    setAnalysis(auto.metrics);
    finalisedRef.current = true;
    setPhase("feedback");
    commitTimerRef.current = window.setTimeout(() => {
      const result: ItemResult = {
        itemId: item.id,
        expected: item.spoken ?? item.content,
        heard: transcript || undefined,
        outcome: auto.outcome,
        fluency: auto.metrics.fluency,
        support: null,
        method: "speech",
        suggestion: auto.outcome,
        match: auto.metrics.accuracy,
        auto: auto.metrics,
      };
      onCommit(result);
    }, 1300);
  };

  const skip = () => {
    const stoppedAt = Date.now();
    const started = captureStartedAtRef.current ?? stoppedAt;
    const auto = analyseReading(draft.subject, item, "", {
      durationSec: Math.max(0.7, (stoppedAt - started) / 1000),
      firstResultAt: null,
      lastResultAt: null,
      pauseCount: 0,
      longPauseCount: 0,
      asrConfidence: null,
    });
    setAnalysis(auto.metrics);
    setNoSpeech(true);
    setPhase("feedback");
    finalisedRef.current = true;
    commitTimerRef.current = window.setTimeout(() => {
      onCommit({
        itemId: item.id,
        expected: item.spoken ?? item.content,
        outcome: auto.outcome,
        fluency: auto.metrics.fluency,
        support: null,
        method: "speech",
        suggestion: auto.outcome,
        match: 0,
        auto: auto.metrics,
      });
    }, 1100);
  };

  const tryAgain = () => {
    setPhase("ready");
    setAnalysis(null);
    setNoSpeech(false);
    speech.reset();
  };

  return (
    <div className="auto-capture">
      <div className="auto-mic-wrap">
        <button
          type="button"
          className={`auto-mic ${phase === "listening" ? "is-listening" : ""}`}
          onClick={() => {
            if (phase === "listening") finish();
            else if (phase === "ready") startCapture();
          }}
          disabled={
            phase === "processing" ||
            phase === "feedback" ||
            phase === "retry" ||
            (!speech.supported && phase === "ready")
          }
        >
          <Icon name={phase === "listening" ? "stop" : "mic"} size={28} />
        </button>
        <span className="auto-mic-label">
          {phase === "ready"
            ? "Tap to read"
            : phase === "listening"
              ? "Listening — tap when you finish"
              : phase === "processing"
                ? "Checking what I heard…"
                : phase === "feedback"
                  ? "Got it"
                  : "Let's try that again"}
        </span>
        <span className="auto-mic-sub">
          {phase === "ready"
            ? "Read aloud at your own pace. The app will move on when you finish."
            : phase === "listening"
              ? `${Math.ceil(remaining)} seconds left. You can tap the button to stop early.`
              : phase === "feedback"
                ? "The next item will appear in a moment."
                : "The app uses your browser's speech service to listen."}
        </span>
        <span className="auto-wave" aria-hidden="true">
          {levels.map((level, index) => (
            <span
              key={index}
              style={{ height: `${3 + level * 26}px` }}
              className={phase === "listening" ? "is-live" : ""}
            />
          ))}
        </span>
      </div>

      {phase === "listening" ? (
        <button type="button" className="btn btn-primary btn-lg auto-finish" onClick={finish}>
          Done reading
        </button>
      ) : null}

      {phase === "retry" ? (
        <div className="auto-retry">
          <p>
            {speech.error
              ? speech.error
              : "I didn't catch that. Try once more, a little closer to the microphone."}
          </p>
          {!speech.supported ? (
            <p className="auto-error">
              This browser does not expose speech recognition. Ask the volunteer to use educator-assisted
              mode.
            </p>
          ) : null}
          <div className="auto-retry-actions">
            <button type="button" className="btn btn-ghost" onClick={skip}>
              Keep going
            </button>
            <button type="button" className="btn btn-primary" onClick={tryAgain}>
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {analysis && phase === "feedback" ? (
        <div className={`auto-feedback ${noSpeech ? "is-muted" : ""}`}>
          <span className="auto-feedback-mark">
            <Icon name="check" size={17} />
          </span>
          <div>
            <strong>{noSpeech ? "Okay, let's move on." : "Saved. Nicely done."}</strong>
            <span>
              {noSpeech
                ? "No response was recorded for this item."
                : labelFluency(analysis.fluency) + " · the next item is coming."}
            </span>
          </div>
        </div>
      ) : null}

      {!speech.supported && phase === "ready" ? (
        <div className="auto-retry">
          <p>Speech recognition is unavailable in this browser. Ask the volunteer to switch to educator-assisted mode.</p>
          <div className="auto-retry-actions">
            <button type="button" className="btn btn-primary" onClick={skip}>
              Continue without speech
            </button>
          </div>
        </div>
      ) : null}

      <p className="auto-caveat auto-caveat--small">
        <button type="button" className="auto-text-button" onClick={onPause}>
          Volunteer: pause the assessment
        </button>
      </p>
    </div>
  );
}

function AutoMathsItem({
  item,
  draft,
  paused,
  onCommit,
}: {
  item: Item;
  draft: DraftSession;
  paused: boolean;
  onCommit: (result: ItemResult) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"ready" | "feedback">("ready");
  const [analysis, setAnalysis] = useState<AutoItemMetrics | null>(null);
  const startedAtRef = useRef(Date.now());
  const commitTimerRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
    return () => {
      window.clearInterval(timer);
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
      setPhase("ready");
      setAnalysis(null);
    }
  }, [paused]);

  const submit = (raw: string) => {
    if (phase === "feedback") return;
    const seconds = Math.max(1, (Date.now() - startedAtRef.current) / 1000);
    const auto = analyseMaths(item, raw, seconds);
    setAnalysis(auto.metrics);
    setPhase("feedback");
    commitTimerRef.current = window.setTimeout(() => {
      onCommit({
        itemId: item.id,
        expected: item.answer ?? item.content,
        heard: raw || undefined,
        outcome: auto.outcome,
        fluency: auto.metrics.fluency,
        support: null,
        method: "keypad",
        suggestion: auto.outcome,
        match: auto.metrics.accuracy,
        auto: auto.metrics,
      });
    }, 1200);
  };

  const append = (value: string) => {
    if (value === "clear") setAnswer("");
    else if (value === "back") setAnswer(answer.slice(0, -1));
    else setAnswer(`${answer}${value}`.slice(0, 4));
  };

  return (
    <div className="auto-maths">
      <div className="auto-answer">
        <span className="auto-answer-label">Your answer</span>
        <span className="auto-answer-value num">{answer || "—"}</span>
        <span className="auto-answer-timer">{remaining}s</span>
      </div>
      <div className="auto-keypad" role="group" aria-label="Number keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
          <button key={key} type="button" onClick={() => append(key)} disabled={phase === "feedback"}>
            {key}
          </button>
        ))}
        <button type="button" className="auto-keypad-word" onClick={() => append("clear")} disabled={phase === "feedback"}>
          Clear
        </button>
        <button type="button" onClick={() => append("0")} disabled={phase === "feedback"}>
          0
        </button>
        <button type="button" onClick={() => append("back")} aria-label="Backspace" disabled={phase === "feedback"}>
          ⌫
        </button>
      </div>
      <div className="auto-maths-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => submit("")}
          disabled={phase === "feedback"}
        >
          I don&apos;t know
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => submit(answer)}
          disabled={!answer.trim() || phase === "feedback"}
        >
          Done
        </button>
      </div>
      {analysis && phase === "feedback" ? (
        <div className={`auto-feedback ${analysis.noSpeech ? "is-muted" : ""}`}>
          <span className="auto-feedback-mark">
            <Icon name="check" size={17} />
          </span>
          <div>
            <strong>{analysis.noSpeech ? "Okay, let's move on." : "Saved."}</strong>
            <span>The next item will appear in a moment.</span>
          </div>
        </div>
      ) : null}
      <p className="auto-caveat auto-caveat--small">
        Maths uses the number pad so every child can answer without a volunteer marking it.
      </p>
    </div>
  );
}
