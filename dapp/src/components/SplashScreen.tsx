"use client";

import { useEffect } from "react";

export function SplashScreenDismiss() {
  useEffect(() => {
    const el = document.getElementById("fp-splash");
    if (!el) return;
    // Fade out
    el.style.opacity = "0";
    const t = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(t);
  }, []);

  return null;
}
