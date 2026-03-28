type Entry = {
  windowStartMs: number;
  count: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __passwordResetOtpSendStore: Map<string, Entry> | undefined;
}

const WINDOW_MS = 2 * 60_000;
const MAX_PER_WINDOW = 3;

const store = globalThis.__passwordResetOtpSendStore ?? new Map<string, Entry>();
if (process.env.NODE_ENV !== "production") {
  globalThis.__passwordResetOtpSendStore = store;
}

export type OtpSendLimitStatus =
  | { ok: true }
  | {
      ok: false;
      retryAfterSeconds: number;
    };

export function checkAndRecordOtpSend(email: string, now = new Date()): OtpSendLimitStatus {
  const key = email.trim().toLowerCase();
  const nowMs = now.getTime();

  const current = store.get(key);
  if (!current) {
    store.set(key, { windowStartMs: nowMs, count: 1 });
    return { ok: true };
  }

  const inWindow = nowMs - current.windowStartMs <= WINDOW_MS;
  const count = inWindow ? current.count + 1 : 1;
  const windowStartMs = inWindow ? current.windowStartMs : nowMs;

  store.set(key, { windowStartMs, count });
  if (count > MAX_PER_WINDOW) {
    const retryAfterMs = WINDOW_MS - (nowMs - windowStartMs);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  return { ok: true };
}
