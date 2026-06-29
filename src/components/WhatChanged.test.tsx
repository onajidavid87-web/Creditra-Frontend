import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { WhatChanged } from "./WhatChanged";

describe("WhatChanged Component", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render when there is no previous value", () => {
    const { container } = render(
      <WhatChanged metricId="total-limit" currentValue={10000} format="currency" label="Total Credit Limit" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when the current value is equal to the previous value", () => {
    localStorage.setItem("creditra_dashboard_values_stable", JSON.stringify({ "total-limit": 10000 }));
    
    const { container } = render(
      <WhatChanged metricId="total-limit" currentValue={10000} format="currency" label="Total Credit Limit" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the trigger and tooltip when the value has changed since last visit", () => {
    // Set a different value from the last visit
    localStorage.setItem("creditra_dashboard_values_stable", JSON.stringify({ "total-limit": 8000 }));

    render(
      <WhatChanged metricId="total-limit" currentValue={10000} format="currency" label="Total Credit Limit" />
    );

    // Should render the trigger (arrow indicating change)
    const trigger = screen.getByLabelText("What changed for Total Credit Limit");
    expect(trigger).toBeInTheDocument();
    
    // Tooltip should be in the document (hidden by default via CSS class, but we can verify text)
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Since last visit:");
    expect(tooltip).toHaveTextContent("Previous:$8,000");
    expect(tooltip).toHaveTextContent("Current:$10,000");
    expect(tooltip).toHaveTextContent("Change:+$2,000");
  });

  it("shows the tooltip on hover", () => {
    localStorage.setItem("creditra_dashboard_values_stable", JSON.stringify({ "total-limit": 8000 }));

    const { container } = render(
      <WhatChanged metricId="total-limit" currentValue={10000} format="currency" label="Total Credit Limit" />
    );

    const wrapper = container.querySelector(".what-changed-wrapper");
    const tooltip = container.querySelector(".what-changed-tooltip");

    expect(tooltip).not.toHaveClass("is-visible");

    // Mouse enter
    fireEvent.mouseEnter(wrapper!);
    expect(tooltip).toHaveClass("is-visible");

    // Mouse leave
    fireEvent.mouseLeave(wrapper!);
    expect(tooltip).not.toHaveClass("is-visible");
  });

  it("shows the tooltip on long-press for mobile devices", () => {
    localStorage.setItem("creditra_dashboard_values_stable", JSON.stringify({ "total-limit": 8000 }));

    const { container } = render(
      <WhatChanged metricId="total-limit" currentValue={10000} format="currency" label="Total Credit Limit" />
    );

    const trigger = screen.getByLabelText("What changed for Total Credit Limit");
    const tooltip = container.querySelector(".what-changed-tooltip");

    expect(tooltip).not.toHaveClass("is-visible");

    // Start touch
    fireEvent.touchStart(trigger);
    
    // Advance timers by 500ms for long-press threshold
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(tooltip).toHaveClass("is-visible");

    // End touch
    fireEvent.touchEnd(trigger);
    
    // Should still be visible immediately after touchEnd (UX grace period)
    expect(tooltip).toHaveClass("is-visible");

    // Advance timer by 2000ms to hide
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(tooltip).not.toHaveClass("is-visible");
  });

  it("handles negative changes and custom formatting", () => {
    localStorage.setItem("creditra_dashboard_values_stable", JSON.stringify({ "risk-score": 85 }));

    render(
      <WhatChanged metricId="risk-score" currentValue={80} format="number" label="Risk Score" />
    );

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Previous:85");
    expect(tooltip).toHaveTextContent("Current:80");
    expect(tooltip).toHaveTextContent("Change:-5");
  });
});
