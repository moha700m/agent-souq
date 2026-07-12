import { cache } from "react";
import { optionalUser } from "@/lib/auth";
import { demoAgents, demoCategories, demoProfiles } from "@/lib/data/demo";
import { getRuntimeMode } from "@/lib/env";
import { AppError, assertDb } from "@/lib/errors";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { idSchema, marketplaceSchema } from "@/lib/validation";
import type {
  Agent,
  Category,
  Creator,
  InteractionState,
  MarketplaceQuery,
  PageResult,
  Profile,
  Review,
} from "@/types/domain";

const agentSelect = `
  id,slug,name,tagline,description,instructions,tags,capabilities,
  price_type,price_cents,currency,thumbnail_url,gallery_urls,demo_url,
  version,status,average_rating,review_count,favorite_count,install_count,
  view_count,published_at,updated_at,
  category:categories!inner(id,slug,name,icon),
  creator:profiles!inner(id,username,full_name,avatar_url,is_verified)
`;

type Row = Record<string, unknown>;

function objectRow(value: unknown): Row {
  if (Array.isArray(value)) return objectRow(value[0]);
  return typeof value === "object" && value !== null ? (value as Row) : {};
}

function mapCreator(value: unknown): Creator {
  const row = objectRow(value);
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    isVerified: row.is_verified === true,
  };
}

function mapCategory(value: unknown): Agent["category"] {
  const row = objectRow(value);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    icon: String(row.icon),
  };
}

export function mapReview(value: unknown): Review {
  const row = objectRow(value);
  const reviewer = row.reviewer
    ? mapCreator(row.reviewer)
    : {
        id: String(row.reviewer_id),
        username: String(row.reviewer_username),
        fullName: String(row.reviewer_full_name),
        avatarUrl:
          typeof row.reviewer_avatar_url === "string" ? row.reviewer_avatar_url : null,
        isVerified: row.reviewer_is_verified === true,
      };

  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    rating: Number(row.rating),
    title: String(row.title),
    body: String(row.body),
    reviewer,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapAgent(value: unknown): Agent {
  const row = objectRow(value);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline),
    description: String(row.description ?? ""),
    instructions: String(row.instructions ?? ""),
    category: mapCategory(row.category),
    creator: mapCreator(row.creator),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    capabilities: Array.isArray(row.capabilities) ? row.capabilities.map(String) : [],
    priceType: row.price_type as Agent["priceType"],
    priceCents: Number(row.price_cents ?? 0),
    currency: "USD",
    thumbnailUrl: typeof row.thumbnail_url === "string" ? row.thumbnail_url : null,
    galleryUrls: Array.isArray(row.gallery_urls) ? row.gallery_urls.map(String) : [],
    demoUrl: typeof row.demo_url === "string" ? row.demo_url : null,
    version: String(row.version ?? "1.0.0"),
    status: row.status as Agent["status"],
    averageRating: Number(row.average_rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    favoriteCount: Number(row.favorite_count ?? 0),
    installCount: Number(row.install_count ?? 0),
    viewCount: Number(row.view_count ?? 0),
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    updatedAt: String(row.updated_at ?? ""),
    reviews: [],
  };
}

export function mapProfile(value: unknown): Profile {
  const row = objectRow(value);
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
    bio: typeof row.bio === "string" ? row.bio : null,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    websiteUrl: typeof row.website_url === "string" ? row.website_url : null,
    role: (row.role ?? "member") as Profile["role"],
    isVerified: row.is_verified === true,
    onboardingCompleted: row.onboarding_completed === true,
    createdAt: String(row.created_at),
  };
}

export function parseMarketplace(
  input: URLSearchParams | Partial<MarketplaceQuery> | Record<string, unknown> = {},
): MarketplaceQuery {
  const value = input instanceof URLSearchParams ? Object.fromEntries(input.entries()) : input;
  const parsed = marketplaceSchema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(
      "BAD_REQUEST",
      "Check the marketplace query parameters.",
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return parsed.data;
}

function getDemoPage(query: MarketplaceQuery): PageResult<Agent> {
  let items = demoAgents.filter(
    (agent) =>
      (!query.category || agent.category.slug === query.category) &&
      (!query.pricing || agent.priceType === query.pricing) &&
      (!query.q ||
        [
          agent.name,
          agent.tagline,
          agent.description,
          agent.category.name,
          agent.creator.fullName,
          ...agent.tags,
          ...agent.capabilities,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.q.toLowerCase())),
  );

  items = [...items].sort((left, right) => {
    let difference = 0;
    if (query.sort === "newest") {
      difference = Date.parse(right.publishedAt ?? "") - Date.parse(left.publishedAt ?? "");
    } else if (query.sort === "rating") {
      difference = right.averageRating - left.averageRating;
    } else if (query.sort === "price-low") {
      difference = left.priceCents - right.priceCents;
    } else if (query.sort === "price-high") {
      difference = right.priceCents - left.priceCents;
    } else {
      difference = right.installCount - left.installCount;
    }
    return difference || left.id.localeCompare(right.id);
  });

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    total,
    page,
    pageSize: query.pageSize,
    pageCount,
  };
}

