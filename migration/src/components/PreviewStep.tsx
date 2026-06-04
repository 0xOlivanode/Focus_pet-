"use client";

import { useState, useEffect } from "react";
import { formatUnits, isAddress } from "viem";
import { publicClient } from "@/lib/chain";
import {
  FOCUSPET_ADDRESS, FOCUSPET_ABI,
  USDT_ADDRESS, GDOLLAR_ADDRESS, ERC20_ABI,
} from "@/config/contracts";

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
  onStart: (miniPayAddress: `0x${string}`, usdtBalance: bigint, gBalance: bigint, pet: PetData) => void;
}

export function PreviewStep({ address, onStart }: Props) {
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<PetData | null>(null);
  const [usdtBalance, setUsdtBalance] = useState(BigInt(0));
  const [gBalance, setGBalance] = useState(BigInt(0));
  const [miniPayAddress, setMiniPayAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [petResult, usdt, g] = await Promise.all([
          publicClient.readContract({ address: FOCUSPET_ADDRESS, abi: FOCUSPET_ABI, functionName: "pets", args: [address] }),
          publicClient.readContract({ address: USDT_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [address] }),
          publicClient.readContract({ address: GDOLLAR_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [address] }),
        ]);
        const p = petResult as any;
        setPet({
          petName: p[5] || "Unnamed Egg",
          username: p[4] || "",
          xp: BigInt(p[0]),
          health: BigInt(p[1]),
          streak: BigInt(p[6]),
          hasPet: BigInt(p[3]) > BigInt(0),
        });
        setUsdtBalance(usdt as bigint);
        setGBalance(g as bigint);
      } catch (e) {
        console.error("Failed to load wallet data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  function validate(val: string) {
    setMiniPayAddress(val);
    if (val && !isAddress(val)) setAddressError("Invalid address");
    else if (val.toLowerCase() === address.toLowerCase()) setAddressError("Cannot migrate to the same address");
    else setAddressError("");
  }

  const canProceed =
    isAddress(miniPayAddress) &&
    !addressError &&
    pet?.hasPet;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm">Loading wallet data…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-xs">
      <div>
        <h2 className="text-xl font-bold mb-1">Preview migration</h2>
        <p className="text-neutral-400 text-xs">From: {address.slice(0, 6)}…{address.slice(-4)}</p>
      </div>

      {/* Pet data */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2 text-sm">
        {pet?.hasPet ? (
          <>
            <div className="flex justify-between"><span className="text-neutral-400">Pet</span><span className="font-medium">{pet.petName}</span></div>
            {pet.username && <div className="flex justify-between"><span className="text-neutral-400">Username</span><span className="font-medium">@{pet.username}</span></div>}
            <div className="flex justify-between"><span className="text-neutral-400">XP</span><span>{Number(pet.xp).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Health</span><span>{Number(pet.health)}/100</span></div>
            <div className="flex justify-between"><span className="text-neutral-400">Streak</span><span>{Number(pet.streak)} days</span></div>
          </>
        ) : (
          <p className="text-yellow-500 text-xs">No pet found on this address.</p>
        )}
      </div>

      {/* Balances */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">USDT</span>
          <span>{usdtBalance > BigInt(0) ? `$${(Number(usdtBalance) / 1e6).toFixed(2)}` : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">G$</span>
          <span>{gBalance > BigInt(0) ? Number(formatUnits(gBalance, 18)).toFixed(2) : "—"}</span>
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="text-xs text-neutral-400 mb-1.5 block">Your MiniPay address</label>
        <input
          type="text"
          value={miniPayAddress}
          onChange={e => validate(e.target.value)}
          placeholder="0x…"
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-white transition-colors"
        />
        {addressError && <p className="text-red-400 text-xs mt-1">{addressError}</p>}
        {!pet?.hasPet && (
          <p className="text-yellow-500 text-xs mt-1">Pet migration will be skipped — no pet on this address.</p>
        )}
      </div>

      <button
        disabled={!canProceed && !(isAddress(miniPayAddress) && !addressError && (usdtBalance > BigInt(0) || gBalance > BigInt(0)))}
        onClick={() => onStart(miniPayAddress as `0x${string}`, usdtBalance, gBalance, pet!)}
        className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start migration
      </button>
    </div>
  );
}
