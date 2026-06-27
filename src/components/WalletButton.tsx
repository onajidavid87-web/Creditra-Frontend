import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { WalletConnectionModal } from './WalletConnectionModal';
import { OnboardingFlow } from './OnboardingFlow';
import { WalletQrCode } from './WalletQrCode';
import { CopyToClipboard } from './CopyToClipboard';
import { shortenAddress } from '../utils/format-address';
import './WalletButton.css';

export const WalletButton = () => {
  const { wallet, status, connect, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleConnect = () => {
    setShowModal(true);
  };

  const handleSuccess = () => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleWalletConnect = async (provider: Parameters<typeof connect>[0]) => {
    await connect(provider);
    handleSuccess();
  };

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (showDropdown) {
      setShowQr(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    setShowQr(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (wallet && status === 'connected') {
    return (
      <div className="wallet-connected">
        <button 
          className="wallet-address-btn" 
          onClick={handleToggleDropdown}
          aria-haspopup="true"
          aria-expanded={showDropdown}
          aria-label={`Wallet connected: ${formatAddress(wallet.publicKey)}`}
        >
          <span className="status-dot" aria-hidden="true"></span>
          <span className="sr-only">Status: Connected</span>
          {formatAddress(wallet.publicKey)}
        </button>
        {showDropdown && (
          <div className={`wallet-dropdown ${showQr ? 'wallet-dropdown--expanded' : ''}`} role="menu">
            <div className="dropdown-item" role="menuitem">
              <span className="label">Wallet:</span>
              <span className="value">{wallet.type}</span>
            </div>
            <div className="dropdown-item" role="menuitem">
              <span className="label">Network:</span>
              <span className="value">{wallet.network}</span>
            </div>
            <button 
              className="show-qr-toggle-btn"
              role="menuitem"
              onClick={() => setShowQr(!showQr)}
              aria-expanded={showQr}
              aria-controls="wallet-qr-container"
            >
              {showQr ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQr && (
              <div className="wallet-qr-container" id="wallet-qr-container" role="menuitem">
                <div className="wallet-qr-row">
                  <WalletQrCode address={wallet.publicKey} />
                  <div className="wallet-qr-info">
                    <span className="wallet-qr-address-label">Address</span>
                    <CopyToClipboard
                      value={wallet.publicKey}
                      displayValue={shortenAddress(wallet.publicKey)}
                      ariaLabel="Copy connected wallet address"
                    />
                  </div>
                </div>
              </div>
            )}
            <button className="disconnect-btn" role="menuitem" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button className="connect-wallet-btn" onClick={handleConnect}>
        Connect Wallet
      </button>
      <WalletConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleWalletConnect}
      />
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    </>
  );
};
