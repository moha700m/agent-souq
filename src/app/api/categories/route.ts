import { apiError, apiSuccess } from "@/lib/api";
import { getCategories } from "@/lib/data/agents";

export async function GET() {
  try {
    return apiSuccess(await getCategories(), {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=900" },
    });
  } catch (error) {
    return apiError(error);
  }
}
