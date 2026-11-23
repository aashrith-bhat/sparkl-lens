import type { ReactNode } from "react";

export type PillTone = "neutral" | "positive" | "negative" | "warning" | "accent";

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return <span className={`pill pill--${tone} ${className}`.trim()}>{children}</span>;
}
