import { toggleFavorite } from "@/actions/interactions";
import { apiError, apiSuccess, assertSameOrigin } from "@/lib/api";

type Context = { params: Promise<{ identifier: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const isFavorite = await toggleFavorite((await context.params).identifier);
    return apiSuccess({ isFavorite }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
