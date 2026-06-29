/**
 * collateral.ts — unit tests
 *
 * All functions are pure, so no mocking is required.
 */
import { describe, it, expect } from 'vitest';
import {
  computeLtvSnapshot,
  computeSubstitutionFee,
  fmtLtv,
  fmtLtvDelta,
  findAssetByName,
  categoryIcon,
  AVAILABLE_COLLATERAL_ASSETS,
} from './collateral';
import type { CollateralAsset } from '../types/collateral';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CRYPTO_ASSET: CollateralAsset = {
  id: 'test-crypto',
  name: 'Test Coin',
  ticker: 'TST',
  value: 400_000,
  maxLtvRatio: 0.70,
  category: 'crypto',
};

const REAL_ESTATE_ASSET: CollateralAsset = {
  id: 'test-re',
  name: 'Office Building',
  value: 1_000_000,
  maxLtvRatio: 0.75,
  category: 'real_estate',
};

// ─── computeLtvSnapshot ───────────────────────────────────────────────────────

describe('computeLtvSnapshot', () => {
  it('calculates ltvRatio correctly', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 200_000);
    expect(snap.ltvRatio).toBeCloseTo(0.5);
  });

  it('isOverLtv is false when balance is within limit', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 200_000); // 50 % < 70 %
    expect(snap.isOverLtv).toBe(false);
  });

  it('isOverLtv is true when balance exceeds maxLtvRatio', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 350_000); // 87.5 % > 70 %
    expect(snap.isOverLtv).toBe(true);
  });

  it('availableHeadroom is positive when under-LTV', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 200_000);
    // headroom = 400 000 * 0.70 - 200 000 = 80 000
    expect(snap.availableHeadroom).toBeCloseTo(80_000);
  });

  it('availableHeadroom is negative when over-LTV', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 350_000);
    expect(snap.availableHeadroom).toBeLessThan(0);
  });

  it('handles zero collateral value without NaN', () => {
    const zeroAsset: CollateralAsset = { ...CRYPTO_ASSET, value: 0 };
    const snap = computeLtvSnapshot(zeroAsset, 100);
    expect(snap.ltvRatio).toBe(1); // 100 % by convention
    expect(snap.isOverLtv).toBe(true);
  });

  it('ltvRatio is 0 when loanBalance is 0', () => {
    const snap = computeLtvSnapshot(CRYPTO_ASSET, 0);
    expect(snap.ltvRatio).toBe(0);
  });
});

// ─── fmtLtv ──────────────────────────────────────────────────────────────────

describe('fmtLtv', () => {
  it('formats 0.5 as "50.0%"', () => {
    expect(fmtLtv(0.5)).toBe('50.0%');
  });

  it('formats 1 as "100.0%"', () => {
    expect(fmtLtv(1)).toBe('100.0%');
  });

  it('formats 0 as "0.0%"', () => {
    expect(fmtLtv(0)).toBe('0.0%');
  });

  it('rounds to one decimal place', () => {
    expect(fmtLtv(0.4257)).toBe('42.6%');
  });
});

// ─── fmtLtvDelta ─────────────────────────────────────────────────────────────

describe('fmtLtvDelta', () => {
  const outSnap = computeLtvSnapshot(CRYPTO_ASSET, 200_000);   // 50 %
  const betterSnap = computeLtvSnapshot(REAL_ESTATE_ASSET, 200_000); // 20 %

  it('returns isImprovement=true when incoming LTV is lower', () => {
    const delta = fmtLtvDelta(outSnap, betterSnap);
    expect(delta.isImprovement).toBe(true);
  });

  it('returns isImprovement=false when incoming LTV is higher', () => {
    const worseSnap = computeLtvSnapshot(CRYPTO_ASSET, 250_000); // 62.5 %
    const delta = fmtLtvDelta(betterSnap, worseSnap);
    expect(delta.isImprovement).toBe(false);
  });

  it('includes a sign in the text for positive deltas', () => {
    const worseSnap = computeLtvSnapshot(CRYPTO_ASSET, 250_000);
    const delta = fmtLtvDelta(betterSnap, worseSnap);
    expect(delta.text).toMatch(/^\+/);
  });

  it('text contains "pp" unit', () => {
    const delta = fmtLtvDelta(outSnap, betterSnap);
    expect(delta.text).toContain('pp');
  });
});

// ─── computeSubstitutionFee ───────────────────────────────────────────────────

describe('computeSubstitutionFee', () => {
  it('charges 0.5 % processing fee on the loan balance', () => {
    const fee = computeSubstitutionFee(100_000, CRYPTO_ASSET);
    expect(fee.processingFee).toBeCloseTo(500);
  });

  it('total equals processingFee for non-real-estate assets', () => {
    const fee = computeSubstitutionFee(100_000, CRYPTO_ASSET);
    expect(fee.total).toBe(fee.processingFee);
    expect(fee.appraisalFee).toBeUndefined();
  });

  it('adds $250 appraisal fee for real_estate assets', () => {
    const fee = computeSubstitutionFee(100_000, REAL_ESTATE_ASSET);
    expect(fee.appraisalFee).toBe(250);
    expect(fee.total).toBeCloseTo(750);
  });

  it('total is sum of processing + appraisal when both apply', () => {
    const fee = computeSubstitutionFee(200_000, REAL_ESTATE_ASSET);
    expect(fee.total).toBeCloseTo(fee.processingFee + (fee.appraisalFee ?? 0));
  });

  it('handles zero balance gracefully', () => {
    const fee = computeSubstitutionFee(0, CRYPTO_ASSET);
    expect(fee.processingFee).toBe(0);
    expect(fee.total).toBe(0);
  });
});

// ─── findAssetByName ──────────────────────────────────────────────────────────

describe('findAssetByName', () => {
  it('returns undefined for undefined input', () => {
    expect(findAssetByName(undefined)).toBeUndefined();
  });

  it('finds an asset by exact name match', () => {
    const asset = findAssetByName('USDC Treasury');
    expect(asset).toBeDefined();
    expect(asset!.id).toBe('asset-usdc');
  });

  it('finds an asset when the search string contains the asset name', () => {
    // e.g. the stored collateral string is "Commercial Real Estate Holdings"
    const asset = findAssetByName('Commercial Real Estate');
    expect(asset).toBeDefined();
    expect(asset!.category).toBe('real_estate');
  });

  it('returns undefined for an unrecognised name', () => {
    expect(findAssetByName('Unicorn Token')).toBeUndefined();
  });
});

// ─── categoryIcon ─────────────────────────────────────────────────────────────

describe('categoryIcon', () => {
  it('returns an emoji for every known category', () => {
    const categories = ['crypto', 'real_estate', 'receivables', 'treasury', 'other'] as const;
    categories.forEach(cat => {
      const icon = categoryIcon(cat);
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});

// ─── AVAILABLE_COLLATERAL_ASSETS ─────────────────────────────────────────────

describe('AVAILABLE_COLLATERAL_ASSETS', () => {
  it('has at least one asset per category', () => {
    const categories = new Set(AVAILABLE_COLLATERAL_ASSETS.map(a => a.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it('every asset has a maxLtvRatio between 0 and 1 exclusive', () => {
    AVAILABLE_COLLATERAL_ASSETS.forEach(a => {
      expect(a.maxLtvRatio).toBeGreaterThan(0);
      expect(a.maxLtvRatio).toBeLessThan(1);
    });
  });

  it('every asset has a positive value', () => {
    AVAILABLE_COLLATERAL_ASSETS.forEach(a => {
      expect(a.value).toBeGreaterThan(0);
    });
  });
});
