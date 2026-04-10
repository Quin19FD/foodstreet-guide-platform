"use client";

import { useLiteMode } from "@/lib/hooks/use-lite-mode";

export function CustomerLiteShell({ children }: { children: React.ReactNode }) {
  const { liteMode } = useLiteMode();

  return <div className={liteMode ? "customer-lite" : undefined}>{children}</div>;
}
