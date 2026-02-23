import { parseAbi, getAddress } from "viem";

export const G_DOLLAR_CELO = getAddress(
  "0x62B8B11039fcfE5AB0C56E502b1C372A3D2a9C7A",
);
export const SUPERFLUID_FORWARDER_CELO = getAddress(
  "0xcfA132E353cB4E398080B9700609bb008eceB125",
);

/**
 * ABI for Superfluid CFAv1Forwarder
 * This is a high-level helper contract that simplifies stream management.
 * https://docs.superfluid.finance/docs/technical-reference/CFAv1Forwarder
 */
export const CFAv1ForwarderAbi = parseAbi([
  "function createFlow(address token, address sender, address receiver, int96 flowRate, bytes userData) returns (bool)",
  "function updateFlow(address token, address sender, address receiver, int96 flowRate, bytes userData) returns (bool)",
  "function deleteFlow(address token, address sender, address receiver, bytes userData) returns (bool)",
  "function getFlowInfo(address token, address sender, address receiver) view returns (uint256 lastUpdated, int96 flowrate, uint256 deposit, uint256 owedDeposit)",
  "function getBufferAmountByFlowrate(address token, int96 flowRate) view returns (uint256 bufferAmount)",
]);

/**
 * Converts a monthly G$ amount to a Superfluid flowRate (tokens/second)
 * @param amountPerMonth Total G$ (with decimals) per 30-day month
 * @returns int96 flowRate for Superfluid CFA
 */
export function calculateFlowRate(amountPerMonth: bigint): bigint {
  const secondsInMonth = BigInt(30 * 24 * 60 * 60);
  return amountPerMonth / secondsInMonth;
}

/**
 * Converts a flowRate (tokens/second) back to an approximate monthly amount
 * @param flowRate int96 flowRate
 * @returns Approximate G$ per 30-day month
 */
export function calculateMonthlyAmount(flowRate: bigint): bigint {
  const secondsInMonth = BigInt(30 * 24 * 60 * 60);
  return flowRate * secondsInMonth;
}
