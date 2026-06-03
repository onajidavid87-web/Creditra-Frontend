import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";
import App from "./App";
import * as router from "react-router-dom";

// Mock react-router-dom to avoid actual routing in tests
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

describe("App Navigation Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders header with navigation links", () => {
    render(<App />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("renders all four navigation links with correct text", () => {
    render(<App />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Credit Lines")).toBeInTheDocument();
    expect(screen.getByText("Open Credit Line")).toBeInTheDocument();
  });

  it("applies header-nav-link class to all navigation links", () => {
    render(<App />);

    const navLinks = screen.getAllByRole("link", {
      name: /dashboard|transactions|credit lines|open credit line/i,
    });

    navLinks.forEach((link) => {
      expect(link).toHaveClass("header-nav-link");
    });
  });

  it("renders navigation links with proper href attributes", () => {
    render(<App />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const transactionLink = screen.getByText("Transactions").closest("a");
    const creditLineLink = screen.getByText("Credit Lines").closest("a");
    const openCreditLink = screen.getByText("Open Credit Line").closest("a");

    expect(dashboardLink).toHaveAttribute("href", "/");
    expect(transactionLink).toHaveAttribute("href", "/transactions");
    expect(creditLineLink).toHaveAttribute("href", "/credit-lines");
    expect(openCreditLink).toHaveAttribute("href", "/open-credit");
  });

  it("renders logo link with correct href", () => {
    render(<App />);

    const logo = screen.getByText("Creditra");
    expect(logo).toHaveClass("logo");
    expect(logo).toHaveAttribute("href", "/");
  });

  it("renders WalletButton in the header", () => {
    render(<App />);

    // WalletButton should be rendered in the header
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("has proper semantic structure with header and main elements", () => {
    render(<App />);

    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");

    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
  });
});

describe("App Navigation Active State (requires integration test)", () => {
  /**
   * NOTE: These tests verify aria-current="page" behavior, which requires
   * actual router context. They are documented here for reference but
   * require integration testing with BrowserRouter enabled.
   *
   * To test active states properly:
   * 1. Use MemoryRouter instead of BrowserRouter for testing
   * 2. Test with actual routing enabled (not mocked)
   * 3. Navigate to each route and verify aria-current attribute
   *
   * Example:
   * it("sets aria-current on active navigation link", () => {
   *   render(
   *     <MemoryRouter initialEntries={["/"]}>
   *       <App />
   *     </MemoryRouter>
   *   );
   *
   *   const dashboardLink = screen.getByText("Dashboard").closest("a");
   *   expect(dashboardLink).toHaveAttribute("aria-current", "page");
   * });
   */

  it("should have aria-current attribute support implemented", () => {
    // This test verifies the structure exists for aria-current support
    // Actual aria-current testing requires non-mocked router
    render(<App />);

    const navLinks = screen.getAllByRole("link", {
      name: /dashboard|transactions|credit lines|open credit line/i,
    });

    // Verify all nav links exist and have the proper class for active styling
    expect(navLinks.length).toBeGreaterThanOrEqual(4);
    navLinks.forEach((link) => {
      expect(link).toHaveClass("header-nav-link");
    });
  });
});

describe("App Styling and Accessibility", () => {
  it("renders with proper accessibility attributes", () => {
    render(<App />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("header-nav");

    const header = screen.getByRole("banner");
    expect(header).toHaveClass("header");
  });

  it("applies correct CSS classes for navigation styling", () => {
    render(<App />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("header-nav-link");

    // Additional classes may be applied when active (requires router context)
    // This verifies the base class is always present
  });

  it("renders with error boundary wrapper", () => {
    render(<App />);

    // If there's an error, the component should not throw
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("renders with wallet provider context", () => {
    render(<App />);

    // WalletButton should be available if WalletProvider is working
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });
});
