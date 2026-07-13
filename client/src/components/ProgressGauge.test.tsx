import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressGauge from "./ProgressGauge";

describe("ProgressGauge", () => {
  it("displays the given percentage", () => {
    render(<ProgressGauge value={73} label="達成率" />);
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getByText("達成率")).toBeInTheDocument();
  });

  it("shows the real value above 100% (achievement can exceed budget)", () => {
    render(<ProgressGauge value={103} />);
    expect(screen.getByText("103%")).toBeInTheDocument();
  });

  it("clamps negative values to 0%", () => {
    render(<ProgressGauge value={-20} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
