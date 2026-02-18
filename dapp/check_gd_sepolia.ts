import { createPublicClient, http } from "viem";
import { celoSepolia } from "viem/chains";

const client = createPublicClient({
  chain: celoSepolia,
  transport: http(),
});

async function check() {
  const gdAddress = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"; // Address from useFocusPet.ts (Likely Alfajores)
  console.log(`Checking GoodDollar at ${gdAddress} on Celo Sepolia...`);

  const code = await client.getBytecode({ address: gdAddress });
  if (code) {
    console.log("✅ Contract found! (Code size > 0)");
  } else {
    console.log("❌ No contract code found at this address on Sepolia.");
    console.log("   This means rewards will FAIL (but likely be caught).");
  }
}

check().catch(console.error);
