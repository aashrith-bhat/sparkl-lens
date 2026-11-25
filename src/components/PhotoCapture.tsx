import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { compressImage, putPhoto, usePhotoUrl } from "../lib/photoStore";

export function PhotoCapture({
  photoId,
  onChange,
  label = "Photo of the written page",
}: {
  photoId: string | null;
  onChange: (photoId: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = usePhotoUrl(photoId);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1600 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) {
          setError("Camera permission was blocked or no camera was found. Choose a photo instead.");
        }
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [cameraOpen]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const saveBlob = async (blob: Blob) => {
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImage(blob);
      const id = await putPhoto(compressed);
      onChange(id);
    } catch {
      setError("The photo could not be saved on this device. Try a smaller image.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    await saveBlob(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("The camera is not ready yet.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (blob) await saveBlob(blob);
    setCameraOpen(false);
  };

  return (
    <div className="photo-capture">
      <div className="photo-capture-head">
        <span className="photo-capture-label">
          <Icon name="camera" size={14} /> {label}
        </span>
        {photoId ? (
          <span className="pill pill--positive">
            <Icon name="check" size={11} /> Attached
          </span>
        ) : (
          <span className="photo-capture-optional">Optional</span>
        )}
      </div>

      {url ? (
        <div className="photo-preview">
          <img src={url} alt="Captured written work" />
          <div className="photo-preview-actions">
            <button type="button" className="btn btn-sm" onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setCameraOpen(true)}>
              <Icon name="camera" size={13} /> Camera
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-empty">
          <span className="photo-empty-mark">
            <Icon name="camera" size={24} />
          </span>
          <p>Place the page in good light and capture all of the writing.</p>
          <div className="photo-empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <Icon name="camera" size={14} /> {busy ? "Saving…" : "Choose photo"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setCameraOpen(true)}
              disabled={busy}
            >
              Use camera
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? <p className="photo-error">{error}</p> : null}

      <Modal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Capture the written page"
        description="Keep the page flat, include the edges and avoid shadows."
        wide
        footer={
          <>
            <button type="button" className="btn" onClick={() => setCameraOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void capture()} disabled={busy}>
              <Icon name="camera" size={14} /> {busy ? "Saving…" : "Capture photo"}
            </button>
          </>
        }
      >
        <div className="camera-frame">
          <video ref={videoRef} playsInline muted autoPlay />
          {error ? <p className="photo-error">{error}</p> : null}
        </div>
      </Modal>
    </div>
  );
}
