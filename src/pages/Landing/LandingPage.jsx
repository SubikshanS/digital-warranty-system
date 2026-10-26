import React from 'react';
import {
  ShieldCheck,
  Factory,
  Store,
  UserCheck,
  Wrench,
  ArrowRight,
  Database,
  Link,
  CheckCircle2
} from 'lucide-react';
import { CONTRACT_ADDRESS } from '../../utils/contractConfig';
import { shortenAddress } from '../../utils/helpers';

export const LandingPage = ({ setActiveTab, onConnectWallet, account }) => {
  return (
    <div className="page-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <span className="hero-badge">
            <ShieldCheck size={16} /> Ethereum Sepolia Blockchain
          </span>
          <h1 className="hero-title">
            Blockchain-Based Digital Warranty Management
          </h1>
          <p className="hero-description">
            A transparent, tamper-proof digital warranty system built on Ethereum smart contracts. Eliminate fraudulent warranty claims, ensure authentic product ownership, and streamline service center operations.
          </p>

          <div className="hero-actions">
            {!account ? (
              <button onClick={onConnectWallet} className="btn btn-primary btn-lg">
                Connect MetaMask Wallet
              </button>
            ) : (
              <button onClick={() => setActiveTab('customer')} className="btn btn-primary btn-lg">
                Go to Customer Portal <ArrowRight size={18} />
              </button>
            )}
            <button onClick={() => setActiveTab('verify')} className="btn btn-outline btn-lg">
              Verify Product Warranty
            </button>
          </div>

          <div className="hero-meta">
            <div className="meta-item">
              <Database size={16} className="text-indigo-400" />
              <span>Smart Contract: {CONTRACT_ADDRESS ? shortenAddress(CONTRACT_ADDRESS) : 'Not Configured'}</span>
            </div>
            <div className="meta-item">
              <Link size={16} className="text-emerald-400" />
              <span>Network: Sepolia Testnet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Lifecycle System Flow */}
      <div className="section-card mt-6">
        <h2 className="section-title">End-to-End Warranty Lifecycle Workflow</h2>
        <p className="section-subtitle">
          Every critical lifecycle event interacts directly with the Solidity smart contract on the Sepolia Ethereum testnet.
        </p>

        <div className="flow-grid">
          <div className="flow-step-card" onClick={() => setActiveTab('admin')}>
            <div className="flow-step-num">1</div>
            <div className="flow-icon bg-indigo-100 text-indigo-600">
              <ShieldCheck size={24} />
            </div>
            <h3 className="flow-card-title">Admin</h3>
            <p className="flow-card-desc">Authorizes Manufacturers, Retailers, and Service Centers on-chain.</p>
          </div>

          <div className="flow-step-card" onClick={() => setActiveTab('manufacturer')}>
            <div className="flow-step-num">2</div>
            <div className="flow-icon bg-blue-100 text-blue-600">
              <Factory size={24} />
            </div>
            <h3 className="flow-card-title">Manufacturer</h3>
            <p className="flow-card-desc">Registers products and creates digital warranties on the blockchain.</p>
          </div>

          <div className="flow-step-card" onClick={() => setActiveTab('retailer')}>
            <div className="flow-step-num">3</div>
            <div className="flow-icon bg-emerald-100 text-emerald-600">
              <Store size={24} />
            </div>
            <h3 className="flow-card-title">Retailer</h3>
            <p className="flow-card-desc">Verifies product registration and assigns ownership to customer wallet.</p>
          </div>

          <div className="flow-step-card" onClick={() => setActiveTab('customer')}>
            <div className="flow-step-num">4</div>
            <div className="flow-icon bg-amber-100 text-amber-600">
              <UserCheck size={24} />
            </div>
            <h3 className="flow-card-title">Customer</h3>
            <p className="flow-card-desc">Views owned products, verifies warranty status, and submits service claims.</p>
          </div>

          <div className="flow-step-card" onClick={() => setActiveTab('service')}>
            <div className="flow-step-num">5</div>
            <div className="flow-icon bg-purple-100 text-purple-600">
              <Wrench size={24} />
            </div>
            <h3 className="flow-card-title">Service Center</h3>
            <p className="flow-card-desc">Inspects claims, approves/rejects, and completes authorized repairs.</p>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid-2-cols mt-6">
        <div className="section-card">
          <h3 className="card-header-title">Key Core Protections</h3>
          <ul className="feature-list">
            <li>
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span><strong>Role-Based Access Control:</strong> Strict modifiers prohibit unauthorized actions.</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span><strong>Tamper-Proof Timestamps:</strong> Expiry dates are evaluated against block timestamps.</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span><strong>Verifiable Ownership:</strong> Customer wallet address directly binds to product warranty.</span>
            </li>
            <li>
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span><strong>Transparent Claims:</strong> Lifecycle states (Submitted → Approved → Completed) logged on-chain.</span>
            </li>
          </ul>
        </div>

        <div className="section-card">
          <h3 className="card-header-title">College Project & Sepolia Setup</h3>
          <div className="setup-guide-box">
            <ol className="setup-steps">
              <li>Install the <strong>MetaMask</strong> browser extension.</li>
              <li>Connect your wallet and switch to the <strong>Sepolia Ethereum Testnet</strong>.</li>
              <li>Obtain free Sepolia ETH from a Sepolia faucet.</li>
              <li>Deploy `WarrantyManagement.sol` using <code>node scripts/deploy.js</code> or configure `CONTRACT_ADDRESS`.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
