/**
 * KYC (Know Your Customer) domain types.
 *
 * The verification flow is a linear sequence of steps. Each step has a
 * status that drives the icon, colour, and whether "Resume" lands on it.
 * All state is owned by KycContext and persisted to localStorage so the
 * user's progress survives page refreshes.
 */

// ─── Step identifiers ─────────────────────────────────────────────────────────

/**
 * Canonical step IDs in the order they appear in the drawer list.
 * Adding a step here is the only change needed to extend the flow.
 */
export type KycStepId =
  | 'identity'
  | 'address'
  | 'documents'
  | 'selfie'
  | 'review';

// ─── Step status ──────────────────────────────────────────────────────────────

/**
 * Lifecycle of a single KYC step.
 *
 * - `not_started`  — user has not interacted yet (greyed out)
 * - `in_progress`  — partially completed or the current active step
 * - `completed`    — all required fields/uploads accepted
 * - `failed`       — verification rejected; user must re-submit
 * - `pending`      — submitted, awaiting backend review
 */
export type KycStepStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'pending';

// ─── Overall KYC status ───────────────────────────────────────────────────────

/**
 * Coarse overall status derived from the individual step statuses.
 * Drives the badge shown on the header trigger button.
 */
export type KycOverallStatus =
  | 'not_started'   // nothing touched
  | 'in_progress'   // at least one step started, not all done
  | 'under_review'  // all steps submitted, waiting for approval
  | 'approved'      // all steps completed and accepted
  | 'rejected';     // one or more steps failed after review

// ─── Step shape ───────────────────────────────────────────────────────────────

/** Display-facing metadata for a single KYC step. */
export interface KycStep {
  id: KycStepId;
  /** Short label rendered in the step list. */
  label: string;
  /** One-sentence description shown below the label. */
  description: string;
  status: KycStepStatus;
  /**
   * ISO 8601 timestamp of the last time this step's status changed.
   * Undefined for `not_started`.
   */
  updatedAt?: string;
}

// ─── Persisted slice ──────────────────────────────────────────────────────────

/**
 * The shape stored in localStorage under `creditra_kyc`.
 * Versioned so future migrations can be applied cleanly.
 */
export interface KycPersistedState {
  version: 1;
  steps: KycStep[];
  /** ISO 8601 — when the user last interacted with the KYC flow. */
  lastUpdated: string;
}
