import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ContinuePrompt } from "../ContinuePrompt";
import type { CreditLine } from "../../types/creditLine";

const { mockReadJson, mockWriteJson, mockStorageStore } = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return {
    mockReadJson: vi.fn((key: string, fallback: unknown) => {
      const val = store[key];
      return val !== undefined ? val : fallback;
    }),
    mockWriteJson: vi.fn((key: string, value: unknown) => {
      store[key] = value;
    }),
    mockStorageStore: store,
  };
});

vi.mock("../../utils/storage", () => ({
  readJson: mockReadJson,
  writeJson: mockWriteJson,
}));

const activeLine: CreditLine = {
  id: "CL-001",
  name: "Test Line",
  status: "Active",
  limit: 100000,
  utilized: 15000,
  apr: 8.5,
  riskScore: 700,
  openedAt: "2025-01-01",
  updatedAt: "2025-06-01T00:00:00Z",
  transactions: [],
  statusHistory: [{ status: "Active", date: "2025-01-01" }],
};

const activeLineWithUtil: CreditLine = {
  ...activeLine,
  id: "CL-002",
  name: "High Util Line",
  limit: 100000,
  utilized: 85000,
  transactions: [
    {
      id: "TX-001",
      type: "Draw",
      amount: 85000,
      date: "2025-05-01T00:00:00Z",
      status: "Completed",
    },
  ],
};

const suspendedLine: CreditLine = {
  ...activeLine,
  id: "CL-003",
  name: "Suspended Line",
  status: "Suspended",
  utilized: 45000,
};

const lineWithPendingTx: CreditLine = {
  ...activeLine,
  id: "CL-004",
  name: "Pending Line",
  utilized: 15000,
  transactions: [
    {
      id: "TX-PND",
      type: "Interest",
      amount: 500,
      date: "2025-06-15T00:00:00Z",
      note: "Pending interest",
      status: "Pending",
    },
  ],
};

const lineWithUpcomingPayment: CreditLine = {
  ...activeLine,
  id: "CL-005",
  name: "Payment Due Line",
  utilized: 25000,
  nextPaymentDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  nextPaymentAmount: 1200,
};

function renderPrompt(creditLines: CreditLine[]) {
  return render(
    <BrowserRouter>
      <ContinuePrompt creditLines={creditLines} />
    </BrowserRouter>,
  );
}

describe("ContinuePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorageStore).forEach((k) => delete mockStorageStore[k]);
  });

  it("renders nothing when there are no in-progress items", () => {
    renderPrompt([activeLine]);
    expect(screen.queryByTestId("continue-prompt")).not.toBeInTheDocument();
  });

  it("renders pending transaction item", () => {
    renderPrompt([lineWithPendingTx]);
    expect(screen.getByTestId("continue-prompt")).toBeInTheDocument();
    expect(screen.getByText("Pending Transaction")).toBeInTheDocument();
    expect(
      screen.getByText(/Pending interest for Pending Line/),
    ).toBeInTheDocument();
  });

  it("renders suspended line item", () => {
    renderPrompt([suspendedLine]);
    expect(screen.getByText("Suspended Credit Line")).toBeInTheDocument();
    expect(
      screen.getByText(/Suspended Line needs repayment/),
    ).toBeInTheDocument();
  });

  it("renders high utilization item", () => {
    renderPrompt([activeLineWithUtil]);
    expect(screen.getByText("High Utilization")).toBeInTheDocument();
    expect(
      screen.getByText(/High Util Line is at 85%/),
    ).toBeInTheDocument();
  });

  it("renders upcoming payment item", () => {
    renderPrompt([lineWithUpcomingPayment]);
    expect(screen.getByText("Upcoming Payment")).toBeInTheDocument();
    expect(
      screen.getByText(/due in 3 days for Payment Due Line/),
    ).toBeInTheDocument();
  });

  it("renders available credit item for lines with zero utilization", () => {
    const zeroUtilLine: CreditLine = {
      ...activeLine,
      id: "CL-AVAIL",
      name: "Available Line",
      utilized: 0,
    };
    renderPrompt([zeroUtilLine]);
    expect(screen.getByText("Credit Available")).toBeInTheDocument();
    expect(
      screen.getByText(/Available Line has \$100,000 ready to draw/),
    ).toBeInTheDocument();
  });

  it("renders multiple items when multiple conditions are met", () => {
    renderPrompt([
      activeLine,
      activeLineWithUtil,
      suspendedLine,
      lineWithPendingTx,
    ]);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("does not render when dismissed in storage", () => {
    mockStorageStore["continue_prompt_dismissed"] = true;
    renderPrompt([activeLineWithUtil, suspendedLine]);
    expect(screen.queryByTestId("continue-prompt")).not.toBeInTheDocument();
  });

  it("persists dismissal and hides on dismiss button click", () => {
    renderPrompt([activeLineWithUtil, suspendedLine]);
    expect(screen.getByTestId("continue-prompt")).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText("Dismiss continue prompt");
    fireEvent.click(dismissBtn);

    expect(mockWriteJson).toHaveBeenCalledWith(
      "continue_prompt_dismissed",
      true,
    );
    expect(
      screen.queryByTestId("continue-prompt"),
    ).not.toBeInTheDocument();
  });

  it("has accessible dismiss button with correct aria-label and type", () => {
    renderPrompt([activeLineWithUtil]);
    const btn = screen.getByLabelText("Dismiss continue prompt");
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute("type")).toBe("button");
  });

  it("action links point to correct routes", () => {
    const zeroUtilLine: CreditLine = {
      ...activeLine,
      id: "CL-AVAIL",
      name: "Available Line",
      utilized: 0,
    };
    renderPrompt([zeroUtilLine, suspendedLine]);
    const drawLink = screen.getByText("Draw Credit →");
    expect(drawLink.closest("a")).toHaveAttribute("href", "/draw-credit");

    const viewLinks = screen.getAllByText("View Credit Lines →");
    viewLinks.forEach((link) => {
      expect(link.closest("a")).toHaveAttribute("href", "/credit-lines");
    });
  });

  it("has role list on items container", () => {
    renderPrompt([activeLine, suspendedLine]);
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(1);
  });

  it("renders title and subtitle", () => {
    renderPrompt([activeLineWithUtil]);
    expect(
      screen.getByText("Continue Where You Left Off"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pick up where you stopped"),
    ).toBeInTheDocument();
  });
});
