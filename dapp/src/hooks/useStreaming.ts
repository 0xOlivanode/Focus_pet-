"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import {
  G_DOLLAR_CELO,
  SUPERFLUID_FORWARDER_CELO,
  CFAv1ForwarderAbi,
  calculateFlowRate,
} from "@/lib/superfluid";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { getAddress } from "viem";

import { CONTRACT_ADDRESS } from "@/config/contracts";

const TRUST_FUND_ADDRESS = CONTRACT_ADDRESS;

export function useStreaming() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Fetch current flow info
  const { data: flowData, refetch: refetchFlow } = useReadContract({
    address: SUPERFLUID_FORWARDER_CELO,
    abi: CFAv1ForwarderAbi,
    functionName: "getFlowInfo",
    args: address ? [G_DOLLAR_CELO, address, TRUST_FUND_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Poll every 10s for updates
    },
  });

  const flowRate = useMemo(() => {
    if (!flowData) return BigInt(0);
    // flowData returns [lastUpdated, flowrate, deposit, owedDeposit]
    return flowData[1];
  }, [flowData]);

  const isStreaming = flowRate > BigInt(0);

  const startSupercharge = async (amountPerMonthG$: bigint) => {
    if (!address) return;

    try {
      const rate = calculateFlowRate(amountPerMonthG$);

      const promise = writeContractAsync({
        address: SUPERFLUID_FORWARDER_CELO,
        abi: CFAv1ForwarderAbi,
        functionName: "createFlow",
        args: [
          G_DOLLAR_CELO,
          address,
          TRUST_FUND_ADDRESS,
          BigInt(rate.toString()) as any, // int96 as bigint
          "0x",
        ],
      });

      toast.promise(promise, {
        loading: "Initiating G$ Stream...",
        success: "Supercharged Happiness Activated! ⚡️🦖",
        error: (err) => {
          if (err.message.includes("User rejected"))
            return "Request cancelled by user.";
          return "Failed to start supercharge. Please try again.";
        },
      });

      await promise;
      await refetchFlow();
    } catch (error) {
      // Error handled by toast.promise
    }
  };

  const stopSupercharge = async () => {
    if (!address) return;

    try {
      const promise = writeContractAsync({
        address: SUPERFLUID_FORWARDER_CELO,
        abi: CFAv1ForwarderAbi,
        functionName: "deleteFlow",
        args: [G_DOLLAR_CELO, address, TRUST_FUND_ADDRESS, "0x"],
      });

      toast.promise(promise, {
        loading: "Stopping G$ Stream...",
        success: "Stream stopped. Pet happiness will return to normal.",
        error: (err) => {
          if (err.message.includes("User rejected"))
            return "Request cancelled by user.";
          return "Failed to stop stream. Please try again.";
        },
      });

      await promise;
      await refetchFlow();
    } catch (error) {
      console.error("Failed to stop stream:", error);
    }
  };

  return {
    isStreaming,
    flowRate,
    startSupercharge,
    stopSupercharge,
    refetchFlow,
    trustFundAddress: TRUST_FUND_ADDRESS,
  };
}
