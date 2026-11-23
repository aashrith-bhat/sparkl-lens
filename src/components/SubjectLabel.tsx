import { getSubject } from "../data/curriculum";
import type { SubjectId } from "../types";
import type { PillTone } from "./Pill";

export function SubjectLabel({
  subject,
  tone = "neutral",
  compact = false,
}: {
  subject: SubjectId;
  tone?: PillTone;
  compact?: boolean;
}) {
  const meta = getSubject(subject);
  return (
    <span className={`subject-label ${tone !== "neutral" ? `is-${tone}` : ""}`} data-subject={subject}>
      <span className="subject-glyph" aria-hidden="true" lang={subject === "kannada" ? "kn" : undefined}>
        {meta.sample}
      </span>
      {!compact ? <span>{meta.name}</span> : null}
    </span>
  );
}
