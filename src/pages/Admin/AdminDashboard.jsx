import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, UserPlus, Building2, Store, Wrench, CheckCircle2 } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { isValidEthereumAddress, parseErrorMessage, shortenAddress } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';

export const AdminDashboard = ({ account, roles, onTxStart }) => {
  const [activeSubTab, setActiveSubTab] = useState('manufacturer');
  const [addressInput, setAddressInput] = useState('');
  const [orgs, setOrgs] = useState({ manufacturers: [], retailers: [], serviceCenters: [] });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadOrganizations = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await ethersService.getAuthorizedOrganizations();
      setOrgs(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isValidEthereumAddress(addressInput)) {
      setErrorMsg('Please enter a valid 42-character Ethereum wallet address (0x...)');
      return;
    }

    try {
      let txStatusHandler = (txState) => onTxStart(txState);

      if (activeSubTab === 'manufacturer') {
        await ethersService.authorizeManufacturer(addressInput.trim(), txStatusHandler);
        setSuccessMsg(`Successfully authorized ${shortenAddress(addressInput)} as Manufacturer!`);
      } else if (activeSubTab === 'retailer') {
        await ethersService.authorizeRetailer(addressInput.trim(), txStatusHandler);
        setSuccessMsg(`Successfully authorized ${shortenAddress(addressInput)} as Retailer!`);
      } else if (activeSubTab === 'service') {
        await ethersService.authorizeServiceCenter(addressInput.trim(), txStatusHandler);
        setSuccessMsg(`Successfully authorized ${shortenAddress(addressInput)} as Service Center!`);
      }

      setAddressInput('');
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  const isContractAdmin = roles?.isAdmin;

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="header-icon-box bg-indigo-100 text-indigo-600">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="dashboard-title">Admin Authorization Portal</h2>
          <p className="dashboard-subtitle">
            Connected Wallet: <code className="wallet-code">{account ? shortenAddress(account) : 'Not Connected'}</code>
          </p>
        </div>
        <div className="ml-auto">
          {isContractAdmin ? (
            <span className="badge badge-success">
              <CheckCircle2 size={14} /> Contract Owner / Admin
            </span>
          ) : (
            <span className="badge badge-warning">Connected as Non-Admin</span>
          )}
        </div>
      </div>

      {!isContractAdmin && account && (
        <AlertMessage
          type="warning"
          title="Admin Access Required"
          message="Your connected wallet address is not the contract owner. Only the Contract Admin can authorize new organizations."
        />
      )}

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Authorize Form Card */}
      <div className="section-card mt-6">
        <h3 className="card-header-title">Authorize Organization Wallet</h3>
        <p className="card-header-subtitle">Select role type and enter the Ethereum address of the organization.</p>

        <div className="subtab-pills mt-4">
          <button
            onClick={() => setActiveSubTab('manufacturer')}
            className={`subtab-btn ${activeSubTab === 'manufacturer' ? 'active' : ''}`}
          >
            <Building2 size={16} /> Manufacturer
          </button>
          <button
            onClick={() => setActiveSubTab('retailer')}
            className={`subtab-btn ${activeSubTab === 'retailer' ? 'active' : ''}`}
          >
            <Store size={16} /> Retailer
          </button>
          <button
            onClick={() => setActiveSubTab('service')}
            className={`subtab-btn ${activeSubTab === 'service' ? 'active' : ''}`}
          >
            <Wrench size={16} /> Service Center
          </button>
        </div>

        <form onSubmit={handleAuthorize} className="auth-form mt-4">
          <div className="form-group">
            <label className="form-label">
              Organization Wallet Address (0x...)
            </label>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!isContractAdmin}
            className="btn btn-primary btn-md mt-2"
          >
            <UserPlus size={18} />
            Authorize {activeSubTab === 'manufacturer' ? 'Manufacturer' : activeSubTab === 'retailer' ? 'Retailer' : 'Service Center'}
          </button>
        </form>
      </div>

      {/* Authorized Organizations View */}
      <div className="section-card mt-6">
        <div className="flex-between mb-4">
          <h3 className="card-header-title">Authorized Organizations Directory</h3>
          <button onClick={loadOrganizations} className="btn btn-outline btn-sm">
            Refresh List
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Querying authorized organizations from smart contract..." />
        ) : (
          <div className="grid-3-cols">
            {/* Manufacturers */}
            <div className="org-list-box">
              <div className="org-box-header text-blue-700 bg-blue-50">
                <Building2 size={18} />
                <span>Manufacturers ({orgs.manufacturers.length})</span>
              </div>
              <div className="org-box-body">
                {orgs.manufacturers.length === 0 ? (
                  <p className="empty-text">No manufacturers authorized yet.</p>
                ) : (
                  <ul className="org-address-list">
                    {orgs.manufacturers.map((addr, idx) => (
                      <li key={idx} className="org-address-item">
                        <span className="font-mono">{shortenAddress(addr)}</span>
                        {addr.toLowerCase() === account?.toLowerCase() && (
                          <span className="chip-you">You</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Retailers */}
            <div className="org-list-box">
              <div className="org-box-header text-emerald-700 bg-emerald-50">
                <Store size={18} />
                <span>Retailers ({orgs.retailers.length})</span>
              </div>
              <div className="org-box-body">
                {orgs.retailers.length === 0 ? (
                  <p className="empty-text">No retailers authorized yet.</p>
                ) : (
                  <ul className="org-address-list">
                    {orgs.retailers.map((addr, idx) => (
                      <li key={idx} className="org-address-item">
                        <span className="font-mono">{shortenAddress(addr)}</span>
                        {addr.toLowerCase() === account?.toLowerCase() && (
                          <span className="chip-you">You</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Service Centers */}
            <div className="org-list-box">
              <div className="org-box-header text-purple-700 bg-purple-50">
                <Wrench size={18} />
                <span>Service Centers ({orgs.serviceCenters.length})</span>
              </div>
              <div className="org-box-body">
                {orgs.serviceCenters.length === 0 ? (
                  <p className="empty-text">No service centers authorized yet.</p>
                ) : (
                  <ul className="org-address-list">
                    {orgs.serviceCenters.map((addr, idx) => (
                      <li key={idx} className="org-address-item">
                        <span className="font-mono">{shortenAddress(addr)}</span>
                        {addr.toLowerCase() === account?.toLowerCase() && (
                          <span className="chip-you">You</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
