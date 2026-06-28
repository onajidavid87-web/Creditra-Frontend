import { CreditLine, DrawPricingRiskBand } from "@/types/draw-credit.types";

export interface DrawPricingQuote {
  apr: number;
  fee: number;
  estimatedMonthlyInterest: number;
  riskBand: DrawPricingRiskBand;
  termMonths: number;
  utilizationAdjustmentLabel: string;
  termAdjustmentLabel: string;
}

const BASE_APR_BY_RISK_BAND: Record<DrawPricingRiskBand, number> = {
  Prime: 7.5,
  Standard: 9.5,
  Watch: 11.5,
};

function getUtilizationAdjustment(utilization: number) {
  if (utilization >= 80) {
    return { points: 2, label: "High utilization adjustment" };
  }

  if (utilization >= 50) {
    return { points: 1.25, label: "Moderate utilization adjustment" };
  }

  return { points: 0.5, label: "Low utilization adjustment" };
}

function getTermAdjustment(termMonths: number) {
  if (termMonths > 24) {
    return { points: 2.5, label: "Long-term pricing adjustment" };
  }

  if (termMonths > 12) {
    return { points: 1.5, label: "Standard-term pricing adjustment" };
  }

  return { points: 0.5, label: "Short-term pricing adjustment" };
}

/**
 * Mock pricing model for the draw-credit wizard.
 *
 * These values are explanatory placeholders until the backend returns a signed
 * pricing quote. Both the preview and confirmation steps call this helper so
 * the APR and supporting rationale stay in sync.
 */
export function getDrawPricingQuote(
  creditLine: CreditLine,
  amount: number,
): DrawPricingQuote {
  const safeAmount = Math.max(amount, 0);
  const fee = safeAmount > 0 ? Math.round(safeAmount * 0.01 * 100) / 100 : 0;
  const utilizationAdjustment = getUtilizationAdjustment(
    creditLine.utilization,
  );
  const termAdjustment = getTermAdjustment(creditLine.termMonths);
  const apr =
    BASE_APR_BY_RISK_BAND[creditLine.riskBand] +
    utilizationAdjustment.points +
    termAdjustment.points;
  const estimatedMonthlyInterest =
    safeAmount > 0
      ? Math.round(((safeAmount * apr) / 100 / 12) * 100) / 100
      : 0;

  return {
    apr,
    fee,
    estimatedMonthlyInterest,
    riskBand: creditLine.riskBand,
    termMonths: creditLine.termMonths,
    utilizationAdjustmentLabel: utilizationAdjustment.label,
    termAdjustmentLabel: termAdjustment.label,
  };
}
