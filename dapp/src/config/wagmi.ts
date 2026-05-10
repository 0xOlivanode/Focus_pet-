import { http, createConfig, fallback } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Primary: Alchemy (from env). Fallback: public Ankr endpoint.
// Never use forno.celo.org as primary — it rate-limits heavy eth_getLogs calls.
const ALCHEMY_RPC =
  "https://celo-mainnet.g.alchemy.com/v2/0gjKvBc8IJsMYVEJKT2_vmjM2AKN2RWs";

export const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()],
  transports: {
    [celo.id]: ALCHEMY_RPC
      ? fallback([http(ALCHEMY_RPC), http("https://rpc.ankr.com/celo")])
      : http("https://rpc.ankr.com/celo"),
    [celoAlfajores.id]: http(),
  },
});
