/**
 * Pure helper functions for the collateral substitution flow.
 *
 * All functions are side-effect-free and independently testable.
 */
import type {
  CollateralAsset,
  CollateralAssetCategory,
  LtvSnapshot,
  SubstitutionFee,
} from '../types/collateral';

// ─── LTV Calculations ─────────────────────────────────────────────────────────

/**
 * Compute the LTV snapshot for a given collateral asset and loan balance.
 *
 * @param asset         The collateral asset (current or incoming).
 * @param loanBalance   The outstanding loan balance secured by this asset.
 */
export function computeLtvSnapshot(
  asset: CollateralAsset,
  loanBalance: number
): LtvSnapshot {
  const collateralValue = asset.value;
  const ltvRatio = collateralValue > 0 ? loanBalance / collateralValue : 1;
  const isOverLtv = ltvRatio > asset.maxLtvRatio;
  // Available headroom before hitting the max-LTV ceiling, in USD.
  const availableHeadroom = collateralValue * asset.maxLtvRatio - loanBalance;

  return {
    loanBalance,
    collateralValue,
    ltvRatio,
    isOverLtv,
    availableHeadroom,
  };
}

/**
 * Express an LTV ratio (0–1) as a percentage string, e.g. "42.5%".
 */
export function fmtLtv(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/**
 * Signed LTV delta between the incoming and outgoing snapshots,
 * expressed in percentage points, e.g. "+5.2pp" or "−3.1pp".
 */
export function fmtLtvDelta(
  outgoing: LtvSnapshot,
  incoming: LtvSnapshot
): { text: string; isImprovement: boolean } {
  const deltaPoints = (incoming.ltvRatio - outgoing.ltvRatio) * 100;
  const isImprovement = deltaPoints < 0; // lower LTV = less risk = improvement
  const sign = deltaPoints > 0 ? '+' : '';
  return {
    text: `${sign}${deltaPoints.toFixed(1)} pp`,
    isImprovement,
  };
}

// ─── Fee Computation ──────────────────────────────────────────────────────────

/** Processing-fee rate applied to the outstanding loan balance. */
const PROCESSING_FEE_RATE = 0.005; // 0.5 %

/** Categories that incur an additional appraisal fee. */
const APPRAISAL_CATEGORIES: CollateralAssetCategory[] = [
  'real_estate',
];

/** Flat appraisal fee in USD for applicable asset categories. */
const APPRAISAL_FEE_USD = 250;

/**
 * Compute the fee structure for a substitution.
 *
 * @param loanBalance     Current outstanding balance.
 * @param incomingAsset   The new collateral being pledged.
 */
export function computeSubstitutionFee(
  loanBalance: number,
  incomingAsset: CollateralAsset
): SubstitutionFee {
  const processingFee = Math.round(loanBalance * PROCESSING_FEE_RATE * 100) / 100;
  const appraisalFee = APPRAISAL_CATEGORIES.includes(incomingAsset.category)
    ? APPRAISAL_FEE_USD
    : undefined;
  const total =
    processingFee + (appraisalFee ?? 0);

  return { processingFee, appraisalFee, total };
}

// ─── Mock Asset Catalogue ─────────────────────────────────────────────────────

/**
 * Mock catalogue of available collateral assets a borrower can substitute
 * into. In production this would come from an API.
 */
export const AVAILABLE_COLLATERAL_ASSETS: CollateralAsset[] = [
  {
    id: 'asset-usdc',
    name: 'USDC Treasury',
    ticker: 'USDC',
    value: 500_000,
    maxLtvRatio: 0.85,
    category: 'crypto',
  },
  {
    id: 'asset-xlm',
    name: 'Stellar Lumens',
    ticker: 'XLM',
    value: 320_000,
    maxLtvRatio: 0.65,
    category: 'crypto',
  },
  {
    id: 'asset-btc',
    name: 'Bitcoin',
    ticker: 'BTC',
    value: 750_000,
    maxLtvRatio: 0.70,
    category: 'crypto',
  },
  {
    id: 'asset-real-estate',
    name: 'Commercial Real Estate',
    value: 1_200_000,
    maxLtvRatio: 0.75,
    category: 'real_estate',
  },
  {
    id: 'asset-ar',
    name: 'Accounts Receivable',
    value: 280_000,
    maxLtvRatio: 0.80,
    category: 'receivables',
  },
  {
    id: 'asset-tbill',
    name: 'US T-Bills',
    ticker: 'TBILL',
    value: 420_000,
    maxLtvRatio: 0.90,
    category: 'treasury',
  },
];

/**
 * Map a collateral string from the canonical `CreditLine.collateral`
 * field to the closest asset in the mock catalogue, for pre-populating
 * the "current" side of the comparison.
 */
export function findAssetByName(name: string | undefined): CollateralAsset | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return AVAILABLE_COLLATERAL_ASSETS.find((a) =>
    a.name.toLowerCase().includes(lower) ||
    lower.includes(a.name.toLowerCase())
  );
}

/**
 * Return the emoji icon for an asset category.
 * Used where a proper SVG icon is not available.
 */
export function categoryIcon(category: CollateralAssetCategory): string {
  switch (category) {
    case 'crypto':      return '🔷';
    case 'real_estate': return '🏢';
    case 'receivables': return '📄';
    case 'treasury':    return '🏛️';
    default:            return '💎';
  }
}
