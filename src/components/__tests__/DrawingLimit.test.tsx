import { render, screen } from "@testing-library/react";
import { DrawingLimit } from "../DrawingLimit";

describe("DrawingLimit", () => {
  it("renders the drawn and available amounts correctly", () => {
    render(<DrawingLimit drawnAmount={3000} totalLimit={10000} />);

    expect(screen.getByText("Drawn: $3,000.00")).toBeInTheDocument();
    expect(screen.getByText("Available: $7,000.00")).toBeInTheDocument();
  });

  it("shows the correct percentage when under 50%", () => {
    render(<DrawingLimit drawnAmount={4000} totalLimit={10000} />);

    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("shows amber color for medium utilization (50-80%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={7000} totalLimit={10000} />
    );

    // Check for amber classes
    const bar = container.querySelector(".bg-amber-500");
    expect(bar).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("shows red color for high utilization (>80%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={9000} totalLimit={10000} />
    );

    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("shows exceeded state when drawn exceeds limit", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={12000} totalLimit={10000} />
    );

    expect(screen.getByText("Exceeded")).toBeInTheDocument();
    expect(screen.getByText("Overdrawn by $2,000.00")).toBeInTheDocument();
  });

  it("shows green color for low utilization (<50%)", () => {
    const { container } = render(
      <DrawingLimit drawnAmount={3000} totalLimit={10000} />
    );

    const bar = container.querySelector(".bg-green-500");
    expect(bar).toBeInTheDocument();
  });

  it("handles zero limit gracefully", () => {
    render(<DrawingLimit drawnAmount={0} totalLimit={0} />);

    expect(screen.getByText("Drawn: $0.00")).toBeInTheDocument();
    expect(screen.getByText("Available: $0.00")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("has accessible labels and roles", () => {
    render(<DrawingLimit drawnAmount={5000} totalLimit={10000} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("uses custom labels when provided", () => {
    render(
      <DrawingLimit
        drawnAmount={5000}
        totalLimit={10000}
        drawnLabel="Used"
        availableLabel="Remaining"
      />
    );

    expect(screen.getByText("Used: $5,000.00")).toBeInTheDocument();
    expect(screen.getByText("Remaining: $5,000.00")).toBeInTheDocument();
  });
});