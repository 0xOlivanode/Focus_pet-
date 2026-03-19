const hre = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7";
  
  console.log(`Checking state for Proxy: ${PROXY_ADDRESS}`);
  const proxy = await hre.ethers.getContractAt("FocusPet", PROXY_ADDRESS);
  
  try {
    const owner = await proxy.owner();
    console.log(`-----------------------------------------`);
    console.log(`OWNER ADDRESS: ${owner}`);
    console.log(`-----------------------------------------`);
    console.log(`Instructions: You MUST use the private key for the above address to perform the upgrade.`);
  } catch (e) {
    console.error("Could not fetch owner. Is the address correct?");
    console.error(e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
