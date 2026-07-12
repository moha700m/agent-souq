import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAgents, mapReview, parseMarketplace } from "@/lib/data/agents";
import { AppError } from "@/lib/errors";

const originalDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

beforeEach(() => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "true";
});

afterEach(() => {
  if (originalDemoMode === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
  else process.env.NEXT_PUBLIC_DEMO_MODE = originalDemoMode;
});

describe("marketplace data layer", () => {
  it("returns a stable, clamped demo page", async () => {
    const first = await getAgents({ sort: "popular", page: 999, pageSize: 2 });
    const second = await getAgents({ sort: "popular", page: 999, pageSize: 2 });
    expect(first.page).toBe(first.pageCount);
    expect(first.items.map((agent) => agent.id)).toEqual(second.items.map((agent) => agent.id));
  });

  it("rejects an invalid query as a 400 application error", () => {
    expect(() => parseMarketplace({ sort: "unknown" as "popular" })).toThrowError(AppError);
    try {
      parseMarketplace({ page: 0 });
    } catch (error) {
      expect(error).toMatchObject({ code: "BAD_REQUEST", status: 400 });
    }
  });

  it("maps public-safe reviewer RPC rows without exposing auth user columns", () => {
    expect(
      mapReview({
        id: "review-id",
        agent_id: "agent-id",
        rating: 5,
        title: "Useful review",
        body: "This review has enough body text for a useful public example.",
        reviewer_id: "profile-id",
        reviewer_username: "alexmorgan",
        reviewer_full_name: "Alex Morgan",
        reviewer_avatar_url: null,
        reviewer_is_verified: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }).reviewer,
    ).toEqual({
      id: "profile-id",
      username: "alexmorgan",
      fullName: "Alex Morgan",
      avatarUrl: null,
      isVerified: false,
    });
  });
});
