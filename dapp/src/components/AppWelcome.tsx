"use client";

import { Loader2 } from "lucide-react";

export function AppWelcome() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 size={24} className="text-white animate-spin" />
    </div>
  );
}
