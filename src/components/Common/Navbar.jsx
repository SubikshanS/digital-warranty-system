import React from 'react';
import { ShieldCheck, Wallet, AlertOctagon, CheckCircle } from 'lucide-react';
import { shortenAddress } from '../../utils/helpers';

export const Navbar = ({
  account,
  isSepolia,
  roles,
  onConnectWallet,
  onSwitchNetwork
}) => {
  return (
    <header className="app-navbar">
      <div className="navbar-container">
        <div className="brand-section">
          <div className="logo-icon">
            <ShieldCheck size={28} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="brand-title">WarrantyChain</h1>
            <p className="brand-subtitle">Ethereum Sepolia Warranty Registry</p>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Network Indicator */}
          {account ? (
            isSepolia ? (
              <span className="net-badge net-sepolia">
                <CheckCircle size={14} /> Sepolia Testnet
              </span>
            ) : (
              <button onClick={onSwitchNetwork} className="net-badge net-wrong hover:bg-rose-200">
                <AlertOctagon size={14} /> Switch to Sepolia
              </button>
            )
          ) : null}

          {/* User Role Indicator */}
          {account && roles && (
            <div className="role-badges-group">
              {roles.isAdmin && <span className="role-chip chip-admin">Admin</span>}
              {roles.isManuf && <span className="role-chip chip-manuf">Manufacturer</span>}
              {roles.isRet && <span className="role-chip chip-retailer">Retailer</span>}
              {roles.isServ && <span className="role-chip chip-service">Service Center</span>}
              {!roles.isAdmin && !roles.isManuf && !roles.isRet && !roles.isServ && (
                <span className="role-chip chip-customer">Customer</span>
              )}
            </div>
          )}

          {/* Wallet Button */}
          {account ? (
            <div className="wallet-chip">
              <Wallet size={16} className="text-indigo-600" />
              <span>{shortenAddress(account)}</span>
            </div>
          ) : (
            <button onClick={onConnectWallet} className="btn btn-primary btn-sm">
              <Wallet size={16} /> Connect MetaMask
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
