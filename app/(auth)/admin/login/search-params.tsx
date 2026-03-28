"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useNextPath() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") ?? "/admin/dashboard", [searchParams]);
  return nextPath;
}
