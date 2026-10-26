# Blockchain-Based Digital Warranty Management System 🛡️⚡

A clean, professional, and reliable decentralized application (dApp) built on the **Ethereum Sepolia Testnet** for digital warranty management across the product lifecycle.

---

## 🌟 Key Features & Workflow

The system implements an end-to-end role-based lifecycle:

1. **Admin (Smart Contract Owner):** Authorizes Manufacturers, Retailers, and Service Centers on-chain.
2. **Manufacturer:** Registers products with unique serial numbers and issues digital warranties.
3. **Retailer:** Verifies product registration and assigns product warranty ownership to customer wallet addresses upon sale.
4. **Customer:** Views owned products, verifies warranty validity, and files on-chain service claims for defective products.
5. **Service Center:** Inspects incoming claims, approves/rejects them, and logs repair completion on the Sepolia blockchain.
6. **Public Warranty Verification:** Anyone can search by Product ID or Warranty ID to verify product authenticity, current owner, and active/expired warranty status.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, CSS, Lucide Icons
- **Blockchain Interactivity:** Ethers.js v6, MetaMask Extension
- **Smart Contract Layer:** Solidity (`^0.8.20`), Solc compiler
- **Network:** Sepolia Ethereum Testnet
- **Version Control:** Git

> 🚫 *No Vite, Node.js backend server, MongoDB/SQL databases, IPFS, or fake mock data used. The Solidity smart contract is the single source of truth.*

---

## 📁 Project Structure

```
digital-warranty-system/
├── contracts/
│   └── WarrantyManagement.sol           # Core Solidity Smart Contract
├── scripts/
│   ├── compile.mjs                       # Standalone Solc contract compiler
│   └── deploy.mjs                        # Ethers.js Sepolia deployment script
├── src/
│   ├── components/
│   │   └── Common/
│   │       ├── Navbar.jsx                # Brand, Network indicator, Wallet chip
│   │       ├── Sidebar.jsx               # Navigation drawer
│   │       ├── StatusBadge.jsx           # Color-coded state badges
│   │       ├── AlertMessage.jsx          # Error/Success alert banners
│   │       ├── LoadingSpinner.jsx        # On-chain query spinner
│   │       └── TransactionModal.jsx      # Step-by-step transaction UX modal
│   ├── pages/
│   │   ├── Landing/                      # System overview & workflow diagram
│   │   ├── Admin/                        # Organization authorization portal
│   │   ├── Manufacturer/                 # Product registration & warranty issuance
│   │   ├── Retailer/                     # Product search & customer assignment
│   │   ├── Customer/                     # My Products, Warranty Claim filing
│   │   ├── ServiceCenter/                # Claim inspection & status updates
│   │   └── Verification/                 # Public warranty verification lookup
│   ├── contracts/
│   │   ├── WarrantyManagementABI.json    # Compiled Contract ABI
│   │   └── WarrantyManagementBytecode.json # Compiled Bytecode
│   ├── services/
│   │   └── ethersService.js              # Dedicated Ethers.js integration service
│   ├── utils/
│   │   ├── contractConfig.js             # Deployed address & Sepolia chain config
│   │   └── helpers.js                    # Address formatting & error parsers
│   ├── App.jsx                           # Main application component
│   └── App.css                           # Modern responsive CSS styles
└── package.json
```

---

## 🚀 How to Run & Deploy

### 1. Install Dependencies
```bash
cd digital-warranty-system
npm install
```

### 2. Compile Smart Contract
To compile `WarrantyManagement.sol` and update the ABI/Bytecode in `src/contracts/`:
```bash
node scripts/compile.mjs
```

### 3. Deploy to Sepolia Testnet
Create a `.env` file in the root directory:
```env
PRIVATE_KEY=0xYourSepoliaPrivateKey
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

Run the deployment script:
```bash
node scripts/deploy.mjs
```
*The script will automatically deploy the contract to Sepolia and update `src/utils/contractConfig.js` with the new contract address.*

### 4. Start React Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser with MetaMask installed.

---

## 🎓 College Demonstration Guide

1. **Connect Admin Wallet:** Connect the MetaMask wallet that deployed the contract. Open **Admin Portal** and authorize a secondary wallet address as **Manufacturer**, another as **Retailer**, and another as **Service Center**.
2. **Switch to Manufacturer Wallet:** Open **Manufacturer Portal**. Register a new product (e.g. `PRD-1001`), then create a 365-day warranty for `PRD-1001`.
3. **Switch to Retailer Wallet:** Open **Retailer Portal**. Search for `PRD-1001`, verify details, enter the **Customer's Wallet Address**, and click **Assign Ownership**.
4. **Switch to Customer Wallet:** Open **Customer Portal**. Verify that `PRD-1001` appears under **My Products** with an **ACTIVE** badge. Click **Raise Warranty Claim**, enter a problem description, and submit.
5. **Switch to Service Center Wallet:** Open **Service Center Portal**. Locate the submitted claim, click **Approve**, then click **Mark Service Completed**. Observe real-time status updates confirmed on Sepolia!
