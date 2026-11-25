import { useEffect, useRef } from "react";
import { useDB } from "../lib/store";
import { syncConfigured, syncPendingWritten } from "../lib/sync";

export function SyncManager() {
  const db = useDB();
  const running = useRef(false);
  const lastKey = useRef("");

  useEffect(() => {
    lastKey.current = "";
  }, [db.settings.syncUrl, db.settings.syncKey]);

  useEffect(() => {
    if (!syncConfigured(db.settings)) return undefined;
    const pending = db.writtenAssessments.filter((item) => item.syncStatus !== "synced");
    if (!pending.length) return undefined;
    const key = pending
      .map((item) => item.id)
      .sort()
      .join("|");
    if (lastKey.current === key) return undefined;

    const run = () => {
      if (running.current || !navigator.onLine) return;
      running.current = true;
      lastKey.current = key;
      void syncPendingWritten(db.settings).finally(() => {
        running.current = false;
      });
    };

    if (navigator.onLine) {
      const timer = window.setTimeout(run, 1200);
      return () => window.clearTimeout(timer);
    }
    window.addEventListener("online", run, { once: true });
    return () => window.removeEventListener("online", run);
  }, [db.settings, db.writtenAssessments]);

  return null;
}
