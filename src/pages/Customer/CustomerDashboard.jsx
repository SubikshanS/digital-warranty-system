import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, ShieldCheck, PlusCircle, Clock, Package } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { parseErrorMessage, formatDate, calculateWarrantyStatus, shortenAddress, getRemainingDays } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { StatusBadge } from '../../components/Common/StatusBadge';

export const CustomerDashboard = ({ account, onTxStart }) => {
  const [activeSubTab, setActiveSubTab] = useState('my-products');
  const [customerProducts, setCustomerProducts] = useState([]);
  const [customerClaims, setCustomerClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Claim Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [problemDesc, setProblemDesc] = useState('');

  const loadCustomerData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await ethersService.getCustomerProducts(account);
      setCustomerProducts(items);

      // Load all claims and filter by customer address
      const allClaims = await ethersService.getAllClaims();
      const myClaims = allClaims.filter(c => c.customer.toLowerCase() === account.toLowerCase());
      setCustomerClaims(myClaims);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProductId) {
      setErrorMsg('Please select one of your owned products.');
      return;
    }
    if (!problemDesc.trim()) {
      setErrorMsg('Please enter a detailed problem description.');
      return;
    }

    try {
      await ethersService.createClaim(
        selectedProductId,
        problemDesc.trim(),
        (txState) => onTxStart(txState)
      );

      setSuccessMsg(`Warranty claim submitted successfully on Sepolia for Product ${selectedProductId}!`);
      setSelectedProductId('');
      setProblemDesc('');
      await loadCustomerData();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="header-icon-box bg-amber-100 text-amber-600">
          <UserCheck size={28} />
        </div>
        <div>
          <h2 className="dashboard-title">Customer Dashboard</h2>
          <p className="dashboard-subtitle">
            Wallet: <code className="wallet-code">{account ? shortenAddress(account) : 'Not Connected'}</code>
          </p>
        </div>
        <div className="ml-auto">
          <span className="badge badge-info">
            <ShieldCheck size={14} /> Registered Customer
          </span>
        </div>
      </div>

      {!account && (
        <AlertMessage
          type="info"
          title="Connect MetaMask"
          message="Please connect your MetaMask wallet to view your owned products and submit warranty claims."
        />
      )}

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Navigation Subtabs */}
      <div className="subtab-pills mt-6">
        <button
          onClick={() => setActiveSubTab('my-products')}
          className={`subtab-btn ${activeSubTab === 'my-products' ? 'active' : ''}`}
        >
          <Package size={16} /> My Digital Products ({customerProducts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('raise-claim')}
          className={`subtab-btn ${activeSubTab === 'raise-claim' ? 'active' : ''}`}
        >
          <PlusCircle size={16} /> Raise Warranty Claim
        </button>
        <button
          onClick={() => setActiveSubTab('my-claims')}
          className={`subtab-btn ${activeSubTab === 'my-claims' ? 'active' : ''}`}
        >
          <Clock size={16} /> Claim History ({customerClaims.length})
        </button>
      </div>

      {/* 1. My Products Grid */}
      {activeSubTab === 'my-products' && (
        <div className="section-card mt-4">
          <div className="flex-between mb-4">
            <h3 className="card-header-title">My Registered Products & Warranties</h3>
            <button onClick={loadCustomerData} className="btn btn-outline btn-sm">
              Refresh
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Fetching your products from Sepolia smart contract..." />
          ) : customerProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="text-gray-400 mb-2" />
              <h4>No Products Found For Your Wallet</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Once a Retailer assigns a product to your wallet address ({shortenAddress(account)}), it will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="grid-2-cols mt-4">
              {customerProducts.map(({ product, warranty }) => {
                const status = calculateWarrantyStatus(warranty);
                const remainingDays = getRemainingDays(warranty.expiryDate);

                return (
                  <div key={product.productId} className="product-card">
                    <div className="flex-between">
                      <h4 className="font-bold text-gray-900 text-lg">{product.productName}</h4>
                      <StatusBadge type="warranty" status={status} />
                    </div>

                    <div className="grid-2-cols mt-3 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs block">Product ID</span>
                        <span className="font-mono font-semibold text-indigo-700">{product.productId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Serial Number</span>
                        <span className="font-mono text-gray-700">{product.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Brand & Model</span>
                        <span>{product.brand} ({product.model})</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Manufacturer</span>
                        <span className="font-mono text-xs text-gray-600">{shortenAddress(product.manufacturer)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Warranty Start</span>
                        <span className="text-xs">{formatDate(warranty.startDate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Warranty Expiry</span>
                        <span className="text-xs font-semibold text-emerald-700">{formatDate(warranty.expiryDate)}</span>
                      </div>
                    </div>

                    {status === 'ACTIVE' && (
                      <div className="mt-4 pt-3 border-t flex-between">
                        <span className="text-xs text-emerald-700 font-medium">
                          {remainingDays} days remaining
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProductId(product.productId);
                            setActiveSubTab('raise-claim');
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          File Service Claim
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Raise Warranty Claim Form */}
      {activeSubTab === 'raise-claim' && (
        <div className="section-card mt-4">
          <h3 className="card-header-title">Raise Warranty Claim</h3>
          <p className="card-header-subtitle">File an on-chain repair claim for an active owned product.</p>

          <form onSubmit={handleSubmitClaim} className="mt-4 max-w-xl">
            <div className="form-group">
              <label className="form-label">Select Owned Product *</label>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                <option value="">-- Choose Product --</option>
                {customerProducts.map(({ product, warranty }) => {
                  const status = calculateWarrantyStatus(warranty);
                  return (
                    <option
                      key={product.productId}
                      value={product.productId}
                      disabled={status !== 'ACTIVE'}
                    >
                      {product.productId} - {product.productName} ({status})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Problem Description *</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Describe the issue or defect in detail (e.g. Screen flickering, battery failure, overheating)..."
                value={problemDesc}
                onChange={(e) => setProblemDesc(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!account || customerProducts.length === 0}
                className="btn btn-primary btn-md"
              >
                <PlusCircle size={18} /> Submit Claim to Blockchain
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. My Claims History */}
      {activeSubTab === 'my-claims' && (
        <div className="section-card mt-4">
          <div className="flex-between mb-4">
            <h3 className="card-header-title">My Claim Submissions</h3>
            <button onClick={loadCustomerData} className="btn btn-outline btn-sm">
              Refresh
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Fetching your claims history..." />
          ) : customerClaims.length === 0 ? (
            <p className="empty-text">No warranty claims submitted yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Product ID</th>
                    <th>Date Submitted</th>
                    <th>Problem Description</th>
                    <th>Claim Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerClaims.map((claim) => (
                    <tr key={claim.claimId}>
                      <td className="font-mono font-semibold text-indigo-700">#{claim.claimId}</td>
                      <td className="font-mono font-medium">{claim.productId}</td>
                      <td className="text-xs">{formatDate(claim.claimDate)}</td>
                      <td className="text-sm text-gray-700 max-w-xs">{claim.problemDescription}</td>
                      <td>
                        <StatusBadge type="claim" status={claim.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
