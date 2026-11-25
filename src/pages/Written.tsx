import { useEffect, useMemo, useState } from "react";
import { getSubject } from "../data/curriculum";
import type { WrittenAssessment } from "../types";
import { WRITTEN_BAND_LABEL } from "../data/written";
import { useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import { formatDate, relativeDate } from "../lib/format";
import { syncConfigured, syncPendingWritten } from "../lib/sync";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { Pill } from "../components/Pill";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function WrittenPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const sorted = useMemo(
    () =>
      [...db.writtenAssessments].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    [db.writtenAssessments],
  );
  const pending = sorted.filter((item) => item.syncStatus !== "synced");
  const learnersWritten = new Set(sorted.map((item) => item.learnerId)).size;
  const photoCount = sorted.reduce(
    (sum, item) => sum + item.tasks.filter((task) => task.photoId).length,
    0,
  );
  const configured = syncConfigured(db.settings);
  const draft = db.writtenDraft;
  const draftLearner = draft
    ? db.learners.find((learner) => learner.id === draft.learnerId)
    : null;

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage("");
    const result = await syncPendingWritten(db.settings);
    setSyncMessage(result.message);
    setSyncing(false);
    toast(result.message, result.failed ? "warning" : "positive");
  };

  return (
    <>
      <PageHeader
        title="Written ability"
        subline="Paper-first written checks: photograph the page, mark a short rubric, and keep the report on this device until it can sync."
        actions={
          <>
            <a className="btn" href="#/settings?tab=sync">
              Sync settings
            </a>
            <a className="btn btn-primary" href="#/written/new">
              Start written check <Icon name="arrow-right" size={14} />
            </a>
          </>
        }
      />

      {draft && draftLearner ? (
        <div className="written-resume">
          <div>
            <span className="written-resume-kicker">
              <span className="status-dot status-dot--accent" /> Written check in progress
            </span>
            <strong>{draftLearner.code}</strong>
            <span>
              {getSubject(draft.subject).name} · task {draft.currentIndex + 1} of {draft.tasks.length}
            </span>
          </div>
          <a className="btn btn-primary btn-sm" href="#/written/session">
            Resume <Icon name="arrow-right" size={13} />
          </a>
        </div>
      ) : null}

      <section className="metric-strip" aria-label="Written checks at a glance">
        <div className="metric-cell">
          <span className="metric-label">Written checks</span>
          <span className="metric-value num">{sorted.length}</span>
          <span className="metric-sub">saved on this device</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Learners with writing</span>
          <span className="metric-value num">{learnersWritten}</span>
          <span className="metric-sub">of {db.learners.length} learners</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Awaiting sync</span>
          <span className="metric-value num">{pending.length}</span>
          <span className="metric-sub">{online ? "connection available" : "offline now"}</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">Page photos</span>
          <span className="metric-value num">{photoCount}</span>
          <span className="metric-sub">stored in this browser</span>
        </div>
      </section>

      <div className="written-home-grid">
        <div className="written-home-main">
          <section className="panel written-history" aria-labelledby="written-history-title">
          <div className="section-head">
            <div>
              <h2 id="written-history-title">Recent written checks</h2>
              <p className="section-sub">Newest first. Open a check for the page photos and rubric.</p>
            </div>
            <span className="section-action">{sorted.length} total</span>
          </div>
          {sorted.length ? (
            <div className="written-history-list">
              {sorted.map((assessment) => (
                <WrittenRow
                  key={assessment.id}
                  assessment={assessment}
                  learnerCode={db.learners.find((item) => item.id === assessment.learnerId)?.code ?? "Learner"}
                  onOpen={() => route.navigate(`/written/${assessment.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No written checks yet"
              body="Start with one child, one page and three short criteria. The report will be saved offline."
              action={
                <a className="btn btn-primary" href="#/written/new">
                  Start a written check
                </a>
              }
            />
          )}
        </section>

        <section className="panel written-station" aria-labelledby="written-station-title">
          <div className="section-head">
            <div>
              <h2 id="written-station-title">Running the written station</h2>
              <p className="section-sub">Built for a long visit with one laptop and one phone.</p>
            </div>
            <span className="section-action">8–10 min / child</span>
          </div>
          <div className="written-station-grid">
            <div>
              <span className="written-station-number">1</span>
              <strong>One page, three tasks</strong>
              <span>Print or write the prompt. Keep the page in view.</span>
            </div>
            <div>
              <span className="written-station-number">2</span>
              <strong>Photo, then rubric</strong>
              <span>Capture the page and mark three criteria. No OCR.</span>
            </div>
            <div>
              <span className="written-station-number">3</span>
              <strong>Queue and move on</strong>
              <span>Save locally. Sync at the end when internet returns.</span>
            </div>
          </div>
        </section>
        </div>

        <aside className="written-home-side">
          <section className="panel panel--raised written-sync-panel">
            <div className="section-head">
              <div>
                <h2>Sync</h2>
                <p className="section-sub">
                  {configured ? "Supabase is configured." : "Records stay on this device until sync is set up."}
                </p>
              </div>
              <Pill tone={online ? "positive" : "warning"}>{online ? "Online" : "Offline"}</Pill>
            </div>
            {configured ? (
              <>
                <p className="small muted">
                  {pending.length
                    ? `${pending.length} written record${pending.length === 1 ? "" : "s"} waiting. Photos upload with the record.`
                    : "Everything written here is synced."}
                </p>
                <button
                  type="button"
                  className="btn btn-primary written-sync-button"
                  onClick={() => void syncNow()}
                  disabled={syncing || !online || !pending.length}
                >
                  {syncing ? "Syncing…" : "Sync now"}
                </button>
                {syncMessage ? <p className="written-sync-message">{syncMessage}</p> : null}
              </>
            ) : (
              <a className="text-link mt-8" href="#/settings?tab=sync">
                Configure Supabase sync <Icon name="arrow-right" size={13} />
              </a>
            )}
          </section>

          <section className="panel written-how-panel">
            <h2>Why paper first?</h2>
            <ol className="written-how-list">
              <li>
                <strong>Works offline</strong>
                <span>No handwriting model, no internet dependency.</span>
              </li>
              <li>
                <strong>Works for Kannada</strong>
                <span>Real handwriting is captured as evidence, not guessed by OCR.</span>
              </li>
              <li>
                <strong>Fast for one-on-one</strong>
                <span>Three criteria and a photo, then the next child.</span>
              </li>
            </ol>
            <p className="written-caveat">
              Draft written tasks and rubric. Review with a Kannada educator before field use.
            </p>
          </section>
        </aside>
      </div>

      <p className="overview-foot">
        <span className="status-dot status-dot--accent" />
        Written photos stay in this browser. Configure Supabase in Settings to upload them when internet
        returns.
      </p>
    </>
  );
}

function WrittenRow({
  assessment,
  learnerCode,
  onOpen,
}: {
  assessment: WrittenAssessment;
  learnerCode: string;
  onOpen: () => void;
}) {
  const subject = getSubject(assessment.subject);
  return (
    <button type="button" className="written-row" onClick={onOpen}>
      <Avatar code={learnerCode} size={30} />
      <span className="written-row-copy">
        <span className="written-row-main">
          {learnerCode} <span className="written-row-dot">·</span> {subject.name}
        </span>
        <span className="written-row-sub">
          {relativeDate(assessment.completedAt)} · {assessment.tasks.length} tasks ·{" "}
          {formatDate(assessment.completedAt, false)}
        </span>
      </span>
      <span className={`written-band written-band--${assessment.band}`}>
        {WRITTEN_BAND_LABEL[assessment.band]}
      </span>
      <span className="written-row-score num">
        {assessment.totalScore}/{assessment.maxScore}
      </span>
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
          ? "Synced"
          : assessment.syncStatus === "error"
            ? "Retry"
            : "Queued"}
      </Pill>
      <Icon name="chevron-right" size={14} className="row-chevron" />
    </button>
  );
}
