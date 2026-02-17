"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { useState, useEffect } from "react";

// Replace with deployed address
// For demo, we can use a placeholder or deploy to Alfajores
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useFocusPet() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Read Pet Data (Token ID 0 for demo if owned)
  // In real app, query tokenOfOwnerByIndex or similar
  const { data: petData, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "getPet",
    args: [BigInt(0)],
    query: {
      enabled: !!address,
    },
  });

  // Read Balance to check if user owns a pet
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
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
  ];

  const { data: gBalance, refetch: refetchGBalance } = useReadContract({
    address: G_DOLLAR_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const approveG = (amount: bigint) => {
    writeContract({
      address: G_DOLLAR_ADDRESS,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const buyFood = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyFood",
      args: [BigInt(0)], // Hardcoded Token ID 0
    });
  };

  const revivePet = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "revivePet",
      args: [BigInt(0)], // Hardcoded Token ID 0
    });
  };

  const mintPet = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "mint",
      args: [],
    });
  };

  const recordSession = (minutes: number) => {
    // Hardcoded Token ID 0 for MVP
    // GoodDollar Engagement App Claim Args:
    const inviter = "0x0000000000000000000000000000000000000000"; // No inviter
    const validUntilBlock = BigInt(999999999999); // Future block
    const signature = "0x"; // Empty signature for now (assume subsequent claim or test)

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "focusSession",
      args: [BigInt(0), BigInt(minutes), inviter, validUntilBlock, signature],
    });
  };

  return {
    petData,
    hasPet: balance ? Number(balance) > 0 : false,
    mintPet,
    recordSession,
    // Economy Exports
    gBalance,
    approveG,
    buyFood,
    revivePet,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    refetch,
    refetchBalance,
    refetchGBalance,
  };
}
