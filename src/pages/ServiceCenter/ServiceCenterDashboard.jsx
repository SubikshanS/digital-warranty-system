import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, CheckCircle, XCircle, CheckCheck } from 'lucide-react';
import ethersService from '../../services/ethersService';
import { parseErrorMessage, formatDate, shortenAddress } from '../../utils/helpers';
import { AlertMessage } from '../../components/Common/AlertMessage';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { StatusBadge } from '../../components/Common/StatusBadge';

export const ServiceCenterDashboard = ({ account, roles, onTxStart }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [claimsList, setClaimsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAllClaims = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const claims = await ethersService.getAllClaims();
      setClaimsList(claims);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadAllClaims();
  }, [loadAllClaims]);

  const handleUpdateStatus = async (claimId, newStatusInt) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await ethersService.updateClaimStatus(
        claimId,
        newStatusInt,
        (txState) => onTxStart(txState)
      );

      const statusNames = { 1: 'APPROVED', 2: 'REJECTED', 3: 'COMPLETED' };
      setSuccessMsg(`Claim #${claimId} status updated to ${statusNames[newStatusInt]}!`);
      await loadAllClaims();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseErrorMessage(err));
    }
  };

  const filteredClaims = claimsList.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(c.claimId) === q ||
      c.productId.toLowerCase().includes(q) ||
      c.customer.toLowerCase().includes(q)
    );
  });

  const isAuthorizedService = roles?.isServ || roles?.isAdmin;

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header-card">
        <div className="header-icon-box bg-purple-100 text-purple-600">
          <Wrench size={28} />
        </div>
        <div>
          <h2 className="dashboard-title">Service Center Portal</h2>
          <p className="dashboard-subtitle">
            Inspect warranty claims, authorize repairs, and log service completions on Sepolia.
          </p>
        </div>
        <div className="ml-auto">
          {roles?.isServ ? (
            <span className="badge badge-success">Authorized Service Center</span>
          ) : (
            <span className="badge badge-warning">Role: Non-Service Center</span>
          )}
        </div>
      </div>

      {!isAuthorizedService && account && (
        <AlertMessage
          type="warning"
          title="Service Center Authorization Required"
          message="Your connected wallet address is not an authorized Service Center. Please contact the Admin to request authorization."
        />
      )}

      {errorMsg && <AlertMessage type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Claim Search & Filter */}
      <div className="section-card mt-6">
        <div className="flex-between">
          <h3 className="card-header-title">Warranty Service Claims Registry</h3>
          <button onClick={loadAllClaims} className="btn btn-outline btn-sm">
            Refresh Claims
          </button>
        </div>

        <div className="search-bar-form mt-4">
          <input
            type="text"
            className="form-input"
            placeholder="Search by Claim ID, Product ID, or Customer Wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching service claims from smart contract..." />
        ) : filteredClaims.length === 0 ? (
          <div className="empty-state mt-4">
            <Wrench size={48} className="text-gray-400 mb-2" />
            <h4>No Claims Found</h4>
            <p>No warranty claims match your search query.</p>
          </div>
        ) : (
          <div className="table-responsive mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Product ID</th>
                  <th>Customer Wallet</th>
                  <th>Problem Description</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Service Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const statusNum = Number(claim.status);
                  return (
                    <tr key={claim.claimId}>
                      <td className="font-mono font-bold text-indigo-700">#{claim.claimId}</td>
                      <td className="font-mono font-medium">{claim.productId}</td>
                      <td className="font-mono text-xs text-gray-700">{shortenAddress(claim.customer)}</td>
                      <td className="text-sm text-gray-800 max-w-xs">{claim.problemDescription}</td>
                      <td className="text-xs">{formatDate(claim.claimDate)}</td>
                      <td>
                        <StatusBadge type="claim" status={statusNum} />
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {statusNum === 0 && ( // SUBMITTED
                            <>
                              <button
                                onClick={() => handleUpdateStatus(claim.claimId, 1)}
                                disabled={!isAuthorizedService}
                                className="btn btn-success btn-xs"
                                title="Approve Claim"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(claim.claimId, 2)}
                                disabled={!isAuthorizedService}
                                className="btn btn-danger btn-xs"
                                title="Reject Claim"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}

                          {statusNum === 1 && ( // APPROVED
                            <button
                              onClick={() => handleUpdateStatus(claim.claimId, 3)}
                              disabled={!isAuthorizedService}
                              className="btn btn-primary btn-xs"
                              title="Mark Service Completed"
                            >
                              <CheckCheck size={14} /> Mark Completed
                            </button>
                          )}

                          {statusNum === 2 && ( // REJECTED
                            <span className="text-xs text-rose-500 font-medium">Claim Rejected</span>
                          )}

                          {statusNum === 3 && ( // COMPLETED
                            <span className="text-xs text-emerald-600 font-medium">Service Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
