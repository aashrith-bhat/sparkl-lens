import { useEffect, useMemo, useState } from "react";
import { getRung, getSubject, shortRungName, SUBJECT_ORDER } from "../data/curriculum";
import { addLearner, useDB } from "../lib/store";
import { useHashRoute } from "../lib/router";
import {
  belowBenchmarkCount,
  latestDateForLearner,
  subjectSnapshots,
} from "../lib/selectors";
import { exportLearnerCsv } from "../lib/export";
import { relativeDate } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { Avatar } from "../components/Avatar";
import { Icon } from "../components/Icon";
import { Pill } from "../components/Pill";
import { EmptyState } from "../components/EmptyState";
import { AddLearnerModal } from "../components/AddLearnerModal";
import { useToast } from "../components/Toast";

export function LearnersPage() {
  const db = useDB();
  const route = useHashRoute();
  const toast = useToast();
  const [search, setSearch] = useState(route.query.get("q") ?? "");
  const [centre, setCentre] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setSearch(route.query.get("q") ?? "");
  }, [route.hash]);

  const centres = Array.from(new Set(db.learners.map((learner) => learner.centre))).sort();
  const { below, assessed } = belowBenchmarkCount(db.learners, db.assessments, db.settings);

  const rows = useMemo(
    () =>
      db.learners.map((learner) => {
        const snapshots = subjectSnapshots(learner, db.assessments, db.settings);
        const lastDate = latestDateForLearner(db.assessments, learner.id);
        const needsAttention = snapshots.some((snapshot) => snapshot.below);
        return { learner, snapshots, lastDate, needsAttention };
      }),
    [db.learners, db.assessments, db.settings],
  );

  const filtered = rows
    .filter((row) => {
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        row.learner.code.toLowerCase().includes(needle) ||
        row.learner.centre.toLowerCase().includes(needle) ||
        String(row.learner.enrolledStd).includes(needle);
      const matchesCentre = centre === "all" || row.learner.centre === centre;
      const matchesAttention = !attentionOnly || row.needsAttention;
      return matchesSearch && matchesCentre && matchesAttention;
    })
    .sort((a, b) => a.learner.code.localeCompare(b.learner.code));

  const addNewLearner = (input: {
    enrolledStd: number;
    centre: string;
    homeLanguage: string;
    consent: boolean;
  }) => {
    const created = addLearner({ ...input, consentOnFile: input.consent });
    setAddOpen(false);
    toast(`Learner ${created.code} added`, "positive");
    route.navigate(`/learners/${created.id}`);
  };

  return (
    <>
      <PageHeader
        title="Learners"
        subline={
          db.learners.length ? (
            <>
              <strong>{db.learners.length}</strong> anonymous codes across {centres.length}{" "}
              {centres.length === 1 ? "centre" : "centres"}. <strong>{below}</strong> of {assessed}{" "}
              assessed learners are below the foundational benchmark for their standard in at least one
              subject.
            </>
          ) : (
            "No learners are stored on this device yet."
          )
        }
        actions={
          <>
            {db.learners.length ? (
              <button type="button" className="btn" onClick={() => exportLearnerCsv(db)}>
                <Icon name="download" size={14} /> Export learners
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={14} /> Add learner
            </button>
          </>
        }
      />

      {db.learners.length ? (
        <>
          <div className="filter-row">
            <label className="filter-search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, standard or centre"
                aria-label="Search learners"
              />
            </label>
            <select
              className="select filter-select"
              value={centre}
              onChange={(event) => setCentre(event.target.value)}
              aria-label="Filter by centre"
            >
              <option value="all">All centres</option>
              {centres.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="filter-check">
              <input
                type="checkbox"
                checked={attentionOnly}
                onChange={(event) => setAttentionOnly(event.target.checked)}
              />
              Below benchmark
            </label>
            <span className="filter-count">
              {filtered.length} of {db.learners.length} learners
            </span>
          </div>

          {filtered.length ? (
            <>
              <div className="section-head records-head">
                <div>
                  <h2>Learner records</h2>
                  <p className="section-sub">
                    Latest level in each subject. The dot marks the widest gap in the row.
                  </p>
                </div>
                <span className="section-action">Sorted by code</span>
              </div>
              <div className="panel panel--flush learner-table-desktop">
                <div className="table-wrap">
                  <table className="table table--rowlink">
                    <thead>
                      <tr>
                        <th>Learner</th>
                        <th className="num">Std</th>
                        <th>Centre</th>
                        {SUBJECT_ORDER.map((subject) => (
                          <th key={subject}>{getSubject(subject).name}</th>
                        ))}
                        <th>Last assessed</th>
                        <th aria-label="Open" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(({ learner, snapshots, lastDate }) => {
                        const worstGap = Math.max(...snapshots.map((snapshot) => snapshot.gap ?? 0));
                        return (
                        <tr
                          key={learner.id}
                          onClick={() => route.navigate(`/learners/${learner.id}`)}
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") route.navigate(`/learners/${learner.id}`);
                          }}
                        >
                          <td>
                            <span className="table-identity">
                              <Avatar code={learner.code} size={28} />
                              <span>
                                <span className="cell-main">{learner.code}</span>
                                <span className="cell-sub">{learner.homeLanguage}</span>
                              </span>
                            </span>
                          </td>
                          <td className="num">{learner.enrolledStd}</td>
                          <td className="muted">{learner.centre}</td>
                          {snapshots.map((snapshot) => {
                            const rung = snapshot.levelOrder
                              ? getRung(snapshot.subject, snapshot.levelOrder)
                              : null;
                            const isWorst = snapshot.below && snapshot.gap === worstGap;
                            return (
                              <td key={snapshot.subject}>
                                {rung ? (
                                  <span className="level-cell">
                                    <span className="level-cell-name">{shortRungName(rung)}</span>
                                    <span className={`cell-sub ${isWorst ? "is-worst" : ""}`}>
                                      {isWorst ? <span className="level-gap-dot" aria-hidden="true" /> : null}
                                      {snapshot.gap
                                        ? `${snapshot.gap} ${snapshot.gap === 1 ? "rung" : "rungs"} below`
                                        : "At benchmark"}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="faint">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="muted nowrap">
                            {lastDate ? relativeDate(lastDate) : "Not assessed"}
                          </td>
                          <td>
                            <Icon name="chevron-right" size={14} className="row-chevron" />
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="learner-list-mobile">
                {filtered.map(({ learner, snapshots, lastDate, needsAttention }) => {
                  const worstGap = Math.max(...snapshots.map((snapshot) => snapshot.gap ?? 0));
                  return (
                  <a key={learner.id} className="learner-mobile-card" href={`#/learners/${learner.id}`}>
                    <div className="learner-mobile-head">
                      <Avatar code={learner.code} size={32} />
                      <div className="learner-mobile-id">
                        <span className="learner-mobile-code">{learner.code}</span>
                        <span className="learner-mobile-sub">
                          Std {learner.enrolledStd} · {learner.centre}
                        </span>
                      </div>
                      {needsAttention ? <Pill tone="warning">Below benchmark</Pill> : null}
                      <Icon name="chevron-right" size={15} />
                    </div>
                    <div className="learner-mobile-levels">
                      {snapshots.map((snapshot) => {
                        const rung = snapshot.levelOrder
                          ? getRung(snapshot.subject, snapshot.levelOrder)
                          : null;
                        const isWorst = snapshot.below && snapshot.gap === worstGap;
                        return (
                          <span key={snapshot.subject} className="learner-mobile-level">
                            <span className="learner-mobile-subject">{getSubject(snapshot.subject).name}</span>
                            <span className={isWorst ? "is-worst" : ""}>
                              {rung ? shortRungName(rung) : "—"}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                    <div className="learner-mobile-foot">
                      <span>{lastDate ? `Last assessed ${relativeDate(lastDate).toLowerCase()}` : "Not assessed yet"}</span>
                      <span>{learner.homeLanguage}</span>
                    </div>
                  </a>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              title="No learner matches these filters"
              body="Clear the search or the centre filter to see the full cohort."
              action={
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSearch("");
                    setCentre("all");
                    setAttentionOnly(false);
                  }}
                >
                  Clear filters
                </button>
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No learners on this device"
          body="Add an anonymous code to start. Each learner gets a separate Kannada, English and Maths level."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
              Add the first learner
            </button>
          }
        />
      )}

      <div className="table-note">
        <span className="status-dot status-dot--accent" />
        Codes only. No names, photographs or dates of birth are stored in this prototype.
      </div>

      <AddLearnerModal
        open={addOpen}
        defaultCentre={db.settings.centre}
        onClose={() => setAddOpen(false)}
        onAdded={addNewLearner}
      />
    </>
  );
}
