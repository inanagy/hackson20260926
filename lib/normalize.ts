export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function std(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/** Scales values to 0..1 by the session maximum; all-zero input stays zero. */
export function byMax(xs: number[]) {
  const max = Math.max(0, ...xs);
  return xs.map((x) => (max > 0 ? x / max : 0));
}

/**
 * How unusually slow each response was relative to this user's own pace.
 * Uses log latency because reaction times are right-skewed; only slower than
 * typical counts, and 2 SD above the user's mean saturates at 1.
 */
export function hesitation(latenciesMs: number[]) {
  const logs = latenciesMs.map((ms) => Math.log(Math.max(ms, 100)));
  const m = mean(logs);
  const s = std(logs);
  if (s === 0) return logs.map(() => 0);
  return logs.map((l) => clamp01((l - m) / (2 * s)));
}

export const likert01 = (value: number) => clamp01(value / 4);
