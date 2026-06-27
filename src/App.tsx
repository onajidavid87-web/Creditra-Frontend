import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, Link, NavLink } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ContrastProvider } from "./context/ContrastContext";
import { WalletButton } from "./components/WalletButton";
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
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
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
      <ThemeProvider>
        <ContrastProvider>
          <WalletProvider>
            <BrowserRouter>
              <div className="app">
                <header className="header">
                  <Link to="/" className="logo">
                    Creditra
                  </Link>

                  <nav className="header-nav">
                    {/*
                      NavLink with render-prop className:
                      - active class: accent + underline + weight (WCAG 1.4.1)
                      - aria-current="page" on active link (WCAG 2.4.8)
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
                    <NavLink
                      to="/settings"
                      className={({ isActive }) =>
                        isActive ? "header-nav-link active" : "header-nav-link"
                      }
                    >
                      Settings
                    </NavLink>
                  </nav>

                  {/* Keyboard shortcut help trigger (? key) */}
                  <button
                    ref={settingsTriggerRef}
                    type="button"
                    className="header-nav-link"
                    aria-label="Keyboard shortcuts"
                    onClick={() => {
                      setOpenedFromSettingsLink(true);
                      setIsShortcutHelpOpen(true);
                    }}
                  >
                    ?
                  </button>

                  <WalletButton />
                </header>

                <main className="main">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                      path="/transactions"
                      element={<TransactionHistory />}
                    />
                    <Route path="/credit-lines" element={<CreditLines />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/draw-credit" element={<DrawCreditPage />} />
                    <Route
                      path="/draw-credit/success"
                      element={<DrawCreditPage />}
                    />
                    <Route
                      path="/open-credit"
                      element={<RequestEvaluation />}
                    />
                    <Route
                      path="/dutch-auctions"
                      element={<DutchAuctions />}
                    />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

                <ShortcutHelpOverlay
                  isOpen={isShortcutHelpOpen}
                  onClose={() => setIsShortcutHelpOpen(false)}
                  triggerRef={
                    openedFromSettingsLink ? settingsTriggerRef : undefined
                  }
                />
              </div>
            </BrowserRouter>
          </WalletProvider>
        </ContrastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
