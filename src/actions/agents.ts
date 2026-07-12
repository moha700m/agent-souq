"use server";

import { revalidatePath } from "next/cache";
import { requireCreator } from "@/lib/auth";
import { normalizeAgentUpdates } from "@/lib/agent-update";
import { AppError, assertDb, failedAction, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  agentDraftSchema,
  agentPublishSchema,
  formObject,
  idSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/urls";

function compact(object: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function databasePayload(input: Record<string, unknown>) {
  return compact({
    name: input.name,
    slug: input.slug,
    tagline: input.tagline,
    description: input.description,
    instructions: input.instructions,
    category_id: input.categoryId,
    tags: input.tags,
    capabilities: input.capabilities,
    price_type: input.priceType,
    price_cents: input.priceType === "free" ? 0 : input.priceCents,
    currency: "USD",
    thumbnail_url:
      input.thumbnailUrl ?? (Object.hasOwn(input, "thumbnailUrl") ? null : undefined),
    gallery_urls: input.galleryUrls,
    demo_url: input.demoUrl ?? (Object.hasOwn(input, "demoUrl") ? null : undefined),
    version: input.version,
  });
}

export async function createAgent(input: unknown): Promise<{ id: string; slug: string }> {
  const parsed = agentDraftSchema.parse(input);
  await requireCreator();
  const supabase = await createClient();
  const generatedSlug = slugify(parsed.name ?? "");
  const slug = (parsed.slug ?? generatedSlug) || `draft-${crypto.randomUUID().slice(0, 8)}`;
  const result = await supabase
    .from("agents")
    .insert(
      databasePayload({
        ...parsed,
        name: parsed.name ?? "Untitled agent",
        slug,
        tagline: parsed.tagline ?? "",
        description: parsed.description ?? "",
        instructions: parsed.instructions ?? "",
      }),
    )
    .select("id,slug")
    .single();
  assertDb(result.error, "That slug is already in use.");
  if (!result.data) throw new AppError("INTERNAL_ERROR", "Draft could not be created.", 500);
  return result.data;
}

export async function updateAgent(id: string, input: unknown): Promise<void> {
  idSchema.parse(id);
  const rawInput =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const parsed = agentDraftSchema.parse(input);
  const updates = normalizeAgentUpdates(rawInput, parsed);

  const user = await requireCreator();
  const supabase = await createClient();

  const current = await supabase
    .from("agents")
    .select(
      "id,status,name,slug,tagline,description,instructions,category_id,tags,capabilities,price_type,price_cents,thumbnail_url,gallery_urls,demo_url,version",
    )
    .eq("id", id)
    .eq("creator_id", user.id)
    .neq("status", "archived")
    .single();
  assertDb(current.error, "Only your editable listing can be updated.");
  if (!current.data) throw new AppError("NOT_FOUND", "Listing could not be found.", 404);

  if (current.data.status === "published") {
    const value = (key: string, fallback: unknown) =>
      Object.hasOwn(updates, key) ? updates[key] : fallback;
    agentPublishSchema.parse({
      name: value("name", current.data.name),
      slug: value("slug", current.data.slug),
      tagline: value("tagline", current.data.tagline),
      description: value("description", current.data.description),
      instructions: value("instructions", current.data.instructions),
      categoryId: value("categoryId", current.data.category_id),
      tags: value("tags", current.data.tags),
      capabilities: value("capabilities", current.data.capabilities),
      priceType: value("priceType", current.data.price_type),
      priceCents: value("priceCents", current.data.price_cents),
      thumbnailUrl: value("thumbnailUrl", current.data.thumbnail_url),
      galleryUrls: value("galleryUrls", current.data.gallery_urls),
      demoUrl: value("demoUrl", current.data.demo_url),
      version: value("version", current.data.version),
    });
  }

  const result = await supabase
    .from("agents")
    .update(databasePayload(updates))
    .eq("id", id)
    .eq("creator_id", user.id)
    .neq("status", "archived")
    .select("id")
    .single();
  assertDb(result.error, "Only your editable listing can be updated.");
}

export async function publishAgent(id: string): Promise<void> {
  idSchema.parse(id);
  const user = await requireCreator();
  const supabase = await createClient();
  const listing = await supabase
    .from("agents")
    .select(
      "name,slug,tagline,description,instructions,category_id,tags,capabilities,price_type,price_cents,thumbnail_url,gallery_urls,demo_url,version",
    )
    .eq("id", id)
    .eq("creator_id", user.id)
    .single();
  assertDb(listing.error, "Listing could not be found.");
  if (!listing.data) throw new AppError("NOT_FOUND", "Listing could not be found.", 404);

  agentPublishSchema.parse({
    name: listing.data.name,
    slug: listing.data.slug,
    tagline: listing.data.tagline,
    description: listing.data.description,
    instructions: listing.data.instructions,
    categoryId: listing.data.category_id,
    tags: listing.data.tags,
    capabilities: listing.data.capabilities,
    priceType: listing.data.price_type,
    priceCents: listing.data.price_cents,
    thumbnailUrl: listing.data.thumbnail_url,
    galleryUrls: listing.data.gallery_urls,
    demoUrl: listing.data.demo_url,
    version: listing.data.version,
  });
  const result = await supabase.rpc("publish_agent", { p_agent_id: id });
  assertDb(result.error, "Listing could not be published.");
}

async function changeListingState(
  id: string,
  name: "archive_agent" | "return_agent_to_draft",
): Promise<void> {
  idSchema.parse(id);
  await requireCreator();
  const supabase = await createClient();
  const result = await supabase.rpc(name, { p_agent_id: id });
  assertDb(result.error, "Listing state could not be changed.");
}

export async function deleteAgent(id: string): Promise<void> {
  idSchema.parse(id);
  const user = await requireCreator();
  const supabase = await createClient();
  const result = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id)
    .eq("status", "draft")
    .select("id")
    .single();
  assertDb(result.error, "Only your own draft listing can be deleted.");
}

export async function createAgentAction(
  _: ActionState<{ id: string; slug: string }>,
  formData: FormData,
): Promise<ActionState<{ id: string; slug: string }>> {
  try {
    const data = await createAgent(formObject(formData));
    revalidatePath("/creator");
    return { ok: true, message: "Draft created.", data };
  } catch (error) {
    return failedAction(error);
  }
}

export async function updateAgentAction(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await updateAgent(id, formObject(formData));
    revalidatePath("/creator");
    revalidatePath("/agents");
    return { ok: true, message: "Changes saved." };
  } catch (error) {
    return failedAction(error);
  }
}

export async function publishAgentAction(id: string): Promise<ActionState> {
  try {
    await publishAgent(id);
    revalidatePath("/agents");
    revalidatePath("/creator");
    return { ok: true, message: "Agent published." };
  } catch (error) {
    return failedAction(error);
  }
}

export async function archiveAgentAction(id: string): Promise<ActionState> {
  try {
    await changeListingState(id, "archive_agent");
    revalidatePath("/agents");
    revalidatePath("/creator");
    return { ok: true, message: "Agent archived." };
  } catch (error) {
    return failedAction(error);
  }
}

export async function unpublishAgentAction(id: string): Promise<ActionState> {
  try {
    await changeListingState(id, "return_agent_to_draft");
    revalidatePath("/agents");
    revalidatePath("/creator");
    return { ok: true, message: "Listing returned to draft." };
  } catch (error) {
    return failedAction(error);
  }
}

export async function deleteAgentAction(id: string): Promise<ActionState> {
  try {
    await deleteAgent(id);
    revalidatePath("/creator");
    return { ok: true, message: "Draft deleted." };
  } catch (error) {
    return failedAction(error);
  }
}
