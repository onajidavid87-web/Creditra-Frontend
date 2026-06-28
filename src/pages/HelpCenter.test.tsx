import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HelpCenter from "./HelpCenter";

class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  trigger(id: string) {
    const entry = {
      target: { id },
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    };
    this.callback([entry], this);
  }
}

let mockObserver: IntersectionObserverMock;

beforeEach(() => {
  mockObserver = new IntersectionObserverMock(vi.fn());
  vi.stubGlobal("IntersectionObserver", vi.fn(
    (cb: IntersectionObserverCallback) => {
      mockObserver = new IntersectionObserverMock(cb);
      return mockObserver;
    },
  ));
});

describe("HelpCenter", () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nav anchor links for each topic", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole("link", { name: /getting started|wallet|credit lines|transactions|notifications|shortcuts|faq/i });
    expect(links.length).toBeGreaterThanOrEqual(7);
  });

  it("sets aria-current on the active nav link and removes it from others", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>,
    );

    const gettingStartedLink = screen.getByRole("link", { name: "Getting Started" });
    const walletLink = screen.getByRole("link", { name: "Wallet" });

    expect(gettingStartedLink).not.toHaveAttribute("aria-current");
    expect(walletLink).not.toHaveAttribute("aria-current");

    act(() => { mockObserver.trigger("wallet"); });

    expect(walletLink).toHaveAttribute("aria-current", "true");
    expect(gettingStartedLink).not.toHaveAttribute("aria-current");
  });

  it("aria-current moves when active section changes", () => {
    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>,
    );

    const gettingStartedLink = screen.getByRole("link", { name: "Getting Started" });
    const transactionsLink = screen.getByRole("link", { name: "Transactions" });

    act(() => { mockObserver.trigger("transactions"); });

    expect(transactionsLink).toHaveAttribute("aria-current", "true");
    expect(gettingStartedLink).not.toHaveAttribute("aria-current");
  });

  it("clicking a nav anchor smooth-scrolls to the target section", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const walletLink = screen.getByRole("link", { name: "Wallet" });

    await user.click(walletLink);

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: expect.any(String), block: "start" }),
    );
  });

  it("keyboard Tab navigates to all nav links and Enter triggers scroll", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <MemoryRouter>
        <HelpCenter />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.tab();

    const firstLink = screen.getAllByRole("link")[0];
    expect(firstLink).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("renders wallet deep-link target and FAQ video button", () => {
    render(
      <MemoryRouter initialEntries={["/help#wallet"]}>
        <HelpCenter />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Wallet" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /how do i connect a wallet\?/i }),
    ).toBeInTheDocument();
  });
});
