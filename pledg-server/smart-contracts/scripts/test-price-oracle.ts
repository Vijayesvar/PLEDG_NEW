import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing PriceOracle functions...");

  const PRICE_ORACLE_ADDRESS = "0x25F10826Cf6aD47f8e655b63024b86816575e9E2";
  
  // Get the contract instance
  const PriceOracle = await ethers.getContractFactory("PriceOracle");
  const priceOracle = PriceOracle.attach(PRICE_ORACLE_ADDRESS);

  // Test token address from your configuration
  const TEST_ETH_ADDRESS = "0x2Ef1C802355c500A3493F2Db8cB9C24AF12c42B0";
  
  console.log("\n📊 Testing PriceOracle functions:");
  console.log("PriceOracle Address:", PRICE_ORACLE_ADDRESS);
  console.log("Test ETH Address:", TEST_ETH_ADDRESS);

  try {
    // Test 1: Get price for 1 ETH (1e18 wei)
    const oneEth = ethers.parseEther("1.0");
    const priceInINR = await priceOracle.getTokenPriceInINR(TEST_ETH_ADDRESS, oneEth);
    console.log("\n💰 Price for 1 ETH:", ethers.formatEther(priceInINR), "INR");

    // Test 2: Get price for 0.5 ETH
    const halfEth = ethers.parseEther("0.5");
    const priceHalfEth = await priceOracle.getTokenPriceInINR(TEST_ETH_ADDRESS, halfEth);
    console.log("💰 Price for 0.5 ETH:", ethers.formatEther(priceHalfEth), "INR");

    // // Test 3: Get the stored price per token
    // const pricePerToken = await priceOracle.tokenPrices(TEST_ETH_ADDRESS);
    // console.log("💰 Price per token (raw):", pricePerToken.toString());
    // console.log("💰 Price per token (formatted):", ethers.formatEther(pricePerToken), "INR");

    // console.log("\n✅ All PriceOracle tests passed! No tokens needed in wallet.");

  } catch (error) {
    console.error("❌ Error testing PriceOracle:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  }); 