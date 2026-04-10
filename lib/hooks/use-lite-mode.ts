"use client";

import { useEffect, useState } from "react";

const LITE_MODE_KEY = "customer_lite_mode";

export function useLiteMode() {
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    setLiteMode(window.localStorage.getItem(LITE_MODE_KEY) === "1");
  }, []);

  const updateLiteMode = (next: boolean) => {
    setLiteMode(next);
    window.localStorage.setItem(LITE_MODE_KEY, next ? "1" : "0");
  };

  return { liteMode, setLiteMode: updateLiteMode };
}
