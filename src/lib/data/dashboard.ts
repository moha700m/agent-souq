import { cache } from "react";
import { ensureProfile, requireUser } from "@/lib/auth";
import { mapAgent, mapProfile, mapReview } from "@/lib/data/agents";
import { demoAgents, demoProfiles } from "@/lib/data/demo";
import { getRuntimeMode } from "@/lib/env";
import { AppError, assertDb } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Agent, CreatorData, DashboardData } from "@/types/domain";

const agentFields = `
  id,slug,name,tagline,description,instructions,tags,capabilities,
  price_type,price_cents,currency,thumbnail_url,gallery_urls,demo_url,
  version,status,average_rating,review_count,favorite_count,install_count,
  view_count,published_at,updated_at,
  category:categories(id,slug,name,icon),
  creator:profiles!inner(id,username,full_name,avatar_url,is_verified)
`;

function nestedAgents(rows: unknown[] | null): Agent[] {
  return (rows ?? []).map((value) => mapAgent((value as { agent: unknown }).agent));
}

async function loadOwnProfile() {
  const supabase = await createClient();
  const result = await supabase.rpc("get_my_profile");
  assertDb(result.error, "Profile could not be loaded.");
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row) throw new AppError("NOT_FOUND", "Profile could not be loaded.", 404);
  return mapProfile(row);
}

export const getCurrentProfile = cache(async () => {
  if (getRuntimeMode() === "demo") return demoProfiles[2];
  if (getRuntimeMode() !== "supabase") {
    throw new AppError("CONFIGURATION_ERROR", "Profiles are not configured.", 503);
  }
  const user = await requireUser();
  await ensureProfile(user);
  return loadOwnProfile();
});

export async function getDashboardData(): Promise<DashboardData> {
  if (getRuntimeMode() === "demo") {
    return {
      profile: demoProfiles[2],
      favorites: demoAgents.slice(0, 3),
      recent: [demoAgents[3], demoAgents[0], demoAgents[6]],
      installations: demoAgents.filter((agent) => agent.priceType === "free"),
      reviews: demoAgents.flatMap((agent) => agent.reviews).slice(0, 2),
      readOnly: true,
    };
  }

  const user = await requireUser();
  await ensureProfile(user);
  const supabase = await createClient();
  const [profile, favorites, recentlyViewed, installations, reviews] = await Promise.all([
    supabase.rpc("get_my_profile"),
    supabase
      .from("favorites")
      .select(`agent:agents!inner(${agentFields})`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("recently_viewed")
      .select(`agent:agents!inner(${agentFields})`)
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(24),
    supabase
      .from("installations")
      .select(`agent:agents!inner(${agentFields})`)
      .eq("user_id", user.id)
      .order("installed_at", { ascending: false })
      .limit(24),
    supabase.rpc("list_my_reviews"),
  ]);
  [profile, favorites, recentlyViewed, installations, reviews].forEach((result) =>
    assertDb(result.error, "Dashboard data could not be loaded."),
  );

  const profileRow = Array.isArray(profile.data) ? profile.data[0] : profile.data;
  if (!profileRow) throw new AppError("NOT_FOUND", "Profile could not be loaded.", 404);
  return {
    profile: mapProfile(profileRow),
    favorites: nestedAgents(favorites.data),
    recent: nestedAgents(recentlyViewed.data),
    installations: nestedAgents(installations.data),
    reviews: (reviews.data ?? []).map(mapReview),
    readOnly: false,
  };
}

export async function getCreatorData(): Promise<CreatorData> {
  if (getRuntimeMode() === "demo") {
    const profile = demoProfiles[0];
    const listings = demoAgents.filter((agent) => agent.creator.id === profile.id);
    return { profile, listings, readOnly: true, totals: listingTotals(listings) };
  }

  const user = await requireUser();
  await ensureProfile(user);
  const supabase = await createClient();
  const [profile, agents] = await Promise.all([
    supabase.rpc("get_my_profile"),
    supabase
      .from("agents")
      .select(agentFields)
      .eq("creator_id", user.id)
      .order("updated_at", { ascending: false })
      .order("id"),
  ]);
  assertDb(profile.error, "Profile could not be loaded.");
  assertDb(agents.error, "Listings could not be loaded.");
  const profileRow = Array.isArray(profile.data) ? profile.data[0] : profile.data;
  if (!profileRow) throw new AppError("NOT_FOUND", "Profile could not be loaded.", 404);

  const listings = (agents.data ?? []).map(mapAgent);
  return {
    profile: mapProfile(profileRow),
    listings,
    readOnly: false,
    totals: listingTotals(listings),
  };
}

function listingTotals(agents: Agent[]) {
  return {
    listings: agents.length,
    published: agents.filter((agent) => agent.status === "published").length,
    views: agents.reduce((total, agent) => total + agent.viewCount, 0),
    favorites: agents.reduce((total, agent) => total + agent.favoriteCount, 0),
    installs: agents.reduce((total, agent) => total + agent.installCount, 0),
    reviews: agents.reduce((total, agent) => total + agent.reviewCount, 0),
  };
}
