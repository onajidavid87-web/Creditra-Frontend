import { useEffect, useMemo, useRef, useState } from 'react';
import './NetworkMismatchBanner.css';

interface NetworkMismatchBannerProps {
  currentNetwork: string | null;
  expectedNetwork: string;
  walletType: 'freighter' | 'albedo' | 'xbull' | 'rabet';
  onSwitchNetwork: () => Promise<void> | void;
}

const NETWORK_LABELS: Record<string, string> = {
  PUBLIC: 'Public network',
  TESTNET: 'Testnet',
};

const WALLET_SWITCH_COPY: Record<string, string> = {
  freighter: 'Switch network in Freighter',
  albedo: 'Switch network in Albedo',
  xbull: 'Switch network in xBull',
  rabet: 'Switch network in Rabet',
};

export const NetworkMismatchBanner = ({
  currentNetwork,
  expectedNetwork,
  walletType,
  onSwitchNetwork,
}: NetworkMismatchBannerProps) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchResult, setSwitchResult] = useState<'success' | 'error' | null>(null);
  const liveRef = useRef<HTMLSpanElement>(null);

  const shouldRender = useMemo(() => {
    if (!currentNetwork) return false;
    return currentNetwork !== expectedNetwork;
  }, [currentNetwork, expectedNetwork]);

  useEffect(() => {
    if (!shouldRender) {
      setIsSwitching(false);
      setSwitchResult(null);
    }
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const currentLabel = NETWORK_LABELS[currentNetwork!] ?? currentNetwork;
  const expectedLabel = NETWORK_LABELS[expectedNetwork] ?? expectedNetwork;
  const descriptionId = 'network-mismatch-desc';

  const handleClick = async () => {
    setIsSwitching(true);
    setSwitchResult(null);
    try {
      await onSwitchNetwork();
      setSwitchResult('success');
    } catch {
      setSwitchResult('error');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className="network-mismatch-banner"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="network-mismatch-banner__content">
        <p className="network-mismatch-banner__title">
          Your wallet network doesn&apos;t match the app.
        </p>
        <p id={descriptionId} className="network-mismatch-banner__copy">
          Current network: {currentLabel}. Expected: {expectedLabel}.
        </p>
      </div>

      <button
        type="button"
        className="network-mismatch-banner__button"
        onClick={handleClick}
        disabled={isSwitching}
        aria-describedby={descriptionId}
      >
        {isSwitching ? 'Switching…' : WALLET_SWITCH_COPY[walletType]}
      </button>

      <span
        ref={liveRef}
        role="log"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {switchResult === 'success' && `Network switched to ${expectedLabel}.`}
        {switchResult === 'error' && `Failed to switch network. Please switch manually in your ${walletType} wallet.`}
      </span>
    </div>
  );
};
