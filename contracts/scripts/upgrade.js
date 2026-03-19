const hre = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7";
  
  console.log("🚀 Deploying New Implementation for FocusPet...");
  const FocusPet = await hre.ethers.getContractFactory("FocusPet");
  const newImplementation = await FocusPet.deploy();
  await newImplementation.waitForDeployment();
  const implAddress = await newImplementation.getAddress();
  
  console.log(`New Implementation deployed to: ${implAddress}`);
  
  console.log("🔗 Upgrading Proxy...");
  const proxy = await hre.ethers.getContractAt("FocusPet", PROXY_ADDRESS);
  
  const owner = await proxy.owner();
  const signer = (await hre.ethers.getSigners())[0].address;
  console.log(`Proxy Owner: ${owner}`);
  console.log(`Your Address: ${signer}`);
  
  if (owner.toLowerCase() !== signer.toLowerCase()) {
    throw new Error("❌ Error: Your address is NOT the owner of the contract. You cannot authorized the upgrade.");
  }
  
  // Call upgradeToAndCall on the proxy
  const tx = await proxy.upgradeToAndCall(implAddress, "0x");
  await tx.wait();
  
  console.log("✅ Upgrade Complete! Smooth Decay and Fixes are now LIVE.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
