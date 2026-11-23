import { getRung, getRungs, getSubject, shortRungName, topOrder } from "../data/curriculum";
import type { SubjectId } from "../types";
import { formatDate } from "../lib/format";

export interface ProgressPoint {
  date: string;
  order: number;
  id: string;
}

export function ProgressChart({
  subject,
  series,
  benchmark,
  enrolledStd,
}: {
  subject: SubjectId;
  series: ProgressPoint[];
  benchmark: number;
  enrolledStd: number;
}) {
  const rungs = getRungs(subject);
  const top = topOrder(subject);
  const points = series.slice(-8);
  const times = points.map((point) => new Date(point.date).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const span = maxTime - minTime;
  const xFor = (index: number) => {
    if (points.length === 1) return 50;
    if (span === 0) return 4 + (index / (points.length - 1)) * 92;
    return 3 + ((times[index] - minTime) / span) * 94;
  };
  const yFor = (order: number) => 100 - (order / top) * 100;
  const labelPoints =
    points.length <= 2
      ? points.map((_, index) => index)
      : [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(
          (value, index, all) => all.indexOf(value) === index,
        );

  const first = points[0];
  const last = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const firstRung = first.order > 0 ? getRung(subject, first.order) : null;
  const lastRung = last.order > 0 ? getRung(subject, last.order) : null;
  const summary = `${getSubject(subject).name}: ${points.length} assessments from ${
    firstRung?.name ?? "below rung 1"
  } on ${formatDate(first.date, false)} to ${lastRung?.name ?? "below rung 1"} on ${formatDate(
    last.date,
    false,
  )}. Std ${enrolledStd} benchmark: ${getRung(subject, benchmark)?.name ?? "top of ladder"}.`;
  const trend =
    points.length === 1
      ? "One assessment so far."
      : previous && last.order > previous.order
        ? `Up ${last.order - previous.order} ${last.order - previous.order === 1 ? "rung" : "rungs"} from the previous record.`
        : previous && last.order < previous.order
          ? `Down ${previous.order - last.order} ${previous.order - last.order === 1 ? "rung" : "rungs"} from the previous record.`
          : `Holding at ${lastRung?.name ?? "the same level"} across ${points.length} assessments.`;

  return (
    <figure className="progress-figure" aria-label={summary}>
      <div className="step-chart">
        <div className="chart-grid" aria-hidden="true">
          {rungs.map((rung) => (
            <div key={rung.id} className="chart-gridline" style={{ top: `${yFor(rung.order)}%` }}>
              <span className="chart-ylabel">{shortRungName(rung)}</span>
            </div>
          ))}
          <div className="chart-gridline is-zero" style={{ top: "100%" }}>
            <span className="chart-ylabel">Below 1</span>
          </div>
          <div className="chart-expected" style={{ top: `${yFor(benchmark)}%` }}>
            <span className="chart-expected-label">Std {enrolledStd} benchmark</span>
          </div>
        </div>

        <div className="chart-plot" aria-hidden="true">
          {points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            const x1 = xFor(index);
            const x2 = xFor(index + 1);
            const y1 = yFor(point.order);
            const y2 = yFor(next.order);
            return (
              <span key={`${point.id}-step`}>
                <span
                  className="chart-seg is-horizontal"
                  style={{ left: `${x1}%`, top: `${y1}%`, width: `${x2 - x1}%` }}
                />
                <span
                  className="chart-seg is-vertical"
                  style={{
                    left: `${x2}%`,
                    top: `${Math.min(y1, y2)}%`,
                    height: `${Math.abs(y2 - y1)}%`,
                  }}
                />
              </span>
            );
          })}
          {points.map((point, index) => (
            <span
              key={point.id}
              className="chart-dot"
              style={{ left: `${xFor(index)}%`, top: `${yFor(point.order)}%` }}
              title={`${formatDate(point.date)} · ${point.order > 0 ? getRung(subject, point.order)?.name : "Below rung 1"}`}
            />
          ))}
        </div>

        <div className="chart-xaxis" aria-hidden="true">
          {labelPoints.map((index) => (
            <span
              key={points[index].id}
              className="chart-xlabel"
              style={{ left: `${xFor(index)}%` }}
            >
              {formatDate(points[index].date, false)}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="chart-caption">{trend}</figcaption>
    </figure>
  );
}
