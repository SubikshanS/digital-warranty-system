import React from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { ETHERSCAN_TX_URL } from '../../utils/contractConfig';

export const TransactionModal = ({ isOpen, txState, onClose }) => {
  if (!isOpen || !txState) return null;

  const { status, txHash, message, error } = txState;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={24} />
            <h3 className="modal-title">Blockchain Transaction</h3>
          </div>
          {status === 'CONFIRMED' || status === 'FAILED' ? (
            <button onClick={onClose} className="modal-close-btn">&times;</button>
          ) : null}
        </div>

        <div className="modal-body">
          {status === 'PENDING_SIGNATURE' && (
            <div className="tx-status-container">
              <div className="pulse-ring">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
              </div>
              <h4 className="tx-status-title">MetaMask Signature Requested</h4>
              <p className="tx-status-desc">Please approve the transaction prompt in your MetaMask wallet extension.</p>
            </div>
          )}

          {status === 'PENDING_CONFIRMATION' && (
            <div className="tx-status-container">
              <Loader2 className="animate-spin text-amber-500" size={48} />
              <h4 className="tx-status-title">Transaction Pending on Sepolia</h4>
              <p className="tx-status-desc">{message || 'Waiting for block confirmation...'}</p>
              {txHash && (
                <div className="tx-hash-box">
                  <span className="tx-hash-label">Tx Hash:</span>
                  <span className="tx-hash-value">{txHash}</span>
                </div>
              )}
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div className="tx-status-container">
              <div className="icon-circle bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={48} />
              </div>
              <h4 className="tx-status-title text-emerald-700">Transaction Confirmed!</h4>
              <p className="tx-status-desc">{message || 'Your action has been permanently recorded on the Sepolia blockchain.'}</p>
              {txHash && (
                <div className="tx-hash-box mt-3">
                  <a
                    href={ETHERSCAN_TX_URL(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="etherscan-link"
                  >
                    View on Etherscan Explorer <ExternalLink size={14} />
                  </a>
                </div>
              )}
              <button onClick={onClose} className="btn btn-primary w-full mt-4">
                Done & Close
              </button>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="tx-status-container">
              <div className="icon-circle bg-rose-100 text-rose-600">
                <XCircle size={48} />
              </div>
              <h4 className="tx-status-title text-rose-700">Transaction Failed</h4>
              <p className="tx-status-desc text-rose-600">{error || message || 'An error occurred during execution.'}</p>
              <button onClick={onClose} className="btn btn-outline w-full mt-4">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