export async function getAgents(
  input: Parameters<typeof parseMarketplace>[0] = {},
): Promise<PageResult<Agent>> {
  const query = parseMarketplace(input);
  const mode = getRuntimeMode();
  if (mode === "demo") return getDemoPage(query);
  if (mode !== "supabase") {
    throw new AppError("CONFIGURATION_ERROR", "Marketplace data is not configured.", 503);
  }

  const supabase = createPublicClient();
  const offset = (query.page - 1) * query.pageSize;

  const { data, error } = await supabase.rpc("search_agent_ids", {
    p_query: query.q ?? null,
    p_category_slug: query.category ?? null,
    p_price_type: query.pricing ?? null,
    p_sort: query.sort,
    p_limit: query.pageSize,
    p_offset: offset,
  });
  assertDb(error, "Search failed.");

  // The RPC returns an { id: null, total_count } sentinel when an offset is
  // beyond the result set. That lets the DAL clamp instead of turning a 416 into
  // a generic server error.
  const rows = (data ?? []) as { id: string | null; total_count: number | string }[];
  const total = Number(rows[0]?.total_count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  if (page !== query.page) return getAgents({ ...query, page });

  const ids = rows.flatMap((row) => (row.id ? [row.id] : []));
  if (ids.length === 0) {
    return { items: [], total, page, pageSize: query.pageSize, pageCount };
  }

  const result = await supabase.from("agents").select(agentSelect).in("id", ids);
  assertDb(result.error, "Agents could not be loaded.");
  const byId = new Map(
    (result.data ?? []).map((row) => [String(row.id), mapAgent(row)] as const),
  );
  return {
    items: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    total,
    page,
    pageSize: query.pageSize,
    pageCount,
  };
}

export async function getFeaturedAgents(limit = 6): Promise<Agent[]> {
  const cappedLimit = Math.max(1, Math.min(limit, 12));
  if (getRuntimeMode() === "demo") return demoAgents.slice(0, cappedLimit);
  if (getRuntimeMode() !== "supabase") {
    throw new AppError("CONFIGURATION_ERROR", "Marketplace data is not configured.", 503);
  }

  const supabase = createPublicClient();
  const result = await supabase
    .from("agents")
    .select(agentSelect)
    .eq("status", "published")
    .eq("moderation_status", "approved")
    .eq("is_featured", true)
    .order("featured_rank")
    .order("id")
    .limit(cappedLimit);
  assertDb(result.error, "Featured agents could not be loaded.");

  const featured = (result.data ?? []).map(mapAgent);
  if (featured.length >= cappedLimit) return featured;
  const popular = (await getAgents({ sort: "popular", page: 1, pageSize: cappedLimit })).items;
  const seen = new Set(featured.map((agent) => agent.id));
  return [...featured, ...popular.filter((agent) => !seen.has(agent.id))].slice(0, cappedLimit);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const mode = getRuntimeMode();
  if (mode === "demo") return demoCategories;
  if (mode !== "supabase") {
    throw new AppError("CONFIGURATION_ERROR", "Categories are not configured.", 503);
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("list_public_categories");
  assertDb(error, "Categories could not be loaded.");
  return ((data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    icon: String(row.icon),
    agentCount: Number(row.agent_count ?? 0),
  }));
});

