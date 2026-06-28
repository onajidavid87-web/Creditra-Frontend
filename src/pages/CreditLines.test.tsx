import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import CreditLines from './CreditLines';

// CL-2023-004 ("Emergency Reserve Line") is the only Defaulted entry in MOCK_CREDIT_LINES
const DEFAULTED_ID = 'CL-2023-004';
const DEFAULTED_NAME = 'Emergency Reserve Line';

// All non-defaulted IDs from mock data
const NON_DEFAULTED_IDS = ['CL-2024-001', 'CL-2024-002', 'CL-2023-003', 'CL-2022-005', 'CL-2025-006'];

function renderCreditLines() {
  return render(
    <MemoryRouter>
      <CreditLines />
    </MemoryRouter>,
  );
}

describe('CreditLines — Defaulted row visual treatment (issue #223)', () => {
  // ─── Card view ────────────────────────────────────────────────────────────

  describe('card view', () => {
    it('applies cl-row--defaulted class to the Defaulted card', () => {
      renderCreditLines();

      // The defaulted card carries aria-label — use it as a stable selector
      const defaultedCard = screen.getByLabelText(`Credit line ${DEFAULTED_ID} is defaulted`);
      expect(defaultedCard).toHaveClass('cl-row--defaulted');
    });

    it('does NOT apply cl-row--defaulted class to non-defaulted cards', () => {
      renderCreditLines();

      // Find all cards that do NOT have the defaulted aria-label
      const allHeadings = screen.getAllByRole('heading', { level: 3 });

      allHeadings
        .filter(h => h.textContent !== DEFAULTED_NAME)
        .forEach(heading => {
          // Walk up to the card root (the div with cl-card)
          const card = heading.closest('.cl-card');
          expect(card).not.toHaveClass('cl-row--defaulted');
        });
    });

    it('sets aria-label on the Defaulted card', () => {
      renderCreditLines();

      const defaultedCard = screen.getByLabelText(`Credit line ${DEFAULTED_ID} is defaulted`);
      expect(defaultedCard).toBeInTheDocument();
      expect(defaultedCard).toHaveAttribute(
        'aria-label',
        `Credit line ${DEFAULTED_ID} is defaulted`,
      );
    });

    it('does NOT set aria-label on non-defaulted cards', () => {
      renderCreditLines();

      const allHeadings = screen.getAllByRole('heading', { level: 3 });

      allHeadings
        .filter(h => h.textContent !== DEFAULTED_NAME)
        .forEach(heading => {
          const card = heading.closest('.cl-card');
          expect(card).not.toHaveAttribute('aria-label');
        });
    });
  });

  // ─── Status-filter sanity check ───────────────────────────────────────────

  describe('only Defaulted status gets the treatment', () => {
    it('exactly one card has cl-row--defaulted when all statuses are shown', () => {
      renderCreditLines();

      const defaultedCards = document.querySelectorAll('.cl-row--defaulted');
      expect(defaultedCards).toHaveLength(1);
    });

    it('cl-row--defaulted card contains the correct credit line name', () => {
      renderCreditLines();

      const defaultedCard = document.querySelector('.cl-row--defaulted');
      expect(defaultedCard).not.toBeNull();
      expect(within(defaultedCard as HTMLElement).getByRole('heading', { level: 3 }))
        .toHaveTextContent(DEFAULTED_NAME);
    });
  });
});
