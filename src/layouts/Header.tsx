import { Link, NavLink } from 'react-router-dom';
import type { RefObject } from 'react';
import { NetworkStatus } from '../components/NetworkStatus';
import { KycTriggerButton } from '../components/KycDrawer';
import { QuickRepayTrigger } from '../components/QuickRepayTrigger';
import { WalletButton } from '../components/WalletButton';

export interface HeaderProps {
  settingsTriggerRef: RefObject<HTMLButtonElement | null>;
  kycTriggerRef: RefObject<HTMLButtonElement | null>;
  onSettingsClick: () => void;
  onKycClick: () => void;
}

/**
 * Persistent application header — logo, primary nav, and action controls.
 */
export function Header({
  settingsTriggerRef,
  kycTriggerRef,
  onSettingsClick,
  onKycClick,
}: HeaderProps) {
  return (
    <header className="header">
      <Link to="/" className="logo">
        Creditra
      </Link>
      <nav className="header-nav">
        {/*
          NavLink with render function allows us to:
          1. Apply active class for styling (accent + underline + weight)
          2. Set aria-current="page" on active links for accessibility

          This satisfies WCAG 2.1 AA requirements:
          - 1.4.1: Use of Color - active state uses color + other visual indicators
          - 2.4.7: Focus Visible - outline differs from active underline
          - 2.4.8: Location - aria-current="page" indicates current page
        */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'header-nav-link active' : 'header-nav-link'
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            isActive ? 'header-nav-link active' : 'header-nav-link'
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/credit-lines"
          className={({ isActive }) =>
            isActive ? 'header-nav-link active' : 'header-nav-link'
          }
        >
          Credit Lines
        </NavLink>
        <NavLink
          to="/open-credit"
          className={({ isActive }) =>
            isActive ? 'header-nav-link active' : 'header-nav-link'
          }
        >
          Open Credit Line
        </NavLink>
        <NavLink
          to="/dutch-auctions"
          className={({ isActive }) =>
            isActive ? 'header-nav-link active' : 'header-nav-link'
          }
        >
          Dutch Auctions
        </NavLink>
      </nav>
      <button
        ref={settingsTriggerRef}
        type="button"
        className="header-nav-link"
        onClick={onSettingsClick}
      >
        Settings
      </button>
      <NetworkStatus />
      <KycTriggerButton triggerRef={kycTriggerRef} onClick={onKycClick} />
      <QuickRepayTrigger />
      <WalletButton />
    </header>
  );
}
