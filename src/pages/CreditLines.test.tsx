/**
 * CreditLines page tests
 *
 * Covers A11Y-004: the results region must carry an accessible label that
 * describes the current filter/sort scope and updates when either changes.
 *
 * Also acts as a regression guard for the label/select wiring added as part
 * of the same fix — the filter controls were missing htmlFor/id pairs.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import CreditLines from "./CreditLines";

const renderCreditLines = () =>
  render(
    <BrowserRouter>
      <CreditLines />
    </BrowserRouter>,
  );

describe("CreditLines", () => {
  // ── Label/select wiring (prerequisite for getByRole name queries) ──────────

  it("Status select is associated with its label", () => {
    renderCreditLines();
    // getByRole with name only works when <label htmlFor> is correctly wired
    expect(
      screen.getByRole("combobox", { name: /status/i }),
    ).toBeInTheDocument();
  });

  it("Sort By select is associated with its label", () => {
    renderCreditLines();
    expect(
      screen.getByRole("combobox", { name: /sort by/i }),
    ).toBeInTheDocument();
  });

  it("sort direction button has an accessible name", () => {
    renderCreditLines();
    expect(
      screen.getByRole("button", { name: /sort direction/i }),
    ).toBeInTheDocument();
  });

  // ── A11Y-004: accessible region label ──────────────────────────────────────

  it("renders a results region with an accessible label", () => {
    renderCreditLines();
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toBeInTheDocument();
  });

  it("default label includes sort field and direction with result count", () => {
    renderCreditLines();
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toHaveAccessibleName(/sorted by last updated descending/i);
    expect(region).toHaveAccessibleName(/\d+ results?/i);
    // No status filter in default state
    expect(region).not.toHaveAccessibleName(/filtered by/i);
  });

  it("label updates when a status filter is applied", () => {
    renderCreditLines();
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "Active" },
    });
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toHaveAccessibleName(/filtered by active/i);
  });

  it("label updates when sort field is changed", () => {
    renderCreditLines();
    fireEvent.change(screen.getByRole("combobox", { name: /sort by/i }), {
      target: { value: "apr" },
    });
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toHaveAccessibleName(/sorted by apr/i);
  });

  it("label reflects ascending direction when sort direction is toggled", () => {
    renderCreditLines();
    fireEvent.click(screen.getByRole("button", { name: /sort direction/i }));
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toHaveAccessibleName(/ascending/i);
  });

  it("label includes both filter and sort qualifiers simultaneously", () => {
    renderCreditLines();
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "Suspended" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /sort by/i }), {
      target: { value: "limit" },
    });
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region).toHaveAccessibleName(/filtered by suspended/i);
    expect(region).toHaveAccessibleName(/sorted by credit limit/i);
  });

  it("result count in label reflects filtered item count", () => {
    renderCreditLines();
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "Suspended" },
    });
    const region = screen.getByRole("region", { name: /credit lines/i });
    expect(region.getAttribute("aria-label")).toMatch(/\d+ results?/i);
  });
});
