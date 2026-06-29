import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { NextSteps } from "./NextSteps";
import { useKyc } from "../context/KycContext";
import { fetchLinkedAccounts } from "../services/linkedAccounts";

// Mock the dependencies
vi.mock("../context/KycContext", () => ({
  useKyc: vi.fn(),
}));

vi.mock("../services/linkedAccounts", () => ({
  fetchLinkedAccounts: vi.fn(),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe("NextSteps Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the loading skeleton initially", () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "not_started",
      resumeStepId: "identity",
      completedCount: 0,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    // Keep fetchLinkedAccounts pending
    vi.mocked(fetchLinkedAccounts).mockReturnValue(new Promise(() => {}));

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    expect(screen.getByLabelText(/loading next steps/i)).toBeInTheDocument();
  });

  it("surfaces KYC todo and other steps as locked when KYC is not started and no accounts are linked", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "not_started",
      resumeStepId: "identity",
      completedCount: 0,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([]);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.queryByLabelText(/loading next steps/i)).not.toBeInTheDocument();
    });

    // Check Verify KYC is Todo
    const kycStep = screen.getByRole("listitem", { name: /Step 1: Verify KYC. Status: Action Required/i });
    expect(kycStep).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();

    // Check Link Account is Locked
    const linkStep = screen.getByRole("listitem", { name: /Step 2: Link Account. Status: Locked/i });
    expect(linkStep).toBeInTheDocument();

    // Check Draw Credit is Locked
    const drawStep = screen.getByRole("listitem", { name: /Step 3: Draw Credit. Status: Locked/i });
    expect(drawStep).toBeInTheDocument();
  });

  it("shows KYC under review status", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "under_review",
      resumeStepId: null,
      completedCount: 4,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([]);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.getByText(/under review/i)).toBeInTheDocument();
    });
  });

  it("shows KYC rejected status as a retry action", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "rejected",
      resumeStepId: "identity",
      completedCount: 2,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([]);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry verification/i })).toBeInTheDocument();
    });
  });

  it("unlocks Link Account step when KYC is approved, and shows it as todo", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "approved",
      resumeStepId: null,
      completedCount: 5,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([]);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.getByRole("listitem", { name: /Step 1: Verify KYC. Status: Completed/i })).toBeInTheDocument();
    });

    // Link Account should now be Todo (Action Required)
    expect(screen.getByRole("listitem", { name: /Step 2: Link Account. Status: Action Required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /connect account/i })).toBeInTheDocument();

    // Draw Credit remains locked because account is not linked yet
    expect(screen.getByRole("listitem", { name: /Step 3: Draw Credit. Status: Locked/i })).toBeInTheDocument();
  });

  it("unlocks Draw Credit step when KYC is approved and account is linked", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "approved",
      resumeStepId: null,
      completedCount: 5,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([
      {
        id: "google-1",
        provider: "google",
        status: "connected",
        displayName: "Test User",
        externalId: "test@google.com",
        connectedAt: "2026-06-28T00:00:00Z",
        lastVerified: "2026-06-28T00:00:00Z",
      },
    ]);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.getByRole("listitem", { name: /Step 1: Verify KYC. Status: Completed/i })).toBeInTheDocument();
      expect(screen.getByRole("listitem", { name: /Step 2: Link Account. Status: Completed/i })).toBeInTheDocument();
    });

    // Draw Credit should now be Todo
    expect(screen.getByRole("listitem", { name: /Step 3: Draw Credit. Status: Action Required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /draw funds/i })).toBeInTheDocument();
  });

  it("shows all completed state when credit is drawn", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "approved",
      resumeStepId: null,
      completedCount: 5,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([
      {
        id: "google-1",
        provider: "google",
        status: "connected",
        displayName: "Test User",
        externalId: "test@google.com",
        connectedAt: "2026-06-28T00:00:00Z",
        lastVerified: "2026-06-28T00:00:00Z",
      },
    ]);

    renderWithRouter(<NextSteps totalAvailable={5000} totalUtilized={5000} />);

    await waitFor(() => {
      expect(screen.getByRole("listitem", { name: /Step 3: Draw Credit. Status: Completed/i })).toBeInTheDocument();
      expect(screen.getByText(/you're all set/i)).toBeInTheDocument();
    });
  });

  it("simulates clicking the KYC trigger button in the DOM when starting verification", async () => {
    vi.mocked(useKyc).mockReturnValue({
      steps: [],
      overallStatus: "not_started",
      resumeStepId: "identity",
      completedCount: 0,
      setStepStatus: vi.fn(),
      resetAll: vi.fn(),
    });
    vi.mocked(fetchLinkedAccounts).mockResolvedValue([]);

    // Create a dummy KYC trigger button in the DOM to check if it gets clicked
    const kycBtn = document.createElement("button");
    kycBtn.className = "kyc-trigger-btn";
    const clickSpy = vi.fn();
    kycBtn.addEventListener("click", clickSpy);
    document.body.appendChild(kycBtn);

    renderWithRouter(<NextSteps totalAvailable={10000} totalUtilized={0} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /start verification/i }));

    expect(clickSpy).toHaveBeenCalled();

    document.body.removeChild(kycBtn);
  });
});
