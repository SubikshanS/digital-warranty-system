import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractPath = path.resolve(__dirname, '../contracts/WarrantyManagement.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'WarrantyManagement.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling WarrantyManagement.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach((err) => {
    if (err.severity === 'error') {
      console.error(err.formattedMessage);
    } else {
      console.warn(err.formattedMessage);
    }
  });
}

const contract = output.contracts['WarrantyManagement.sol']['WarrantyManagement'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const outDir = path.resolve(__dirname, '../src/contracts');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  path.resolve(outDir, 'WarrantyManagementABI.json'),
  JSON.stringify(abi, null, 2)
);

fs.writeFileSync(
  path.resolve(outDir, 'WarrantyManagementBytecode.json'),
  JSON.stringify({ bytecode: '0x' + bytecode }, null, 2)
);

console.log('Compilation successful!');
console.log('ABI saved to src/contracts/WarrantyManagementABI.json');
console.log('Bytecode saved to src/contracts/WarrantyManagementBytecode.json');
