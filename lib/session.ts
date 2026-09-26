"use client";

import { useSyncExternalStore } from "react";
import type { Analysis, ReflexResponse, Reflection } from "./schemas";

export type SessionData = {
  order: string[];
  reflex: ReflexResponse[];
  reflections: Record<string, Reflection>;
  analysis: Analysis | null;
};

const KEY = "saudade:v1";
const EVENT = "saudade:session";

export const emptySession = (): SessionData => ({
  order: [],
  reflex: [],
  reflections: {},
  analysis: null,
});

let cachedRaw: string | null = null;
let cached: SessionData = emptySession();

function read(): SessionData {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return cached;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? { ...emptySession(), ...JSON.parse(raw) } : emptySession();
    } catch {
      cached = emptySession();
    }
  }
  return cached;
}

export function writeSession(update: Partial<SessionData>) {
  const next = { ...read(), ...update };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    cached = next;
  }
  window.dispatchEvent(new Event(EVENT));
}

export function resetSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
  cached = emptySession();
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** null during SSR and the first client render, so pages can wait for storage. */
export function useSession(): SessionData | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
