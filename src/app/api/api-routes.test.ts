import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getAgents } from "@/app/api/agents/route";
import { GET as getHealth } from "@/app/api/health/route";
import { POST as postFavorite } from "@/app/api/agents/[identifier]/favorite/route";
import { POST as postReview } from "@/app/api/agents/[identifier]/reviews/route";
import { GET as confirmAuth } from "@/app/auth/confirm/route";

const original = {
  demo: process.env.NEXT_PUBLIC_DEMO_MODE,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
});

afterEach(() => {
  for (const [name, value] of [
    ["NEXT_PUBLIC_DEMO_MODE", original.demo],
    ["NEXT_PUBLIC_SUPABASE_URL", original.url],
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", original.key],
  ] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("API route contracts", () => {
  it("returns a structured 400 for invalid marketplace parameters", async () => {
    const response = await getAgents(
      new Request(`http://localhost:3000/api/agents?q=${"x".repeat(101)}`),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "BAD_REQUEST" } });
  });

  it("serves demo marketplace data with the documented envelope", async () => {
    const response = await getAgents(new Request("http://localhost:3000/api/agents?pageSize=2"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { page: 1, pageSize: 2 } });
  });

  it("reports demo as healthy and a forced incomplete configuration as degraded", async () => {
    expect((await getHealth()).status).toBe(200);
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    const degraded = await getHealth();
    expect(degraded.status).toBe(503);
    await expect(degraded.json()).resolves.toEqual({ status: "degraded", mode: "misconfigured" });
  });

  it("blocks cross-origin cookie mutations before authentication", async () => {
    const response = await postFavorite(
      new Request("http://localhost:3000/api/agents/30000000-0000-4000-8000-000000000001/favorite", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
      { params: Promise.resolve({ identifier: "30000000-0000-4000-8000-000000000001" }) },
    );
    expect(response.status).toBe(403);
  });

  it("rejects malformed review JSON before invoking persistence", async () => {
    const response = await postReview(
      new Request("http://localhost:3000/api/agents/30000000-0000-4000-8000-000000000001/reviews", {
        method: "POST",
        body: "not-json",
        headers: { origin: "http://localhost:3000" },
      }),
      { params: Promise.resolve({ identifier: "30000000-0000-4000-8000-000000000001" }) },
    );
    expect(response.status).toBe(400);
  });

  it("never honors an external redirect in an invalid confirmation link", async () => {
    const response = await confirmAuth(
      new Request("http://localhost:3000/auth/confirm?next=https://evil.example"),
    );
    const location = new URL(response.headers.get("location")!);
    expect(location.origin).toBe("http://localhost:3000");
    expect(location.pathname).toBe("/auth/sign-in");
    expect(location.searchParams.get("next")).toBe("/onboarding");
  });
});
