import { PublicClient, Abi } from "viem";

export async function fetchLogsInChunks(
  publicClient: PublicClient,
  address: `0x${string}`,
  abi: Abi,
  eventName: string,
  fromBlock: bigint,
  chunkSize: bigint = 500000n, // Celo Forno safe chunk size
) {
  const latestBlock = await publicClient.getBlockNumber();
  let currentBlock = fromBlock;
  const allLogs: any[] = [];

  while (currentBlock <= latestBlock) {
    let toBlock = currentBlock + chunkSize - 1n;
    if (toBlock > latestBlock) {
      toBlock = latestBlock;
    }

    try {
      const logs = await publicClient.getContractEvents({
        address,
        abi,
        eventName,
        fromBlock: currentBlock,
        toBlock,
      } as any);
      allLogs.push(...logs);
    } catch (e) {
      console.warn(
        `Failed to fetch logs from ${currentBlock} to ${toBlock}.`,
        e,
      );
      throw e;
    }

    currentBlock = toBlock + 1n;
  }

  return allLogs;
}
