"use client";

import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { IOSInstallPrompt } from "./IOSInstallPrompt";

const STAGES = [
  { emoji: "🥚", label: "Egg" },
  { emoji: "🐣", label: "Baby" },
  { emoji: "🦖", label: "Teen" },
  { emoji: "🐉", label: "Adult" },
  { emoji: "👑", label: "Elder" },
];

export function AppWelcome() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between py-6 px-5 sm:px-10 lg:px-[80px]">
        <div className="flex items-center gap-x-2">
          <img
            src="/focus-pet-logo.jpeg"
            alt="FocusPet"
            className="w-8 h-8 rounded-full shadow-sm"
          />
          <span className="text-xl font-anton uppercase">Focus Pet</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <div className="w-full max-w-sm">
          <h1 className="font-anton text-[56px]/[52px] sm:text-[64px]/[58px] uppercase mb-6">
            Welcome to FocusPet
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base mb-10 leading-relaxed">
            Raise a pet by doing the work. Every focus session earns XP and{" "}
            <strong className="text-white">G$</strong> on Celo.
          </p>

          <button
            onClick={() => login()}
            className="group inline-flex items-center overflow-hidden border border-neutral-700 w-fit cursor-pointer"
          >
            <span className="flex items-center justify-center px-[18px] h-12 sm:h-14 bg-[#EDEDED]">
              <ArrowRight
                size={20}
                className="text-black transition-transform duration-200 group-hover:translate-x-1"
              />
            </span>
            <span className="px-7 sm:px-10 h-12 sm:h-14 flex items-center bg-white text-black text-sm sm:text-lg tracking-tight">
              Sign In to Continue
            </span>
          </button>

          <p className="mt-4 text-xs text-neutral-500">
            Sign in with email or MiniPay
          </p>
        </div>
      </main>

      <IOSInstallPrompt />
    </div>
  );
}
