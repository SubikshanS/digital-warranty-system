import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('Error: Please provide PRIVATE_KEY in your .env file to deploy to Sepolia.');
    console.log('\nExample .env file content:');
    console.log('PRIVATE_KEY=0xYourPrivateKeyHere');
    console.log('SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY');
    console.log('REACT_APP_CONTRACT_ADDRESS=0xDeployedAddressHere\n');
    process.exit(1);
  }

  console.log('Connecting to network:', rpcUrl);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Deploying from wallet address:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

  const abiPath = path.resolve(__dirname, '../src/contracts/WarrantyManagementABI.json');
  const bytecodePath = path.resolve(__dirname, '../src/contracts/WarrantyManagementBytecode.json');

  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const { bytecode } = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('Deploying WarrantyManagement smart contract...');
  
  const contract = await factory.deploy();
  console.log('Deployment transaction hash:', contract.deploymentTransaction().hash);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n==================================================');
  console.log('SUCCESS! WarrantyManagement deployed to address:', address);
  console.log('==================================================\n');

  // Update contractConfig.js
  const configPath = path.resolve(__dirname, '../src/utils/contractConfig.js');
  const configContent = `// Auto-generated or manually configured contract configuration
export const CONTRACT_ADDRESS = "${address}";
export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";
`;
  fs.writeFileSync(configPath, configContent);
  console.log('Updated src/utils/contractConfig.js with deployed address.');
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
