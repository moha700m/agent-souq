"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { assertDb, failedAction, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { idSchema, reviewSchema } from "@/lib/validation";

export async function toggleFavorite(id: string): Promise<boolean> {
  idSchema.parse(id);
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_favorite", { p_agent_id: id });
  assertDb(error, "Favorite could not be updated.");
  return Boolean(data);
}

export async function installFreeAgent(id: string): Promise<boolean> {
  idSchema.parse(id);
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("install_free_agent", { p_agent_id: id });
  assertDb(error, "Only published free agents can be installed.");
  return Boolean(data);
}

export async function saveReview(id: string, input: unknown): Promise<string> {
  idSchema.parse(id);
  const parsed = reviewSchema.parse(input);
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upsert_review", {
    p_agent_id: id,
    p_rating: parsed.rating,
    p_title: parsed.title,
    p_body: parsed.body,
  });
  assertDb(error, "Install this agent before reviewing it. Creators cannot review their own agents.");
  return String(data);
}

export async function deleteReview(id: string): Promise<void> {
  idSchema.parse(id);
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_review", { p_review_id: id });
  assertDb(error, "Only your review can be deleted.");
}

export async function toggleFavoriteAction(
  id: string,
): Promise<ActionState<{ isFavorite: boolean }>> {
  try {
    const isFavorite = await toggleFavorite(id);
    revalidatePath("/dashboard/saved");
    return {
      ok: true,
      data: { isFavorite },
      message: isFavorite ? "Saved to favorites." : "Removed from favorites.",
    };
  } catch (error) {
    return failedAction(error);
  }
}

export async function installAgentAction(
  id: string,
): Promise<ActionState<{ isInstalled: boolean }>> {
  try {
    await installFreeAgent(id);
    revalidatePath("/dashboard/library");
    return {
      ok: true,
      data: { isInstalled: true },
      message: "Agent added to your library.",
    };
  } catch (error) {
    return failedAction(error);
  }
}

export async function reviewAction(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await saveReview(id, {
      rating: formData.get("rating"),
      title: formData.get("title"),
      body: formData.get("body"),
    });
    revalidatePath("/agents");
    revalidatePath("/dashboard/reviews");
    return { ok: true, message: "Review saved." };
  } catch (error) {
    return failedAction(error);
  }
}

export async function deleteReviewAction(id: string): Promise<ActionState> {
  try {
    await deleteReview(id);
    revalidatePath("/agents");
    revalidatePath("/dashboard/reviews");
    return { ok: true, message: "Review deleted." };
  } catch (error) {
    return failedAction(error);
  }
}
