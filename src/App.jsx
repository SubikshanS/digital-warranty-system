import React, { useState, useEffect, useCallback } from 'react';
import ethersService from './services/ethersService';
import { Navbar } from './components/Common/Navbar';
import { Sidebar } from './components/Common/Sidebar';
import { TransactionModal } from './components/Common/TransactionModal';
import { AlertMessage } from './components/Common/AlertMessage';
import { LandingPage } from './pages/Landing/LandingPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ManufacturerDashboard } from './pages/Manufacturer/ManufacturerDashboard';
import { RetailerDashboard } from './pages/Retailer/RetailerDashboard';
import { CustomerDashboard } from './pages/Customer/CustomerDashboard';
import { ServiceCenterDashboard } from './pages/ServiceCenter/ServiceCenterDashboard';
import { WarrantyVerification } from './pages/Verification/WarrantyVerification';
import { CONTRACT_ADDRESS } from './utils/contractConfig';
import './App.css';

export default function App() {
  const [account, setAccount] = useState(null);
  const [isSepolia, setIsSepolia] = useState(false);
  const [roles, setRoles] = useState({ isAdmin: false, isManuf: false, isRet: false, isServ: false });
  const [activeTab, setActiveTab] = useState('landing');
  const [metaMaskMissing, setMetaMaskMissing] = useState(false);

  // Transaction Modal State
  const [txModal, setTxModal] = useState({
    isOpen: false,
    txState: null
  });

  const checkWalletState = useCallback(async () => {
    if (!ethersService.isMetaMaskInstalled()) {
      setMetaMaskMissing(true);
      return;
    }

    try {
      const activeAcc = await ethersService.getConnectedAccount();
      setAccount(activeAcc);

      const sepoliaOk = await ethersService.isSepoliaNetwork();
      setIsSepolia(sepoliaOk);

      if (activeAcc && CONTRACT_ADDRESS) {
        const userRoles = await ethersService.getUserRoles(activeAcc);
        setRoles(userRoles);
      }
    } catch (err) {
      console.error('Error checking wallet state:', err);
    }
  }, []);

  useEffect(() => {
    checkWalletState();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkWalletState();
        } else {
          setAccount(null);
          setRoles({ isAdmin: false, isManuf: false, isRet: false, isServ: false });
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkWalletState]);

  const handleConnectWallet = async () => {
    try {
      const acc = await ethersService.connectWallet();
      setAccount(acc);
      await checkWalletState();

      // Automatically route user to their authorized role dashboard if applicable
      const userRoles = await ethersService.getUserRoles(acc);
      setRoles(userRoles);

      if (userRoles.isAdmin) {
        setActiveTab('admin');
      } else if (userRoles.isManuf) {
        setActiveTab('manufacturer');
      } else if (userRoles.isRet) {
        setActiveTab('retailer');
      } else if (userRoles.isServ) {
        setActiveTab('service');
      } else {
        setActiveTab('customer');
      }
    } catch (err) {
      alert(err.message || 'Failed to connect wallet');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await ethersService.switchToSepolia();
      await checkWalletState();
    } catch (err) {
      alert(err.message || 'Failed to switch to Sepolia network');
    }
  };

  const handleTxStart = (txState) => {
    setTxModal({
      isOpen: true,
      txState
    });
  };

  const closeTxModal = () => {
    setTxModal({ isOpen: false, txState: null });
  };

  return (
    <div className="app-root">
      <Navbar
        account={account}
        isSepolia={isSepolia}
        roles={roles}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
      />

      <div className="app-main-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          roles={roles}
        />

        <main className="app-content-area">
          {metaMaskMissing && (
            <div className="p-4">
              <AlertMessage
                type="error"
                title="MetaMask Not Detected"
                message="Please install the MetaMask browser extension to use this dApp."
              />
            </div>
          )}

          {account && !isSepolia && (
            <div className="p-4">
              <AlertMessage
                type="warning"
                title="Wrong Network Detected"
                message="Please switch your MetaMask network to Sepolia Testnet to interact with smart contract transactions."
              />
            </div>
          )}

          {!CONTRACT_ADDRESS && (
            <div className="p-4">
              <AlertMessage
                type="info"
                title="Smart Contract Deployment Needed"
                message="No deployed contract address found. Please deploy WarrantyManagement.sol using 'node scripts/deploy.js' or specify REACT_APP_CONTRACT_ADDRESS in src/utils/contractConfig.js."
              />
            </div>
          )}

          {activeTab === 'landing' && (
            <LandingPage
              setActiveTab={setActiveTab}
              onConnectWallet={handleConnectWallet}
              account={account}
            />
          )}

          {activeTab === 'verify' && <WarrantyVerification />}

          {activeTab === 'admin' && (
            <AdminDashboard
              account={account}
              roles={roles}
              onTxStart={handleTxStart}
            />
          )}

          {activeTab === 'manufacturer' && (
            <ManufacturerDashboard
              account={account}
              roles={roles}
              onTxStart={handleTxStart}
            />
          )}

          {activeTab === 'retailer' && (
            <RetailerDashboard
              account={account}
              roles={roles}
              onTxStart={handleTxStart}
            />
          )}

          {activeTab === 'customer' && (
            <CustomerDashboard
              account={account}
              onTxStart={handleTxStart}
            />
          )}

          {activeTab === 'service' && (
            <ServiceCenterDashboard
              account={account}
              roles={roles}
              onTxStart={handleTxStart}
            />
          )}
        </main>
      </div>

      <TransactionModal
        isOpen={txModal.isOpen}
        txState={txModal.txState}
        onClose={closeTxModal}
      />
    </div>
  );
}
