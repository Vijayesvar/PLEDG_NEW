# Pledg Smart Contract Deployment Guide

## Polygon Amoy Testnet Deployment

This guide will help you deploy the Pledg smart contracts to the Polygon Amoy testnet.

### Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** configured
3. **Alchemy account** with Polygon Amoy access
4. **Private key** for deployment wallet
5. **Test MATIC** for gas fees

### Step 1: Environment Setup

Create a `.env` file in the `smart-contracts` directory:

```bash
# Polygon Amoy Testnet Configuration
POLYGON_AMOY_URL=https://polygon-amoy.g.alchemy.com/v2/vf7MJh3wIEcMmKTEkOVe5

# Private Key (for deployment) - IMPORTANT: Never commit your actual private key!
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# API Keys (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### Step 2: Install Dependencies

```bash
cd smart-contracts
npm install
```

### Step 3: Compile Contracts

```bash
npm run compile
```

### Step 4: Get Test MATIC

1. Visit the Polygon Amoy faucet: https://faucet.polygon.technology/amoy
2. Connect your wallet
3. Request test MATIC

### Step 5: Deploy Contracts

```bash
npm run deploy:amoy
```

### Step 6: Verify Contracts

After deployment, verify your contracts on Polygonscan Amoy:

```bash
npx hardhat verify --network polygonAmoy DEPLOYED_CONTRACT_ADDRESS [constructor_args]
```

Example:
```bash
# Verify Price Oracle
npx hardhat verify --network polygonAmoy 0x...PriceOracleAddress

# Verify Pledg contract
npx hardhat verify --network polygonAmoy 0x...PledgAddress 0x...PriceOracleAddress
```

### Contract Addresses

After deployment, you'll get:
- **Price Oracle**: `0x...`
- **Pledg Main Contract**: `0x...`

### Supported Tokens

The deployment script automatically adds the test ETH token (`0x2Ef1C802355c500A3493F2Db8cB9C24AF12c42B0`) as a supported collateral token. This address is configured in the PriceOracle contract.

**Note**: For production use, you should:
1. Deploy your own test tokens on Amoy testnet
2. Update the PriceOracle configuration
3. Add the correct token addresses to the deployment script

### Testing the Deployment

1. **Check contract status**:
   ```javascript
   const pledg = await ethers.getContractAt("Pledg", "DEPLOYED_ADDRESS");
   const loanCount = await pledg.getLoanCount();
   console.log("Loan count:", loanCount.toString());
   ```

2. **Test loan creation** (requires test tokens):
   ```javascript
   // This will be done through your backend API
   ```

### Network Information

- **Network Name**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC URL**: https://polygon-amoy.g.alchemy.com/v2/vf7MJh3wIEcMmKTEkOVe5
- **Block Explorer**: https://amoy.polygonscan.com
- **Currency**: MATIC (test)

### Troubleshooting

1. **Insufficient gas**: Make sure you have enough test MATIC
2. **Compilation errors**: Check Solidity version compatibility
3. **Deployment failures**: Verify your private key and network configuration
4. **Verification issues**: Ensure you have the correct API keys

### Security Notes

- Never commit your `.env` file to version control
- Use a dedicated deployment wallet with limited funds
- Test thoroughly on testnet before mainnet deployment
- Keep your private keys secure

### Next Steps

After successful deployment:
1. Update your backend configuration with the new contract addresses
2. Test all contract functions
3. Add more supported tokens as needed
4. Prepare for mainnet deployment 