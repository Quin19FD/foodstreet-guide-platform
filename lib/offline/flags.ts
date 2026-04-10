const OFFLINE_OVERRIDE_KEY = "fs_offline_mode_override";

function parseFlag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

export function isOfflineModeEnabled(): boolean {
  const envEnabled = parseFlag(process.env.NEXT_PUBLIC_OFFLINE_MODE_ENABLED);

  if (typeof window === "undefined") {
    return envEnabled;
  }

  const override = window.localStorage.getItem(OFFLINE_OVERRIDE_KEY);
  if (override === "1") return true;
  if (override === "0") return false;

  return envEnabled;
}

export function setOfflineModeOverride(value: "1" | "0" | null): void {
  if (typeof window === "undefined") return;
  if (value == null) {
    window.localStorage.removeItem(OFFLINE_OVERRIDE_KEY);
    return;
  }
  window.localStorage.setItem(OFFLINE_OVERRIDE_KEY, value);
}
