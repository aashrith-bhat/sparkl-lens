import { useEffect, useMemo, useState } from "react";
import type { Outcome, SpeechTrial } from "../types";
import { addSpeechTrial, useDB } from "../lib/store";
import { scoreTranscript, suggestionLabel } from "../lib/scoring";
import { relativeDate } from "../lib/format";
import { exportSpeechCsv } from "../lib/export";
import {
  speakText,
  speechRecognitionSupported,
  useMicLevel,
  useSpeechRecognition,
} from "../lib/useSpeech";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";
import { Pill } from "../components/Pill";
import { TokenRow } from "../components/TokenRow";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

const PROMPTS = {
  english: {
    word: ["school", "water", "mother", "kitten", "garden", "mango", "window", "village"],
    sentence: [
      "The children walk to school together.",
      "The kitten drank the milk and purred.",
      "The sun rises in the east.",
      "Meena gave the little bird some water.",
    ],
    paragraph: [
      "The sun rises in the east. The children walk to school together. They carry their books and water bottles. At school, they read, play and sing.",
      "A small kitten sat under the mango tree. It was hungry and alone. Meena saw the kitten and gave it some milk. The kitten drank the milk and purred.",
    ],
  },
  kannada: {
    word: ["ಶಾಲೆ", "ನೀರು", "ಮನೆ", "ಹಾಲು", "ಹೂವು", "ಗಿಡ", "ಮಳೆ", "ಪುಸ್ತಕ"],
    sentence: [
      "ಮಕ್ಕಳು ಶಾಲೆಗೆ ಹೋಗುತ್ತಾರೆ.",
      "ಮಳೆ ನಿಂತ ಮೇಲೆ ಹಕ್ಕಿ ಹಾರಿಹೋಯಿತು.",
      "ನಮ್ಮ ಶಾಲೆ ತುಂಬಾ ಸುಂದರವಾಗಿದೆ.",
      "ಮೀನಾ ಹಕ್ಕಿಗೆ ನೀರು ಕೊಟ್ಟಳು.",
    ],
    paragraph: [
      "ನಮ್ಮ ಶಾಲೆ ಒಂದು ಸುಂದರವಾದ ಸ್ಥಳ. ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಮಕ್ಕಳು ಮನೆಯಿಂದ ಶಾಲೆಗೆ ಬರುತ್ತಾರೆ. ಶಿಕ್ಷಕರು ಅವರಿಗೆ ಪಾಠ ಹೇಳಿಕೊಡುತ್ತಾರೆ. ಮಧ್ಯಾಹ್ನ ಎಲ್ಲರೂ ಒಟ್ಟಿಗೆ ಊಟ ಮಾಡುತ್ತಾರೆ.",
      "ಮೀನಾ ಒಂದು ಸಣ್ಣ ಹಳ್ಳಿಯಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದಳು. ಒಂದು ದಿನ ಆಕಾಶವು ಮೋಡಗಳಿಂದ ತುಂಬಿತು. ಮಳೆ ಬರುತ್ತದೆ ಎಂದು ಅವಳು ತಿಳಿದುಕೊಂಡಳು. ಅವಳು ಬೇಗನೆ ಮನೆಗೆ ಓದಿದಳು.",
    ],
  },
};

type Language = "english" | "kannada";
type PromptKind = "word" | "sentence" | "paragraph";
type PermissionState = "granted" | "prompt" | "denied" | "unsupported";

