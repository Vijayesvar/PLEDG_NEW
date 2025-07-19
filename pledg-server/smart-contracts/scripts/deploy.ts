import { ethers } from "hardhat";

async function main() {
  console.log("Starting Pledg platform deployment on Polygon Amoy...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  console.log("\n1. Deploying Price Oracle...");
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("Price Oracle deployed to:", priceOracleAddress);

  console.log("\n2. Deploying Pledg main contract...");
  const Pledg = await ethers.getContractFactory("Pledg");
  const pledg = await Pledg.deploy(priceOracleAddress);
  await pledg.waitForDeployment();
  const pledgAddress = await pledg.getAddress();
  console.log("Pledg contract deployed to:", pledgAddress);

  console.log("\n3. Configuring supported tokens...");  
  // For Polygon Amoy testnet, you'll need to deploy your own test tokens
  // or use existing test tokens. The address below is from the PriceOracle config
  // but you should replace it with actual test tokens you want to support
  const TEST_ETH_ADDRESS = "0x2Ef1C802355c500A3493F2Db8cB9C24AF12c42B0"; // From PriceOracle config
  await pledg.addSupportedToken(TEST_ETH_ADDRESS);
  console.log("Added test ETH as supported token:", TEST_ETH_ADDRESS);

  console.log("\n4. Verifying deployment...");
  const loanCount = await pledg.getActiveLoans();
  console.log("Initial loan count:", loanCount.toString());

  const isWETHSupported = await pledg.supportedTokens(TEST_ETH_ADDRESS);
  console.log("WETH supported:", isWETHSupported);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\nContract Addresses:");
  console.log("Price Oracle:", priceOracleAddress);
  console.log("Pledg Main:", pledgAddress);
  console.log("\nNetwork: Polygon Amoy Testnet");
  console.log("Chain ID: 80002");
  
  const deploymentInfo = {
    network: "Polygon Amoy Testnet",
    chainId: 80002,
    deployer: deployer.address,
    priceOracle: priceOracleAddress,
    pledg: pledgAddress,
    supportedTokens: [TEST_ETH_ADDRESS],
    timestamp: new Date().toISOString()
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 