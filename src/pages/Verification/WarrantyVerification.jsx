import React, { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, UserCheck, Factory, CheckCircle2 } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { parseErrorMessage, formatDate, calculateWarrantyStatus, shortenAddress, getRemainingDays } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { StatusBadge } from '../../components/Common/StatusBadge';

export const WarrantyVerification = () => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const id = searchInput.trim();

    try {
      let product = null;
      let warranty = null;

      // Try searching product first
      try {
        product = await ethersService.getProduct(id);
        warranty = await ethersService.getWarrantyByProductId(id);
      } catch (err1) {
        // If not found by product ID, check if numeric warranty ID
        if (!isNaN(id)) {
          warranty = await ethersService.getWarranty(Number(id));
          if (warranty && warranty.exists) {
            product = await ethersService.getProduct(warranty.productId);
          }
        }
      }

      if (!product || !product.exists) {
        setResult({ status: 'NOT FOUND' });
      } else {
        const warrantyStatus = calculateWarrantyStatus(warranty);
        setResult({
          product,
          warranty,
          status: warrantyStatus
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="hero-verification-card">
        <div className="text-center">
          <ShieldCheck className="mx-auto text-indigo-600 mb-2" size={48} />
          <h2 className="text-2xl font-bold text-gray-900">Public Digital Warranty Verification</h2>
          <p className="text-sm text-gray-600 mt-1">
            Query the Sepolia Ethereum blockchain to instantly verify product authenticity, ownership, and warranty validity.
          </p>
        </div>

        <form onSubmit={handleVerify} className="search-bar-form mt-6 max-w-2xl mx-auto">
          <input
            type="text"
            className="form-input text-center text-lg font-mono"
            placeholder="Enter Product ID or Warranty ID (e.g. PRD-1001 or 1)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-lg">
            <Search size={20} /> Verify On-Chain
          </button>
        </form>
      </div>

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {loading && <LoadingSpinner label="Searching Sepolia Ethereum blockchain records..." />}

      {result && (
        <div className="section-card mt-6">
          {result.status === 'NOT FOUND' ? (
            <div className="empty-state">
              <AlertTriangle size={48} className="text-amber-500 mb-2" />
              <h3 className="text-xl font-bold text-gray-800">Warranty Record Not Found</h3>
              <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                No registered product or warranty matching "<code>{searchInput}</code>" exists on the smart contract.
              </p>
              <div className="mt-4">
                <StatusBadge type="warranty" status="NOT FOUND" />
              </div>
            </div>
          ) : (
            <div className="verification-details">
              <div className="flex-between pb-4 border-b">
                <div>
                  <span className="text-xs font-mono text-indigo-600 font-semibold block">PRODUCT ID: {result.product.productId}</span>
                  <h3 className="text-2xl font-bold text-gray-900">{result.product.productName}</h3>
                </div>
                <div>
                  <StatusBadge type="warranty" status={result.status} />
                </div>
              </div>

              <div className="grid-2-cols mt-6 gap-6">
                <div className="details-group-box">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Factory size={18} className="text-blue-600" /> Product Specifications
                  </h4>
                  <ul className="details-list">
                    <li><strong>Brand:</strong> {result.product.brand || 'N/A'}</li>
                    <li><strong>Model:</strong> {result.product.model || 'N/A'}</li>
                    <li><strong>Serial Number:</strong> <span className="font-mono">{result.product.serialNumber || 'N/A'}</span></li>
                    <li><strong>Manufacturer Address:</strong> <span className="font-mono text-xs">{shortenAddress(result.product.manufacturer)}</span></li>
                  </ul>
                </div>

                <div className="details-group-box">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <UserCheck size={18} className="text-emerald-600" /> Warranty Ownership
                  </h4>
                  <ul className="details-list">
                    <li><strong>Warranty ID:</strong> #{result.warranty ? result.warranty.warrantyId : 'N/A'}</li>
                    <li>
                      <strong>Current Owner Wallet:</strong>{' '}
                      <span className="font-mono text-xs font-semibold text-emerald-700">
                        {result.warranty ? shortenAddress(result.warranty.currentOwner) : 'N/A'}
                      </span>
                    </li>
                    <li><strong>Start Date:</strong> {result.warranty ? formatDate(result.warranty.startDate) : 'N/A'}</li>
                    <li><strong>Expiry Date:</strong> {result.warranty ? formatDate(result.warranty.expiryDate) : 'N/A'}</li>
                  </ul>
                </div>
              </div>

              {result.status === 'ACTIVE' && (
                <div className="active-guarantee-card mt-6">
                  <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-emerald-900">Valid Active Digital Warranty</h5>
                    <p className="text-xs text-emerald-800">
                      This product is officially registered on the Ethereum blockchain. Warranty expires in {getRemainingDays(result.warranty.expiryDate)} days.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
