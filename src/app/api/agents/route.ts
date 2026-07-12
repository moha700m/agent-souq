import { apiError, apiSuccess } from "@/lib/api";
import { getAgents } from "@/lib/data/agents";

export async function GET(request: Request) {
  try {
    const result = await getAgents(new URL(request.url).searchParams);
    return apiSuccess(result, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return apiError(error);
  }
}
