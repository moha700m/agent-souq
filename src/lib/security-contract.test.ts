import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDirectory = resolve(process.cwd(), "supabase/migrations");
const migrationPath = resolve(
  migrationsDirectory,
  readdirSync(migrationsDirectory).find((file) => file.endsWith("_initial_agent_souq.sql"))!,
);
const sql = readFileSync(migrationPath, "utf8");

function functionDefinition(name: string) {
  const start = sql.indexOf(`create function public.${name}`);
  const end = sql.indexOf("\n$$;", start);
  expect(start, `${name} exists`).toBeGreaterThanOrEqual(0);
  expect(end, `${name} terminates`).toBeGreaterThan(start);
  return sql.slice(start, end + 4);
}

function agentGrantColumns(operation: "insert" | "update") {
  const match = sql.match(
    new RegExp(`grant ${operation} \\(([^;]+)\\)\\s*on public\\.agents`, "i"),
  );
  expect(match, `${operation} agent grant exists`).not.toBeNull();
  return match![1];
}

describe("Supabase security contract", () => {
  it("enables RLS on every exposed application table", () => {
    for (const table of [
      "profiles",
      "categories",
      "agents",
      "favorites",
      "installations",
      "reviews",
      "recently_viewed",
      "reports",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("never exposes profile authorization or suspension columns to anon", () => {
    const match = sql.match(/grant select \(([^;]+)\)\s*on public\.profiles to anon;/i);
    expect(match).not.toBeNull();
    const columns = match![1];
    expect(columns).not.toMatch(/\brole\b/);
    expect(columns).not.toMatch(/onboarding_completed|is_suspended|suspended_at/);
  });

  it("derives ownership from auth and protects live listing completeness", () => {
    expect(sql).toContain("new.creator_id := (select auth.uid());");
    expect(sql).toContain("constraint agents_published_complete check");
    expect(sql).toContain("new.published_at := old.published_at;");
    expect(agentGrantColumns("update")).not.toMatch(/creator_id|published_at|is_featured/);
  });

  it("uses one complete public visibility predicate across reads and mutations", () => {
    expect(sql).toContain("create function private.is_agent_public(agent_id uuid)");
    for (const name of ["toggle_favorite", "install_free_agent", "record_agent_view"]) {
      expect(functionDefinition(name)).toContain("private.is_agent_public(p_agent_id)");
    }
    expect(functionDefinition("upsert_review")).toContain("private.is_agent_public(p_agent_id)");
    expect(functionDefinition("list_public_reviews")).toContain("private.is_agent_public(agent.id)");
    expect(functionDefinition("search_agent_ids")).toContain("private.is_agent_public(agent.id)");
  });

  it("returns a total-count sentinel when a requested search page is empty", () => {
    const search = functionDefinition("search_agent_ids");
    expect(search).toContain("select null::uuid, aggregate_count.total_count");
    expect(search).toContain("where not exists (select 1 from page)");
  });

  it("keeps installs idempotent and review deletion owner-derived", () => {
    expect(functionDefinition("install_free_agent")).toContain(
      "on conflict (user_id, agent_id) do nothing",
    );
    const deletion = functionDefinition("delete_my_review");
    expect(deletion).toContain("user_id = v_user_id");
    expect(sql).not.toMatch(/grant (insert|update|delete) on public\.installations/i);
  });

  it("refreshes recent ordering on every view while deduplicating the counter", () => {
    expect(sql).toContain("last_counted_at timestamptz not null default now()");
    const viewFunction = functionDefinition("record_agent_view");
    expect(viewFunction).toContain("last_viewed_at = excluded.last_viewed_at");
    expect(viewFunction).toContain("last_counted_at <= viewed_at - interval '30 minutes'");
  });

  it("rechecks active database profiles for JWT-stale writes and storage", () => {
    expect(sql).toContain("create function private.profile_is_active_member(profile_id uuid)");
    expect(functionDefinition("toggle_favorite")).toContain(
      "private.profile_is_active_member(v_user_id)",
    );
    const storagePolicies = sql.slice(sql.indexOf("create policy agent_media_owner_insert"));
    expect(storagePolicies.match(/private\.profile_can_create\(\(select auth\.uid\(\)\)\)/g)).toHaveLength(
      4,
    );
  });

  it("reserves featured ranking as system-owned architecture", () => {
    expect(sql).toContain("is_featured boolean not null default false");
    expect(sql).toContain("featured_rank smallint");
    expect(sql).toContain("agents_featured_rank_idx");
    expect(`${agentGrantColumns("insert")} ${agentGrantColumns("update")}`).not.toMatch(
      /is_featured|featured_rank/,
    );
  });
});
