import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationStep } from "./ConfirmationStep";

const creditLine = {
  id: "cl-001",
  name: "Business Line of Credit",
  limit: 50000,
  available: 35000,
  utilization: 30,
  riskBand: "Standard" as const,
  termMonths: 24,
};

describe("ConfirmationStep", () => {
  it("toggles the Why this APR drawer with aria-expanded and shows current pricing drivers", async () => {
    const user = userEvent.setup();

    render(
      <ConfirmationStep
        creditLine={creditLine}
        amount={10000}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", { name: /why this apr\?/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText(/apr explanation/i)).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText(/apr explanation/i)).toBeInTheDocument();
    expect(screen.getByText(/current value: standard\./i)).toBeInTheDocument();
    expect(screen.getByText(/current value: 30%\./i)).toBeInTheDocument();
    expect(screen.getByText(/current value: 24 months\./i)).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText(/apr explanation/i)).not.toBeInTheDocument();
  });
});
