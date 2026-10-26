import React, { useState, useEffect, useCallback } from 'react';
import { Store, Search, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { isValidEthereumAddress, parseErrorMessage, formatDate, calculateWarrantyStatus, shortenAddress } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { StatusBadge } from '../../components/Common/StatusBadge';

export const RetailerDashboard = ({ account, roles, onTxStart }) => {
  const [searchId, setSearchId] = useState('');
  const [searchedProduct, setSearchedProduct] = useState(null);
  const [searchedWarranty, setSearchedWarranty] = useState(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [assignedList, setAssignedList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAssignedProducts = useCallback(async () => {
    if (!account) return;
    setLoadingList(true);
    try {
      const prods = await ethersService.getAllProducts();
      const wrts = await ethersService.getAllWarranties();
      const combined = prods.map(p => {
        const w = wrts.find(item => item.productId === p.productId);
        return { product: p, warranty: w };
      }).filter(item => item.warranty && item.warranty.exists && item.warranty.currentOwner !== item.product.manufacturer);
      setAssignedList(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, [account]);

  useEffect(() => {
    loadAssignedProducts();
  }, [loadAssignedProducts]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearchLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setSearchedProduct(null);
    setSearchedWarranty(null);

    try {
      const p = await ethersService.getProduct(searchId.trim());
      let w = null;
      try {
        w = await ethersService.getWarrantyByProductId(searchId.trim());
      } catch (e) {
        // Warranty might not be created yet
      }

      setSearchedProduct(p);
      setSearchedWarranty(w);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAssignOwner = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!searchedProduct) {
      setErrorMsg('Please search and select a valid product first.');
      return;
    }
    if (!searchedWarranty || !searchedWarranty.exists) {
      setErrorMsg('Cannot assign product: No warranty found for this product. Manufacturer must create a warranty first.');
      return;
    }
    if (!isValidEthereumAddress(customerAddress)) {
      setErrorMsg('Please enter a valid 42-character Ethereum customer wallet address (0x...).');
      return;
    }

    try {
      await ethersService.assignOwner(
        searchedProduct.productId,
        customerAddress.trim(),
        (txState) => onTxStart(txState)
      );

      setSuccessMsg(`Product ${searchedProduct.productId} successfully assigned to customer ${shortenAddress(customerAddress)}!`);
      setCustomerAddress('');
      // Refresh searched warranty
      const updatedW = await ethersService.getWarrantyByProductId(searchedProduct.productId);
      setSearchedWarranty(updatedW);
      await loadAssignedProducts();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  const isAuthorizedRetailer = roles?.isRet || roles?.isAdmin;

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="header-icon-box bg-emerald-100 text-emerald-600">
          <Store size={28} />
        </div>
        <div>
          <h2 className="dashboard-title">Retailer Sales & Ownership Portal</h2>
          <p className="dashboard-subtitle">
            Verify product authenticity and assign warranty ownership to customer wallets upon sale.
          </p>
        </div>
        <div className="ml-auto">
          {roles?.isRet ? (
            <span className="badge badge-success">Authorized Retailer</span>
          ) : (
            <span className="badge badge-warning">Role: Non-Retailer</span>
          )}
        </div>
      </div>

      {!isAuthorizedRetailer && account && (
        <AlertMessage
          type="warning"
          title="Retailer Authorization Required"
          message="Your connected wallet is not an authorized Retailer. Please ask the Admin to authorize your wallet address."
        />
      )}

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Product Search Card */}
      <div className="section-card mt-6">
        <h3 className="card-header-title">1. Search & Verify Product</h3>
        <p className="card-header-subtitle">Enter Product ID to verify manufacturer registration on Sepolia.</p>

        <form onSubmit={handleSearch} className="search-bar-form mt-4">
          <input
            type="text"
            className="form-input"
            placeholder="Enter Product ID (e.g. PRD-1001)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            <Search size={18} /> Search Product
          </button>
        </form>

        {searchLoading && <LoadingSpinner label="Querying smart contract..." />}

        {searchedProduct && (
          <div className="product-result-card mt-6">
            <div className="flex-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={24} />
                <h4 className="font-bold text-lg text-gray-800">{searchedProduct.productName}</h4>
              </div>
              <StatusBadge type="warranty" status={calculateWarrantyStatus(searchedWarranty)} />
            </div>

            <div className="grid-3-cols mt-4 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Product ID</span>
                <span className="font-mono font-semibold text-indigo-700">{searchedProduct.productId}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Brand & Model</span>
                <span>{searchedProduct.brand} ({searchedProduct.model || 'N/A'})</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Serial Number</span>
                <span className="font-mono text-gray-700">{searchedProduct.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Manufacturer</span>
                <span className="font-mono text-xs text-gray-600">{shortenAddress(searchedProduct.manufacturer)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Current Owner Wallet</span>
                <span className="font-mono text-xs font-semibold text-emerald-700">
                  {searchedWarranty ? shortenAddress(searchedWarranty.currentOwner) : 'No Warranty Issued'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Warranty Expiry</span>
                <span className="text-xs">{searchedWarranty ? formatDate(searchedWarranty.expiryDate) : 'N/A'}</span>
              </div>
            </div>

            {/* Assignment Section */}
            <div className="assignment-box mt-6 pt-4 border-t">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <UserCheck size={18} className="text-indigo-600" /> 2. Assign Ownership to Customer
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Enter the buyer's Ethereum wallet address to transfer on-chain ownership of this product warranty.
              </p>

              <form onSubmit={handleAssignOwner} className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Wallet Address (0x...)</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="0x9876543210fedcba9876543210fedcba98765432"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={!isAuthorizedRetailer || !searchedWarranty}
                    className="btn btn-primary btn-md w-full"
                  >
                    <ArrowRight size={18} /> Assign Ownership on Blockchain
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Directory of Customer Assigned Products */}
      <div className="section-card mt-6">
        <div className="flex-between mb-4">
          <h3 className="card-header-title">Customer Assigned Products Directory</h3>
          <button onClick={loadAssignedProducts} className="btn btn-outline btn-sm">
            Refresh
          </button>
        </div>

        {loadingList ? (
          <LoadingSpinner label="Fetching assigned products..." />
        ) : assignedList.length === 0 ? (
          <p className="empty-text">No products assigned to customers yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Serial Number</th>
                  <th>Customer Owner Wallet</th>
                  <th>Warranty Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedList.map(({ product, warranty }) => (
                  <tr key={product.productId}>
                    <td className="font-mono font-semibold text-indigo-700">{product.productId}</td>
                    <td>{product.productName}</td>
                    <td className="font-mono text-gray-600">{product.serialNumber}</td>
                    <td className="font-mono text-xs font-semibold text-emerald-700">
                      {shortenAddress(warranty.currentOwner)}
                    </td>
                    <td className="text-xs">{formatDate(warranty.expiryDate)}</td>
                    <td>
                      <StatusBadge type="warranty" status={calculateWarrantyStatus(warranty)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
