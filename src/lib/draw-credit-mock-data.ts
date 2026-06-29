import { CreditLine } from "@/types/draw-credit.types";

/**
 * Mock credit lines used by the draw-credit wizard while the backend
 * indexer is being built.
 *
 * Three intentionally distinct utilisation levels are included so the
 * wizard exercises the full validation matrix in
 * `src/utils/amountValidation.ts` without needing a network round-trip:
 *
 * - `cl-001` (30 %) — low utilisation; should produce `success` messages
 * - `cl-002` (55 %) — medium utilisation; near the recommended-reserve floor
 * - `cl-003` (84 %) — high utilisation; reserve warnings expected
 *
 * Replace this export with a backend fetch in the same import position
 * to swap mocks for real data.
 */
export const mockCreditLines: CreditLine[] = [
  {
    id: "cl-001",
    name: "Business Line of Credit",
    limit: 50000,
    available: 35000,
    utilization: 30,
    riskBand: "Standard",
    termMonths: 24,
  },
  {
    id: "cl-002",
    name: "Equipment Finance",
    limit: 100000,
    available: 45000,
    utilization: 55,
    riskBand: "Prime",
    termMonths: 18,
  },
  {
    id: "cl-003",
    name: "Working Capital",
    limit: 75000,
    available: 12000,
    utilization: 84,
    riskBand: "Watch",
    termMonths: 12,
  },
];
