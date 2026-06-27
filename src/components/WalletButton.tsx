import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { WalletConnectionModal } from './WalletConnectionModal';
import { OnboardingFlow } from './OnboardingFlow';
import './WalletButton.css';

export const WalletButton = () => {
  const { wallet, status, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = () => {
    setShowModal(true);
  };

  const handleSuccess = () => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (wallet && status === 'connected') {
    // Notify context about dropdown visibility for polling
    const { balances, lastUpdated, refreshBalance, setDropdownOpen } = useWallet();
    // Ensure polling starts/stops when dropdown visibility changes
    useEffect(() => {
      setDropdownOpen(showDropdown);
    }, [showDropdown, setDropdownOpen]);

    const balanceDisplay = balances ? balances.map((b, i) => (
      <div key={i} className="balance-item">
        <span className="label">Balance ({b.asset}):</span>
        <span className="value">{b.balance}</span>
      </div>
    )) : <span className="value">Unknown</span>;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [announceMsg, setAnnounceMsg] = useState('');

    const handleRefresh = async () => {
      setIsRefreshing(true);
      try {
        await refreshBalance();
        setAnnounceMsg('Balance refreshed');
      } catch {
        setAnnounceMsg('Failed to refresh balance');
      } finally {
        setIsRefreshing(false);
        // Clear announcement after a short time for screen readers
        setTimeout(() => setAnnounceMsg(''), 3000);
      }
    };

    return (
      <div className="wallet-connected">
        <button 
          className="wallet-address-btn" 
          onClick={() => setShowDropdown(!showDropdown)}
          aria-haspopup="true"
          aria-expanded={showDropdown}
          aria-label={`Wallet connected: ${formatAddress(wallet.publicKey)}`}
        >
          <span className="status-dot" aria-hidden="true"></span>
          <span className="sr-only">Status: Connected</span>
          {formatAddress(wallet.publicKey)}
        </button>
        {showDropdown && (
          <div className="wallet-dropdown" role="menu">
            <div className="dropdown-item" role="menuitem">
              <span className="label">Wallet:</span>
              <span className="value">{wallet.type}</span>
            </div>
            <div className="dropdown-item" role="menuitem">
              <span className="label">Network:</span>
              <span className="value">{wallet.network}</span>
            </div>
            <div className="dropdown-item" role="menuitem">
              <span className="label">Balance:</span>
              <div className="balance-list">{balanceDisplay}</div>
            </div>
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              aria-label="Refresh wallet balance"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <span className="spinner" aria-hidden="true"></span>
              ) : (
                'Refresh'
              )}
            </button>
            {lastUpdated && (
              <div className="timestamp" role="status" aria-live="polite">
                Last updated: {formatRelative(lastUpdated)}
              </div>
            )}
            <span className="sr-only" role="status" aria-live="polite">{announceMsg}</span>
            <button className="disconnect-btn" onClick={handleDisconnect}>
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
        onSuccess={handleSuccess}
      />
      <OnboardingFlow
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    </>
  );
};
