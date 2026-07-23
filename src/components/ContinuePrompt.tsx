import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { CreditLine } from "../types/creditLine";
import { fmt } from "../utils/tokens";
import { readJson, writeJson } from "../utils/storage";
import "./ContinuePrompt.css";

const DISMISS_KEY = "continue_prompt_dismissed";

interface ContinueItem {
  key: string;
  icon: string;
  label: string;
  description: string;
  actionLabel: string;
  to: string;
  type: "warning" | "info" | "danger";
}

interface ContinuePromptProps {
  creditLines: CreditLine[];
}

export function ContinuePrompt({ creditLines }: ContinuePromptProps) {
  const [dismissed, setDismissed] = useState(() =>
    readJson(DISMISS_KEY, false),
  );

  const items = useMemo<ContinueItem[]>(() => {
    const result: ContinueItem[] = [];
    const now = Date.now();

    creditLines.forEach((cl) => {
      const pendingTx = cl.transactions.find((tx) => tx.status === "Pending");
      if (pendingTx) {
        result.push({
          key: `pending-${cl.id}-${pendingTx.id}`,
          icon: "\u23F3",
          label: "Pending Transaction",
          description: `${pendingTx.note || pendingTx.type} for ${cl.name}`,
          actionLabel: "View Details \u2192",
          to: "/credit-lines",
          type: "warning",
        });
      }

      if (cl.status === "Suspended") {
        result.push({
          key: `suspended-${cl.id}`,
          icon: "\u26A0\uFE0F",
          label: "Suspended Credit Line",
          description: `${cl.name} needs repayment to restore access.`,
          actionLabel: "View Credit Lines \u2192",
          to: "/credit-lines",
          type: "danger",
        });
      }

      if (cl.status === "Active") {
        const utilPct = cl.limit > 0 ? cl.utilized / cl.limit : 0;
        if (utilPct >= 0.75) {
          result.push({
            key: `high-util-${cl.id}`,
            icon: "\uD83D\uDCCA",
            label: "High Utilization",
            description: `${cl.name} is at ${Math.round(utilPct * 100)}% utilization. Consider a repayment.`,
            actionLabel: "Review Credit \u2192",
            to: "/credit-lines",
            type: "warning",
          });
        }
      }

      if (cl.nextPaymentDate) {
        const daysUntil = Math.ceil(
          (new Date(cl.nextPaymentDate).getTime() - now) / 86400000,
        );
        if (daysUntil >= 0 && daysUntil <= 7) {
          result.push({
            key: `payment-${cl.id}`,
            icon: "\uD83D\uDCC5",
            label: "Upcoming Payment",
            description: `${fmt(cl.nextPaymentAmount ?? 0)} due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} for ${cl.name}.`,
            actionLabel: "View Credit Lines \u2192",
            to: "/credit-lines",
            type: "info",
          });
        }
      }

      if (cl.status === "Active" && cl.utilized === 0 && cl.limit > 0) {
        result.push({
          key: `available-${cl.id}`,
          icon: "\uD83D\uDCB3",
          label: "Credit Available",
          description: `${cl.name} has ${fmt(cl.limit)} ready to draw.`,
          actionLabel: "Draw Credit \u2192",
          to: "/draw-credit",
          type: "info",
        });
      }
    });

    return result;
  }, [creditLines]);

  const handleDismiss = () => {
    setDismissed(true);
    writeJson(DISMISS_KEY, true);
  };

  if (dismissed || items.length === 0) return null;

  return (
    <section
      className="continue-prompt"
      aria-label="Continue where you left off"
      data-testid="continue-prompt"
    >
      <div className="continue-prompt-header">
        <h2 className="continue-prompt-title">
          Continue Where You Left Off
        </h2>
        <p className="continue-prompt-subtitle">
          Pick up where you stopped
        </p>
      </div>

      <div className="continue-prompt-items" role="list">
        {items.map((item) => (
          <div
            key={item.key}
            className={`continue-prompt-item continue-prompt-item--${item.type}`}
            role="listitem"
          >
            <span className="continue-prompt-item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <div className="continue-prompt-item-content">
              <div className="continue-prompt-item-label">{item.label}</div>
              <div className="continue-prompt-item-desc">
                {item.description}
              </div>
            </div>
            <Link to={item.to} className="continue-prompt-item-action">
              {item.actionLabel}
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="continue-prompt-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss continue prompt"
      >
        Dismiss
      </button>
    </section>
  );
}
