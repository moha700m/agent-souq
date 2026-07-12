import { describe, expect, it } from "vitest";
import { normalizeAgentUpdates } from "@/lib/agent-update";
import { agentDraftSchema, agentPublishSchema } from "@/lib/validation";

const liveListing = {
  name: "Review Pilot",
  slug: "review-pilot",
  tagline: "Review technical work with clear risks and practical next steps.",
  description:
    "Review Pilot examines a bounded technical change and returns structured findings that remain easy for an accountable human owner to verify before production use.",
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

describe("agent edit normalization", () => {
  it("preserves intentional blank draft fields while retaining name and slug", () => {
    const raw = {
      name: "",
      slug: "",
      tagline: "",
      description: "",
      instructions: "",
      categoryId: "",
      tags: [],
      capabilities: [],
      priceType: "free",
      priceCents: 0,
      thumbnailUrl: "",
      galleryUrls: [],
      demoUrl: "",
      version: "1.0.0",
    };
    const parsed = agentDraftSchema.parse(raw);
    const updates = normalizeAgentUpdates(raw, parsed);

    expect(updates).toMatchObject({
      tagline: "",
      description: "",
      instructions: "",
      categoryId: null,
      thumbnailUrl: null,
      demoUrl: null,
    });
    expect(updates).not.toHaveProperty("name");
    expect(updates).not.toHaveProperty("slug");
  });

  it("makes the same clearing edit fail publication validation", () => {
    const raw = { tagline: "", categoryId: "", tags: [], capabilities: [], galleryUrls: [] };
    const parsed = agentDraftSchema.parse({
      ...liveListing,
      ...raw,
    });
    const updates = normalizeAgentUpdates(raw, parsed);
    expect(
      agentPublishSchema.safeParse({
        ...liveListing,
        ...updates,
      }).success,
    ).toBe(false);
  });
});
