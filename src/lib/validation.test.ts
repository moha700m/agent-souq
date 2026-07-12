import { describe, expect, it } from "vitest";
import {
  agentPublishSchema,
  marketplaceSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

const publishableAgent = {
  name: "Review Pilot",
  slug: "review-pilot",
  tagline: "Review technical work with visible assumptions and practical next steps.",
  description:
    "Review Pilot examines a bounded piece of technical work and produces structured findings that are easy for a human owner to verify before any production change is made.",
  instructions: "Provide the expected behavior, constraints, relevant diff, and current test evidence.",
  categoryId: "20000000-0000-4000-8000-000000000001",
  tags: ["review"],
  capabilities: ["risk ranking"],
  priceType: "free" as const,
  priceCents: 0,
  thumbnailUrl: "https://example.com/cover.webp",
  galleryUrls: [],
  demoUrl: undefined,
  version: "1.0.0",
};

describe("server validation contracts", () => {
  it("bounds every marketplace input before database access", () => {
    expect(marketplaceSchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
    expect(marketplaceSchema.safeParse({ page: 10001 }).success).toBe(false);
    expect(marketplaceSchema.safeParse({ pageSize: 49 }).success).toBe(false);
    expect(marketplaceSchema.safeParse({ category: "coding' OR true" }).success).toBe(false);
  });

  it("accepts legacy sign-in passwords but enforces strong new passwords", () => {
    expect(signInSchema.safeParse({ email: "person@example.com", password: "old" }).success).toBe(
      true,
    );
    expect(
      signUpSchema.safeParse({
        fullName: "Person Name",
        email: "person@example.com",
        password: "onlylowercase",
        confirmPassword: "onlylowercase",
      }).success,
    ).toBe(false);
  });

  it("requires a real visual and consistent pricing before publication", () => {
    expect(agentPublishSchema.safeParse(publishableAgent).success).toBe(true);
    expect(
      agentPublishSchema.safeParse({
        ...publishableAgent,
        thumbnailUrl: undefined,
        galleryUrls: [],
      }).success,
    ).toBe(false);
    expect(
      agentPublishSchema.safeParse({ ...publishableAgent, priceType: "free", priceCents: 50 })
        .success,
    ).toBe(false);
  });
});
