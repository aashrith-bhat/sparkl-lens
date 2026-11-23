import type { ReactNode } from "react";

export function PageHeader({
  title,
  subline,
  actions,
}: {
  title: string;
  subline?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        <h1>{title}</h1>
        {subline ? <p className="page-sub">{subline}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}
