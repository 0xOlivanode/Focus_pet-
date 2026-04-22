import { useState, useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { CONTRACT_ADDRESS } from "@/config/contracts";
import { isPetNameFreeOnSubgraph } from "@/lib/subgraph";

/**
 * Checks name availability on-demand (triggered by user input, not on mount).
 *
 * Username  — authoritative: reads usernameToAddress() on-chain (single eth_call).
 *             The contract enforces uniqueness, so this is always correct.
 *
 * Pet name  — best-effort: queries the subgraph. Not enforced on-chain, so
 *             this is a UX hint rather than a hard constraint.
 *
 * Both checks are debounced at 400 ms to avoid hammering RPC / subgraph
 * on every keystroke.
 */
export function useNameAvailability(
  initialUsername?: string,
  initialPetName?: string,
) {
  const publicClient = usePublicClient();

  const [usernameAvailable, setUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [petNameAvailable, setPetNameAvailable] = useState<boolean | null>(
    null,
  );
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingPetName, setIsCheckingPetName] = useState(false);

  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const petNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Username ──────────────────────────────────────────────────────────────

  const checkUsername = useCallback(
    (username: string) => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);

      // Empty — reset state
      if (!username.trim()) {
        setUsernameAvailable(null);
        return;
      }

      // Same as current — always available (user hasn't changed it)
      if (
        initialUsername &&
        username.toLowerCase() === initialUsername.toLowerCase()
      ) {
        setUsernameAvailable(true);
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(true);

      usernameTimer.current = setTimeout(async () => {
        try {
          if (!publicClient) {
            setUsernameAvailable(null);
            return;
          }

          // Contract enforces uniqueness via usernameToAddress mapping.
          // A zero address means the username is unclaimed.
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: FocusPetABI,
            functionName: "usernameToAddress",
            args: [username],
          });

          const isFree =
            !owner ||
            owner === "0x0000000000000000000000000000000000000000";
          setUsernameAvailable(isFree);
        } catch {
          // If the check fails, optimistically allow the user to proceed —
          // the contract will reject a duplicate on-chain anyway.
          setUsernameAvailable(true);
        } finally {
          setIsCheckingUsername(false);
        }
      }, 400);
    },
    [publicClient, initialUsername],
  );

  // ─── Pet Name ──────────────────────────────────────────────────────────────

  const checkPetName = useCallback(
    (petName: string) => {
      if (petNameTimer.current) clearTimeout(petNameTimer.current);

      if (!petName.trim()) {
        setPetNameAvailable(null);
        return;
      }

      if (
        initialPetName &&
        petName.toLowerCase() === initialPetName.toLowerCase()
      ) {
        setPetNameAvailable(true);
        setIsCheckingPetName(false);
        return;
      }

      setIsCheckingPetName(true);

      petNameTimer.current = setTimeout(async () => {
        try {
          const isFree = await isPetNameFreeOnSubgraph(petName);
          setPetNameAvailable(isFree);
        } catch {
          setPetNameAvailable(true);
        } finally {
          setIsCheckingPetName(false);
        }
      }, 400);
    },
    [initialPetName],
  );

  // ─── Sync helpers (for consumers that need a boolean answer now) ───────────

  const isUsernameAvailable = useCallback(
    (username: string): boolean => {
      if (!username.trim()) return true;
      if (
        initialUsername &&
        username.toLowerCase() === initialUsername.toLowerCase()
      )
        return true;
      // Return the last known check result while async check runs
      return usernameAvailable !== false;
    },
    [usernameAvailable, initialUsername],
  );

  const isPetNameAvailable = useCallback(
    (petName: string): boolean => {
      if (!petName.trim()) return true;
      if (
        initialPetName &&
        petName.toLowerCase() === initialPetName.toLowerCase()
      )
        return true;
      return petNameAvailable !== false;
    },
    [petNameAvailable, initialPetName],
  );

  return {
    // Trigger checks imperatively (call on input onChange)
    checkUsername,
    checkPetName,
    // Availability state
    usernameAvailable,
    petNameAvailable,
    // Loading indicators for UI spinners
    isCheckingUsername,
    isCheckingPetName,
    // Legacy sync API — safe to keep for existing consumers
    isUsernameAvailable,
    isPetNameAvailable,
    isLoadingAvailability: isCheckingUsername || isCheckingPetName,
  };
}
