import { ethers } from 'ethers';
import abiData from '../contracts/WarrantyManagementABI.json';
import { CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID_HEX } from '../utils/contractConfig';

class EthersService {
  constructor() {
    this.abi = abiData;
  }

  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask browser extension.');
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized in MetaMask.');
    }
    return accounts[0];
  }

  async getConnectedAccount() {
    if (!this.isMetaMaskInstalled()) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0].address : null;
  }

  async getNetwork() {
    if (!this.isMetaMaskInstalled()) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return {
      chainIdHex: '0x' + network.chainId.toString(16),
      chainIdDecimal: Number(network.chainId),
      name: network.name
    };
  }

  async isSepoliaNetwork() {
    const net = await this.getNetwork();
    if (!net) return false;
    return net.chainIdDecimal === 11155111 || net.chainIdHex.toLowerCase() === SEPOLIA_CHAIN_ID_HEX.toLowerCase();
  }

  async switchToSepolia() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed.');
    }
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
      });
      return true;
    } catch (switchError) {
      // 4902 error code means network is not added to MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://rpc.sepolia.org'],
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }
          ]
        });
        return true;
      }
      throw switchError;
    }
  }

  getContract(runner) {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
      throw new Error('Contract Address is not set. Please deploy the smart contract to Sepolia testnet or configure CONTRACT_ADDRESS in src/utils/contractConfig.js.');
    }
    return new ethers.Contract(CONTRACT_ADDRESS, this.abi, runner);
  }

  async getReadOnlyContract() {
    if (this.isMetaMaskInstalled()) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return this.getContract(provider);
    } else {
      // Fallback public RPC for reading
      const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
      return this.getContract(provider);
    }
  }

  async getSignedContract() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is required to sign blockchain transactions.');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return this.getContract(signer);
  }

  // --- ROLE CHECKS ---
  async getUserRoles(address) {
    try {
      const contract = await this.getReadOnlyContract();
      const [isAdmin, isManuf, isRet, isServ] = await contract.getUserRoles(address);
      return { isAdmin, isManuf, isRet, isServ };
    } catch (err) {
      console.warn('Error fetching roles:', err);
      return { isAdmin: false, isManuf: false, isRet: false, isServ: false };
    }
  }

  // --- ADMIN METHODS ---
  async authorizeManufacturer(address, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.authorizeManufacturer(address);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Transaction submitted. Waiting for confirmation on Sepolia...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Manufacturer authorized successfully!' });
    return receipt;
  }

  async authorizeRetailer(address, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.authorizeRetailer(address);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Transaction submitted. Waiting for confirmation on Sepolia...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Retailer authorized successfully!' });
    return receipt;
  }

  async authorizeServiceCenter(address, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.authorizeServiceCenter(address);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Transaction submitted. Waiting for confirmation on Sepolia...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Service Center authorized successfully!' });
    return receipt;
  }

  async getAuthorizedOrganizations() {
    const contract = await this.getReadOnlyContract();
    const manufacturers = await contract.getAuthorizedManufacturers();
    const retailers = await contract.getAuthorizedRetailers();
    const serviceCenters = await contract.getAuthorizedServiceCenters();
    return {
      manufacturers: Array.from(manufacturers),
      retailers: Array.from(retailers),
      serviceCenters: Array.from(serviceCenters)
    };
  }

  // --- MANUFACTURER METHODS ---
  async registerProduct(productId, productName, brand, model, serialNumber, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.registerProduct(productId, productName, brand, model, serialNumber);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Registering product on Sepolia blockchain...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Product registered successfully on-chain!' });
    return receipt;
  }

  async createWarranty(productId, durationInDays, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.createWarranty(productId, durationInDays);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Creating warranty on Sepolia blockchain...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Warranty created successfully!' });
    return receipt;
  }

  // --- RETAILER METHODS ---
  async assignOwner(productId, customerAddress, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.assignOwner(productId, customerAddress);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Assigning product ownership on Sepolia...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Product ownership assigned to customer successfully!' });
    return receipt;
  }

  // --- CUSTOMER METHODS ---
  async createClaim(productId, problemDescription, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.createClaim(productId, problemDescription);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Submitting warranty claim to Sepolia blockchain...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Warranty claim submitted successfully!' });
    return receipt;
  }

  // --- SERVICE CENTER METHODS ---
  async updateClaimStatus(claimId, statusNumber, onTxStatusChange) {
    onTxStatusChange?.({ status: 'PENDING_SIGNATURE', message: 'Waiting for MetaMask signature...' });
    const contract = await this.getSignedContract();
    const tx = await contract.updateClaimStatus(claimId, statusNumber);
    onTxStatusChange?.({ status: 'PENDING_CONFIRMATION', txHash: tx.hash, message: 'Updating claim status on Sepolia...' });
    const receipt = await tx.wait();
    onTxStatusChange?.({ status: 'CONFIRMED', txHash: tx.hash, receipt, message: 'Claim status updated successfully!' });
    return receipt;
  }

  // --- DATA GETTERS ---
  async getProduct(productId) {
    const contract = await this.getReadOnlyContract();
    return await contract.getProduct(productId);
  }

  async getWarrantyByProductId(productId) {
    const contract = await this.getReadOnlyContract();
    return await contract.getWarrantyByProductId(productId);
  }

  async getWarranty(warrantyId) {
    const contract = await this.getReadOnlyContract();
    return await contract.getWarranty(warrantyId);
  }

  async getClaim(claimId) {
    const contract = await this.getReadOnlyContract();
    return await contract.getClaim(claimId);
  }

  async getAllProducts() {
    const contract = await this.getReadOnlyContract();
    const rawProducts = await contract.getAllProducts();
    return rawProducts.map(p => ({
      productId: p.productId,
      productName: p.productName,
      brand: p.brand,
      model: p.model,
      serialNumber: p.serialNumber,
      manufacturer: p.manufacturer,
      registrationDate: p.registrationDate,
      exists: p.exists
    }));
  }

  async getAllWarranties() {
    const contract = await this.getReadOnlyContract();
    const rawWarranties = await contract.getAllWarranties();
    return rawWarranties.map(w => ({
      warrantyId: Number(w.warrantyId),
      productId: w.productId,
      startDate: w.startDate,
      expiryDate: w.expiryDate,
      currentOwner: w.currentOwner,
      exists: w.exists
    }));
  }

  async getAllClaims() {
    const contract = await this.getReadOnlyContract();
    const rawClaims = await contract.getAllClaims();
    return rawClaims.map(c => ({
      claimId: Number(c.claimId),
      productId: c.productId,
      warrantyId: Number(c.warrantyId),
      customer: c.customer,
      problemDescription: c.problemDescription,
      claimDate: c.claimDate,
      status: Number(c.status),
      exists: c.exists
    }));
  }

  async getCustomerProducts(customerAddress) {
    const contract = await this.getReadOnlyContract();
    const [rawProducts, rawWarranties] = await contract.getCustomerProducts(customerAddress);
    
    return rawProducts.map((p, i) => {
      const w = rawWarranties[i];
      return {
        product: {
          productId: p.productId,
          productName: p.productName,
          brand: p.brand,
          model: p.model,
          serialNumber: p.serialNumber,
          manufacturer: p.manufacturer,
          registrationDate: p.registrationDate,
          exists: p.exists
        },
        warranty: {
          warrantyId: Number(w.warrantyId),
          productId: w.productId,
          startDate: w.startDate,
          expiryDate: w.expiryDate,
          currentOwner: w.currentOwner,
          exists: w.exists
        }
      };
    });
  }
}

const ethersService = new EthersService();
export default ethersService;
