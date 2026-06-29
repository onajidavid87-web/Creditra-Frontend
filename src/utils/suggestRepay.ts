export interface SuggestRepayParams {
  totalDue: number;
  limit: number;
  walletBalance: number;
  apr: number;
  nextPaymentAmount?: number;
}

const getWalletReserveFloor = (walletBalance: number) =>
  Math.min(walletBalance, Math.max(100, Math.round(walletBalance * 0.1)));

const TARGET_UTILIZATION = 0.5;

export function suggestRepayAmount(
  totalDue: number,
  limit: number,
  walletBalance: number,
  apr: number,
  nextPaymentAmount?: number,
): number {
  if (totalDue <= 0 || walletBalance <= 0) return 0;

  const amountToTargetUtil = Math.max(0, totalDue - limit * TARGET_UTILIZATION);
  const monthlyInterest = totalDue * (apr / 100) / 12;
  const minimumSuggested = nextPaymentAmount ?? Math.max(monthlyInterest, 1);

  let suggested = amountToTargetUtil > 0
    ? Math.max(amountToTargetUtil, minimumSuggested)
    : minimumSuggested;

  suggested = Math.min(suggested, totalDue);

  const walletReserve = getWalletReserveFloor(walletBalance);
  const maxAffordable = Math.max(0, walletBalance - walletReserve);
  suggested = Math.min(suggested, maxAffordable);

  suggested = Math.max(suggested, 0);

  return Math.round(suggested * 100) / 100;
}
