import { useHashRoute } from "./lib/router";
import { AppShell } from "./components/AppShell";
import { PageHeader } from "./components/PageHeader";
import { EmptyState } from "./components/EmptyState";
import { OverviewPage } from "./pages/Overview";
import { AssessPage } from "./pages/Assess";
import { SessionPage } from "./pages/Session";
import { ReportsPage } from "./pages/Reports";
import { ReportDetailPage } from "./pages/ReportDetail";
import { WrittenPage } from "./pages/Written";
import { WrittenSetupPage } from "./pages/WrittenSetup";
import { WrittenSessionPage } from "./pages/WrittenSession";
import { WrittenReportPage } from "./pages/WrittenReport";
import { LearnersPage } from "./pages/Learners";
import { LearnerDetailPage } from "./pages/LearnerDetail";
import { SpeechLabPage } from "./pages/SpeechLab";
import { EvidencePage } from "./pages/Evidence";
import { SettingsPage } from "./pages/Settings";

export default function App() {
  const route = useHashRoute();
  const segment = route.segments[0] ?? "overview";

  let page: React.ReactNode;
  switch (segment) {
    case "overview":
      page = <OverviewPage />;
      break;
    case "assess":
      page = <AssessPage />;
      break;
    case "session":
      page = <SessionPage />;
      break;
    case "reports":
      page = route.segments[1] ? (
        <ReportDetailPage key={route.segments[1]} />
      ) : (
        <ReportsPage />
      );
      break;
    case "written":
      page =
        route.segments[1] === "new" ? (
          <WrittenSetupPage />
        ) : route.segments[1] === "session" ? (
          <WrittenSessionPage />
        ) : route.segments[1] ? (
          <WrittenReportPage key={route.segments[1]} />
        ) : (
          <WrittenPage />
        );
      break;
    case "learners":
      page = route.segments[1] ? (
        <LearnerDetailPage key={route.segments[1]} />
      ) : (
        <LearnersPage />
      );
      break;
    case "speech":
      page = <SpeechLabPage />;
      break;
    case "evidence":
      page = <EvidencePage />;
      break;
    case "settings":
      page = <SettingsPage />;
      break;
    default:
      page = (
        <>
          <PageHeader title="Not found" subline="That page is not part of this prototype." />
          <EmptyState
            title="This destination does not exist"
            body="Use the sidebar or the bottom bar to return to the workspace."
            action={
              <a className="btn btn-primary" href="#/overview">
                Back to Overview
              </a>
            }
          />
        </>
      );
  }

  return <AppShell>{page}</AppShell>;
}
