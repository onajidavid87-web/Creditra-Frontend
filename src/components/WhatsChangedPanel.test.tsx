import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, vi, describe, beforeEach } from "vitest";
import { WhatsChangedPanel } from "./WhatsChangedPanel";
import * as storage from "../utils/storage";

vi.mock("../data/releases.json", () => ({
  default: {
    id: "v1.2.0",
    changes: ["Change 1", "Change 2"]
  }
}));

vi.mock("../context/ReducedMotionContext", () => ({
  useReducedMotion: () => ({ isReducedMotionActive: false })
}));

describe("WhatsChangedPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders when not dismissed", () => {
    vi.spyOn(storage, "readJson").mockReturnValue("v1.1.0");
    render(<WhatsChangedPanel />);
    expect(screen.getByText(/What's new in v1.2.0/i)).toBeInTheDocument();
    expect(screen.getByText("Change 1")).toBeInTheDocument();
  });

  test("does not render if already dismissed", () => {
    vi.spyOn(storage, "readJson").mockReturnValue("v1.2.0");
    const { container } = render(<WhatsChangedPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  test("dismisses and saves to storage on click", () => {
    vi.spyOn(storage, "readJson").mockReturnValue("v1.1.0");
    const writeSpy = vi.spyOn(storage, "writeJson").mockImplementation(() => {});
    
    render(<WhatsChangedPanel />);
    const dismissBtn = screen.getByRole("button", { name: /dismiss changes panel/i });
    fireEvent.click(dismissBtn);
    
    expect(writeSpy).toHaveBeenCalledWith("last_release_seen", "v1.2.0");
    expect(screen.queryByText(/What's new in v1.2.0/i)).not.toBeInTheDocument();
  });
});