export function SpeechLabPage() {
  const db = useDB();
  const toast = useToast();
  const [language, setLanguage] = useState<Language>("english");
  const [kind, setKind] = useState<PromptKind>("word");
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [verdict, setVerdict] = useState<Outcome | null>(null);
  const [loggedTrial, setLoggedTrial] = useState<SpeechTrial | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [voices, setVoices] = useState<string[]>([]);

  const prompts = PROMPTS[language][kind];
  const prompt = prompts[index % prompts.length];
  const speechLanguage = language === "kannada" ? "kn-IN" : "en-IN";
  const speech = useSpeechRecognition(speechLanguage);
  const levels = useMicLevel(speech.listening);
  const score = transcript.trim() ? scoreTranscript(prompt, transcript) : null;
  const scored = useMemo(
    () => db.speechTrials.filter((trial) => trial.suggestion !== null),
    [db.speechTrials],
  );
  const agreements = scored.filter(
    (trial) => (trial.suggestion === "correct") === (trial.verdict === "correct"),
  );
  const agreementRate = scored.length ? Math.round((agreements.length / scored.length) * 100) : 0;
  const matrix = useMemo(() => {
    const cells = {
      correctCorrect: 0,
      correctWrong: 0,
      wrongCorrect: 0,
      wrongWrong: 0,
    };
    for (const trial of scored) {
      const machineCorrect = trial.suggestion === "correct";
      const educatorCorrect = trial.verdict === "correct";
      if (machineCorrect && educatorCorrect) cells.correctCorrect += 1;
      else if (machineCorrect && !educatorCorrect) cells.correctWrong += 1;
      else if (!machineCorrect && educatorCorrect) cells.wrongCorrect += 1;
      else cells.wrongWrong += 1;
    }
    return cells;
  }, [scored]);

  useEffect(() => {
    setTranscript("");
    setVerdict(null);
    setLoggedTrial(null);
    speech.reset();
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, kind]);

  useEffect(() => {
    if (speech.finalText.trim()) setTranscript(speech.finalText);
  }, [speech.finalText]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!navigator.permissions?.query) {
      setPermission("unsupported");
      return;
    }
    let active = true;
    let status: PermissionStatus | null = null;
    const onChange = () => {
      if (active && status) setPermission(status.state as PermissionState);
    };
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        status = result;
        if (active) setPermission(result.state as PermissionState);
        result.addEventListener("change", onChange);
      })
      .catch(() => {
        if (active) setPermission("unsupported");
      });
    return () => {
      active = false;
      status?.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices().map((voice) => voice.lang));
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  const kannadaVoice = voices.some((voice) => voice.toLowerCase().startsWith("kn"));

  const startRecording = () => {
    if (loggedTrial) return;
    setVerdict(null);
    speech.start();
  };

  const chooseVerdict = (outcome: Outcome) => {
    if (loggedTrial) return;
    setVerdict(outcome);
  };

  const nextPrompt = () => {
    setIndex((value) => (value + 1) % prompts.length);
    setTranscript("");
    setVerdict(null);
    setLoggedTrial(null);
    speech.reset();
  };

  const hearPrompt = () => {
    const ok = speakText(prompt, speechLanguage);
    if (!ok) toast("No Kannada voice on this device. Read the prompt aloud.", "warning");
  };

  const logTrial = () => {
    if (!verdict || !transcript.trim()) return;
    const source = speech.finalText.trim() ? "speech" : "manual";
    const trial: SpeechTrial = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sp-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      language,
      expected: prompt,
      transcript: transcript.trim(),
      match: source === "speech" ? score?.match ?? 0 : 0,
      suggestion: source === "speech" ? score?.suggestion ?? null : null,
      verdict,
      educator: db.settings.educator,
      source,
    };
    addSpeechTrial(trial);
    setLoggedTrial(trial);
    toast("Trial logged", "positive");
  };

  const languageStats = (target: Language) => {
    const subset = scored.filter((trial) => trial.language === target);
    if (!subset.length) return { count: 0, rate: 0 };
    const agree = subset.filter(
      (trial) => (trial.suggestion === "correct") === (trial.verdict === "correct"),
    ).length;
    return { count: subset.length, rate: Math.round((agree / subset.length) * 100) };
  };

  return (
    <>
      <PageHeader
        title="Speech lab"
        subline="An experiment in Kannada and English. The machine only suggests; the educator decides. Nothing on this page grades a child."
        actions={
          db.speechTrials.length ? (
            <button type="button" className="btn" onClick={() => exportSpeechCsv(db)}>
              <Icon name="download" size={14} /> Export trials
            </button>
          ) : undefined
        }
      />

      <div className="notice lab-notice">
        <Icon name="wave" size={15} />
        <span>
          Version one of the assessment does <strong>not</strong> use speech to decide a level. This lab
          measures where the browser and the educator disagree, so a threshold can be agreed before any
          pilot.
        </span>
      </div>

      <div className="grid-12 lab-layout">
        <section className="col-7 panel lab-panel" aria-labelledby="try-title">
          <div className="section-head">
            <div>
              <h2 id="try-title">Try a reading</h2>
              <p className="section-sub">
                Read the prompt aloud, then log your own verdict before the machine score is revealed.
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={nextPrompt}>
              Next prompt <Icon name="refresh" size={13} />
            </button>
          </div>

          <div className="lab-controls">
            <div className="segmented" role="group" aria-label="Language">
              <button
                type="button"
                className={language === "english" ? "is-active" : ""}
                onClick={() => setLanguage("english")}
                aria-pressed={language === "english"}
              >
                English
              </button>
              <button
                type="button"
                className={language === "kannada" ? "is-active" : ""}
                onClick={() => setLanguage("kannada")}
                aria-pressed={language === "kannada"}
              >
                Kannada
              </button>
            </div>
            <div className="segmented" role="group" aria-label="Prompt length">
              {(
                [
                  ["word", "Word"],
                  ["sentence", "Sentence"],
                  ["paragraph", "Paragraph"],
                ] as Array<[PromptKind, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={kind === value ? "is-active" : ""}
                  onClick={() => setKind(value)}
                  aria-pressed={kind === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="speech-prompt-card">
            <div className="speech-prompt-head">
              <span className="speech-prompt-label">
                {language === "kannada" ? "ಕನ್ನಡ" : "English"} · {kind}
              </span>
              <button type="button" className="btn btn-sm" onClick={hearPrompt}>
                <Icon name="play" size={12} /> Hear it
              </button>
            </div>
            <p
              className={`speech-prompt ${language === "kannada" ? "kannada" : "literata"} is-${kind}`}
              lang={language === "kannada" ? "kn" : "en"}
            >
              {prompt}
            </p>
          </div>

          <div className="lab-mic">
            <button
              type="button"
              className={`mic-button ${speech.listening ? "is-listening" : ""}`}
              onClick={() => (speech.listening ? speech.stop() : startRecording())}
              aria-label={speech.listening ? "Stop listening" : "Start listening"}
              disabled={Boolean(loggedTrial)}
            >
              <Icon name={speech.listening ? "stop" : "mic"} size={22} />
            </button>
            <div className="lab-mic-copy">
              <span className="mic-label">
                {speech.listening ? "Listening — tap to stop" : "Tap to listen"}
              </span>
              <span className="mic-sub">
                Use the device microphone. Audio is not stored by this app.
              </span>
              <span className="mic-wave" aria-hidden="true">
                {levels.map((level, barIndex) => (
                  <span
                    key={barIndex}
                    style={{ height: `${3 + level * 24}px` }}
                    className={speech.listening ? "is-live" : ""}
                  />
                ))}
              </span>
              {speech.listening && speech.interim ? <p className="live-transcript">{speech.interim}</p> : null}
              {speech.error ? <p className="capture-error">{speech.error}</p> : null}
              {!speech.supported ? (
                <p className="capture-error">
                  This browser does not expose speech recognition. You can still type the transcript and
                  log the educator's verdict.
                </p>
              ) : null}
            </div>
          </div>

          <div className="lab-transcript">
            <label htmlFor="lab-transcript">Transcript</label>
            <textarea
              id="lab-transcript"
              className="textarea"
              value={transcript}
              onChange={(event) => {
                setTranscript(event.target.value);
                if (verdict && !loggedTrial) setVerdict(null);
              }}
              placeholder="The browser transcript appears here. You can correct it before logging."
              disabled={Boolean(loggedTrial)}
            />
          </div>

          <div className="lab-verdict">
            <div className="lab-verdict-head">
              <span className="mark-label">Your verdict, first</span>
              <span className="faint small">
                {loggedTrial
                  ? "Trial logged — machine comparison below."
                  : "The machine score is revealed only after you log."}
              </span>
            </div>
            <div className="lab-verdict-grid">
              {(
                [
                  ["correct", "Correct"],
                  ["partial", "Partial"],
                  ["incorrect", "Not yet"],
                ] as Array<[Outcome, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`mark-btn mark-${value === "incorrect" ? "incorrect" : value} ${
                    verdict === value ? "is-selected" : ""
                  }`}
                  onClick={() => chooseVerdict(value)}
                  aria-pressed={verdict === value}
                  disabled={Boolean(loggedTrial)}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-primary lab-log-btn"
                onClick={logTrial}
                disabled={!verdict || !transcript.trim() || Boolean(loggedTrial)}
                title={!verdict ? "Mark the reading before logging." : undefined}
              >
                {loggedTrial ? (
                  <>
                    <Icon name="check" size={14} /> Logged
                  </>
                ) : (
                  "Log trial"
                )}
              </button>
            </div>
            <p className="lab-audio-note">
              Logging keeps the transcript and your verdict. Audio is never stored. A typed transcript is
              educator-only and does not count toward agreement.
            </p>
          </div>

          {loggedTrial && loggedTrial.source === "speech" && score ? (
            <div className="machine-reveal">
              <div className="machine-reveal-head">
                <span className="machine-reveal-title">What the machine heard</span>
                <Pill tone={score.suggestion === "correct" ? "positive" : score.suggestion === "partial" ? "warning" : "negative"}>
                  {suggestionLabel(score.suggestion)}
                </Pill>
              </div>
              <div className="machine-reveal-meta">
                <span className="num">{Math.round(score.match * 100)}% word match</span>
                <span className="faint">·</span>
                <span>
                  {score.matchedTokens} of {score.totalTokens} words matched
                </span>
                {score.scriptMismatch ? <Pill tone="warning">Script mismatch</Pill> : null}
              </div>
              {score.tokens.length > 14 ? (
                <details className="token-details">
                  <summary>Word-by-word comparison</summary>
                  <TokenRow tokens={score.tokens} />
                </details>
              ) : (
                <TokenRow tokens={score.tokens} />
              )}
            </div>
          ) : loggedTrial ? (
            <div className="lab-hidden-note">
              <span className="status-dot status-dot--accent" />
              Educator-only trial saved. A typed transcript has no machine comparison, so it is excluded
              from the agreement count.
            </div>
          ) : verdict && !transcript.trim() ? (
            <div className="lab-hidden-note">
              <span className="status-dot status-dot--accent" />
              Record or type the transcript to log the trial.
            </div>
          ) : (
            <div className="lab-hidden-note">
              <span className="status-dot status-dot--accent" />
              Mark the reading, then log it. The machine's suggestion and word match are shown after the
              trial is saved, so the comparison is not led by the machine.
            </div>
          )}

        </section>

        <div className="col-5 lab-side">
          <section className="panel agreement-panel" aria-labelledby="agreement-title">
            <div className="section-head">
              <div>
                <h2 id="agreement-title">Machine–educator agreement</h2>
                <p className="section-sub">Correct versus not correct, across audio-scored trials.</p>
              </div>
              <span className="section-action">{scored.length} scored</span>
            </div>

            {scored.length ? (
              <>
                <div className="agreement-headline">
                  <span className="agreement-value literata num">{agreementRate}%</span>
                  <span className="agreement-copy">
                    {agreements.length} of {scored.length} trials agreed
                  </span>
                </div>
                <div className="agreement-track" role="img" aria-label={`${agreementRate}% agreement`}>
                  <span style={{ width: `${agreementRate}%` }} />
                </div>
                <div className="agreement-scale">
                  <span>0%</span>
                  <span>100%</span>
                </div>

                <table className="matrix">
                  <thead>
                    <tr>
                      <th />
                      <th>Machine: correct</th>
                      <th>Machine: not correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Educator: correct</th>
                      <td className="is-agree">{matrix.correctCorrect}</td>
                      <td className="is-differ">{matrix.wrongCorrect}</td>
                    </tr>
                    <tr>
                      <th>Educator: not correct</th>
                      <td className="is-differ">{matrix.correctWrong}</td>
                      <td className="is-agree">{matrix.wrongWrong}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="agreement-langs">
                  {(["english", "kannada"] as Language[]).map((code) => {
                    const stats = languageStats(code);
                    return (
                      <div key={code} className="agreement-lang-row">
                        <span>{code === "english" ? "English" : "Kannada"}</span>
                        <span className="muted num">{stats.count} scored</span>
                        <span className="num">{stats.count ? `${stats.rate}% agree` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="agreement-note">
                  Agreement is not accuracy. A machine can agree with an educator and both can be wrong;
                  a disagreement is the useful case to review.
                </p>
              </>
            ) : (
              <EmptyState
                title="No scored trials yet"
                body="Log a trial to compare the machine suggestion with the educator's verdict."
              />
            )}
          </section>

          <section className="panel device-panel" aria-labelledby="device-title">
            <div className="section-head">
              <div>
                <h2 id="device-title">Device check</h2>
                <p className="section-sub">What this browser can actually do, right now.</p>
              </div>
            </div>
            <div className="device-list">
              <DeviceRow
                label="Browser speech"
                value={speechRecognitionSupported() ? "Available" : "Not available"}
                tone={speechRecognitionSupported() ? "positive" : "negative"}
              />
              <DeviceRow
                label="Secure context"
                value={window.isSecureContext ? "Yes" : "No"}
                tone={window.isSecureContext ? "positive" : "negative"}
              />
              <DeviceRow
                label="Network"
                value={online ? "Online" : "Offline"}
                tone={online ? "positive" : "warning"}
              />
              <DeviceRow
                label="Microphone"
                value={
                  permission === "granted"
                    ? "Allowed"
                    : permission === "denied"
                      ? "Blocked"
                      : permission === "unsupported"
                        ? "Not checkable"
                        : "Not asked yet"
                }
                tone={
                  permission === "granted"
                    ? "positive"
                    : permission === "denied"
                      ? "negative"
                      : "neutral"
                }
              />
              <DeviceRow
                label="Kannada voice for playback"
                value={kannadaVoice ? "Found" : "Not found"}
                tone={kannadaVoice ? "positive" : "warning"}
              />
            </div>
            <p className="device-note">
              Chrome's speech recognition may send audio to an online service even when this app is
              local. Test on the real shared device before promising speech recognition.
            </p>
          </section>
        </div>
      </div>

      <section className="panel panel--flush lab-log" aria-labelledby="log-title">
        <div className="panel-pad section-head">
          <div>
            <h2 id="log-title">Trial log</h2>
            <p className="section-sub">
              {db.speechTrials.length} {db.speechTrials.length === 1 ? "trial" : "trials"} on this device.
              The educator's verdict is recorded before the machine suggestion is read. Typed transcripts
              are educator-only.
            </p>
          </div>
          <span className="section-action">Newest first</span>
        </div>
        {db.speechTrials.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Logged</th>
                  <th>Lang</th>
                  <th>Expected</th>
                  <th>Heard</th>
                  <th className="num">Match</th>
                  <th>Machine</th>
                  <th>Educator</th>
                  <th>Agreement</th>
                </tr>
              </thead>
              <tbody>
                {[...db.speechTrials]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((trial) => {
                    const agree =
                      trial.suggestion === null
                        ? null
                        : (trial.suggestion === "correct") === (trial.verdict === "correct");
                    return (
                      <tr key={trial.id}>
                        <td className="nowrap muted">{relativeDate(trial.createdAt)}</td>
                        <td className="muted">{trial.language === "english" ? "EN" : "KN"}</td>
                        <td>
                          <span
                            className={`trial-text ${trial.language === "kannada" ? "kannada-ui" : ""}`}
                            lang={trial.language === "kannada" ? "kn" : undefined}
                            title={trial.expected}
                          >
                            {trial.expected}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`trial-text ${trial.language === "kannada" ? "kannada-ui" : ""}`}
                            lang={trial.language === "kannada" ? "kn" : undefined}
                            title={trial.transcript}
                          >
                            {trial.transcript}
                          </span>
                        </td>
                        <td className="num">{Math.round(trial.match * 100)}%</td>
                        <td>
                          {trial.suggestion ? (
                            <Pill
                              tone={
                                trial.suggestion === "correct"
                                  ? "positive"
                                  : trial.suggestion === "partial"
                                    ? "warning"
                                    : "negative"
                              }
                            >
                              {suggestionLabel(trial.suggestion)}
                            </Pill>
                          ) : (
                            <span className="faint">—</span>
                          )}
                        </td>
                        <td>
                          <Pill
                            tone={
                              trial.verdict === "correct"
                                ? "positive"
                                : trial.verdict === "partial"
                                  ? "warning"
                                  : "negative"
                            }
                          >
                            {trial.verdict === "correct"
                              ? "Correct"
                              : trial.verdict === "partial"
                                ? "Partial"
                                : "Not yet"}
                          </Pill>
                        </td>
                        <td>
                          {agree === null ? (
                            <span className="faint">—</span>
                          ) : (
                            <Pill tone={agree ? "positive" : "negative"}>{agree ? "Agree" : "Differ"}</Pill>
                          )}
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
              title="No trials logged"
              body="Record a reading, mark your verdict, then log the trial to see agreement."
            />
          </div>
        )}
      </section>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        Speech is an experiment, not a verdict. Task 4: compare machine suggestions with educator
        judgement, and stop if unreliable.
      </p>
    </>
  );
}

function DeviceRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "warning" | "neutral";
}) {
  return (
    <div className="device-row">
      <span className={`status-dot ${tone === "neutral" ? "" : `status-dot--${tone}`}`} />
      <span className="device-label">{label}</span>
      <span className={`device-value is-${tone}`}>{value}</span>
    </div>
  );
}
