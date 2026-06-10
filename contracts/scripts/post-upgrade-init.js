const hre = require("hardhat");

// Run this once after upgrading to activate USDT purchases and the launch discount.
// Usage: npx hardhat run scripts/post-upgrade-init.js --network celo

const PROXY      = "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7";
const USDT       = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const DISCOUNT_BPS       = 3000;               // 30% off
const DISCOUNT_END_UNIX  = 1749686399;         // 2026-06-11 23:59:59 UTC

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log(`Using account: ${owner.address}`);

  const proxy = await hre.ethers.getContractAt("FocusPet", PROXY, owner);

  // 1. Set USDT token address
  console.log("Setting USDT address…");
  const tx1 = await proxy.setUsdt(USDT);
  await tx1.wait();
  console.log(`✅ setUsdt done (tx: ${tx1.hash})`);

  // 2. Activate launch discount
  console.log(`Setting launch discount (${DISCOUNT_BPS} bps until ${DISCOUNT_END_UNIX})…`);
  const tx2 = await proxy.setLaunchDiscount(DISCOUNT_BPS, DISCOUNT_END_UNIX);
  await tx2.wait();
  console.log(`✅ setLaunchDiscount done (tx: ${tx2.hash})`);

  // 3. Verify
  const usdtAddr = await proxy.usdt();
  const discountBps = await proxy.discountBps();
  const discountEnd = await proxy.discountEndTime();
  console.log("\n── Verification ──────────────────────────────");
  console.log(`usdt address  : ${usdtAddr}`);
  console.log(`discountBps   : ${discountBps} (${Number(discountBps) / 100}% off)`);
  console.log(`discountEndTime: ${discountEnd} (${new Date(Number(discountEnd) * 1000).toUTCString()})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
