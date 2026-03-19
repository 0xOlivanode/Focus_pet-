
import { usePrivy } from "@privy-io/react-auth";

export function DebugPrivy() {
  const privy = usePrivy();
  console.log("Privy Methods:", Object.keys(privy));
  return null;
}
