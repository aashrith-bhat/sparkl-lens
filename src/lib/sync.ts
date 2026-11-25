import type { Settings, WrittenAssessment } from "../types";
import { getPhoto } from "./photoStore";
import { getDB, updateWrittenAssessment } from "./store";

export interface SyncConfig {
  url: string;
  key: string;
}

export function syncConfig(settings: Settings): SyncConfig | null {
  const url = settings.syncUrl.trim().replace(/\/+$/, "");
  const key = settings.syncKey.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function syncConfigured(settings: Settings): boolean {
  return Boolean(syncConfig(settings));
}

function headers(config: SyncConfig, extra: Record<string, string> = {}) {
  return {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    ...extra,
  };
}

function errorText(status: number, body: string): string {
  const clean = body.replace(/\s+/g, " ").trim().slice(0, 180);
  if (status === 401 || status === 403) return "Supabase rejected the key. Check the anon key and table policies.";
  if (status === 404) return "The Supabase table or storage bucket was not found. Run the setup SQL.";
  return clean ? `Sync failed (${status}): ${clean}` : `Sync failed (${status}).`;
}

export async function testSync(settings: Settings): Promise<{ ok: boolean; message: string }> {
  const config = syncConfig(settings);
  if (!config) return { ok: false, message: "Add the Supabase URL and anon key first." };
  try {
    const response = await fetch(
      `${config.url}/rest/v1/written_assessments?select=id&limit=1`,
      { headers: headers(config) },
    );
    if (!response.ok) {
      return { ok: false, message: errorText(response.status, await response.text()) };
    }
    return { ok: true, message: "Connected to Supabase. Table access works." };
  } catch {
    return { ok: false, message: "Could not reach Supabase. The app will keep records locally." };
  }
}

async function uploadPhoto(
  config: SyncConfig,
  assessment: WrittenAssessment,
  taskId: string,
  photoId: string,
): Promise<void> {
  const blob = await getPhoto(photoId);
  if (!blob) return;
  const path = `${assessment.id}/${taskId}.jpg`;
  const response = await fetch(
    `${config.url}/storage/v1/object/written-photos/${path}`,
    {
      method: "POST",
      headers: headers(config, {
        "Content-Type": blob.type || "image/jpeg",
        "x-upsert": "true",
        "cache-control": "3600",
      }),
      body: blob,
    },
  );
  if (!response.ok) throw new Error(errorText(response.status, await response.text()));
}

export async function pushWrittenAssessment(
  assessment: WrittenAssessment,
  settings: Settings,
): Promise<{ ok: boolean; message?: string }> {
  const config = syncConfig(settings);
  if (!config) return { ok: false, message: "Sync is not configured." };
  if (!navigator.onLine) return { ok: false, message: "Offline. The record stays queued." };

  const learner = getDB().learners.find((item) => item.id === assessment.learnerId);
  try {
    for (const task of assessment.tasks) {
      if (task.photoId) await uploadPhoto(config, assessment, task.taskId, task.photoId);
    }
    const response = await fetch(`${config.url}/rest/v1/written_assessments`, {
      method: "POST",
      headers: headers(config, {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({
        id: assessment.id,
        learner_code: learner?.code ?? "",
        subject: assessment.subject,
        centre: assessment.centre,
        completed_at: assessment.completedAt,
        band: assessment.band,
        total_score: assessment.totalScore,
        max_score: assessment.maxScore,
        educator: assessment.educator,
        device_id: assessment.deviceId,
        updated_at: assessment.updatedAt,
        payload: assessment,
      }),
    });
    if (!response.ok) {
      return { ok: false, message: errorText(response.status, await response.text()) };
    }
    updateWrittenAssessment(assessment.id, {
      syncStatus: "synced",
      syncError: undefined,
      syncedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    updateWrittenAssessment(assessment.id, { syncStatus: "error", syncError: message });
    return { ok: false, message };
  }
}

export async function syncPendingWritten(
  settings: Settings,
): Promise<{ pushed: number; failed: number; message: string }> {
  if (!syncConfig(settings)) {
    return { pushed: 0, failed: 0, message: "Sync is not configured." };
  }
  if (!navigator.onLine) {
    return { pushed: 0, failed: 0, message: "Offline. Records will sync when a connection returns." };
  }
  const pending = getDB().writtenAssessments.filter((item) => item.syncStatus !== "synced");
  let pushed = 0;
  let failed = 0;
  let lastError = "";
  for (const assessment of pending) {
    const result = await pushWrittenAssessment(assessment, settings);
    if (result.ok) pushed += 1;
    else {
      failed += 1;
      lastError = result.message ?? "Sync failed.";
    }
  }
  return {
    pushed,
    failed,
    message:
      failed === 0
        ? `${pushed} written record${pushed === 1 ? "" : "s"} synced.`
        : `${pushed} synced · ${failed} still queued. ${lastError}`,
  };
}
