import { describe, expect, it } from "vitest";
import { safeRedirectPath, slugify } from "@/lib/urls";

describe("URL safety helpers", () => {
  it("preserves a same-origin relative destination", () => {
    expect(safeRedirectPath("/creator/listings?page=2#drafts")).toBe(
      "/creator/listings?page=2#drafts",
    );
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/dashboard\nSet-Cookie: bad=true",
    "dashboard",
    null,
  ])("rejects an unsafe return destination: %s", (value) => {
    expect(safeRedirectPath(value, "/safe")).toBe("/safe");
  });

  it("creates bounded URL-safe listing slugs", () => {
    expect(slugify("  Review & Research Pilot  ")).toBe("review-research-pilot");
    expect(slugify("x".repeat(100))).toHaveLength(80);
  });
});
