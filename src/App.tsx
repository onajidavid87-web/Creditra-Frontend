import { BrowserRouter, Route, Routes, Link, NavLink } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { WalletProvider } from "./context/WalletContext";
import { WalletButton } from "./components/WalletButton";
import DrawCreditPage from "./pages/DrawCreditPage";
import { TransactionHistory } from "./pages/TransactionHistory";
import { RequestEvaluation } from "./pages/RequestEvaluation";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotFound } from "./pages/NotFound";

function App() {
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
                  children={({ isActive }) => (
                    <a
                      href="/"
                      className={
                        isActive ? "header-nav-link active" : "header-nav-link"
                      }
                      aria-current={isActive ? "page" : undefined}
                    >
                      Dashboard
                    </a>
                  )}
                />
                <NavLink
                  to="/transactions"
                  children={({ isActive }) => (
                    <a
                      href="/transactions"
                      className={
                        isActive ? "header-nav-link active" : "header-nav-link"
                      }
                      aria-current={isActive ? "page" : undefined}
                    >
                      Transactions
                    </a>
                  )}
                />
                <NavLink
                  to="/credit-lines"
                  children={({ isActive }) => (
                    <a
                      href="/credit-lines"
                      className={
                        isActive ? "header-nav-link active" : "header-nav-link"
                      }
                      aria-current={isActive ? "page" : undefined}
                    >
                      Credit Lines
                    </a>
                  )}
                />
                <NavLink
                  to="/open-credit"
                  children={({ isActive }) => (
                    <a
                      href="/open-credit"
                      className={
                        isActive ? "header-nav-link active" : "header-nav-link"
                      }
                      aria-current={isActive ? "page" : undefined}
                    >
                      Open Credit Line
                    </a>
                  )}
                />
              </nav>
              <WalletButton />
            </header>
            <main className="main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                <Route path="/draw-credit" element={<DrawCreditPage />} />
                <Route
                  path="/draw-credit/success"
                  element={<DrawCreditPage />}
                />
                <Route path="/open-credit" element={<RequestEvaluation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
}

export default App;
