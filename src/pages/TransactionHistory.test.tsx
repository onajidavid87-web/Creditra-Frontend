import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { TransactionHistory } from "./TransactionHistory";

const renderTransactionHistory = () => {
  render(
    <BrowserRouter>
      <TransactionHistory />
    </BrowserRouter>,
  );
};

describe("TransactionHistory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders type and date filter chips as labeled pressed toggle groups", () => {
    renderTransactionHistory();

    const typeGroup = screen.getByRole("group", { name: /type/i });
    const dateGroup = screen.getByRole("group", { name: /date range/i });

    expect(
      within(typeGroup).getByRole("button", { name: "All" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(typeGroup).getByRole("button", { name: "Draw" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Repay" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Fee" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(typeGroup).getByRole("button", { name: "Interest" }),
    ).toHaveAttribute("aria-pressed", "false");

    expect(
      within(dateGroup).getByRole("button", { name: "Today" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "7d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "30d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "90d" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(dateGroup).getByRole("button", { name: "Custom" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("updates the polite result count when filters change", () => {
    renderTransactionHistory();

    // Check initial result count
    const resultCountBefore = screen.getByText("28 transactions shown");
    expect(resultCountBefore).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    // Verify the 7d filter is active
    expect(
      screen.getByRole("button", { name: "7d" }).getAttribute("aria-pressed"),
    ).toBe("true");

    // Check updated result count after filtering
    const resultCountAfter = screen.getByText("3 transactions shown");
    expect(resultCountAfter).toBeTruthy();
  });

  it("shows a no-results state with a clear filters action", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    // Check no-results state appears
    const noResultsHeading = screen.getByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsHeading).toBeTruthy();

    // Check "no transactions yet" message is NOT present
    const noTransactionsMsg = screen.queryByText(/no transactions yet/i);
    expect(noTransactionsMsg).toBeFalsy();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    // No-results state should disappear
    const noResultsAfterClear = screen.queryByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsAfterClear).toBeFalsy();

    // Result count should be restored
    const resultCount = screen.getByText("28 transactions shown");
    expect(resultCount).toBeTruthy();

    // First "All" button (type filter) should be active
    const allButtons = screen.getAllByRole("button", { name: "All" });
    expect(allButtons[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("renders amount range filter chips with correct aria-pressed states", () => {
    renderTransactionHistory();

    const amountGroup = screen.getByRole("group", { name: /amount/i });

    expect(
      within(amountGroup).getByRole("button", { name: "All Amounts" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(amountGroup).getByRole("button", { name: "<$100" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$100–$1,000" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: ">$1,000" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("amount filter stacks with existing type and date filters (AND)", () => {
    renderTransactionHistory();

    // Start: 28 transactions
    expect(screen.getByText("28 transactions shown")).toBeTruthy();

    // Apply >$1,000 amount filter → 22 transactions (all >1000)
    fireEvent.click(screen.getByRole("button", { name: ">$1,000" }));
    expect(screen.getByText("22 transactions shown")).toBeTruthy();

    // Stack with Fee type filter → 0 transactions (no Fees >1000)
    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    expect(screen.getByText("0 transactions shown")).toBeTruthy();

    // Clear filters restores count
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(screen.getByText("28 transactions shown")).toBeTruthy();
  });

  it("opens custom date inputs when Custom is selected", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });
});
