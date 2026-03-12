import { useState, useEffect, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { CONTRACT_ADDRESS, DEPLOYMENT_BLOCK } from "@/config/contracts";

export function useNameAvailability(
  initialUsername?: string,
  initialPetName?: string,
) {
  const publicClient = usePublicClient();
  const [takenUsernames, setTakenUsernames] = useState<Set<string>>(new Set());
  const [takenPetNames, setTakenPetNames] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNames = async () => {
      if (!publicClient) return;

      try {
        setIsLoading(true);
        const nameLogs = await publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          eventName: "NamesUpdated",
          fromBlock: DEPLOYMENT_BLOCK,
        });

        const users = new Set<string>();
        const pets = new Set<string>();

        for (const log of nameLogs) {
          const { username, petName } = log.args;
          if (username) users.add(username.toLowerCase());
          if (petName) pets.add(petName.toLowerCase());
        }

        setTakenUsernames(users);
        setTakenPetNames(pets);
      } catch (error) {
        console.error("Failed to fetch name availability logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNames();
  }, [publicClient]);

  const checkUsername = (username: string) => {
    if (!username || username.trim() === "") return true; // Empty string is functionally "available" until they type
    if (
      initialUsername &&
      username.toLowerCase() === initialUsername.toLowerCase()
    )
      return true; // Bypass if unchanged
    return !takenUsernames.has(username.toLowerCase());
  };

  const checkPetName = (petName: string) => {
    if (!petName || petName.trim() === "") return true;
    if (
      initialPetName &&
      petName.toLowerCase() === initialPetName.toLowerCase()
    )
      return true; // Bypass if unchanged
    return !takenPetNames.has(petName.toLowerCase());
  };

  return {
    isUsernameAvailable: checkUsername,
    isPetNameAvailable: checkPetName,
    isLoadingAvailability: isLoading,
  };
}
