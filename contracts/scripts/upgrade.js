const hre = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7";
  
  // Explicitly getting signers
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No signers found. Make sure your PRIVATE_KEY is set in .env");
  }
  const deployer = signers[0];
  
  console.log(`🚀 Deploying New Implementation for FocusPet with account: ${deployer.address}`);
  
  const FocusPet = await hre.ethers.getContractFactory("FocusPet", deployer);
  const newImplementation = await FocusPet.deploy();
  await newImplementation.waitForDeployment();
  const implAddress = await newImplementation.getAddress();
  
  console.log(`New Implementation deployed to: ${implAddress}`);
  
  console.log("🔗 Upgrading Proxy...");
  const proxy = await hre.ethers.getContractAt("FocusPet", PROXY_ADDRESS, deployer);
  
  const owner = await proxy.owner();
  console.log(`Proxy Owner: ${owner}`);
  console.log(`Your Address: ${deployer.address}`);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.warn("⚠️ Warning: Your address is NOT the owner recorded on-chain.");
    console.warn(`Record: ${owner}`);
    console.warn(`You:   ${deployer.address}`);
    throw new Error("❌ Error: Unauthorized. You cannot authorize the upgrade with this account.");
  }
  
  // Call upgradeToAndCall on the proxy
  console.log("⏳ Sending upgrade transaction...");
  const tx = await proxy.upgradeToAndCall(implAddress, "0x");
  await tx.wait();
  
  console.log("✅ Upgrade Complete! All New Features are now LIVE.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
