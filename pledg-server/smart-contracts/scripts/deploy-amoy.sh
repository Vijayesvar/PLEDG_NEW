#!/bin/bash

echo "🚀 Pledg Smart Contract Deployment to Polygon Amoy"
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your configuration:"
    echo "POLYGON_AMOY_URL=https://polygon-amoy.g.alchemy.com/v2/vf7MJh3wIEcMmKTEkOVe5"
    echo "PRIVATE_KEY=your_private_key_here"
    echo "POLYGONSCAN_API_KEY=your_polygonscan_api_key_here"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile

# Check if compilation was successful
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful!"

# Deploy to Polygon Amoy
echo "🚀 Deploying to Polygon Amoy testnet..."
npm run deploy:amoy

# Check if deployment was successful
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the contract addresses from the output above"
echo "2. Verify contracts on Polygonscan Amoy"
echo "3. Update your backend configuration"
echo "4. Test the deployed contracts" 