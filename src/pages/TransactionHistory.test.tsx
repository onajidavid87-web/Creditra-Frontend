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

  it("renders type, date, and amount filter chips as labeled pressed toggle groups", () => {
    renderTransactionHistory();

    const typeGroup = screen.getByRole("group", { name: /type/i });
    const dateGroup = screen.getByRole("group", { name: /date range/i });
    const amountGroup = screen.getByRole("group", { name: /amount range/i });

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

    expect(
      within(amountGroup).getByRole("button", { name: "All amounts" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(amountGroup).getByRole("button", { name: "Under $5k" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$5k-$25k" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(amountGroup).getByRole("button", { name: "$25k+" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Custom range" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the polite result count when quick amount chips change", () => {
    renderTransactionHistory();

    expect(screen.getByText("28 transactions shown")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Under $5k" }));

    expect(
      screen
        .getByRole("button", { name: "Under $5k" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByText("8 transactions shown")).toBeTruthy();
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

  it("opens custom date inputs when Custom is selected", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("applies a custom amount range from the modal", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Custom range" }));

    expect(
      screen.getByRole("dialog", { name: /choose a custom amount range/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Minimum amount"), {
      target: { value: "10000" },
    });
    fireEvent.change(screen.getByLabelText("Maximum amount"), {
      target: { value: "20000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /apply range/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("3 transactions shown")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /custom: min \$10,000 · max \$20,000/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
