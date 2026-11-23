import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getRungs, SUBJECTS } from "../data/curriculum";
import type { Item, SubjectId } from "../types";
import {
  addCustomItem,
  clearAll,
  deleteCustomItem,
  resetDemo,
  setBenchmark,
  toggleRung,
  updateSettings,
  useDB,
} from "../lib/store";
import { useHashRoute } from "../lib/router";
import { CENTRES, EDUCATORS } from "../lib/defaults";
import {
  exportAssessmentCsv,
  exportJson,
  exportLearnerCsv,
  exportSpeechCsv,
} from "../lib/export";
import { sourceLinks, team } from "../data/evidence";
import { PageHeader } from "../components/PageHeader";
import { Icon } from "../components/Icon";
import { Pill } from "../components/Pill";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";

const SETTINGS_TABS = [
  { id: "grading", label: "Grading" },
  { id: "levels", label: "Levels" },
  { id: "items", label: "Items" },
  { id: "data", label: "Data & privacy" },
  { id: "about", label: "About" },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export function SettingsPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const queryTab = route.query.get("tab");
  const [tab, setTab] = useState<SettingsTab>(
    SETTINGS_TABS.some((item) => item.id === queryTab) ? (queryTab as SettingsTab) : "grading",
  );
  const [mapSubject, setMapSubject] = useState<SubjectId>("kannada");
  const [bankSubject, setBankSubject] = useState<SubjectId>("kannada");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const next = route.query.get("tab");
    if (SETTINGS_TABS.some((item) => item.id === next)) setTab(next as SettingsTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.hash]);

  const choose = (next: SettingsTab) => {
    setTab(next);
    route.navigate(`/settings?tab=${next}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const storageSize = useMemo(() => {
    try {
      return new Blob([JSON.stringify(db)]).size;
    } catch {
      return 0;
    }
  }, [db]);

  const patch = (input: Parameters<typeof updateSettings>[0]) => {
    updateSettings(input);
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subline="Grading rules, the draft level map, the item bank and the local records. Changes save as you edit."
        actions={
          <span className="save-stamp">
            <Icon name="check" size={13} /> Auto-saved on this device
          </span>
        }
      />

      <div className="tabs" role="tablist" aria-label="Settings sections">
        {SETTINGS_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tab ${tab === item.id ? "is-active" : ""}`}
            onClick={() => choose(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "grading" ? (
        <div className="settings-view">
          <SettingRow
            title="Default rung rule"
            description="Used by the full ladder and as the starting point for a custom test. A quick check is fixed at two items and one to clear."
          >
            <div className="setting-inline">
              <div className="setting-control">
                <span className="setting-control-label">Items per rung</span>
                <Stepper
                  value={db.settings.itemsPerRung}
                  min={1}
                  max={5}
                  onChange={(value) =>
                    patch({
                      itemsPerRung: value,
                      passMark: Math.min(db.settings.passMark, value),
                    })
                  }
                  label="Items per rung"
                />
              </div>
              <div className="setting-control">
                <span className="setting-control-label">To clear a rung</span>
                <Stepper
                  value={Math.min(db.settings.passMark, db.settings.itemsPerRung)}
                  min={1}
                  max={db.settings.itemsPerRung}
                  onChange={(value) => patch({ passMark: value })}
                  label="Items needed to clear a rung"
                />
              </div>
              <div className="setting-control">
                <span className="setting-control-label">Partial credit</span>
                <div className="row">
                  <button
                    type="button"
                    className={`toggle ${db.settings.partialCredit ? "is-on" : ""}`}
                    aria-pressed={db.settings.partialCredit}
                    aria-label="Count a partial response as half"
                    onClick={() => patch({ partialCredit: !db.settings.partialCredit })}
                  />
                  <span className="small muted">
                    {db.settings.partialCredit ? "Half a point" : "No credit"}
                  </span>
                </div>
              </div>
            </div>
            <div className="rule-preview">
              <span className="rule-preview-strong">
                {db.settings.itemsPerRung} items · {Math.min(db.settings.passMark, db.settings.itemsPerRung)} to clear
              </span>
              <span>
                {db.settings.partialCredit
                  ? " · a partial response counts as half"
                  : " · a partial response does not count"}
              </span>
            </div>
            <p className="setting-foot">
              This is a draft rule. SparkL's official pass criteria have not been supplied.
            </p>
          </SettingRow>

          <SettingRow
            title="Kannada instructions"
            description="Show the Kannada instruction under every item. The English instruction stays visible."
          >
            <div className="toggle-row">
              <div>
                <p className="toggle-row-title">Show Kannada instructions</p>
                <p className="toggle-row-desc">
                  Recommended for Kannada-medium learners and for any child more comfortable in Kannada.
                </p>
              </div>
              <button
                type="button"
                className={`toggle ${db.settings.showKannadaInstructions ? "is-on" : ""}`}
                aria-pressed={db.settings.showKannadaInstructions}
                onClick={() => patch({ showKannadaInstructions: !db.settings.showKannadaInstructions })}
                aria-label="Show Kannada instructions"
              />
            </div>
            {db.settings.showKannadaInstructions ? (
              <div className="kannada-preview">
                <span className="kannada-ui" lang="kn">ಈ ಅಕ್ಷರಗಳನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.</span>
                <span className="kannada-preview-translation">Read these letters aloud.</span>
              </div>
            ) : null}
            <p className="setting-foot">
              The app interface itself is in English. Kannada is used for the instruction and the item
              content, not as a full interface translation yet.
            </p>
          </SettingRow>

          <SettingRow
            title="Educator and centre"
            description="The name attached to new assessment records. This is a local label, not a login."
          >
            <div className="field-grid">
              <div className="field">
                <label htmlFor="settings-educator">Educator</label>
                <select
                  id="settings-educator"
                  className="select"
                  value={db.settings.educator}
                  onChange={(event) => patch({ educator: event.target.value })}
                >
                  {EDUCATORS.map((educator) => (
                    <option key={educator} value={educator}>
                      {educator}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="settings-centre">Default centre</label>
                <select
                  id="settings-centre"
                  className="select"
                  value={db.settings.centre}
                  onChange={(event) => patch({ centre: event.target.value })}
                >
                  {CENTRES.map((centre) => (
                    <option key={centre} value={centre}>
                      {centre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SettingRow>

          <div className="settings-note">
            <p className="margin-note-title">What is not editable here</p>
            <p>
              The quick-check shape (two items, one to clear, four rung attempts) and the six-rung content
              are fixed in this prototype. A custom test can change them for a single child. The official
              SparkL sequence will replace this draft.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "levels" ? (
        <div className="settings-view">
          <div className="level-map-head">
            <div>
              <h2>What each rung represents</h2>
              <p className="section-sub">
                A benchmark is the standard a rung represents. The learner's enrolled standard is compared
                with the highest rung at or below that benchmark.
              </p>
            </div>
            <div className="segmented" role="group" aria-label="Subject">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className={mapSubject === subject.id ? "is-active" : ""}
                  onClick={() => setMapSubject(subject.id)}
                  aria-pressed={mapSubject === subject.id}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
          <div className="panel panel--flush level-map-desktop">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rung</th>
                    <th>Benchmark</th>
                    <th className="num">Sequence</th>
                    <th>Used in sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {getRungs(mapSubject).map((rung) => {
                    const disabled = db.settings.disabledRungs[mapSubject]?.includes(rung.id);
                    const benchmark = db.settings.benchmarks[mapSubject]?.[rung.id] ?? rung.benchmark;
                    const enabledCount = getRungs(mapSubject).filter(
                      (candidate) => !db.settings.disabledRungs[mapSubject]?.includes(candidate.id),
                    ).length;
                    return (
                      <tr key={rung.id} className={disabled ? "is-disabled-row" : ""}>
                        <td>
                          <span className="cell-main">{rung.name}</span>
                          <span className="cell-sub">
                            {rung.kannadaName ? `${rung.kannadaName} · ` : ""}
                            {rung.focus}
                          </span>
                        </td>
                        <td>
                          <select
                            className="select benchmark-select"
                            value={benchmark}
                            onChange={(event) =>
                              setBenchmark(mapSubject, rung.id, Number(event.target.value))
                            }
                            aria-label={`Benchmark for ${rung.name}`}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((std) => (
                              <option key={std} value={std}>
                                Std {std}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="num muted">{rung.order}</td>

                        <td>
                          <div className="row">
                            <button
                              type="button"
                              className={`toggle ${!disabled ? "is-on" : ""}`}
                              aria-pressed={!disabled}
                              aria-label={`${disabled ? "Enable" : "Disable"} ${rung.name}`}
                              onClick={() => {
                                if (!disabled && enabledCount <= 1) {
                                  toast("Keep at least one rung enabled.", "warning");
                                  return;
                                }
                                toggleRung(mapSubject, rung.id);
                              }}
                            />
                            <span className="small muted">{disabled ? "Off" : "On"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="level-map-mobile">
            {getRungs(mapSubject).map((rung) => {
              const disabled = db.settings.disabledRungs[mapSubject]?.includes(rung.id);
              const benchmark = db.settings.benchmarks[mapSubject]?.[rung.id] ?? rung.benchmark;
              const enabledCount = getRungs(mapSubject).filter(
                (candidate) => !db.settings.disabledRungs[mapSubject]?.includes(candidate.id),
              ).length;
              return (
                <div className={`level-mobile-card ${disabled ? "is-disabled" : ""}`} key={rung.id}>
                  <div className="level-mobile-head">
                    <div>
                      <h3>{rung.name}</h3>
                      <p>
                        {rung.kannadaName ? `${rung.kannadaName} · ` : ""}
                        {rung.focus}
                      </p>
                    </div>
                    <div className="row">
                      <button
                        type="button"
                        className={`toggle ${!disabled ? "is-on" : ""}`}
                        aria-pressed={!disabled}
                        aria-label={`${disabled ? "Enable" : "Disable"} ${rung.name}`}
                        onClick={() => {
                          if (!disabled && enabledCount <= 1) {
                            toast("Keep at least one rung enabled.", "warning");
                            return;
                          }
                          toggleRung(mapSubject, rung.id);
                        }}
                      />
                      <span className="small muted">{disabled ? "Off" : "On"}</span>
                    </div>
                  </div>
                  <div className="level-mobile-foot">
                    <div className="field">
                      <label htmlFor={`mobile-benchmark-${rung.id}`}>Benchmark</label>
                      <select
                        id={`mobile-benchmark-${rung.id}`}
                        className="select benchmark-select"
                        value={benchmark}
                        onChange={(event) =>
                          setBenchmark(mapSubject, rung.id, Number(event.target.value))
                        }
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((std) => (
                          <option key={std} value={std}>
                            Std {std}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="level-mobile-seq">
                      Rung {rung.order} of {getRungs(mapSubject).length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="settings-note mt-16">
            <p className="margin-note-title">Draft mapping, not a curriculum claim</p>
            <p>
              The defaults (Kannada and English to Std 3; Maths to Std 4) are a working mapping for the
              prototype. They are not a validated SparkL grade equivalent. Change them here as the actual
              rubric is agreed.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "items" ? (
        <div className="settings-view">
          <div className="level-map-head">
            <div>
              <h2>The item bank</h2>
              <p className="section-sub">
                Core items were written for this prototype. Add a custom item to a rung and it becomes
                available to future sessions on this device.
              </p>
            </div>
            <div className="segmented" role="group" aria-label="Subject">
              {SUBJECTS.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className={bankSubject === subject.id ? "is-active" : ""}
                  onClick={() => setBankSubject(subject.id)}
                  aria-pressed={bankSubject === subject.id}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
          <div className="item-bank">
            {getRungs(bankSubject).map((rung) => {
              const custom = db.settings.customItems[rung.id] ?? [];
              return (
                <details className="item-bank-group" key={rung.id} open={rung.order === 1}>
                  <summary>
                    <span className="item-bank-title">
                      {rung.name} <span className="muted">· Std {db.settings.benchmarks[bankSubject]?.[rung.id] ?? rung.benchmark}</span>
                    </span>
                    <span className="item-bank-count">
                      {rung.items.length + custom.length} items
                    </span>
                  </summary>
                  <div className="item-bank-body">
                    <div className="table-wrap">
                      <table className="table item-bank-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Type</th>
                            <th>Answer / expected</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rung.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span
                                  className={`item-content ${bankSubject === "kannada" ? "kannada-ui" : ""}`}
                                  lang={bankSubject === "kannada" ? "kn" : undefined}
                                >
                                  {item.content}
                                </span>
                              </td>
                              <td className="muted small">{itemKindLabel(item)}</td>
                              <td className="muted small">{itemExpected(item)}</td>
                              <td>
                                <Pill tone="neutral">Core</Pill>
                              </td>
                            </tr>
                          ))}
                          {custom.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span
                                  className={`item-content ${bankSubject === "kannada" ? "kannada-ui" : ""}`}
                                  lang={bankSubject === "kannada" ? "kn" : undefined}
                                >
                                  {item.content}
                                </span>
                              </td>
                              <td className="muted small">{itemKindLabel(item)}</td>
                              <td className="muted small">{itemExpected(item)}</td>
                              <td>
                                <span className="row item-bank-source">
                                  <Pill tone="warning">Custom</Pill>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    aria-label={`Delete custom item ${item.content}`}
                                    onClick={() => deleteCustomItem(rung.id, item.id)}
                                  >
                                    <Icon name="trash" size={14} />
                                  </button>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <AddItemForm rungId={rung.id} subject={bankSubject} />
                  </div>
                </details>
              );
            })}
          </div>
          <div className="settings-note mt-16">
            <p className="margin-note-title">A custom item is still a draft</p>
            <p>
              Adding an item does not validate it. The SparkL rubric and a Kannada educator should approve
              the sequence, wording and expected answer before a pilot.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="settings-view">
          <div className="storage-strip">
            <div>
              <span className="storage-label">Learners</span>
              <span className="storage-value num">{db.learners.length}</span>
            </div>
            <div>
              <span className="storage-label">Assessments</span>
              <span className="storage-value num">{db.assessments.length}</span>
            </div>
            <div>
              <span className="storage-label">Speech trials</span>
              <span className="storage-value num">{db.speechTrials.length}</span>
            </div>
            <div>
              <span className="storage-label">Local data</span>
              <span className="storage-value num">{formatBytes(storageSize)}</span>
            </div>
          </div>

          <section className="panel data-panel" aria-labelledby="export-title">
            <div className="section-head">
              <div>
                <h2 id="export-title">Export</h2>
                <p className="section-sub">
                  A JSON backup can be kept or opened as text. This prototype does not import a backup.
                  CSV files open in Excel or Sheets.
                </p>
              </div>
            </div>
            <div className="data-actions">
              <button type="button" className="btn" onClick={() => exportJson(db)}>
                <Icon name="download" size={14} /> JSON backup
              </button>
              <button type="button" className="btn" onClick={() => exportAssessmentCsv(db)} disabled={!db.assessments.length}>
                <Icon name="download" size={14} /> Assessments CSV
              </button>
              <button type="button" className="btn" onClick={() => exportLearnerCsv(db)} disabled={!db.learners.length}>
                <Icon name="download" size={14} /> Learners CSV
              </button>
              <button type="button" className="btn" onClick={() => exportSpeechCsv(db)} disabled={!db.speechTrials.length}>
                <Icon name="download" size={14} /> Speech trials CSV
              </button>
            </div>
            <p className="setting-foot">
              Exports leave the app as plain files. Treat them as child records and store them on a
              protected device.
            </p>
          </section>

          <section className="panel data-panel" aria-labelledby="privacy-title">
            <div className="section-head">
              <div>
                <h2 id="privacy-title">What is stored</h2>
                <p className="section-sub">Records live in this browser profile only.</p>
              </div>
              <Pill tone="neutral">Local storage</Pill>
            </div>
            <div className="privacy-grid">
              <div>
                <h3>Stored</h3>
                <ul className="plain-list">
                  <li>Anonymous learner code, enrolled standard, centre, home language, consent flag.</li>
                  <li>Assessment results by subject, item marks, duration, educator and confidence.</li>
                  <li>Educator notes and speech transcripts, when entered or logged.</li>
                  <li>Grading settings and custom items.</li>
                </ul>
              </div>
              <div>
                <h3>Not stored</h3>
                <ul className="plain-list">
                  <li>Names, photographs, dates of birth or addresses.</li>
                  <li>Audio recordings.</li>
                  <li>Passwords, accounts or a login identity.</li>
                  <li>Anything sent to a server. There is no server in this prototype.</li>
                </ul>
              </div>
            </div>
            <div className="notice privacy-notice">
              <Icon name="alert" size={15} />
              <span>
                Browser speech recognition may send audio to the browser vendor's speech service. This app
                does not record or upload audio itself. Test this with SparkL before any child uses it.
              </span>
            </div>
            <div className="notice notice--warning privacy-notice">
              <Icon name="alert" size={15} />
              <span>
                A shared browser profile means shared records. Use a dedicated device profile, export the
                records after a session and clear them if the device changes hands. Consent is recorded as a
                flag, not a signed document.
              </span>
            </div>
          </section>

          <section className="panel danger-panel" aria-labelledby="danger-title">
            <div className="section-head">
              <div>
                <h2 id="danger-title">Reset or clear</h2>
                <p className="section-sub">These actions affect only this browser. They cannot be undone.</p>
              </div>
            </div>
            <div className="danger-row">
              <div>
                <p className="toggle-row-title">Restore the demo records</p>
                <p className="toggle-row-desc">
                  Replaces all learners, assessments, trials and settings with the seeded demonstration
                  data.
                </p>
              </div>
              <button type="button" className="btn" onClick={() => setConfirmReset(true)}>
                Restore demo
              </button>
            </div>
            <div className="danger-row">
              <div>
                <p className="toggle-row-title">Clear all local records</p>
                <p className="toggle-row-desc">
                  Removes learners, assessments, trials and the draft, and resets the settings. The app stays
                  installed.
                </p>
              </div>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmClear(true)}>
                Clear everything
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "about" ? (
        <div className="settings-view">
          <section className="about-head">
            <span className="about-mark" aria-hidden="true">
              <Icon name="spark" size={30} />
            </span>
            <div>
              <h2>SparkL Lens</h2>
              <p>
                A draft, local-first assessment tool for Project SparkL. It finds a demonstrated level in
                Kannada, English and Maths, keeps the educator in control and shows the gap against the
                enrolled standard.
              </p>
              <p className="about-version">
                Version 0.1.0 · prototype · Team Syndicate, 2026
              </p>
            </div>
          </section>

          <div className="about-grid">
            <section>
              <h3>What this prototype is</h3>
              <ul className="plain-list">
                <li>A worked example of how the Task 1–4 research could become a product.</li>
                <li>A local browser app with seeded demo records and no server.</li>
                <li>A draft six-rung ladder per subject, editable in Settings.</li>
                <li>An experiment in advisory Kannada and English speech, never an automatic grade.</li>
              </ul>
            </section>
            <section>
              <h3>What it is not</h3>
              <ul className="plain-list">
                <li>A validated SparkL assessment or an official rubric.</li>
                <li>A production child-data system, a login or a sync service.</li>
                <li>A replacement for an educator's listening and judgement.</li>
                <li>Evidence that speech recognition works on the real shared device.</li>
              </ul>
            </section>
          </div>

          <section className="about-section">
            <h3>Keyboard</h3>
            <div className="kbd-grid">
              <span><kbd>/</kbd> Focus search</span>
              <span><kbd>1</kbd> Correct</span>
              <span><kbd>2</kbd> Partial</span>
              <span><kbd>3</kbd> Not yet</span>
              <span><kbd>Enter</kbd> Save &amp; continue</span>
            </div>
          </section>

          <section className="about-section">
            <h3>Letters and sources</h3>
            <p className="about-copy">
              The five task PDFs are bundled with the app and open from the Evidence page. The interface
              uses Instrument Sans; learning content uses Literata; Kannada uses Noto Serif and Noto Sans
              Kannada. All four are locally served open-source fonts, so the app makes no font request at
              runtime.
            </p>
            <div className="about-links">
              {sourceLinks.slice(0, 4).map((source) => (
                <a key={source.file} href={source.file} target="_blank" rel="noreferrer" className="text-link">
                  {source.label}
                </a>
              ))}
            </div>
          </section>

          <section className="about-section">
            <h3>Team Syndicate</h3>
            <p className="about-copy">
              {team.map((member) => `${member.name} (${member.branch})`).join(" · ")}.
            </p>
            <p className="about-copy">
              Built on the Project SparkL research tasks. The product, wording and gap analysis are a draft
              for review, not the official SparkL position.
            </p>
          </section>

          <section className="about-section">
            <h3>Privacy in one line</h3>
            <p className="about-copy">
              No names, no audio, no server. Records live in this browser and can be exported or cleared at
              any time from Data &amp; privacy.
            </p>
          </section>
        </div>
      ) : null}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restore the demo records?"
        description="This replaces the current local records and settings with the seeded demonstration data."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast("Demo records restored", "positive");
              }}
            >
              Restore demo
            </button>
          </>
        }
      >
        <p className="small muted">Any assessments added on this device will be lost.</p>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear every local record?"
        description="This removes all learners, assessments, speech trials and the draft, and resets the grading settings."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                clearAll();
                setConfirmClear(false);
                toast("All local records cleared");
              }}
            >
              Clear everything
            </button>
          </>
        }
      >
        <p className="small muted">Export a JSON backup first if any of these records matter.</p>
      </Modal>
    </>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="setting-row">
      <div className="setting-label">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="setting-panel">{children}</div>
    </section>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        <Icon name="minus" size={13} />
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Icon name="plus" size={13} />
      </button>
    </div>
  );
}

function AddItemForm({ rungId, subject }: { rungId: string; subject: SubjectId }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"read" | "say" | "answer">("read");
  const [content, setContent] = useState("");
  const [answer, setAnswer] = useState("");

  const reset = () => {
    setContent("");
    setAnswer("");
    setKind("read");
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-sm add-item-button" onClick={() => setOpen(true)}>
        <Icon name="plus" size={13} /> Add a custom item
      </button>
    );
  }

  return (
    <form
      className="add-item-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!content.trim()) return;
        const item: Item = {
          id: `custom-${rungId}-${Date.now().toString(36)}`,
          kind,
          content: content.trim(),
          manualOnly: kind === "say" ? true : undefined,
          spoken: kind === "read" ? content.trim() : undefined,
          answer: kind === "answer" ? answer.trim() : undefined,
          accept: kind === "answer" && answer.trim() ? [answer.trim()] : undefined,
        };
        addCustomItem(rungId, item);
        toast("Custom item added", "positive");
        reset();
      }}
    >
      <div className="field-grid field-grid--3">
        <div className="field">
          <label htmlFor={`item-kind-${rungId}`}>Type</label>
          <select
            id={`item-kind-${rungId}`}
            className="select"
            value={kind}
            onChange={(event) => setKind(event.target.value as "read" | "say" | "answer")}
          >
            <option value="read">Read aloud</option>
            <option value="say">Say aloud (educator marks)</option>
            <option value="answer">Answer</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`item-content-${rungId}`}>Content</label>
          <input
            id={`item-content-${rungId}`}
            className={`input ${subject === "kannada" ? "kannada-ui" : ""}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={subject === "kannada" ? "ಉದಾ. ಮನೆ" : "For example: mango"}
          />
        </div>
        {kind === "answer" ? (
          <div className="field">
            <label htmlFor={`item-answer-${rungId}`}>Expected answer</label>
            <input
              id={`item-answer-${rungId}`}
              className="input"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="For example: 12"
            />
          </div>
        ) : (
          <div className="field">
            <span className="field-label">Expected</span>
            <span className="field-help">
              {kind === "say"
                ? "The educator listens; no machine transcript is expected."
                : "The item text is used as the expected reading."}
            </span>
          </div>
        )}
      </div>
      <div className="add-item-actions">
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm" disabled={!content.trim() || (kind === "answer" && !answer.trim())}>
          Add item
        </button>
      </div>
    </form>
  );
}

function itemKindLabel(item: Item): string {
  if (item.kind === "answer") return "Answer";
  if (item.kind === "say") return "Say aloud";
  if (item.kind === "comprehension") return "Comprehension";
  if (item.kind === "dots") return "Counting";
  return "Read aloud";
}

function itemExpected(item: Item): string {
  if (item.answer) return item.answer;
  if (item.kind === "say" || item.kind === "comprehension") return "Educator judges";
  return "Read as written";
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}
