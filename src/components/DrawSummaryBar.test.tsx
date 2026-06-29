import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DrawSummaryBar } from "./DrawSummaryBar";
import type { CreditLine } from "@/types/draw-credit.types";

/**
 * Sample credit line for unit tests — chosen to exercise the "Standard"
 * risk band so the test asserts a deterministic APR of about 11.5%.
 */
const standardLine: CreditLine = {
  id: "cl-standard-001",
  name: "Business Line of Credit",
  limit: 50000,
  available: 35000,
  utilization: 30,
  riskBand: "Standard",
  termMonths: 24,
};

describe("DrawSummaryBar", () => {
  describe("visibility", () => {
    it("renders nothing when no credit line is selected", () => {
      const { container } = render(
        <DrawSummaryBar creditLine={null} amount={1000} step="amount" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing on the `select` step even with a line", () => {
      const { container } = render(
        <DrawSummaryBar creditLine={standardLine} amount={0} step="select" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing on the `confirm` step (avoids double sticky bars over ConfirmationStep)", () => {
      const { container } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={5000}
          step="confirm"
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing on the terminal `status` step", () => {
      const { container } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={5000}
          step="status"
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("shows the bar on the `amount` step once a line is selected", () => {
      const { container } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );
      expect(container.firstChild).not.toBeNull();
    });

    it("does not crash when visibility toggles across renders (rules of hooks)", () => {
      // Mount visible, then navigate to invisible, then back to visible.
      // Without correct hook ordering this throws "Rendered more hooks
      // than during the previous render."
      const { rerender, container } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );
      expect(container.firstChild).not.toBeNull();

      // amount → confirm (invisible): bar disappears
      rerender(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="confirm"
        />,
      );
      expect(container.firstChild).toBeNull();

      // confirm → amount (visible again): bar reappears
      rerender(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1500}
          step="amount"
        />,
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("rendered figures", () => {
    it("shows formatted amount, APR (rounded), and total cost (amount + fee)", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={10000}
          step="amount"
        />,
      );

      // Amount tile shows the human-formatted money string.
      expect(screen.getByTestId("draw-summary-amount")).toHaveTextContent(
        /\$10,000/,
      );

      // APR tile shows a numeric value followed by "%".
      const aprTile = screen.getByTestId("draw-summary-apr");
      expect(aprTile.textContent).toMatch(/^\d+(\.\d+)?%$/);

      // Total cost = amount + fee = $10,000 + $100 (1 %) = $10,100.
      expect(screen.getByTestId("draw-summary-total")).toHaveTextContent(
        /\$10,100/,
      );
    });

    it("renders $0.00 totals and 0% APR gracefully when amount is zero", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={0}
          step="amount"
        />,
      );

      expect(screen.getByTestId("draw-summary-amount")).toHaveTextContent("$0");
      expect(screen.getByTestId("draw-summary-total")).toHaveTextContent("$0");
    });

    it("clamps a negative amount prop to $0 instead of producing negative numbers", () => {
      const { container } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={-500}
          step="amount"
        />,
      );

      expect(container.firstChild).not.toBeNull();
      expect(screen.getByTestId("draw-summary-amount")).toHaveTextContent("$0");
      expect(screen.getByTestId("draw-summary-total")).toHaveTextContent("$0");
    });
  });

  describe("accessibility (WCAG 2.1 AA)", () => {
    it("exposes a labelled region landmark", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );

      const region = screen.getByRole("region", { name: /draw summary/i });
      expect(region).toBeInTheDocument();
    });

    it("uses definition-list semantics with labelled terms for SR navigation", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );

      const captions = screen.getAllByRole("term");
      const values = screen.getAllByRole("definition");

      expect(captions).toHaveLength(3);
      expect(values).toHaveLength(3);

      const captionTexts = captions.map((node) => node.textContent);
      expect(captionTexts).toEqual(
        expect.arrayContaining(["Amount", "APR", "Total cost"]),
      );
    });

    it("renders the live region with role=status, aria-live=polite, and atomic updates", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );

      const live = screen.getByTestId("draw-summary-live");
      expect(live).toHaveAttribute("role", "status");
      expect(live).toHaveAttribute("aria-live", "polite");
      expect(live).toHaveAttribute("aria-atomic", "true");
      expect(live).toHaveClass("sr-only");
    });
  });

  describe("debounced live-region announcement", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not update the live region text until 400 ms after a settled amount", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );

      // After mount + a tick of fake time, the debounced value equals the
      // initial mount value (1000).
      act(() => {
        vi.advanceTimersByTime(450);
      });
      const live = screen.getByTestId("draw-summary-live");
      expect(live.textContent).toMatch(/1,000/);
    });

    it("coalesces rapid amount edits into one final announcement", () => {
      const { rerender } = render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={0}
          step="amount"
        />,
      );

      // First, let the initial empty-string debounce settle.
      act(() => {
        vi.advanceTimersByTime(450);
      });

      // Simulate rapid typing: 1 → 10 → 100 → 1000 within the same tick.
      // Without the debounce, an SR polite region would queue four
      // announcements; with it, the trailing edge fires once with 1000.
      for (const value of [1, 10, 100, 1000]) {
        rerender(
          <DrawSummaryBar
            creditLine={standardLine}
            amount={value}
            step="amount"
          />,
        );
        // Each rerender resets the debounce timer; no advancement.
      }

      // Just before the debounce settles, the live region text still
      // reflects the previous value, not the latest amount.
      act(() => {
        vi.advanceTimersByTime(399);
      });
      let live = screen.getByTestId("draw-summary-live");
      expect(live.textContent).not.toMatch(/1,000/);

      // Advance past the 400 ms debounce window — the trailing edge
      // commits the LAST value to the live region.
      act(() => {
        vi.advanceTimersByTime(50);
      });
      live = screen.getByTestId("draw-summary-live");
      expect(live.textContent).toMatch(/1,000/);
    });
  });

  describe("responsive / structural", () => {
    it("sets a fixed-position region anchored to the viewport", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={1000}
          step="amount"
        />,
      );

      const region = screen.getByRole("region", { name: /draw summary/i });
      expect(region).toHaveClass("draw-summary-bar");
      expect(region.tagName.toLowerCase()).toBe("aside");
    });

    it("tags the bar with the visible wizard step for styling hooks", () => {
      render(
        <DrawSummaryBar
          creditLine={standardLine}
          amount={0}
          step="amount"
        />,
      );

      const region = screen.getByTestId("draw-summary-bar");
      expect(region).toHaveAttribute("data-step", "amount");
    });
  });
});
