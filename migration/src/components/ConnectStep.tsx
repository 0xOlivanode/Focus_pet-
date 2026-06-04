"use client";

import { useState, useEffect, useRef } from "react";
import { useLoginWithEmail } from "@privy-io/react-auth";
import { useWeb3AuthConnect } from "@web3auth/modal/react";
import { WALLET_CONNECTORS } from "@web3auth/modal";

type AuthRoute = "privy" | "web3auth" | "new" | null;
type View = "email" | "otp";

export function ConnectStep() {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { connect, connectTo } = useWeb3AuthConnect();

  const [view, setView] = useState<View>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [authRoute, setAuthRoute] = useState<AuthRoute>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Debounced email → Supabase lookup
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

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [email]);

  useEffect(() => {
    if (view === "otp") setTimeout(() => otpInputRef.current?.focus(), 100);
  }, [view]);

  const canContinue =
    email.includes("@") && email.includes(".") &&
    authRoute !== null && !isChecking && !isConnecting;

  const statusHint =
    authRoute === "privy"   ? "We'll send you a sign-in code." :
    authRoute === "web3auth" ? "Welcome back — signing you in." :
    authRoute === "new"      ? "New here? Use your email to continue." : "";

  const handleContinue = async () => {
    if (!canContinue) return;
    setError("");
    setIsConnecting(true);
    try {
      if (authRoute === "privy") {
        await sendCode({ email });
        setView("otp");
      } else {
        await connectTo(WALLET_CONNECTORS.AUTH, {
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

  const handleOtp = async () => {
    if (!otp.trim() || isConnecting) return;
    setError("");
    setIsConnecting(true);
    try {
      await loginWithCode({ code: otp });
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? "";
      if (msg.includes("invalid") || msg.includes("expired") || msg.includes("incorrect")) {
        setError("Incorrect or expired code. Try again.");
      } else if (!msg.includes("rejected")) {
        setError("Something went wrong. Please try again.");
      }
      setOtp("");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWallet = async () => {
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

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="text-5xl">🐣</div>
      <div>
        <h1 className="text-2xl font-bold mb-2">FocusPet Migration</h1>
        <p className="text-neutral-400 text-sm max-w-xs">
          Move your pet, XP, streaks, and funds to your MiniPay address.
        </p>
      </div>

      <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left text-sm text-neutral-400 space-y-1.5">
        <p className="text-white font-medium text-xs uppercase tracking-widest mb-2">What gets migrated</p>
        <p>✓ Pet name, XP, health, streak</p>
        <p>✓ Cosmetics and inventory</p>
        <p>✓ USDT balance</p>
        <p>✓ G$ balance</p>
      </div>

      {view === "email" ? (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <div className="relative">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleContinue()}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 text-sm outline-none focus:border-neutral-600 transition-colors"
              autoComplete="email"
              inputMode="email"
            />
            {isChecking && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">…</span>
            )}
          </div>

          {statusHint && !isChecking && (
            <p className="text-xs text-neutral-500 text-left">{statusHint}</p>
          )}

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting
              ? authRoute === "privy" ? "Sending code…" : "Opening…"
              : "Continue"}
          </button>

          {error && <p className="text-red-400 text-xs text-left">{error}</p>}

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-600 text-xs">or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <button
            onClick={handleWallet}
            disabled={isWalletConnecting}
            className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isWalletConnecting ? "Connecting…" : "Connect a wallet"}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={() => { setView("email"); setOtp(""); setError(""); }}
            className="text-neutral-500 hover:text-white text-xs self-start transition-colors"
          >
            ← Back
          </button>

          <div>
            <p className="text-sm text-neutral-400 mb-1">We sent a code to</p>
            <p className="text-white text-sm font-medium">{email}</p>
          </div>

          <input
            ref={otpInputRef}
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && handleOtp()}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 outline-none focus:border-neutral-600 text-center tracking-[0.3em] text-lg font-mono transition-colors"
            autoComplete="one-time-code"
          />

          <button
            onClick={handleOtp}
            disabled={otp.length < 6 || isConnecting}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Signing in…" : "Confirm"}
          </button>

          {error && <p className="text-red-400 text-xs text-left">{error}</p>}

          <button
            onClick={async () => { setError(""); setOtp(""); await sendCode({ email }); }}
            className="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Didn&apos;t get it? Resend code
          </button>
        </div>
      )}
    </div>
  );
}
