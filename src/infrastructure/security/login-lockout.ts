/**
 * Login lockout (rate limit) theo email:
 * - Sai >= 3 lần trong 1 phút => khóa 1 phút.
 *
 * Ghi chú: Đây là in-memory store (phù hợp dev / single instance).
 * Production nên dùng Redis hoặc DB table để không bị mất state khi restart.
 */

type LockoutEntry = {
  firstFailedAtMs: number;
  failedCount: number;
  lockedUntilMs?: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __authLockoutStore: Map<string, LockoutEntry> | undefined;
}

const WINDOW_MS = 60_000;
const LOCK_MS = 60_000;
const MAX_FAILS = 3;

const store = globalThis.__authLockoutStore ?? new Map<string, LockoutEntry>();

if (process.env.NODE_ENV !== "production") {
  globalThis.__authLockoutStore = store;
}

export type LockoutStatus =
  | { isLocked: false; remainingSeconds: 0 }
  | { isLocked: true; remainingSeconds: number };

/**
 * Kiểm tra xem email đang bị khóa đăng nhập hay không.
 *
 * Input:
 * - email: string
 *
 * Output:
 * - LockoutStatus
 */
export function getLockoutStatus(email: string, now = new Date()): LockoutStatus {
  const key = email.trim().toLowerCase();
  const entry = store.get(key);
  if (!entry?.lockedUntilMs) return { isLocked: false, remainingSeconds: 0 };

  const remainingMs = entry.lockedUntilMs - now.getTime();
  if (remainingMs <= 0) {
    store.delete(key);
    return { isLocked: false, remainingSeconds: 0 };
  }

  return { isLocked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
}

/**
 * Ghi nhận 1 lần login sai.
 *
 * Input:
 * - email: string
 *
 * Output:
 * - LockoutStatus sau khi ghi nhận
 */
export function recordFailedAttempt(email: string, now = new Date()): LockoutStatus {
  const key = email.trim().toLowerCase();
  const nowMs = now.getTime();

  const current = store.get(key);
  if (!current) {
    store.set(key, { firstFailedAtMs: nowMs, failedCount: 1 });
    return { isLocked: false, remainingSeconds: 0 };
  }

  if (current.lockedUntilMs && current.lockedUntilMs > nowMs) {
    return { isLocked: true, remainingSeconds: Math.ceil((current.lockedUntilMs - nowMs) / 1000) };
  }

  const inWindow = nowMs - current.firstFailedAtMs <= WINDOW_MS;
  const failedCount = inWindow ? current.failedCount + 1 : 1;
  const firstFailedAtMs = inWindow ? current.firstFailedAtMs : nowMs;

  if (failedCount >= MAX_FAILS) {
    const lockedUntilMs = nowMs + LOCK_MS;
    store.set(key, { firstFailedAtMs, failedCount, lockedUntilMs });
    return { isLocked: true, remainingSeconds: Math.ceil(LOCK_MS / 1000) };
  }

  store.set(key, { firstFailedAtMs, failedCount });
  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * Reset trạng thái lockout (khi login thành công).
 *
 * Input:
 * - email: string
 *
 * Output: void
 */
export function resetLockout(email: string): void {
  store.delete(email.trim().toLowerCase());
}
