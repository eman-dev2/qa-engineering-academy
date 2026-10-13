/**
 * Fixed-window login throttle, in memory.
 * Limitation (documented in README): resets on restart and isn't shared across instances.
 * Replace with a shared store (e.g. a DB table or Redis) before running more than one instance.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

const failures = new Map<string, { count: number; windowStart: number }>();

export function isThrottled(key: string, now = Date.now()): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (now - entry.windowStart > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()) {
  const entry = failures.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    failures.set(key, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  failures.delete(key);
}
