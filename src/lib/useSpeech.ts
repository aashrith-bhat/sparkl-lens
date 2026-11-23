import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
  length: number;
}

interface RecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: RecognitionResult;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate =
    (window as unknown as { SpeechRecognition?: RecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
  return candidate ?? null;
}

export function speechRecognitionSupported(): boolean {
  return Boolean(getConstructor());
}

function errorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was blocked. Allow it in the browser, then try again.";
    case "no-speech":
      return "No speech was heard. Try again, a little closer to the microphone.";
    case "audio-capture":
      return "No microphone was found on this device.";
    case "network":
      return "The browser's speech service needs a connection. Manual marking still works.";
    case "language-not-supported":
      return "This browser does not support recognition for this language.";
    case "aborted":
      return "Recording was stopped.";
    default:
      return "Speech capture stopped. Manual marking still works.";
  }
}

export function useSpeechRecognition(language: "en-IN" | "kn-IN") {
  const [supported] = useState(() => speechRecognitionSupported());
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterim("");
    setError(null);
  }, []);

  const start = useCallback(() => {
    const Constructor = getConstructor();
    if (!Constructor) {
      setError("This browser does not expose speech recognition. Use manual marking.");
      return;
    }
    recognitionRef.current?.abort();
    setFinalText("");
    setInterim("");
    setError(null);
    const recognition = new Constructor();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let final = "";
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) final += ` ${transcript}`;
        else pending += ` ${transcript}`;
      }
      if (final.trim()) {
        setFinalText((current) => `${current} ${final}`.replace(/\s+/g, " ").trim());
      }
      setInterim(pending.trim());
    };
    recognition.onerror = (event) => {
      setError(errorMessage(event.error));
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Speech capture could not start. Manual marking still works.");
      setListening(false);
    }
  }, [language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    reset();
    if (listening) {
      recognitionRef.current?.abort();
      setListening(false);
    }
    // A language change starts a fresh capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return { supported, listening, finalText, interim, error, start, stop, reset };
}

export function useMicLevel(active: boolean): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0.12));

  useEffect(() => {
    if (!active) {
      setLevels(Array(28).fill(0.12));
      return;
    }
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let cancelled = false;
    let lastUpdate = 0;

    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const draw = (time: number) => {
          if (cancelled) return;
          frame = requestAnimationFrame(draw);
          if (time - lastUpdate < 60) return;
          lastUpdate = time;
          analyser.getByteFrequencyData(data);
          const bars = Array.from({ length: 28 }, (_, index) => {
            const from = Math.floor((index / 28) * data.length * 0.7);
            const to = Math.max(from + 1, Math.floor(((index + 1) / 28) * data.length * 0.7));
            let sum = 0;
            for (let i = from; i < to; i += 1) sum += data[i];
            const average = sum / (to - from) / 255;
            return Math.min(1, Math.max(0.08, average * 2.4));
          });
          setLevels(bars);
        };
        frame = requestAnimationFrame(draw);
      } catch {
        // The levels are decoration; speech recognition can continue without them.
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void context?.close();
      setLevels(Array(28).fill(0.12));
    };
  }, [active]);

  return levels;
}

export function speakText(text: string, language: "en-IN" | "kn-IN"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = language === "kn-IN" ? 0.86 : 0.92;
  const voices = synth.getVoices();
  const match = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase());
  if (language === "kn-IN" && !match) return false;
  if (match) utterance.voice = match;
  synth.cancel();
  synth.speak(utterance);
  return true;
}

export function hasVoiceFor(language: "en-IN" | "kn-IN"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  if (language === "en-IN") {
    return voices.some((voice) => voice.lang.toLowerCase().startsWith("en"));
  }
  return voices.some((voice) => voice.lang.toLowerCase().startsWith("kn"));
}
