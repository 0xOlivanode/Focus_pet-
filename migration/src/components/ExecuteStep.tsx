"use client";

import { useState } from "react";
import { encodeFunctionData, formatUnits } from "viem";
import { walletClientFromProvider } from "@/lib/chain";
import {
  FOCUSPET_ADDRESS, FOCUSPET_ABI,
  USDT_ADDRESS, GDOLLAR_ADDRESS, ERC20_ABI,
} from "@/config/contracts";

type TxStatus = "pending" | "success" | "skipped" | "error" | "idle";

interface Step {
  label: string;
  status: TxStatus;
  hash?: string;
  error?: string;
}

interface PetData {
  petName: string;
  username: string;
  xp: bigint;
  health: bigint;
  streak: bigint;
  hasPet: boolean;
}

interface Props {
  address: `0x${string}`;
  miniPayAddress: `0x${string}`;
  usdtBalance: bigint;
  gBalance: bigint;
  pet: PetData;
  getProvider: () => Promise<any>;
}

export function ExecuteStep({ address, miniPayAddress, usdtBalance, gBalance, pet, getProvider }: Props) {
  const [steps, setSteps] = useState<Step[]>([
    { label: "Migrate pet data",    status: pet.hasPet ? "idle" : "skipped" },
    { label: "Transfer USDT",       status: usdtBalance > BigInt(0) ? "idle" : "skipped" },
    { label: "Transfer G$",         status: gBalance > BigInt(0) ? "idle" : "skipped" },
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function setStep(i: number, update: Partial<Step>) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...update } : s));
  }

  async function run() {
    setRunning(true);
    const provider = await getProvider();
    const wc = walletClientFromProvider(provider, address);

    // Step 0: migrate pet
    if (pet.hasPet) {
      setStep(0, { status: "pending" });
      try {
        const data = encodeFunctionData({ abi: FOCUSPET_ABI, functionName: "migratePet", args: [miniPayAddress] });
        const hash = await wc.sendTransaction({ to: FOCUSPET_ADDRESS, data, gas: BigInt(300_000) });
        setStep(0, { status: "success", hash });
      } catch (e: any) {
        setStep(0, { status: "error", error: e?.shortMessage ?? e?.message ?? "Failed" });
        setRunning(false);
        return;
      }
    }

    // Step 1: transfer USDT
    if (usdtBalance > BigInt(0)) {
      setStep(1, { status: "pending" });
      try {
        const data = encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [miniPayAddress, usdtBalance] });
        const hash = await wc.sendTransaction({ to: USDT_ADDRESS, data, gas: BigInt(100_000) });
        setStep(1, { status: "success", hash });
      } catch (e: any) {
        setStep(1, { status: "error", error: e?.shortMessage ?? e?.message ?? "Failed" });
        setRunning(false);
        return;
      }
    }

    // Step 2: transfer G$
    if (gBalance > BigInt(0)) {
      setStep(2, { status: "pending" });
      try {
        const data = encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [miniPayAddress, gBalance] });
        const hash = await wc.sendTransaction({ to: GDOLLAR_ADDRESS, data, gas: BigInt(100_000) });
        setStep(2, { status: "success", hash });
      } catch (e: any) {
        setStep(2, { status: "error", error: e?.shortMessage ?? e?.message ?? "Failed" });
        setRunning(false);
        return;
      }
    }

    setRunning(false);
    setDone(true);
  }

  function statusIcon(s: TxStatus) {
    if (s === "idle")    return <div className="w-5 h-5 rounded-full border border-neutral-600" />;
    if (s === "pending") return <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />;
    if (s === "success") return <span className="text-green-400">✓</span>;
    if (s === "skipped") return <span className="text-neutral-500">—</span>;
    if (s === "error")   return <span className="text-red-400">✗</span>;
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold">Migration complete!</h2>
        <p className="text-neutral-400 text-sm max-w-xs">
          Open MiniPay and load FocusPet — your pet and funds are waiting at<br />
          <span className="font-mono text-xs text-white">{miniPayAddress.slice(0,8)}…{miniPayAddress.slice(-6)}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-xs">
      <div>
        <h2 className="text-xl font-bold mb-1">Migrate to MiniPay</h2>
        <p className="text-neutral-400 text-xs font-mono">→ {miniPayAddress.slice(0,8)}…{miniPayAddress.slice(-6)}</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl divide-y divide-neutral-800">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-5 flex items-center justify-center shrink-0">
              {statusIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.status === "skipped" ? "text-neutral-500" : "text-white"}`}>
                {step.label}
              </p>
              {step.hash && (
                <a
                  href={`https://celoscan.io/tx/${step.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline font-mono"
                >
                  {step.hash.slice(0, 10)}…
                </a>
              )}
              {step.error && <p className="text-xs text-red-400 truncate">{step.error}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {steps.some(s => s.status === "error") && (
        <p className="text-red-400 text-xs text-center">
          A step failed. Check the error and try again — completed steps won&apos;t repeat.
        </p>
      )}

      <button
        onClick={run}
        disabled={running || steps.every(s => s.status === "success" || s.status === "skipped")}
        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {running ? "Signing transactions…" : steps.some(s => s.status === "error") ? "Retry" : "Run migration"}
      </button>
    </div>
  );
}
