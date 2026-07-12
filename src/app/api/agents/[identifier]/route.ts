import { apiError, apiSuccess } from "@/lib/api";
import { getAgentBySlug } from "@/lib/data/agents";
import { AppError } from "@/lib/errors";

type Context = { params: Promise<{ identifier: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const agent = await getAgentBySlug((await context.params).identifier);
    if (!agent) throw new AppError("NOT_FOUND", "Agent was not found.", 404);
    return apiSuccess(agent, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return apiError(error);
  }
}
