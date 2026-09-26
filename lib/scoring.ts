import { byMax, clamp01, hesitation, likert01 } from "./normalize";
import type { LatentState, ReflexResponse, Reflection } from "./schemas";

const WEIGHTS = {
  choice: 0.4,
  dwell: 0.2,
  revisit: 0.15,
  replay: 0.15,
  hesitation: 0.1,
} as const;

const HIGH = 0.5;

/**
 * Implicit response I(x) in 0..1 for every reflex response, keyed by stimulus.
 * Signals nobody produced this session (e.g. replay with image-only stimuli)
 * are dropped and the remaining weights renormalized, so an absent feature
 * does not cap every score below 1.
 */
export function calculateImplicitResponse(responses: ReflexResponse[]) {
  const choice = responses.map((r) => (r.choice === "attracted" ? 1 : 0));
  const dwell = byMax(responses.map((r) => r.dwellMs));
  const revisit = byMax(responses.map((r) => r.revisitCount));
  const replay = byMax(responses.map((r) => r.replayCount));
  const hes = hesitation(responses.map((r) => r.latencyMs));

  const features = [
    { w: WEIGHTS.choice, v: choice },
    { w: WEIGHTS.dwell, v: dwell },
    { w: WEIGHTS.revisit, v: revisit },
    { w: WEIGHTS.replay, v: replay },
    { w: WEIGHTS.hesitation, v: hes },
  ].filter((f, i) => i === 0 || f.v.some((x) => x > 0));

  const total = features.reduce((s, f) => s + f.w, 0);
  const scores = new Map<string, number>();
  responses.forEach((r, i) => {
    const raw = features.reduce((s, f) => s + f.w * f.v[i], 0);
    scores.set(r.stimulusId, clamp01(raw / total));
  });
  return scores;
}

export function calculateAbsence(currentPresence: number) {
  return 1 - likert01(currentPresence);
}

export function calculateLatentGap(implicit: number, explicitPreference: number) {
  return implicit - likert01(explicitPreference);
}

export function calculateSaudadeScore(
  past: number,
  absence: number,
  implicit: number,
  gap: number,
) {
  return clamp01(past * absence * (0.7 * implicit + 0.3 * Math.max(0, gap)));
}

export function classifyLatentState(
  past: number,
  current: number,
  implicit: number,
): LatentState | null {
  const implicitHigh = implicit >= HIGH;
  const pastHigh = past >= HIGH;
  const absenceHigh = 1 - current >= HIGH;
  if (current >= HIGH && implicitHigh) return "active";
  if (pastHigh && absenceHigh && implicitHigh) return "dormant";
  if (pastHigh && absenceHigh && !implicitHigh) return "past_only";
  if (!pastHigh && implicitHigh) return "emerging";
  return null;
}

export type ScoredItem = {
  stimulusId: string;
  pastValue: number;
  currentPresence: number;
  implicitResponse: number;
  explicitPreference: number;
  absence: number;
  latentGap: number;
  saudadeScore: number;
  state: LatentState | null;
  reflection: string;
};

export function scoreReflection(r: Reflection, implicit: number): ScoredItem {
  const past = likert01(r.pastValue);
  const current = likert01(r.currentPresence);
  const absence = calculateAbsence(r.currentPresence);
  const gap = calculateLatentGap(implicit, r.explicitPreference);
  return {
    stimulusId: r.stimulusId,
    pastValue: past,
    currentPresence: current,
    implicitResponse: implicit,
    explicitPreference: likert01(r.explicitPreference),
    absence,
    latentGap: gap,
    saudadeScore: calculateSaudadeScore(past, absence, implicit, gap),
    state: classifyLatentState(past, current, implicit),
    reflection: r.reflection,
  };
}

/**
 * Stimuli revisited in Phase 2: the strongest implicit responses, plus the
 * skipped ones answered with the most hesitation, so the set can also surface
 * things that became truly past rather than only what attracted the user.
 */
export function selectForReflection(
  responses: ReflexResponse[],
  implicit: Map<string, number>,
  top = 3,
  conflicted = 1,
) {
  const byImplicit = [...responses].sort(
    (a, b) => (implicit.get(b.stimulusId) ?? 0) - (implicit.get(a.stimulusId) ?? 0),
  );
  const chosen = byImplicit.slice(0, top).map((r) => r.stimulusId);
  const hesValues = hesitation(responses.map((r) => r.latencyMs));
  const hes = new Map(responses.map((r, i) => [r.stimulusId, hesValues[i]]));
  const extra = responses
    .filter((r) => r.choice === "skip" && !chosen.includes(r.stimulusId))
    .sort((a, b) => (hes.get(b.stimulusId) ?? 0) - (hes.get(a.stimulusId) ?? 0))
    .slice(0, conflicted)
    .map((r) => r.stimulusId);
  return [...chosen, ...extra];
}
