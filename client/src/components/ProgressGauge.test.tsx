import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressGauge from "./ProgressGauge";

describe("ProgressGauge", () => {
  it("displays the given percentage", () => {
    render(<ProgressGauge value={73} label="達成率" />);
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getByText("達成率")).toBeInTheDocument();
  });

  it("clamps values above 100 to 100%", () => {
    render(<ProgressGauge value={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clamps negative values to 0%", () => {
    render(<ProgressGauge value={-20} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
