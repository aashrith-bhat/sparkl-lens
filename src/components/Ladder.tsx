import { getRungs, getSubject } from "../data/curriculum";
import type { SubjectId } from "../types";
import { Icon } from "./Icon";

export function MiniLadder({
  subject,
  order,
  expected,
}: {
  subject: SubjectId;
  order: number | null;
  expected?: number;
}) {
  const rungs = getRungs(subject);
  const label =
    order === null
      ? `${getSubject(subject).name}: not assessed yet`
      : `${getSubject(subject).name}: level ${order} of ${rungs.length}`;
  return (
    <span className="mini-ladder" role="img" aria-label={label}>
      {rungs.map((rung) => {
        const filled = order !== null && rung.order <= order;
        const current = order !== null && rung.order === order;
        return (
          <span
            key={rung.id}
            title={`${rung.name} · Std ${rung.benchmark}${rung.order === expected ? " · enrolled benchmark" : ""}`}
            className={[
              "mini-step",
              filled ? "is-filled" : "",
              current ? "is-current" : "",
              rung.order === expected ? "is-expected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ height: 4 + rung.order * 2 }}
          />
        );
      })}
    </span>
  );
}

export function ResultLadder({
  subject,
  suggested,
  failed,
  passedOrders,
}: {
  subject: SubjectId;
  suggested: number;
  failed: number | null;
  passedOrders: number[];
}) {
  const rungs = getRungs(subject);
  return (
    <div className="result-ladder" role="img" aria-label={`Result ladder for ${getSubject(subject).name}`}>
      {rungs.map((rung) => {
        const passed = passedOrders.includes(rung.order);
        const isFailed = failed === rung.order;
        const isCurrent = suggested === rung.order;
        const status = isFailed ? "failed" : passed ? "passed" : "open";
        return (
          <div
            key={rung.id}
            className={[
              "ladder-step",
              `is-${status}`,
              isCurrent ? "is-current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div
              className="ladder-bar"
              style={{ height: `${24 + rung.order * 9}px` }}
              title={`${rung.name}${isCurrent ? " — demonstrated level" : isFailed ? " — stopped here" : ""}`}
            >
              {isFailed ? <Icon name="close" size={12} /> : passed ? <Icon name="check" size={12} /> : null}
            </div>
            <div className="ladder-caption">
              <span className="ladder-name" title={isFailed ? "The ladder stopped here" : isCurrent ? "Highest rung cleared" : passed ? "Cleared" : "Not tested in this run"}>
                {rung.name}
              </span>
              <span className="ladder-bench">Std {rung.benchmark}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RailLadder({
  subject,
  currentOrder,
  passedOrders,
  failedOrders,
  attemptedOrders,
}: {
  subject: SubjectId;
  currentOrder: number;
  passedOrders: number[];
  failedOrders: number[];
  attemptedOrders: number[];
}) {
  const rungs = getRungs(subject);
  return (
    <ol className="rail-ladder" aria-label="Assessment ladder">
      {rungs.map((rung) => {
        const passed = passedOrders.includes(rung.order);
        const failed = failedOrders.includes(rung.order);
        const current = rung.order === currentOrder;
        const attempted = attemptedOrders.includes(rung.order);
        const status = current ? "current" : passed ? "passed" : failed ? "failed" : attempted ? "settled" : "open";
        return (
          <li
            key={rung.id}
            className={`rail-step is-${status}`}
            aria-current={current ? "step" : undefined}
          >
            <span className="rail-dot" aria-hidden="true">
              {passed ? (
                <Icon name="check" size={11} />
              ) : failed ? (
                <Icon name="close" size={11} />
              ) : (
                <span className="rail-dot-core" />
              )}
            </span>
            <span className="rail-copy">
              <span className="rail-name">{rung.name}</span>
              <span className="rail-sub">Std {rung.benchmark} benchmark</span>
            </span>
            {current ? <span className="rail-now">Now</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
