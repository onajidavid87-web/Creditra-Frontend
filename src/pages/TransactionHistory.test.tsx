import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "../components/notifications/ToastContainer";
import { NotificationProvider } from "../context/NotificationContext";
import { TransactionHistory } from "./TransactionHistory";

const renderTransactionHistory = () => {
  render(
    <NotificationProvider>
      <BrowserRouter>
        <TransactionHistory />
        <ToastContainer />
      </BrowserRouter>
    </NotificationProvider>,
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

    const resultCountBefore = screen.getByText("28 transactions shown");
    expect(resultCountBefore).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    expect(
      screen.getByRole("button", { name: "7d" }).getAttribute("aria-pressed"),
    ).toBe("true");

    const resultCountAfter = screen.getByText("3 transactions shown");
    expect(resultCountAfter).toBeTruthy();
  });

  it("shows a no-results state with a clear filters action", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const noResultsHeading = screen.getByRole("heading", {
      name: /no transactions match these filters/i,
    });
    expect(noResultsHeading).toBeTruthy();

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

  it("disables CSV export when the filtered result set is empty and explains why", () => {
    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "Fee" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const exportButton = screen.getByRole("button", { name: /export csv/i });
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute(
      "aria-describedby",
      "transaction-export-help",
    );
    expect(
      screen.getByText(/current filters do not match any transactions/i),
    ).toBeTruthy();
  });

  it("downloads the filtered CSV and shows a polite confirmation toast", () => {
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    renderTransactionHistory();

    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/csv export ready/i)).toBeTruthy();
    expect(screen.getByText(/creditra-transactions-.*\.csv/i)).toBeTruthy();

    const toast = screen
      .getByText(/csv export ready/i)
      .closest('[role="status"]');
    expect(toast).toHaveAttribute("aria-live", "polite");

    anchorClick.mockRestore();
  });
});
