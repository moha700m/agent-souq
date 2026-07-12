import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentVisual } from "@/components/agent-visual";

afterEach(() => vi.restoreAllMocks());

describe("AgentVisual", () => {
  it("rejects non-HTTPS media and renders the branded fallback", () => {
    render(<AgentVisual src="http://unsafe.example/cover.png" alt="Unsafe preview" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Unsafe preview")).toBeInTheDocument();
  });

  it("replaces a failed remote image without leaving a broken image control", () => {
    render(<AgentVisual src="https://images.example/cover.png" alt="Agent preview" />);
    const image = screen.getByRole("img", { name: "Agent preview" });
    fireEvent.error(image);
    expect(screen.queryByRole("img", { name: "Agent preview" })).not.toBeInTheDocument();
    expect(screen.getByText("Agent preview")).toBeInTheDocument();
  });

  it("detects an image that failed before hydration attached its error handler", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);

    render(<AgentVisual src="https://images.example/early-failure.png" alt="Early failure" />);

    await waitFor(() =>
      expect(screen.queryByRole("img", { name: "Early failure" })).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Early failure")).toBeInTheDocument();
  });

  it("resets the fallback state when the source changes", async () => {
    let naturalWidth=0;
    vi.spyOn(HTMLImageElement.prototype,"complete","get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype,"naturalWidth","get").mockImplementation(()=>naturalWidth);
    const view=render(<AgentVisual src="https://images.example/failed.png" alt="Failed preview"/>);
    await waitFor(()=>expect(screen.queryByRole("img",{name:"Failed preview"})).not.toBeInTheDocument());
    naturalWidth=320;
    view.rerender(<AgentVisual src="https://images.example/recovered.png" alt="Recovered preview"/>);
    expect(screen.getByRole("img",{name:"Recovered preview"})).toBeInTheDocument();
  });
});
