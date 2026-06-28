import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AmountInput } from "./AmountInput";

describe("AmountInput", () => {
  const creditLine = {
    id: "cl-001",
    name: "Business Line of Credit",
    limit: 50000,
    available: 35000,
    utilization: 30,
    riskBand: "Standard" as const,
    termMonths: 24,
  };

  it("connects inline validation messaging to the input with aria-describedby including helper text", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/draw amount/i);
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain("draw-amount-helper");
  });

  it("adds error message ID to aria-describedby when amount exceeds availability", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/draw amount/i) as HTMLInputElement;

    fireEvent.change(input, {
      target: { value: "36000" },
    });

    // Should have both helper and error in aria-describedby
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain("draw-amount-helper");
    expect(describedBy).toContain("draw-amount-error");

    // aria-invalid should be true when there's an error
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows an inline error and keeps continue disabled when the amount exceeds availability", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/draw amount/i), {
      target: { value: "36000" },
    });

    expect(screen.getByText("Exceeds available credit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("displays validation error with danger type when amount is below minimum", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/draw amount/i), {
      target: { value: "0.50" },
    });

    expect(screen.getByText("Minimum amount required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("renders Max button with accessible label", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const maxButton = screen.getByRole("button", {
      name: /set amount to maximum/i,
    });
    expect(maxButton).toBeInTheDocument();
  });

  it("sets amount to maximum available when Max button is clicked", () => {
    const onAmountChange = vi.fn();
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={onAmountChange}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const maxButton = screen.getByRole("button", {
      name: /set amount to maximum/i,
    });
    fireEvent.click(maxButton);

    const input = screen.getByLabelText(/draw amount/i) as HTMLInputElement;
    expect(input.value).toBe(creditLine.available.toString());
  });

  it("shows success message when valid amount is entered", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/draw amount/i), {
      target: { value: "10000" },
    });

    expect(screen.getByText("Draw amount looks good")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("enables continue button only when amount is valid", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/draw amount/i), {
      target: { value: "15000" },
    });

    expect(continueButton).not.toBeDisabled();
  });

  it("sanitizes pasted currency strings (strips $, commas, whitespace)", async () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/draw amount/i) as HTMLInputElement;
    
    // Mock clipboard event
    const pasteEvent = new ClipboardEvent("paste", {
      clipboardData: {
        getData: (type: string) => {
          if (type === "text") return "$1,500.00";
          return "";
        },
      },
    });
    
    fireEvent.paste(input, pasteEvent);
    
    expect(input.value).toBe("1500.00");
    expect(screen.getByText("Pasted value sanitized to $1,500.00")).toBeInTheDocument();
  });

  it("rejects non-numeric pasted text and announces the error", async () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/draw amount/i) as HTMLInputElement;
    
    const pasteEvent = new ClipboardEvent("paste", {
      clipboardData: {
        getData: (type: string) => {
          if (type === "text") return "invalid-amount";
          return "";
        },
      },
    });
    
    fireEvent.paste(input, pasteEvent);
    
    expect(input.value).not.toBe("invalid-amount");
    expect(screen.getByText("Invalid amount pasted. Please enter a numeric value.")).toBeInTheDocument();
  });
});

  it("renders decrease stepper button with accessible label", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const decButton = screen.getByRole("button", {
      name: /decrease amount/i,
    });
    expect(decButton).toBeInTheDocument();
    expect(decButton).toBeDisabled(); // initially 0, can't go below 0
  });

  it("renders increase stepper button with accessible label", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const incButton = screen.getByRole("button", {
      name: /increase amount/i,
    });
    expect(incButton).toBeInTheDocument();
    expect(incButton).not.toBeDisabled();
  });

  it("increments amount by step when increase button is clicked", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const incButton = screen.getByRole("button", {
      name: /increase amount/i,
    });
    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;

    fireEvent.click(incButton);
    expect(input.value).toBe("100");
  });

  it("decrements amount by step when decrease button is clicked", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });

    const decButton = screen.getByRole("button", {
      name: /decrease amount/i,
    });
    fireEvent.click(decButton);
    expect(input.value).toBe("400");
  });

  it("disables decrease button when amount is 0", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const decButton = screen.getByRole("button", {
      name: /decrease amount/i,
    });
    expect(decButton).toBeDisabled();
  });

  it("disables increase button when amount equals available credit", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: creditLine.available.toString() } });

    const incButton = screen.getByRole("button", {
      name: /increase amount/i,
    });
    expect(incButton).toBeDisabled();
  });

  it("does not increment amount beyond available credit", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "34900" } });

    const incButton = screen.getByRole("button", {
      name: /increase amount/i,
    });
    fireEvent.click(incButton);
    expect(input.value).toBe(creditLine.available.toString());
  });

  it("does not decrement amount below 0", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    // A small amount less than STEP_AMOUNT should floor to 0
    fireEvent.change(input, { target: { value: "50" } });
    const decButton = screen.getByRole("button", {
      name: /decrease amount/i,
    });
    fireEvent.click(decButton);
    expect(input.value).toBe("0");
  });

  it("responds to ArrowUp key to increment amount", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("600");
  });

  it("responds to ArrowDown key to decrement amount", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "500" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("400");
  });

  it("sets input step attribute", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/amount to draw/i) as HTMLInputElement;
    expect(input).toHaveAttribute("step", "100");
  });

  it("sets input to invalid state with proper styling when error occurs", () => {
    render(
      <AmountInput
        creditLine={creditLine}
        onAmountChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/draw amount/i) as HTMLInputElement;

    fireEvent.change(input, {
      target: { value: "50000" },
    });

    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
