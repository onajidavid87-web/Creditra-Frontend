import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, Link, NavLink } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WalletButton } from "./components/WalletButton";
import DrawCreditPage from "./pages/DrawCreditPage";
import CreditLines from "./pages/CreditLines";
import { TransactionHistory } from "./pages/TransactionHistory";
import { RequestEvaluation } from "./pages/RequestEvaluation";
import { Settings } from "./pages/Settings";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFound } from "./pages/NotFound";
import HelpCenter from "./pages/HelpCenter";
import { ShortcutHelpOverlay } from "./components/ShortcutHelpOverlay";
import { DutchAuctions } from "./pages/DutchAuctions";

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
 * Composition order is load-bearing:
 *
 *   <ErrorBoundary>          // catches render errors in everything below
 *     <WalletProvider>       // wallet lifecycle visible to every route
 *       <BrowserRouter>      // route tree
 *         <header />         // rendered outside <Routes/> so it persists
 *         <main>
 *           <Routes />       // current route
 *         </main>
 *       </BrowserRouter>
 *     </WalletProvider>
 *   </ErrorBoundary>
 *
 * The error boundary is the outer wrapper so a failure inside the
 * wallet reducer still renders the fallback page rather than a blank
 * screen. The header sits outside `<Routes>` so a route change never
 * dismounts the wallet button or the navigation chrome.
 *
 * See `docs/ARCHITECTURE.md` for the full component topology.
 */
function App() {
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [openedFromSettingsLink, setOpenedFromSettingsLink] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
              <WalletButton />
            </header>
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
          </div>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
