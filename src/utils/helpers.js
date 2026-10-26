import { isAddress } from 'ethers';

/**
 * Formats an Ethereum address into short readable string (0x1234...5678)
 */
export const shortenAddress = (address) => {
  if (!address) return '';
  if (!isAddress(address)) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Validates whether a string is a valid Ethereum wallet address
 */
export const isValidEthereumAddress = (address) => {
  if (!address) return false;
  return isAddress(address.trim());
};

/**
 * Formats unix timestamp (in seconds) to human readable date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp || Number(timestamp) === 0) return 'N/A';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculates remaining days from unix timestamp
 */
export const getRemainingDays = (expiryTimestamp) => {
  if (!expiryTimestamp) return 0;
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(expiryTimestamp) - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 3600));
};

/**
 * Determines warranty status (ACTIVE, EXPIRED, NOT FOUND)
 */
export const calculateWarrantyStatus = (warranty) => {
  if (!warranty || !warranty.exists) return 'NOT FOUND';
  const now = Math.floor(Date.now() / 1000);
  if (Number(warranty.expiryDate) < now) return 'EXPIRED';
  return 'ACTIVE';
};

/**
 * Converts ClaimStatus enum integer to string text
 */
export const getClaimStatusText = (status) => {
  const code = Number(status);
  switch (code) {
    case 0:
      return 'SUBMITTED';
    case 1:
      return 'APPROVED';
    case 2:
      return 'REJECTED';
    case 3:
      return 'COMPLETED';
    default:
      return 'UNKNOWN';
  }
};

/**
 * Maps readable human error messages from blockchain/MetaMask exceptions
 */
export const parseErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';

  const message = error.reason || error.message || String(error);

  if (message.includes('user rejected') || message.includes('ACTION_REJECTED')) {
    return 'Transaction was cancelled in MetaMask.';
  }
  if (message.includes('Only Admin is authorized')) {
    return 'Unauthorized: Only the Smart Contract Admin can perform this action.';
  }
  if (message.includes('Only authorized Manufacturer allowed')) {
    return 'Unauthorized: Your wallet is not authorized as a Manufacturer.';
  }
  if (message.includes('Only authorized Retailer allowed')) {
    return 'Unauthorized: Your wallet is not authorized as a Retailer.';
  }
  if (message.includes('Only authorized Service Center allowed')) {
    return 'Unauthorized: Your wallet is not authorized as a Service Center.';
  }
  if (message.includes('Only product owner can create a claim')) {
    return 'Unauthorized: Only the current product owner can create a claim.';
  }
  if (message.includes('Product ID already registered')) {
    return 'Registration Failed: Duplicate Product ID. Please use a unique Product ID.';
  }
  if (message.includes('Product does not exist') || message.includes('Product not found')) {
    return 'Error: The requested Product ID was not found on the blockchain.';
  }
  if (message.includes('Warranty already exists')) {
    return 'Error: A warranty has already been created for this Product ID.';
  }
  if (message.includes('Warranty has expired')) {
    return 'Claim Failed: Cannot submit a claim because the product warranty has expired.';
  }
  if (message.includes('Manufacturer already authorized')) {
    return 'Notice: This wallet address is already an authorized Manufacturer.';
  }
  if (message.includes('Retailer already authorized')) {
    return 'Notice: This wallet address is already an authorized Retailer.';
  }
  if (message.includes('Service Center already authorized')) {
    return 'Notice: This wallet address is already an authorized Service Center.';
  }
  if (message.includes('Invalid transition')) {
    return 'Action Failed: Invalid claim state transition.';
  }
  if (message.includes('insufficient funds')) {
    return 'MetaMask Error: Insufficient Sepolia ETH balance for transaction gas fees.';
  }

  return message;
};