export const getAgentBySlug = cache(async (slug: string): Promise<Agent | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const mode = getRuntimeMode();
  if (mode === "demo") return demoAgents.find((agent) => agent.slug === slug) ?? null;
  if (mode !== "supabase") {
    throw new AppError("CONFIGURATION_ERROR", "Data is not configured.", 503);
  }

  const supabase = createPublicClient();
  const result = await supabase
    .from("agents")
    .select(agentSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("moderation_status", "approved")
    .maybeSingle();
  assertDb(result.error, "Agent could not be loaded.");
  if (!result.data) return null;

  const agent = mapAgent(result.data);
  const reviews = await supabase.rpc("list_public_reviews", { p_agent_id: agent.id });
  assertDb(reviews.error, "Reviews could not be loaded.");
  agent.reviews = (reviews.data ?? []).map(mapReview);
  return agent;
});

export async function getAgentById(id: string): Promise<Agent | null> {
  if (!idSchema.safeParse(id).success) return null;
  if (getRuntimeMode() === "demo") return demoAgents.find((agent) => agent.id === id) ?? null;
  const supabase = await createServerClient();
  const result = await supabase.from("agents").select(agentSelect).eq("id", id).maybeSingle();
  assertDb(result.error, "Agent could not be loaded.");
  return result.data ? mapAgent(result.data) : null;
}

export async function relatedAgents(agent: Agent, limit = 3): Promise<Agent[]> {
  if (getRuntimeMode() === "demo") {
    return demoAgents
      .filter((candidate) => candidate.id !== agent.id)
      .sort(
        (left, right) =>
          Number(right.category.id === agent.category.id) -
            Number(left.category.id === agent.category.id) ||
          right.installCount - left.installCount ||
          left.id.localeCompare(right.id),
      )
      .slice(0, limit);
  }

  const supabase = createPublicClient();
  const result = await supabase
    .from("agents")
    .select(agentSelect)
    .eq("status", "published")
    .eq("moderation_status", "approved")
    .neq("id", agent.id)
    .order("install_count", { ascending: false })
    .order("id")
    .limit(limit);
  assertDb(result.error, "Related agents could not be loaded.");
  return (result.data ?? []).map(mapAgent);
}

export async function getCreator(
  username: string,
): Promise<{ profile: Profile; agents: Agent[] } | null> {
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return null;
  if (getRuntimeMode() === "demo") {
    const profile = demoProfiles.find(
      (candidate) => candidate.username === username && candidate.role !== "member",
    );
    return profile
      ? { profile, agents: demoAgents.filter((agent) => agent.creator.id === profile.id) }
      : null;
  }

  const supabase = createPublicClient();
  const profileResult = await supabase.rpc("get_public_creator", { p_username: username });
  assertDb(profileResult.error, "Creator could not be loaded.");
  const profileRow = Array.isArray(profileResult.data)
    ? profileResult.data[0]
    : profileResult.data;
  if (!profileRow) return null;

  const profile = { ...mapProfile(profileRow), role: "creator" as const };
  const listings = await supabase
    .from("agents")
    .select(agentSelect)
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .eq("moderation_status", "approved")
    .order("published_at", { ascending: false })
    .order("id");
  assertDb(listings.error, "Listings could not be loaded.");
  return { profile, agents: (listings.data ?? []).map(mapAgent) };
}

export async function interactionState(agentId: string): Promise<InteractionState> {
  const empty: InteractionState = {
    isFavorite: false,
    isInstalled: false,
    canReview: false,
    ownReviewId: null,
  };
  const user = await optionalUser();
  if (!user) return empty;

  const supabase = await createServerClient();
  const [favorite, installation, review, agent] = await Promise.all([
    supabase
      .from("favorites")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", agentId)
      .maybeSingle(),
    supabase
      .from("installations")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", agentId)
      .maybeSingle(),
    supabase.rpc("list_my_reviews"),
    supabase.from("agents").select("creator_id").eq("id", agentId).maybeSingle(),
  ]);
  [favorite, installation, review, agent].forEach((result) =>
    assertDb(result.error, "Interaction state could not be loaded."),
  );

  const ownReview = (review.data ?? []).find(
    (candidate: { agent_id?: string }) => candidate.agent_id === agentId,
  );
  return {
    isFavorite: Boolean(favorite.data),
    isInstalled: Boolean(installation.data),
    canReview: Boolean(installation.data) && agent.data?.creator_id !== user.id,
    ownReviewId: ownReview?.id ?? null,
  };
}

export async function recordView(id: string): Promise<void> {
  if (getRuntimeMode() !== "supabase" || !(await optionalUser())) return;
  const supabase = await createServerClient();
  const { error } = await supabase.rpc("record_agent_view", { p_agent_id: id });
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("Agent view could not be recorded.");
  }
}
