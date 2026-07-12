import { saveReview } from "@/actions/interactions";
import { apiError, apiSuccess, assertSameOrigin, parseJson } from "@/lib/api";
import { reviewSchema } from "@/lib/validation";

type Context = { params: Promise<{ identifier: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const review = await parseJson(request, reviewSchema);
    const id = await saveReview((await context.params).identifier, review);
    return apiSuccess(
      { id },
      { status: 200, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
