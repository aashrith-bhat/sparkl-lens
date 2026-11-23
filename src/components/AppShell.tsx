import { useEffect, useRef, useState, type ReactNode } from "react";
import { getSubject } from "../data/curriculum";
import { useDB } from "../lib/store";
import { navigate, useHashRoute } from "../lib/router";
import { Icon, type IconName } from "./Icon";
import { Pill } from "./Pill";

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  match?: string[];
}

const NAV_MAIN: NavItem[] = [
  { label: "Overview", path: "/overview", icon: "overview", match: ["/overview"] },
  { label: "Assess", path: "/assess", icon: "ladder", match: ["/assess", "/session"] },
  { label: "Reports", path: "/reports", icon: "report", match: ["/reports"] },
  { label: "Learners", path: "/learners", icon: "learners", match: ["/learners"] },
];

const NAV_EXPLORE: NavItem[] = [
  { label: "Speech lab", path: "/speech", icon: "wave", match: ["/speech"] },
  { label: "Evidence", path: "/evidence", icon: "book", match: ["/evidence"] },
];

const NAV_MANAGE: NavItem[] = [{ label: "Settings", path: "/settings", icon: "settings", match: ["/settings"] }];

const PAGE_TITLES: Record<string, string> = {
  overview: "Overview",
  assess: "Assess",
  session: "Assessment in progress",
  learners: "Learners",
  reports: "Reports",
  learner: "Learner profile",
  speech: "Speech lab",
  evidence: "Evidence",
  settings: "Settings",
};

function activeFor(item: NavItem, path: string): boolean {
  return (item.match ?? [item.path]).some((match) => path === match || path.startsWith(`${match}/`));
}

function pageTitleFor(path: string): string {
  const segment = path.split("/").filter(Boolean)[0] ?? "overview";
  return PAGE_TITLES[segment] ?? "SparkL Lens";
}

export function AppShell({ children }: { children: ReactNode }) {
  const db = useDB();
  const route = useHashRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const navDialog = useRef<HTMLDialogElement>(null);

  const centres = Array.from(new Set(db.learners.map((learner) => learner.centre)));
  const draft = db.draft;
  const draftLearner = draft ? db.learners.find((learner) => learner.id === draft.learnerId) : null;
  const autoFocus = route.path === "/session" && draft?.config.pacing === "auto";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setMenuOpen(false);
    document.title = `${pageTitleFor(route.path)} · SparkL Lens`;
  }, [route.path]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const dialog = navDialog.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/learners?q=${encodeURIComponent(query)}` : "/learners");
    setMenuOpen(false);
  };

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = activeFor(item, route.path);
      return (
        <a
          key={item.path}
          href={`#${item.path}`}
          className={`nav-item ${active ? "is-active" : ""}`}
          aria-current={active ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
        </a>
      );
    });

  return (
    <div className={`app-frame ${autoFocus ? "is-auto-focus" : ""}`}>
      <aside className="sidebar">
        <a href="#/overview" className="brand" aria-label="SparkL Lens, overview">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="spark" size={27} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">SparkL Lens</span>
            <span className="brand-sub">Assessment prototype</span>
          </span>
        </a>

        <div className="scope">
          <span className="scope-label">Karnataka pilot</span>
          <span className="scope-value">
            {centres.length ? `${centres.length} ${centres.length === 1 ? "centre" : "centres"}` : "No centres yet"}
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Workspace">
          <p className="nav-group-label">Workspace</p>
          {renderNav(NAV_MAIN)}
          <p className="nav-group-label">Explore</p>
          {renderNav(NAV_EXPLORE)}
          <p className="nav-group-label">Manage</p>
          {renderNav(NAV_MANAGE)}
        </nav>

        <div className="sidebar-foot">
          {draft && draftLearner ? (
            <a className="draft-card" href="#/session">
              <span className="draft-eyebrow">
                <span className="status-dot status-dot--accent" />
                Assessment in progress
              </span>
              <span className="draft-title">
                {draftLearner.code} · {getSubject(draft.subject).name}
              </span>
              <span className="draft-link">Resume where you left off</span>
            </a>
          ) : null}
          <div className="prototype-note">
            <Pill tone="neutral">Draft prototype</Pill>
            <p>Rubric, sequence and pass rules are pending SparkL review.</p>
            <a href="#/evidence" className="text-link">
              Read the evidence <Icon name="arrow-right" size={13} />
            </a>
          </div>
        </div>
      </aside>

      <div className="frame-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" size={18} />
          </button>
          <a className="topbar-brand" href="#/overview" aria-label="SparkL Lens, overview">
            <Icon name="spark" size={14} />
            <span>SparkL Lens</span>
          </a>
          <form className="topbar-search" onSubmit={submitSearch} role="search">
            <Icon name="search" size={15} />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search learner code"
              aria-label="Search learners by code"
              autoComplete="off"
            />
            <kbd>/</kbd>
          </form>
          <div className="topbar-right">
            <span className="local-status">
              <span className="status-dot status-dot--positive" />
              On this device
            </span>
            <span className="topbar-sep" aria-hidden="true" />
            <span className="demo-note">Demo records</span>
          </div>
        </header>

        <main className="sheet" id="main-sheet">
          <div className="sheet-inner">{children}</div>
        </main>
      </div>

      <dialog
        ref={navDialog}
        className="nav-sheet"
        aria-label="Navigation"
        onCancel={(event) => {
          event.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      >
        <div className="nav-sheet-head">
          <a href="#/overview" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              <Icon name="spark" size={25} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">SparkL Lens</span>
              <span className="brand-sub">Assessment prototype</span>
            </span>
          </a>
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="nav-sheet-body">
          <p className="nav-group-label">Workspace</p>
          {renderNav(NAV_MAIN)}
          <p className="nav-group-label">Explore</p>
          {renderNav(NAV_EXPLORE)}
          <p className="nav-group-label">Manage</p>
          {renderNav(NAV_MANAGE)}
        </div>
        <div className="nav-sheet-foot">
          <p className="scope-label">Karnataka pilot</p>
          <p>{centres.length ? centres.join(" · ") : "No centres yet"}</p>
          <p className="prototype-line">Draft prototype · rubric pending review</p>
        </div>
      </dialog>
    </div>
  );
}
