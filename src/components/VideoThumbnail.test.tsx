import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoThumbnail } from "./VideoThumbnail";

describe("VideoThumbnail", () => {
  it("does not render a third-party iframe until the user clicks play", () => {
    render(
      <VideoThumbnail
        title="Connecting a wallet"
        videoId="abc123"
        transcriptUrl="https://support.creditra.app/transcripts/connect-wallet"
      />,
    );

    expect(screen.queryByTitle("Connecting a wallet")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Play video about Connecting a wallet" }),
    );

    const iframe = screen.getByTitle("Connecting a wallet");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0",
    );
    expect(iframe).toHaveAttribute("loading", "lazy");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-presentation",
    );
  });

  it("renders the transcript link when one is provided", () => {
    render(
      <VideoThumbnail
        title="Keyboard shortcuts"
        videoId="xyz987"
        transcriptUrl="https://support.creditra.app/transcripts/keyboard-shortcuts"
      />,
    );

    expect(screen.getByRole("link", { name: /read transcript/i })).toHaveAttribute(
      "href",
      "https://support.creditra.app/transcripts/keyboard-shortcuts",
    );
  });
});
