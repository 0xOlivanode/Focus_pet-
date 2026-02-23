const hre = require("hardhat");

async function main() {
  const FocusPet = await hre.ethers.getContractFactory("FocusPet");

  // CELO MAINNET ADDRESSES (PRODUCTION)
  // Source: GoodCollective / GoodDollar Celo Mainnet deployment list (Checksummed)
  const REWARDS_MAINNET = "0x25db74CF4E7BA120526fd87e159CF656d94bAE43";
  const G_DOLLAR_MAINNET = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";
  const UBI_POOL_MAINNET = "0xd7029Be2bd6BCc667d71da6944Eda996CFdB801b";

  // ALFAJORES TESTNET ADDRESSES (STAGING)
  const REWARDS_ALFAJORES = "0xb44fC3A592aDaA257AECe1Ae8956019EA53d0465";
  const G_DOLLAR_ALFAJORES = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"; // This is actually mainnet G$ but used in staging configs usually
  const UBI_POOL_ALFAJORES = "0xBC5847eFDCD57A1a2c68a4B829871fc3D201A4F4";

  console.log("🚀 Deploying FocusPet to Celo MAINNET...");
  const focusPet = await FocusPet.deploy(G_DOLLAR_MAINNET, UBI_POOL_MAINNET);

  await focusPet.waitForDeployment();

  console.log(`FocusPet deployed to ${focusPet.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
