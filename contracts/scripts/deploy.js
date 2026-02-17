const hre = require("hardhat");

async function main() {
  const FocusPet = await hre.ethers.getContractFactory("FocusPet");
  const REWARDS_CONTRACT = "0xb44fC3A592aDaA257AECe1Ae8956019EA53d0465"; // Celo Alfajores Dev
  const G_DOLLAR_CONTRACT = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"; // Celo Alfajores G$
  const focusPet = await FocusPet.deploy(REWARDS_CONTRACT, G_DOLLAR_CONTRACT);

  await focusPet.waitForDeployment();

  console.log(`FocusPet deployed to ${focusPet.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
