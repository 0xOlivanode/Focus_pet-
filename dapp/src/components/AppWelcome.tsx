"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useLoginWithEmail } from "@privy-io/react-auth";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { IOSInstallPrompt } from "./IOSInstallPrompt";

type AuthRouteResult = "privy" | "web3auth" | "new" | null;
type View = "email" | "otp";

export function AppWelcome() {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { connect, connectTo } = useWeb3AuthConnect();

  const [view, setView] = useState<View>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [authRoute, setAuthRoute] = useState<AuthRouteResult>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Debounced email check: fires 600ms after user stops typing
  useEffect(() => {
    setAuthRoute(null);
    setError("");

    if (!email || !email.includes("@") || !email.includes(".")) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setAuthRoute(data.authType ?? "new");
      } catch {
        setAuthRoute("new");
      } finally {
        setIsChecking(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  // Auto-focus OTP input when view switches
  useEffect(() => {
    if (view === "otp") {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [view]);

  const handleEmailContinue = async () => {
    if (!canContinue) return;
    setError("");
    setIsConnecting(true);

    try {
      if (authRoute === "privy") {
        // Existing Privy user — send OTP inline, skip the Privy modal
        await sendCode({ email });
        setView("otp");
      } else {
        // New user or returning Web3Auth user — Web3Auth handles its own OTP UI
        // v10 API: authConnection + loginHint (loginProvider/extraLoginOptions are v9)
        await connectTo("auth", {
          authConnection: "email_passwordless",
          loginHint: email,
        });
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (!msg.includes("rejected") && !msg.includes("denied")) {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim() || isConnecting) return;
    setError("");
    setIsConnecting(true);

    try {
      await loginWithCode({ code: otp });
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (
        msg.includes("invalid") ||
        msg.includes("expired") ||
        msg.includes("incorrect")
      ) {
        setError("Incorrect or expired code. Try again.");
      } else if (!msg.includes("rejected")) {
        setError("Something went wrong. Please try again.");
      }
      setOtp("");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setOtp("");
    try {
      await sendCode({ email });
    } catch {
      setError("Failed to resend. Please try again.");
    }
  };

  const handleWalletConnect = async () => {
    if (isWalletConnecting) return;
    setError("");
    setIsWalletConnecting(true);
    try {
      await connect();
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (!msg.includes("rejected") && !msg.includes("denied")) {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsWalletConnecting(false);
    }
  };

  // authRoute must be resolved before allowing Continue — prevents Privy users
  // being accidentally routed to Web3Auth if they click within the 600ms debounce window
  const canContinue =
    email.includes("@") &&
    email.includes(".") &&
    authRoute !== null &&
    !isChecking &&
    !isConnecting;

  const statusHint =
    authRoute === "privy"
      ? "We'll send you a sign-in code."
      : authRoute === "web3auth"
        ? "Welcome back — signing you in."
        : authRoute === "new"
          ? "New here — we'll get you set up."
          : "";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between py-2 px-5 sm:px-10 lg:px-[80px]">
        <img
          src="/focus-pet-logo.svg"
          alt="FocusPet logo"
          className="w-[140px] lg:w-[200px]"
        />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <div className="w-full max-w-sm">
          {view === "email" ? (
            <>
              <h1 className="font-anton text-[56px]/[52px] sm:text-[64px]/[58px] uppercase mb-6">
                Welcome to FocusPet
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base mb-10 leading-relaxed">
                Raise a pet by doing the work. Every focus session earns XP and{" "}
                <strong className="text-white">G$</strong>.
              </p>

              {/* Email input + continue */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleEmailContinue()
                    }
                    className="w-full bg-[#111111] border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 text-sm outline-none focus:border-neutral-600 transition-colors pr-10"
                    autoComplete="email"
                    inputMode="email"
                  />
                  {isChecking && (
                    <Loader2
                      size={15}
                      className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-neutral-500"
                    />
                  )}
                </div>

                {statusHint && !isChecking && (
                  <p className="text-xs text-neutral-500 text-left">
                    {statusHint}
                  </p>
                )}

                <button
                  onClick={handleEmailContinue}
                  disabled={!canContinue}
                  className="group inline-flex items-center overflow-hidden border border-neutral-700 w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center px-[18px] h-12 sm:h-14 bg-[#EDEDED] shrink-0">
                    {isConnecting ? (
                      <Loader2 size={18} className="text-black animate-spin" />
                    ) : (
                      <ArrowRight
                        size={20}
                        className="text-black transition-transform duration-200 group-hover:translate-x-1"
                      />
                    )}
                  </span>
                  <span className="px-7 sm:px-10 h-12 sm:h-14 flex-1 flex items-center justify-center bg-white text-black text-sm sm:text-base tracking-tight font-medium">
                    {isConnecting ? "Sending code…" : "Continue"}
                  </span>
                </button>
              </div>

              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-neutral-600 text-xs">or</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {/* Wallet connect */}
              <button
                onClick={handleWalletConnect}
                disabled={isWalletConnecting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-neutral-800 bg-[#0a0a0a] hover:bg-[#111111] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isWalletConnecting ? (
                  <Loader2 size={16} className="animate-spin text-neutral-400" />
                ) : (
                  <Wallet size={16} className="text-neutral-400" />
                )}
                {isWalletConnecting ? "Connecting…" : "Connect a wallet"}
              </button>

              <p className="mt-4 text-xs text-neutral-600">
                Sign in with email or connect your wallet
              </p>
            </>
          ) : (
            <>
              {/* OTP view — Privy users only */}
              <button
                onClick={() => {
                  setView("email");
                  setOtp("");
                  setError("");
                }}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-white text-xs mb-8 transition-colors mx-auto"
              >
                <ArrowLeft size={13} />
                Back
              </button>

              <h1 className="font-anton text-[40px]/[44px] sm:text-[52px]/[52px] uppercase mb-4">
                Check your email
              </h1>
              <p className="text-neutral-400 text-sm mb-2 leading-relaxed">
                We sent a code to
              </p>
              <p className="text-white text-sm font-medium mb-10">{email}</p>

              <div className="flex flex-col gap-3 mb-4">
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleOtpSubmit()}
                  className="w-full bg-[#111111] border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 text-sm outline-none focus:border-neutral-600 transition-colors text-center tracking-[0.3em] text-lg font-mono"
                  autoComplete="one-time-code"
                />

                <button
                  onClick={handleOtpSubmit}
                  disabled={otp.length < 6 || isConnecting}
                  className="group inline-flex items-center overflow-hidden border border-neutral-700 w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center px-[18px] h-12 sm:h-14 bg-[#EDEDED] shrink-0">
                    {isConnecting ? (
                      <Loader2 size={18} className="text-black animate-spin" />
                    ) : (
                      <ArrowRight
                        size={20}
                        className="text-black transition-transform duration-200 group-hover:translate-x-1"
                      />
                    )}
                  </span>
                  <span className="px-7 sm:px-10 h-12 sm:h-14 flex-1 flex items-center justify-center bg-white text-black text-sm sm:text-base tracking-tight font-medium">
                    {isConnecting ? "Signing in…" : "Confirm"}
                  </span>
                </button>
              </div>

              {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

              <button
                onClick={handleResend}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Didn't get it? Resend code
              </button>
            </>
          )}
        </div>
      </main>

      <IOSInstallPrompt />
    </div>
  );
}
