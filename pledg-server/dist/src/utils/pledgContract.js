"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPledgContract = getPledgContract;
const ethers_1 = require("ethers");
const Pledg_json_1 = __importDefault(require("../../smart-contracts/artifacts/contracts/core/Pledg.sol/Pledg.json"));
const PLEDG_CONTRACT_ADDRESS = process.env['PLEDG_CONTRACT_ADDRESS'];
const OWNER_PRIVATE_KEY = process.env['PRIVATE_KEY'];
const RPC_URL = process.env['RPC_URL'];
let provider = null;
let ownerSigner = null;
let contract = null;
function getPledgContract() {
    if (!PLEDG_CONTRACT_ADDRESS || !OWNER_PRIVATE_KEY || !RPC_URL) {
        console.warn('⚠️  Blockchain environment variables not found. Smart contract features will be disabled.');
        console.warn('   Please set PLEDG_CONTRACT_ADDRESS, PRIVATE_KEY, and RPC_URL in your .env file');
        return null;
    }
    if (!contract) {
        try {
            provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
            ownerSigner = new ethers_1.ethers.Wallet(OWNER_PRIVATE_KEY, provider);
            contract = new ethers_1.ethers.Contract(PLEDG_CONTRACT_ADDRESS, Pledg_json_1.default.abi, ownerSigner);
        }
        catch (error) {
            console.error('Failed to initialize smart contract:', error);
            return null;
        }
    }
    return contract;
}
//# sourceMappingURL=pledgContract.js.map