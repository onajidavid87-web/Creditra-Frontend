import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, Link, NavLink } from "react-router-dom";
import { CommandPalette } from "./components/CommandPalette";
import { Dashboard } from "./pages/Dashboard";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import { KycProvider } from "./context/KycContext";
import { WalletButton } from "./components/WalletButton";
import { KycDrawer, KycTriggerButton } from "./components/KycDrawer";
import DrawCreditPage from "./pages/DrawCreditPage";
import CreditLines from "./pages/CreditLines";
import { TransactionHistory } from "./pages/TransactionHistory";
import { RequestEvaluation } from "./pages/RequestEvaluation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFound } from "./pages/NotFound";
import HelpCenter from "./pages/HelpCenter";
import { ShortcutHelpOverlay } from "./components/ShortcutHelpOverlay";
import { SupportWidget } from "./components/SupportWidget";
import { DutchAuctions } from "./pages/DutchAuctions";
import LandingPage from "./components/LandingPage";
import { RouteAnnouncer } from "./components/RouteAnnouncer";
import { WalletReconnectBanner } from "./components/WalletReconnectBanner";

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

/**
 * Application root.
 *
 * Provider composition order (outer → inner):
 *
 *   <ErrorBoundary>      — catches render errors in everything below
 *     <ThemeProvider>    — colour-scheme (light/dark) preference
 *       <ContrastProvider> — high-contrast override, [data-contrast="high"]
 *         <WalletProvider> — wallet lifecycle visible to every route
 *           <BrowserRouter>
 *             <header />   — persistent nav chrome
 *             <main>
 *               <Routes /> — current route
 *             </main>
 *           </BrowserRouter>
 *         </WalletProvider>
 *       </ContrastProvider>
 *     </ThemeProvider>
 *   </ErrorBoundary>
 *
 * See docs/ARCHITECTURE.md for the full component topology.
 */
function App() {
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [openedFromSettingsLink, setOpenedFromSettingsLink] = useState(false);
  const [isKycDrawerOpen, setIsKycDrawerOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const kycTriggerRef = useRef<HTMLButtonElement>(null);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K / Ctrl+K → toggle command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        paletteTriggerRef.current = document.activeElement as HTMLElement;
        setIsPaletteOpen((open) => !open);
        return;
      }

      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key !== "?") return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      setOpenedFromSettingsLink(false);
      setIsShortcutHelpOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <WalletProvider>
        <KycProvider>
        <BrowserRouter>
          <div className="app">
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
                    isActive ? "header-nav-link active" : "header-nav-link"
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/transactions"
                  className={({ isActive }) =>
                    isActive ? "header-nav-link active" : "header-nav-link"
                  }
                >
                  Transactions
                </NavLink>
                <NavLink
                  to="/credit-lines"
                  className={({ isActive }) =>
                    isActive ? "header-nav-link active" : "header-nav-link"
                  }
                >
                  Credit Lines
                </NavLink>
                <NavLink
                  to="/open-credit"
                  className={({ isActive }) =>
                    isActive ? "header-nav-link active" : "header-nav-link"
                  }
                >
                  Open Credit Line
                </NavLink>
                <NavLink
                  to="/dutch-auctions"
                  className={({ isActive }) =>
                    isActive ? "header-nav-link active" : "header-nav-link"
                  }
                >
                  Dutch Auctions
                </NavLink>
              </nav>
              <button
                ref={settingsTriggerRef}
                type="button"
                className="header-nav-link"
                onClick={() => {
                  setOpenedFromSettingsLink(true);
                  setIsShortcutHelpOpen(true);
                }}
              >
                Settings
              </button>
              <KycTriggerButton
                triggerRef={kycTriggerRef}
                onClick={() => setIsKycDrawerOpen(true)}
              />
              <WalletButton />
            </header>
            {/* Wallet auto-reconnect timeout banner — self-dismissing,
                non-blocking; only visible when reconnect takes > 8 s. */}
            <WalletReconnectBanner />
            <main className="main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                <Route path="/credit-lines" element={<CreditLines />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/draw-credit" element={<DrawCreditPage />} />
                <Route
                  path="/draw-credit/success"
                  element={<DrawCreditPage />}
                />
                <Route path="/open-credit" element={<RequestEvaluation />} />
                <Route path="/dutch-auctions" element={<DutchAuctions />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <ShortcutHelpOverlay
              isOpen={isShortcutHelpOpen}
              onClose={() => setIsShortcutHelpOpen(false)}
              triggerRef={openedFromSettingsLink ? settingsTriggerRef : undefined}
            />
            <KycDrawer
              isOpen={isKycDrawerOpen}
              onClose={() => setIsKycDrawerOpen(false)}
              onResume={(stepId) => {
                // Navigate to the KYC page with the step pre-selected.
                // Replace with router.push('/kyc?step=' + stepId) when the
                // full KYC page exists.
                console.info('[KYC] Resume at step:', stepId);
              }}
              triggerRef={kycTriggerRef}
            />
          </div>
        </BrowserRouter>
        </KycProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
