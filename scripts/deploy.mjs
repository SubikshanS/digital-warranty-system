import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Reliable Sepolia RPC endpoints fallback list
  const rpcList = [
    process.env.SEPOLIA_RPC_URL,
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://rpc.ankr.com/eth_sepolia',
    'https://1rpc.io/sepolia'
  ].filter(Boolean);

  let provider = null;
  let rpcUrlUsed = '';

  for (const url of rpcList) {
    try {
      console.log('Testing RPC connection to:', url);
      const testProvider = new ethers.JsonRpcProvider(url);
      await testProvider.getBlockNumber();
      provider = testProvider;
      rpcUrlUsed = url;
      console.log('Connected successfully to:', rpcUrlUsed);
      break;
    } catch (err) {
      console.warn(`RPC ${url} unreachable, trying next fallback...`);
    }
  }

  if (!provider) {
    console.error('Error: Could not connect to any Sepolia RPC provider.');
    process.exit(1);
  }

  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey.includes('YourMetaMaskPrivateKeyHere')) {
    console.error('Error: Please provide your real PRIVATE_KEY in your .env file to deploy.');
    process.exit(1);
  }

  // Ensure 0x prefix for private key
  const formattedKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
  const wallet = new ethers.Wallet(formattedKey, provider);

  console.log('\nDeploying contract from wallet address:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Wallet balance:', ethers.formatEther(balance), 'Sepolia ETH');

  if (balance === 0n) {
    console.error('\nError: Your wallet balance is 0 Sepolia ETH.');
    console.log('Please get free Sepolia testnet ETH from a faucet before deploying!');
    console.log('Faucet link: https://cloud.google.com/application/web3/faucet/ethereum/sepolia\n');
    process.exit(1);
  }

  const abiPath = path.resolve(__dirname, '../src/contracts/WarrantyManagementABI.json');
  const bytecodePath = path.resolve(__dirname, '../src/contracts/WarrantyManagementBytecode.json');

  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const { bytecode } = JSON.parse(fs.readFileSync(bytecodePath, 'utf8'));

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('Deploying WarrantyManagement smart contract to Sepolia...');
  
  const contract = await factory.deploy();
  console.log('Deployment transaction hash:', contract.deploymentTransaction().hash);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n==================================================');
  console.log('SUCCESS! WarrantyManagement deployed to address:', address);
  console.log('==================================================\n');

  // Update contractConfig.js automatically
  const configPath = path.resolve(__dirname, '../src/utils/contractConfig.js');
  const configContent = `// Auto-generated or manually configured contract configuration
export const CONTRACT_ADDRESS = "${address}";
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
export const SEPOLIA_NETWORK_NAME = "Sepolia Testnet";
export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

export const ETHERSCAN_TX_URL = (txHash) => \`\${SEPOLIA_EXPLORER}/tx/\${txHash}\`;
export const ETHERSCAN_ADDRESS_URL = (address) => \`\${SEPOLIA_EXPLORER}/address/\${address}\`;
`;
  fs.writeFileSync(configPath, configContent);
  console.log('Updated src/utils/contractConfig.js with deployed address.');
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
