"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { useEffect, useState } from "react";

// Replace with deployed address
const CONTRACT_ADDRESS = "0x9289F74f356271cEfe691c88963aC961C6efa422"; // Celo Mainnet

export function useFocusPet() {
  const { address } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | null
  >(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (writeError) {
      console.error("Minting Write Error:", writeError);
    }
    if (receiptError) {
      console.error("Minting Receipt Error:", receiptError);
    }
  }, [writeError, receiptError]);

  // Read Pet Data by Address
  const {
    data: petData,
    refetch,
    isLoading: isLoadingPet,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "pets",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 60000, // Background refetch every 60s
    },
  });

  // --- GoodDollar Integration ---
  const G_DOLLAR_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";
  const ERC20ABI = [
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const { data: gBalance, refetch: refetchGBalance } = useReadContract({
    address: G_DOLLAR_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: G_DOLLAR_ADDRESS,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const approveG = (amount: bigint) => {
    setLastAction("shop");
    writeContract({
      address: G_DOLLAR_ADDRESS,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const buyFood = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyFood",
      args: [],
    });
  };

  const revivePet = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "revivePet",
      args: [],
    });
  };

  const setNames = (username: string, petName: string) => {
    setLastAction("profile");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "setNames",
      args: [username, petName],
    });
  };

  const recordSession = async (minutes: number) => {
    setLastAction("focus");
    try {
      setIsSigning(true);
      // 1. Get Signature from Backend
      const response = await fetch("/api/sign-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          minutes,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to sign");

      const { signature, validUntilBlock, inviter } = data;

      // 2. Send Transaction
      writeContract(
        {
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          functionName: "focusSession",
          args: [
            BigInt(Math.max(1, Math.round(minutes))),
            inviter,
            BigInt(validUntilBlock),
            signature,
          ],
        },
        {
          onSuccess: () => {
            // Optimistic UI Update: Update local state immediately before chain syncs
            setXp((prev) => prev + minutes);
            setHealth((prev) => Math.min(100, prev + 5));
          },
          onSettled: () => setIsSigning(false), // Stop signing state when wallet opens/fails
        },
      );
    } catch (e) {
      console.error("Session Record Error:", e);
      alert("Failed to secure reward signature!");
      setIsSigning(false);
    }
  };

  // Helper to determine if user has a pet (birthTime > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const rawXp = pet ? Number(pet[0]) : 0;
  const rawHealth = pet ? Number(pet[1]) : 100;
  const lastInteraction = pet ? Number(pet[2]) : 0;
  const hasPet = pet && Number(pet[3]) > 0; // birthTime is index 3
  const username = pet ? (pet[4] as string) : "";
  const petName = pet ? (pet[5] as string) : "Unnamed Pet";

  // --- Virtual Health Decay (Real-time calculation) ---
  const [health, setHealth] = useState(rawHealth);
  const [xp, setXp] = useState(rawXp);

  useEffect(() => {
    setHealth(rawHealth);
    setXp(rawXp);

    if (hasPet && lastInteraction > 0 && rawHealth > 0) {
      const calculateVirtualHealth = () => {
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = now - lastInteraction;
        const daysPassed = timeDiff / (24 * 60 * 60);
        const healthLoss = Math.floor(daysPassed * 10); // DECAY_RATE_PER_DAY = 10

        if (healthLoss > 0) {
          const virtualHealth = Math.max(0, rawHealth - healthLoss);
          setHealth(virtualHealth);
        }
      };

      calculateVirtualHealth();
      // Tick every minute to update decay if needed
      const interval = setInterval(calculateVirtualHealth, 60000);
      return () => clearInterval(interval);
    }
  }, [rawHealth, rawXp, lastInteraction, hasPet]);

  return {
    petData,
    hasPet,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    writeError,
    receiptError,
    refetch,
    // Actions
    recordSession,
    buyFood,
    revivePet,
    setNames,
    // Economy
    gBalance,
    approveG,
    refetchGBalance,
    // UX
    isSigning,
    isProcessing: isSigning || isPending || isConfirming,
    isLoadingPet,
    xp,
    health,
    username,
    petName,
    lastAction,
    allowance: allowance ? (allowance as bigint) : BigInt(0),
    refetchAllowance,
  };
}
