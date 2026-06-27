/**
 * Types for the collateral substitution flow.
 *
 * Collateral assets are the on-chain or off-chain holdings a borrower
 * pledges against a credit line. The substitution flow lets a borrower
 * swap the currently-pledged asset for a new one, showing a side-by-side
 * LTV comparison and the processing fee before they confirm.
 */

/**
 * Category of a collateral asset. Drives the icon rendered on the
 * comparison card and any category-specific LTV floor rules the UI
 * surfaces as warnings.
 */
export type CollateralAssetCategory =
  | 'crypto'
  | 'real_estate'
  | 'receivables'
  | 'treasury'
  | 'other';

/**
 * A single collateral asset — either the currently-pledged one or a
 * candidate for substitution.
 */
export interface CollateralAsset {
  /** Stable identifier. For mock data this mirrors the credit-line id. */
  id: string;
  /** Human-readable name shown on the comparison card. */
  name: string;
  /** Estimated fair-market value in USD. */
  value: number;
  /** Maximum Loan-To-Value ratio permitted for this asset type (0–1). */
  maxLtvRatio: number;
  /** Coarse asset category for icon selection and UX copy. */
  category: CollateralAssetCategory;
  /** Optional ticker / contract-address shown as a secondary label. */
  ticker?: string;
}

/**
 * Computed LTV metrics derived from a `CollateralAsset` and the
 * outstanding loan balance. Used to drive the comparison cards.
 */
export interface LtvSnapshot {
  /** Current drawn balance secured by this collateral. */
  loanBalance: number;
  /** Collateral fair-market value. */
  collateralValue: number;
  /**
   * Effective LTV ratio — `loanBalance / collateralValue`.
   * Expressed as a fraction (e.g. 0.42 = 42 %).
   */
  ltvRatio: number;
  /**
   * True when `ltvRatio` exceeds the asset's `maxLtvRatio`.
   * The UI surfaces a warning when the *incoming* asset is over-LTV.
   */
  isOverLtv: boolean;
  /**
   * Headroom before the collateral becomes over-LTV, in USD.
   * Negative when already over-LTV.
   */
  availableHeadroom: number;
}

/**
 * Fee structure returned (or derived) for a substitution operation.
 */
export interface SubstitutionFee {
  /** Processing fee in USD. */
  processingFee: number;
  /** Optional appraisal fee in USD (e.g. for real estate). */
  appraisalFee?: number;
  /** Total combined fee. */
  total: number;
}

/**
 * The three steps inside the collateral substitution modal.
 *
 * - `select`   — user picks the incoming collateral from the list
 * - `review`   — side-by-side comparison of current vs. new, LTV delta, fee
 * - `confirm`  — irreversible-action gate; user types to confirm and submits
 */
export type SubstitutionStep = 'select' | 'review' | 'confirm';

/**
 * Outcome states after the network submission in the confirm step.
 */
export type SubstitutionStatus = 'idle' | 'pending' | 'success' | 'error';
