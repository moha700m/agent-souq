import { deleteReview } from "@/actions/interactions";
import { apiError, apiSuccess, assertSameOrigin } from "@/lib/api";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await deleteReview((await context.params).id);
    return apiSuccess({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
