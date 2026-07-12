import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Price, formatPrice } from "@/components/price";

describe("Price", () => {
  it("formats every supported marketplace price model clearly", () => {
    expect(formatPrice("free", 0)).toBe("Free");
    expect(formatPrice("one_time", 2900)).toBe("$29");
    expect(formatPrice("subscription", 1950)).toBe("$19.50/mo");
  });

  it("renders the formatted price", () => {
    render(<Price type="subscription" cents={1200} />);
    expect(screen.getByText("$12/mo")).toBeInTheDocument();
  });
});
