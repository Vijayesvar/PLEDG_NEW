#!/bin/bash

echo "🔍 Pledg Smart Contract Verification on Polygonscan Amoy"
echo "======================================================="

# Check if contract addresses are provided
if [ $# -lt 2 ]; then
    echo "❌ Error: Please provide contract addresses!"
    echo "Usage: ./scripts/verify-amoy.sh <PRICE_ORACLE_ADDRESS> <PLEDG_ADDRESS>"
    echo "Example: ./scripts/verify-amoy.sh 0x1234... 0x5678..."
    exit 1
fi

PRICE_ORACLE_ADDRESS=$1
PLEDG_ADDRESS=$2

echo "📋 Contract Addresses:"
echo "Price Oracle: $PRICE_ORACLE_ADDRESS"
echo "Pledg Contract: $PLEDG_ADDRESS"
echo ""

# Verify Price Oracle
echo "🔍 Verifying Price Oracle..."
npx hardhat verify --network polygonAmoy $PRICE_ORACLE_ADDRESS

if [ $? -eq 0 ]; then
    echo "✅ Price Oracle verified successfully!"
else
    echo "❌ Price Oracle verification failed!"
fi

echo ""

# Verify Pledg Contract
echo "🔍 Verifying Pledg Contract..."
npx hardhat verify --network polygonAmoy $PLEDG_ADDRESS $PRICE_ORACLE_ADDRESS

if [ $? -eq 0 ]; then
    echo "✅ Pledg Contract verified successfully!"
else
    echo "❌ Pledg Contract verification failed!"
fi

echo ""
echo "📋 Verification completed!"
echo "View contracts on Polygonscan Amoy:"
echo "https://amoy.polygonscan.com/address/$PRICE_ORACLE_ADDRESS"
echo "https://amoy.polygonscan.com/address/$PLEDG_ADDRESS" 