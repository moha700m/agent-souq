import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public Supabase client boundary", () => {
  it("does not read cookies or persist a session for cacheable catalogue data", () => {
    const source = readFileSync(resolve(process.cwd(), "src/lib/supabase/public.ts"), "utf8");
    expect(source).toContain("persistSession: false");
    expect(source).toContain("autoRefreshToken: false");
    expect(source).not.toMatch(/next\/headers|cookies\(/);
  });

  it("is used by the catalogue DAL separately from the authenticated client", () => {
    const source = readFileSync(resolve(process.cwd(), "src/lib/data/agents.ts"), "utf8");
    expect(source).toContain('createPublicClient } from "@/lib/supabase/public"');
    expect(source).toContain('createClient as createServerClient');
    expect(source).toContain("p_query: query.q ?? null");
  });
});
