import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SupportWidget } from "./SupportWidget";

describe("SupportWidget", () => {
  it("opens from the floating button and exposes FAQ search plus email handoff", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SupportWidget />
      </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", { name: "Support" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("dialog", { name: "Support and FAQ search" }),
    ).toBeInTheDocument();

    const search = screen.getByRole("searchbox", { name: "Search FAQ" });
    expect(search).toHaveFocus();

    await user.type(search, "wallet");

    expect(
      screen.getByRole("button", { name: "How do I connect a wallet?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Where can I review my credit lines?",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Email support" })).toHaveAttribute(
      "href",
      "mailto:support@creditra.com?subject=GrantFox%20support%20request",
    );
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SupportWidget />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Support" }));
    expect(
      screen.getByRole("dialog", { name: "Support and FAQ search" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Support and FAQ search" }),
    ).not.toBeInTheDocument();
  });
});
