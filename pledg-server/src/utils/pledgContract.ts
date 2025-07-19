import { ethers } from "ethers";
import pledgAbi from "../../smart-contracts/artifacts/contracts/core/Pledg.sol/Pledg.json";

const PLEDG_CONTRACT_ADDRESS = process.env['PLEDG_CONTRACT_ADDRESS'] as string;
const OWNER_PRIVATE_KEY = process.env['PRIVATE_KEY'] as string;
const RPC_URL = process.env['RPC_URL'] as string;

let provider: ethers.JsonRpcProvider | null = null;
let ownerSigner: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

export function getPledgContract(): ethers.Contract | null {
  if (!PLEDG_CONTRACT_ADDRESS || !OWNER_PRIVATE_KEY || !RPC_URL) {
    console.warn('⚠️  Blockchain environment variables not found. Smart contract features will be disabled.');
    console.warn('   Please set PLEDG_CONTRACT_ADDRESS, PRIVATE_KEY, and RPC_URL in your .env file');
    return null;
  }

  if (!contract) {
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      ownerSigner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
      contract = new ethers.Contract(PLEDG_CONTRACT_ADDRESS, pledgAbi.abi, ownerSigner);
    } catch (error) {
      console.error('Failed to initialize smart contract:', error);
      return null;
    }
  }

  return contract;
}