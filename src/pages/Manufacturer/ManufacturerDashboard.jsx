import React, { useState, useEffect, useCallback } from 'react';
import { Factory, PlusCircle, ShieldPlus, Package, Calendar } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { parseErrorMessage, formatDate, calculateWarrantyStatus } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { StatusBadge } from '../../components/Common/StatusBadge';

export const ManufacturerDashboard = ({ account, roles, onTxStart }) => {
  const [activeTab, setActiveTab] = useState('register-product');

  // Register Product Form State
  const [prodForm, setProdForm] = useState({
    productId: '',
    productName: '',
    brand: '',
    model: '',
    serialNumber: ''
  });

  // Create Warranty Form State
  const [warrantyForm, setWarrantyForm] = useState({
    productId: '',
    durationInDays: 365
  });

  const [productsList, setProductsList] = useState([]);
  const [warrantiesList, setWarrantiesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadManufacturerData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const prods = await ethersService.getAllProducts();
      const wrts = await ethersService.getAllWarranties();
      setProductsList(prods);
      setWarrantiesList(wrts);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadManufacturerData();
  }, [loadManufacturerData]);

  // Handle Product Registration
  const handleRegisterProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!prodForm.productId.trim() || !prodForm.productName.trim()) {
      setErrorMsg('Product ID and Product Name are required.');
      return;
    }

    try {
      await ethersService.registerProduct(
        prodForm.productId.trim(),
        prodForm.productName.trim(),
        prodForm.brand.trim(),
        prodForm.model.trim(),
        prodForm.serialNumber.trim(),
        (txState) => onTxStart(txState)
      );

      setSuccessMsg(`Product "${prodForm.productName}" (ID: ${prodForm.productId}) successfully registered on Sepolia!`);
      setProdForm({ productId: '', productName: '', brand: '', model: '', serialNumber: '' });
      await loadManufacturerData();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  // Handle Warranty Creation
  const handleCreateWarranty = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!warrantyForm.productId.trim()) {
      setErrorMsg('Product ID is required.');
      return;
    }
    if (Number(warrantyForm.durationInDays) <= 0) {
      setErrorMsg('Warranty duration must be greater than 0 days.');
      return;
    }

    try {
      await ethersService.createWarranty(
        warrantyForm.productId.trim(),
        Number(warrantyForm.durationInDays),
        (txState) => onTxStart(txState)
      );

      setSuccessMsg(`Warranty created successfully for Product ID ${warrantyForm.productId}!`);
      setWarrantyForm({ productId: '', durationInDays: 365 });
      await loadManufacturerData();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  // Auto-calculated warranty dates preview
  const nowSec = Math.floor(Date.now() / 1000);
  const calculatedStartDate = formatDate(nowSec);
  const calculatedExpiryDate = formatDate(nowSec + (Number(warrantyForm.durationInDays || 0) * 86400));

  const isAuthorizedManuf = roles?.isManuf || roles?.isAdmin;

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="header-icon-box bg-blue-100 text-blue-600">
          <Factory size={28} />
        </div>
        <div>
          <h2 className="dashboard-title">Manufacturer Portal</h2>
          <p className="dashboard-subtitle">
            Register products and issue immutable digital warranties on-chain.
          </p>
        </div>
        <div className="ml-auto">
          {roles?.isManuf ? (
            <span className="badge badge-success">Authorized Manufacturer</span>
          ) : (
            <span className="badge badge-warning">Role: Non-Manufacturer</span>
          )}
        </div>
      </div>

      {!isAuthorizedManuf && account && (
        <AlertMessage
          type="warning"
          title="Manufacturer Authorization Required"
          message="Your connected wallet is not an authorized Manufacturer. Please ask the Admin to authorize your wallet address."
        />
      )}

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Subtab Navigation */}
      <div className="subtab-pills mt-6">
        <button
          onClick={() => setActiveTab('register-product')}
          className={`subtab-btn ${activeTab === 'register-product' ? 'active' : ''}`}
        >
          <PlusCircle size={16} /> 1. Register Product
        </button>
        <button
          onClick={() => setActiveTab('create-warranty')}
          className={`subtab-btn ${activeTab === 'create-warranty' ? 'active' : ''}`}
        >
          <ShieldPlus size={16} /> 2. Create Warranty
        </button>
        <button
          onClick={() => setActiveTab('view-products')}
          className={`subtab-btn ${activeTab === 'view-products' ? 'active' : ''}`}
        >
          <Package size={16} /> Registered Products ({productsList.length})
        </button>
      </div>

      {/* 1. Register Product Form */}
      {activeTab === 'register-product' && (
        <div className="section-card mt-4">
          <h3 className="card-header-title">Register Product Details</h3>
          <p className="card-header-subtitle">Store unique product specs permanently on the Ethereum blockchain.</p>

          <form onSubmit={handleRegisterProduct} className="form-grid-2 mt-4">
            <div className="form-group">
              <label className="form-label">Product ID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PRD-1001 or MAC-2026-X"
                value={prodForm.productId}
                onChange={(e) => setProdForm({ ...prodForm, productId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. UltraBook Pro 15"
                value={prodForm.productName}
                onChange={(e) => setProdForm({ ...prodForm, productName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. TechCorp"
                value={prodForm.brand}
                onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. TC-X900"
                value={prodForm.model}
                onChange={(e) => setProdForm({ ...prodForm, model: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SN-88392019482"
                value={prodForm.serialNumber}
                onChange={(e) => setProdForm({ ...prodForm, serialNumber: e.target.value })}
              />
            </div>

            <div className="full-width mt-2">
              <button
                type="submit"
                disabled={!isAuthorizedManuf}
                className="btn btn-primary btn-md"
              >
                <PlusCircle size={18} /> Register Product on Blockchain
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Create Warranty Form */}
      {activeTab === 'create-warranty' && (
        <div className="section-card mt-4">
          <h3 className="card-header-title">Issue Digital Warranty</h3>
          <p className="card-header-subtitle">Bind a warranty duration to a registered Product ID.</p>

          <form onSubmit={handleCreateWarranty} className="mt-4 max-w-xl">
            <div className="form-group">
              <label className="form-label">Select Registered Product ID *</label>
              <select
                className="form-select"
                value={warrantyForm.productId}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, productId: e.target.value })}
                required
              >
                <option value="">-- Choose Product ID --</option>
                {productsList.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productId} - {p.productName} ({p.brand})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mt-4">
              <label className="form-label">Warranty Duration (Days) *</label>
              <div className="duration-quick-buttons mb-2">
                <button type="button" onClick={() => setWarrantyForm({ ...warrantyForm, durationInDays: 180 })} className="chip-btn">6 Months (180d)</button>
                <button type="button" onClick={() => setWarrantyForm({ ...warrantyForm, durationInDays: 365 })} className="chip-btn">1 Year (365d)</button>
                <button type="button" onClick={() => setWarrantyForm({ ...warrantyForm, durationInDays: 730 })} className="chip-btn">2 Years (730d)</button>
                <button type="button" onClick={() => setWarrantyForm({ ...warrantyForm, durationInDays: 1095 })} className="chip-btn">3 Years (1095d)</button>
              </div>
              <input
                type="number"
                min="1"
                className="form-input"
                value={warrantyForm.durationInDays}
                onChange={(e) => setWarrantyForm({ ...warrantyForm, durationInDays: e.target.value })}
                required
              />
            </div>

            {/* Calculated Warranty Dates Preview */}
            <div className="date-preview-card mt-4">
              <div className="preview-header">
                <Calendar size={18} className="text-indigo-600" />
                <span>Calculated Warranty Timeline</span>
              </div>
              <div className="grid-2-cols mt-2">
                <div>
                  <span className="text-xs text-gray-500 block">Warranty Start Date</span>
                  <span className="font-semibold text-gray-800">{calculatedStartDate}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Warranty Expiry Date</span>
                  <span className="font-semibold text-emerald-700">{calculatedExpiryDate}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={!isAuthorizedManuf}
                className="btn btn-primary btn-md"
              >
                <ShieldPlus size={18} /> Create & Issue Warranty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. View Registered Products & Warranties Table */}
      {activeTab === 'view-products' && (
        <div className="section-card mt-4">
          <div className="flex-between mb-4">
            <h3 className="card-header-title">Registered Products & Warranties</h3>
            <button onClick={loadManufacturerData} className="btn btn-outline btn-sm">
              Refresh Data
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Fetching products from smart contract..." />
          ) : productsList.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="text-gray-400 mb-2" />
              <h4>No Products Registered Yet</h4>
              <p>Use the "Register Product" tab above to add products to the blockchain.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Brand & Model</th>
                    <th>Serial Number</th>
                    <th>Warranty ID</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Warranty Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map((p) => {
                    const w = warrantiesList.find((item) => item.productId === p.productId);
                    const status = calculateWarrantyStatus(w);
                    return (
                      <tr key={p.productId}>
                        <td className="font-mono font-semibold text-indigo-700">{p.productId}</td>
                        <td className="font-medium">{p.productName}</td>
                        <td>{p.brand} {p.model ? `(${p.model})` : ''}</td>
                        <td className="font-mono text-gray-600">{p.serialNumber || 'N/A'}</td>
                        <td>{w ? `#${w.warrantyId}` : <span className="text-xs text-gray-400">No Warranty</span>}</td>
                        <td className="text-xs">{w ? formatDate(w.startDate) : '-'}</td>
                        <td className="text-xs">{w ? formatDate(w.expiryDate) : '-'}</td>
                        <td>
                          <StatusBadge type="warranty" status={status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
