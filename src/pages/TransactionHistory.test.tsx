import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { TransactionHistory } from "./TransactionHistory";

const renderTransactionHistory = (initialEntries: string[] = ["/transactions"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TransactionHistory />
    </MemoryRouter>,
  );
};

describe("TransactionHistory", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-20T12:00:00Z"));
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
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
    const { container } = renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const noResultsHeading = screen.getByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsHeading).toBeTruthy();

    // Check NoDataGraph illustration renders in the empty state
    const illustration = container.querySelector(
      ".empty-state .empty-state-illustration",
    );
    expect(illustration).toBeInTheDocument();

    // Check "no transactions yet" message is NOT present
    const noTransactionsMsg = screen.queryByText(/no transactions yet/i);
    expect(noTransactionsMsg).toBeFalsy();

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    const noResultsAfterClear = screen.queryByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsAfterClear).toBeFalsy();

    const resultCount = screen.getByText("28 transactions shown");
    expect(resultCount).toBeTruthy();

    const allButtons = screen.getAllByRole("button", { name: "All" });
    expect(allButtons[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("opens custom date inputs when Custom is selected", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  // ── A11Y-004: table caption tests ──────────────────────────────────────────

  it("renders a visually-hidden caption on the transaction table", () => {
    renderTransactionHistory();
    // The table is identified by its caption text via getByRole
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toBeInTheDocument();
  });

  it("default caption describes unfiltered scope and result count", () => {
    renderTransactionHistory();
    const table = screen.getByRole("table", { name: /transaction history/i });
    // No filter qualifiers in default state
    expect(table).toHaveAccessibleName(/transaction history — \d+ results?/i);
    // Confirm no filter fragment is included
    expect(table.querySelector("caption")?.textContent).not.toMatch(/filtered by/i);
  });

  it("caption updates when a type filter is applied", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Draw" }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toHaveAccessibleName(/filtered by draw/i);
  });

  it("caption updates when a date preset is applied", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table).toHaveAccessibleName(/last 7 days/i);
  });

  it("caption includes multiple active filter qualifiers simultaneously", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Repay" }));
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    const caption = screen
      .getByRole("table", { name: /transaction history/i })
      .querySelector("caption");
    expect(caption?.textContent).toMatch(/filtered by repayment/i);
    expect(caption?.textContent).toMatch(/last 30 days/i);
  });

  it("caption reverts to unfiltered description after clearing filters", () => {
    renderTransactionHistory();
    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    const table = screen.getByRole("table", { name: /transaction history/i });
    expect(table.querySelector("caption")?.textContent).not.toMatch(
      /filtered by/i,
    );
  });
});
