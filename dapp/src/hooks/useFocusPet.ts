"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { useEffect } from "react";

// Replace with deployed address
const CONTRACT_ADDRESS = "0x256dFFF8e9B86eb652DE66a41e1f86C8da89668F";

export function useFocusPet() {
  const { address } = useAccount();
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
  const { data: petData, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "pets",
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
      args: [],
    });
  };

  const revivePet = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "revivePet",
      args: [],
    });
  };

  const recordSession = (minutes: number) => {
    // GoodDollar Engagement App Claim Args:
    const inviter = "0x0000000000000000000000000000000000000000"; // No inviter
    const validUntilBlock = BigInt(999999999999); // Future block
    const signature = "0x"; // Empty signature for now (assume subsequent claim or test)

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "focusSession",
      args: [
        BigInt(Math.max(1, Math.round(minutes))), // Ensure integer for 0.5 mins
        inviter,
        validUntilBlock,
        signature,
      ],
    });
  };

  // Helper to determine if user has a pet (birthTime > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const hasPet = pet && Number(pet[3]) > 0; // birthTime is index 3 in struct

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
    // Economy
    gBalance,
    approveG,
    refetchGBalance,
  };
}
