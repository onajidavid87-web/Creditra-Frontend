export interface PayoffProjectionResult {
  currentMonths: number;
  newMonths: number;
  monthsSaved: number;
  currentTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  isFullPayoff: boolean;
  isNeverPaidOff: boolean;
  currentUtilizationPct: number;
  newUtilizationPct: number;
}

export const DEFAULT_MONTHLY_PAYMENT_FRACTION = 0.025;

export function computePayoffProjection(
  debt: number,
  apr: number,
  monthlyPayment: number,
  repayAmount: number,
  limit: number,
  maxMonths = 360,
): PayoffProjectionResult {
  const effectiveRepay = Math.max(0, Math.min(repayAmount, debt));
  const newDebt = debt - effectiveRepay;

  const currentUtilizationPct = limit > 0 ? Math.round((debt / limit) * 100) : 0;
  const newUtilizationPct = limit > 0 ? Math.round((newDebt / limit) * 100) : 0;

  if (debt <= 0) {
    return {
      currentMonths: 0,
      newMonths: 0,
      monthsSaved: 0,
      currentTotalInterest: 0,
      newTotalInterest: 0,
      interestSaved: 0,
      isFullPayoff: true,
      isNeverPaidOff: false,
      currentUtilizationPct,
      newUtilizationPct: 0,
    };
  }

  const current = simulatePayoff(debt, apr, monthlyPayment, maxMonths);
  const next = simulatePayoff(newDebt, apr, monthlyPayment, maxMonths);

  const monthsSaved =
    current.months === maxMonths && next.months === maxMonths
      ? 0
      : current.months === maxMonths
        ? 0
        : current.months - next.months;

  return {
    currentMonths: current.months,
    newMonths: next.months,
    monthsSaved: Math.max(0, monthsSaved),
    currentTotalInterest: Math.round(current.totalInterest * 100) / 100,
    newTotalInterest: Math.round(next.totalInterest * 100) / 100,
    interestSaved: Math.max(0, Math.round((current.totalInterest - next.totalInterest) * 100) / 100),
    isFullPayoff: effectiveRepay >= debt,
    isNeverPaidOff: current.months >= maxMonths,
    currentUtilizationPct,
    newUtilizationPct: effectiveRepay >= debt ? 0 : newUtilizationPct,
  };
}

interface SimulatedPayoff {
  months: number;
  totalInterest: number;
}

function simulatePayoff(
  debt: number,
  apr: number,
  monthlyPayment: number,
  maxMonths: number,
): SimulatedPayoff {
  if (debt <= 0) return { months: 0, totalInterest: 0 };

  let remaining = debt;
  const monthlyRate = apr / 100 / 12;
  let totalInterest = 0;

  for (let month = 1; month <= maxMonths; month++) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    remaining += interest;
    remaining -= monthlyPayment;

    if (remaining <= 0) {
      return { months: month, totalInterest };
    }
  }

  return { months: maxMonths, totalInterest };
}

export function computeDefaultMonthlyPayment(
  debt: number,
  apr: number,
  nextPaymentAmount?: number,
): number {
  if (nextPaymentAmount && nextPaymentAmount > 0) return nextPaymentAmount;
  if (debt > 0) {
    const interestOnly = debt * (apr / 100) / 12;
    const pctBased = debt * DEFAULT_MONTHLY_PAYMENT_FRACTION;
    return Math.max(interestOnly, pctBased);
  }
  return 0;
}

export function formatMonths(months: number): string {
  if (months === 0) return 'Paid off';
  if (months >= 360) return '10+ years';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${months} mo`;
  if (remainingMonths === 0) return `${years} yr`;
  return `${years} yr ${remainingMonths} mo`;
}

export function formatPayoffDate(monthsFromNow: number, isFullPayoff: boolean): string {
  if (isFullPayoff || monthsFromNow === 0) return 'Now';
  if (monthsFromNow >= 360) return '10+ years';

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1);
  return target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
