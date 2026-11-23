import { useEffect, useState } from "react";

export interface RouteState {
  path: string;
  query: URLSearchParams;
  hash: string;
}

function readHash(): string {
  const raw = window.location.hash.replace(/^#/, "");
  return raw || "/overview";
}

function parse(hash: string): RouteState {
  const [pathPart, queryPart = ""] = hash.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return { path, query: new URLSearchParams(queryPart), hash };
}

export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = `#${to.startsWith("/") ? to : `/${to}`}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  if (options.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function useHashRoute(): RouteState & {
  segments: string[];
  navigate: (to: string, options?: { replace?: boolean }) => void;
} {
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const onChange = () => setHash(readHash());
    window.addEventListener("hashchange", onChange);
    if (!window.location.hash) window.history.replaceState(null, "", "#/overview");
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const parsed = parse(hash);
  return {
    ...parsed,
    segments: parsed.path.split("/").filter(Boolean),
    navigate,
  };
}

export function setQueryValue(key: string, value: string): void {
  const current = parse(readHash());
  const query = new URLSearchParams(current.query);
  if (value) query.set(key, value);
  else query.delete(key);
  const suffix = query.toString();
  navigate(`${current.path}${suffix ? `?${suffix}` : ""}`, { replace: true });
}
