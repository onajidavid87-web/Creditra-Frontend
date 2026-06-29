import { useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { CreditLineRowMenu } from "../components/CreditLineRowMenu";
import { MOCK_CREDIT_LINES } from "../data/mockData";
import type {
  CreditLineStatus,
  SortField,
  SortDirection,
} from "../types/creditLine";
import type { CollateralAsset } from "../types/collateral";
import {
  COLOR, UTIL_COLOR,
  fmt, fmtDate, getUtilizationLevel, utilizationPct,
} from '../utils/tokens';
import { formatCountdown, getCountdownAriaLabel } from '../utils/dates';
import './CreditLines.css';

// ─── Credit Line Card ────────────────────────────────────────────────────────

function CreditLineCard({
  line,
  isSelected,
  onToggle,
  onSwapCollateral,
  onRepay,
  onSchedule,
  onDetails,
}: {
  line: (typeof MOCK_CREDIT_LINES)[0];
  isSelected: boolean;
  onToggle: () => void;
  onSwapCollateral?: (
    line: (typeof MOCK_CREDIT_LINES)[0],
    triggerRef: React.RefObject<HTMLButtonElement | null>,
  ) => void;
  onRepay?: () => void;
  onSchedule?: (lineId: string) => void;
  onDetails?: (lineId: string) => void;
}) {
  const pct = utilizationPct(line.utilized, line.limit);
  const level = getUtilizationLevel(line.utilized, line.limit);
  const swapTriggerRef = useRef<HTMLButtonElement>(null);

  const isDefaulted = line.status === 'Defaulted';

  return (
    <div
      className={`cl-card${isDefaulted ? ' cl-row--defaulted' : ''}`}
      aria-label={isDefaulted ? `Credit line ${line.id} is defaulted` : undefined}
    >
       <div className="cl-card-header">
         <div className="cl-card-title-row">
           <label className="cl-row-select">
             <input
               type="checkbox"
               checked={isSelected}
               onChange={onToggle}
               aria-label={`Select ${line.name} for comparison`}
             />
             <span>Compare</span>
           </label>
           <div>
             <h3 className="cl-name">{line.name}</h3>
             <p className="cl-id">{line.id}</p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <StatusBadge status={line.status} />
           <CreditLineRowMenu
             lineId={line.id}
             lineName={line.name}
             onRepay={onRepay}
             onSchedule={onSchedule}
             onDetails={onDetails}
           />
         </div>
       </div>

      <div className="cl-card-body">
        <div className="cl-metrics">
          <div className="cl-metric">
            <span className="cl-metric-label">Limit</span>
            <span className="cl-metric-value" style={{ color: COLOR.accent }}>
              {fmt(line.limit)}
            </span>
          </div>
          <div className="cl-metric">
            <span className="cl-metric-label">Utilized</span>
            <span
              className="cl-metric-value"
              style={{ color: UTIL_COLOR[level] }}
            >
              {fmt(line.utilized)}
            </span>
          </div>
          <div className="cl-metric">
            <span className="cl-metric-label">Available</span>
            <span className="cl-metric-value" style={{ color: COLOR.success }}>
              {fmt(line.limit - line.utilized)}
            </span>
          </div>
        </div>

        <div className="cl-util-bar">
          <div className="cl-util-header">
            <span>Utilization</span>
            <span className="num-tabular" style={{ color: UTIL_COLOR[level] }}>{pct}%</span>
          </div>
          <div className="cl-util-track">
            <div
              className="cl-util-fill"
              style={{ width: `${pct}%`, background: UTIL_COLOR[level] }}
            />
          </div>
        </div>

        <div className="cl-details">
          <div className="cl-detail">
            <span className="label">APR</span>
            <span className="value num-tabular">{line.apr}%</span>
          </div>
          <div className="cl-detail">
            <span className="label">Risk Score</span>
            <span className="value num-tabular">{line.riskScore}</span>
          </div>
          <div className="cl-detail">
            <span className="label">Opened</span>
            <span className="value">{fmtDate(line.openedAt)}</span>
          </div>
        </div>

        {line.nextInterestAccrualDate && (
          <div className="cl-accrual">
            <NextAccrualChip target={line.nextInterestAccrualDate} />
          </div>
        )}
      </div>

       <div className="cl-card-footer">
       </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CreditLines() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<CreditLineStatus | "all">(
    "all",
  );

  const creditLines = MOCK_CREDIT_LINES;

  const [showCompare, setShowCompare] = useState(false);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [modalTarget, setModalTarget] = useState<{
    line: (typeof MOCK_CREDIT_LINES)[0];
    currentAsset: string;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
  } | null>(null);

  const handleModalClose = () => setModalTarget(null);
  const handleModalSuccess = (_incomingAsset: CollateralAsset) => {
    setModalTarget(null);
  };
  const handleSwapCollateral = (
    line: (typeof MOCK_CREDIT_LINES)[0],
    triggerRef: React.RefObject<HTMLButtonElement | null>,
  ) => {
    setModalTarget({
      line,
      currentAsset: "ETH",
      triggerRef,
    });
  };

  const handleRepay = (lineId: string) => {
    navigate(`/repay?line=${lineId}`);
  };

  const handleSchedule = (lineId: string) => {
    console.log(`Schedule requested for ${lineId}`);
  };

  const handleDetails = (lineId: string) => {
    console.log(`Details requested for ${lineId}`);
  };

  const filteredAndSorted = useMemo(() => {
    let filtered =
      statusFilter === "all"
        ? creditLines
        : creditLines.filter((cl) => cl.status === statusFilter);

    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "limit":
          aVal = a.limit;
          bVal = b.limit;
          break;
        case "utilization":
          aVal = a.utilized / a.limit;
          bVal = b.utilized / b.limit;
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case "apr":
          aVal = a.apr;
          bVal = b.apr;
          break;
        case "riskScore":
          aVal = a.riskScore;
          bVal = b.riskScore;
          break;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === "asc"
        ? aVal - (bVal as number)
        : (bVal as number) - aVal;
    });
  }, [creditLines, sortField, sortDir, statusFilter]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleOpenCompare = () => {
    if (selectedLines.length === 2) {
      setShowCompare(true);
    }
  };

  const handleCloseCompare = () => {
    setShowCompare(false);
    setSelectedLines([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedLines((prev) => {
      if (prev.includes(id)) {
        return prev.filter((lineId) => lineId !== id);
      } else if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const comparePanelRef = useFocusTrap({
    isActive: showCompare,
    triggerRef,
    onEscape: handleCloseCompare,
  });

  useInertBackdrop({ isInert: showCompare, modalId: "compare-lines-drawer" });
  useBodyScrollLock({ isLocked: showCompare });

  const selectedCreditLines = useMemo(
    () => creditLines.filter((line) => selectedLines.includes(line.id)),
    [creditLines, selectedLines],
  );

  return (
    <div className="credit-lines-page">
      <div className="cl-page-header">
        <div>
          <h1>Credit Lines</h1>
          <p className="subtitle">Manage your credit facilities</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            ref={triggerRef}
            className="cl-primary-btn"
            onClick={handleOpenCompare}
            disabled={selectedLines.length !== 2}
            style={{ opacity: selectedLines.length === 2 ? 1 : 0.6 }}
          >
            Compare Selected ({selectedLines.length}/2)
          </button>
          <Link to="/open-credit" className="cl-primary-btn">
            + Open New Line
          </Link>
        </div>
      </div>

      <div className="cl-filters">
        <div className="cl-filter-group">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CreditLineStatus | "all")
            }
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Defaulted">Defaulted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="cl-filter-group">
          <label>Sort By</label>
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="status">Status</option>
            <option value="limit">Credit Limit</option>
            <option value="utilization">Utilization</option>
            <option value="apr">APR</option>
            <option value="riskScore">Risk Score</option>
          </select>
        </div>
        <button
          className="cl-sort-dir"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>

      {showCompare && selectedCreditLines.length === 2 && (
        <div
          id="compare-lines-drawer"
          ref={comparePanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-lines-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(15, 23, 42, 0.45)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              width: "min(480px, 100%)",
              height: "100%",
              position: "relative",
              zIndex: 1201,
            }}
          >
            <CompareLinesPanel
              lines={selectedCreditLines}
              onClose={handleCloseCompare}
            />
          </div>
        </div>
      )}

      {filteredAndSorted.length === 0 ? (
        <div className="cl-empty">
          <NoLines className="empty-state-illustration--muted" />
          <h3>No credit lines found</h3>
          <p>Apply for a credit line to get started</p>
          <Link to="/open-credit" className="cl-primary-btn">
            Open Credit Line
          </Link>
        </div>
      ) : (
        <div className="cl-grid">
          {filteredAndSorted.map((line) => (
            <CreditLineCard
              key={line.id}
              line={line}
              isSelected={selectedLines.includes(line.id)}
              onToggle={() => toggleSelection(line.id)}
              onSwapCollateral={handleSwapCollateral}
              onRepay={() => handleRepay(line.id)}
              onSchedule={() => handleSchedule(line.id)}
              onDetails={() => handleDetails(line.id)}
            />
          ))}
        </div>
      )}

      {/* Collateral substitution modal — mounted at page level so it overlays everything */}
      {modalTarget && (
        <CollateralSubstitutionModal
          isOpen
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          creditLineName={modalTarget.line.name}
          loanBalance={modalTarget.line.utilized}
          currentAsset={modalTarget.currentAsset}
          triggerRef={modalTarget.triggerRef}
        />
      )}
    </div>
  );
}
