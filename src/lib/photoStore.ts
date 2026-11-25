import { useEffect, useState } from "react";

const DB_NAME = "sparkl-lens-photos";
const STORE = "photos";
const DB_VERSION = 1;

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local photo storage."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open photo storage."));
    request.onsuccess = () => resolve(request.result);
  });
}

export function newPhotoId(): string {
  return `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function putPhoto(blob: Blob, id = newPhotoId()): Promise<string> {
  const database = await openPhotoDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(blob, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save photo."));
  });
  database.close();
  return id;
}

export async function getPhoto(id: string): Promise<Blob | null> {
  const database = await openPhotoDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readonly");
    const request = transaction.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not read photo."));
  });
  database.close();
  return blob;
}

export async function deletePhoto(id: string): Promise<void> {
  const database = await openPhotoDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete photo."));
  });
  database.close();
}

export async function clearAllPhotos(): Promise<void> {
  const database = await openPhotoDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear photos."));
  });
  database.close();
}

export function usePhotoUrl(id: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    if (!id) return undefined;
    void getPhoto(id)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return url;
}

export async function compressImage(source: Blob, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (!source.type.startsWith("image/")) return source;
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return source;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const compressed = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  return compressed ?? source;
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    // Storage persistence is a browser hint, not a requirement.
  }
}
