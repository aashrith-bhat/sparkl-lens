import type { Item, Outcome } from "../types";

const KANNADA_RANGE = /[\u0C80-\u0CFF]/;

export function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

export function similarity(a: string, b: string): number {
  const left = normaliseText(a);
  const right = normaliseText(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;
  const longest = Math.max(left.length, right.length);
  return Math.max(0, 1 - levenshtein(left, right) / longest);
}

export interface ScoredToken {
  text: string;
  status: "matched" | "close" | "missing";
  heard?: string;
  score: number;
}

export interface TranscriptScore {
  match: number;
  matchedTokens: number;
  totalTokens: number;
  tokens: ScoredToken[];
  suggestion: Outcome | null;
  scriptMismatch: boolean;
}

export function scoreTranscript(expected: string, transcript: string): TranscriptScore {
  const expectedText = normaliseText(expected);
  const heardText = normaliseText(transcript);
  const expectedTokens = expectedText.split(" ").filter(Boolean);

  const scriptMismatch =
    KANNADA_RANGE.test(expectedText) && !KANNADA_RANGE.test(heardText) && heardText.length > 0;

  if (!heardText) {
    return {
      match: 0,
      matchedTokens: 0,
      totalTokens: expectedTokens.length,
      tokens: expectedTokens.map((text) => ({ text, status: "missing", score: 0 })),
      suggestion: null,
      scriptMismatch,
    };
  }

  const heardTokens = heardText.split(" ").filter(Boolean);
  const passage = expectedTokens.length > 2;

  if (expectedTokens.length === 1) {
    const score = similarity(expectedTokens[0], heardText);
    const status = score >= 0.8 ? "matched" : score >= 0.55 ? "close" : "missing";
    const suggestion: Outcome | null = scriptMismatch
      ? null
      : score >= 0.86
        ? "correct"
        : score >= 0.58
          ? "partial"
          : "incorrect";
    return {
      match: score,
      matchedTokens: status === "matched" ? 1 : 0,
      totalTokens: 1,
      tokens: [{ text: expectedTokens[0], status, heard: transcript.trim(), score }],
      suggestion,
      scriptMismatch,
    };
  }

  let total = 0;
  let matched = 0;
  const tokens: ScoredToken[] = expectedTokens.map((token) => {
    let best = 0;
    let bestHeard = "";
    for (const heard of heardTokens) {
      const score = similarity(token, heard);
      if (score > best) {
        best = score;
        bestHeard = heard;
      }
    }
    const status = best >= 0.84 ? "matched" : best >= 0.55 ? "close" : "missing";
    if (status === "matched") matched += 1;
    total += best >= 0.84 ? 1 : best >= 0.55 ? 0.55 : 0;
    return { text: token, status, heard: bestHeard || undefined, score: best };
  });

  const match = expectedTokens.length ? total / expectedTokens.length : 0;
  const suggestion: Outcome | null = scriptMismatch
    ? null
    : match >= (passage ? 0.76 : 0.82)
      ? "correct"
      : match >= 0.45
        ? "partial"
        : "incorrect";

  return { match, matchedTokens: matched, totalTokens: expectedTokens.length, tokens, suggestion, scriptMismatch };
}

export function scoreAnswer(item: Item, given: string): Outcome {
  const value = given.trim();
  if (!value) return "incorrect";
  const accepted = [item.answer, ...(item.accept ?? [])].filter(
    (candidate): candidate is string => Boolean(candidate),
  );
  const numericValue = Number(value.replace(/[,\s]/g, "").replace("−", "-"));
  for (const candidate of accepted) {
    const numericCandidate = Number(candidate.replace(/[,\s]/g, "").replace("−", "-"));
    if (Number.isFinite(numericValue) && Number.isFinite(numericCandidate)) {
      if (numericValue === numericCandidate) return "correct";
    } else if (similarity(value, candidate) >= 0.86) {
      return "correct";
    }
  }
  const close = accepted.some((candidate) => similarity(value, candidate) >= 0.6);
  return close ? "partial" : "incorrect";
}

export function rungScore(partialCredit: boolean, outcomes: Outcome[]): number {
  return outcomes.reduce((sum, outcome) => {
    if (outcome === "correct") return sum + 1;
    if (outcome === "partial" && partialCredit) return sum + 0.5;
    return sum;
  }, 0);
}

export function suggestionLabel(outcome: Outcome | null): string {
  if (!outcome) return "No machine suggestion";
  if (outcome === "correct") return "Sounds correct";
  if (outcome === "partial") return "Partly there";
  return "Not yet";
}
